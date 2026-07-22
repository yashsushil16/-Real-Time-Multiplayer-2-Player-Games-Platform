import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db.js';
import { RoomManager } from './roomManager.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

// ================= REST API ROUTES =================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json({ success: true, leaderboard: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/matches', async (req, res) => {
  try {
    const { userId } = req.query;
    const matches = await db.getMatches(userId || null);
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token, isSimulated, googleId, name, email, picture, guestUserId } = req.body;

    let userData;

    if (token) {
      // Secure Google Token Verification
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        return res.status(401).json({ success: false, error: 'Invalid Google OAuth token' });
      }
      const payload = await response.json();

      // Optionally verify audience matches client ID if GOOGLE_CLIENT_ID env var is set
      const serverGoogleClientId = (process.env.GOOGLE_CLIENT_ID || '').replace(/^['"]|['"]$/g, '').trim();
      if (serverGoogleClientId && payload.aud !== serverGoogleClientId) {
        console.error(`Google Auth Mismatch: Token audience is '${payload.aud}', but server is configured with '${serverGoogleClientId}'.`);
        return res.status(401).json({ success: false, error: `Token audience mismatch. Token aud: ${payload.aud}` });
      }

      userData = {
        googleId: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture
      };
    } else if (isSimulated) {
      // Simulated dev login fallback
      if (!googleId) {
        return res.status(400).json({ success: false, error: 'Google ID is required for simulation' });
      }
      userData = { googleId, name, email, picture };
    } else {
      return res.status(400).json({ success: false, error: 'Either token or simulated login details are required' });
    }

    const userId = 'usr_g_' + userData.googleId;
    const user = await db.upsertUser({
      userId,
      googleId: userData.googleId,
      name: userData.name,
      email: userData.email,
      picture: userData.picture,
      isGoogle: true
    });

    let finalUser = user;
    if (guestUserId && guestUserId !== user.id) {
      finalUser = await db.mergeGuestAccount(guestUserId, user.id) || user;
    }

    res.json({ success: true, user: finalUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/user/profile', async (req, res) => {
  try {
    const { userId, name, avatar, picture, googleId, email, isGoogle } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

    const updatedUser = await db.upsertUser({
      userId,
      name,
      avatar,
      picture,
      googleId,
      email,
      isGoogle
    });

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const users = await db.getUsers();
    const matches = await db.getMatches();
    const activeRoomsCount = roomManager.rooms.size;

    res.json({
      success: true,
      stats: {
        totalPlayers: users.length,
        totalMatches: matches.length,
        activeRooms: activeRoomsCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ================= SOCKET.IO HANDLERS =================

io.on('connection', (socket) => {
  console.log(`⚡ Player connected: ${socket.id}`);

  // Create private room
  socket.on('create_room', ({ user, gameType }, callback) => {
    try {
      const room = roomManager.createRoom({ socketId: socket.id, user, gameType });
      socket.join(room.id);
      if (callback) callback({ success: true, room, playerIndex: 0 });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Join existing room with code
  socket.on('join_room', ({ roomId, user }, callback) => {
    try {
      const result = roomManager.joinRoom({ roomId, socketId: socket.id, user });
      if (!result.success) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      socket.join(result.room.id);
      
      io.to(result.room.id).emit('room_updated', result.room);

      if (callback) callback({ success: true, room: result.room, playerIndex: result.playerIndex });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Quick Match Random Pairing
  socket.on('quick_match', ({ user, gameType }, callback) => {
    try {
      const matchResult = roomManager.findQuickMatch({ socketId: socket.id, user, gameType });

      if (matchResult.matched) {
        socket.join(matchResult.room.id);
        const opponentSocket = io.sockets.sockets.get(matchResult.opponentSocketId);
        if (opponentSocket) opponentSocket.join(matchResult.room.id);

        io.to(matchResult.room.id).emit('match_found', { room: matchResult.room });
        if (callback) callback({ success: true, matched: true, room: matchResult.room });
      } else {
        if (callback) callback({ success: true, matched: false, inQueue: true });
      }
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Cancel Quick Match Queue
  socket.on('cancel_quick_match', () => {
    roomManager.removeFromQueue(socket.id);
  });

  // Make Game Move
  socket.on('make_move', async ({ roomId, move }) => {
    const result = await roomManager.handleMove({ roomId, socketId: socket.id, move });
    if (result.error) {
      socket.emit('move_error', { message: result.error });
      return;
    }

    io.to(roomId).emit('room_updated', result.room);
  });

  // Switch Active Game in Room
  socket.on('switch_game', ({ roomId, gameType }, callback) => {
    const result = roomManager.switchGame({ roomId, gameType, socketId: socket.id });
    if (result.success) {
      io.to(roomId).emit('room_updated', result.room);
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false, error: result.error });
    }
  });

  // Send In-Room Chat / Emoji
  socket.on('send_chat', ({ roomId, message, type }) => {
    const result = roomManager.handleChat({ roomId, socketId: socket.id, message, type });
    if (result) {
      io.to(roomId).emit('chat_updated', { room: result.room, newMsg: result.chatMsg });
    }
  });

  // Request Rematch
  socket.on('request_rematch', ({ roomId }) => {
    const result = roomManager.handleRematch({ roomId, socketId: socket.id });
    if (result) {
      io.to(roomId).emit('rematch_status', result);
      io.to(roomId).emit('room_updated', result.room);
    }
  });

  // Toggle Voice Chat Active Status
  socket.on('toggle_voice', ({ roomId, enabled }) => {
    const room = roomManager.toggleVoice({ roomId, socketId: socket.id, enabled });
    if (room) {
      io.to(roomId).emit('room_updated', room);
    }
  });

  // Relay WebRTC Signals to Opponent
  socket.on('webrtc_signal', ({ roomId, targetSocketId, signal }) => {
    io.to(targetSocketId).emit('webrtc_signal', { senderSocketId: socket.id, signal });
  });

  // Update Profile
  socket.on('update_profile', ({ user }) => {
    try {
      const room = roomManager.updatePlayerProfile(socket.id, user);
      if (room) {
        io.to(room.id).emit('room_updated', room);
      }
    } catch (err) {
      console.error('Error updating profile in room:', err.message);
    }
  });

  // Leave Room
  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    const discResult = roomManager.handleDisconnect(socket.id);
    if (discResult) {
      io.to(roomId).emit('room_updated', discResult.room);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔥 Player disconnected: ${socket.id}`);
    const discResult = roomManager.handleDisconnect(socket.id);
    if (discResult) {
      io.to(discResult.room.id).emit('player_disconnected', discResult);
    }
  });
});


const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Express + Socket.io Server listening on port ${PORT}`);
});
