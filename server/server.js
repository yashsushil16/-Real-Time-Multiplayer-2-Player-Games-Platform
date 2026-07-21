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

// CORS configuration supporting local Vite dev server and production domains
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

app.get('/api/leaderboard', (req, res) => {
  try {
    const users = db.getUsers();
    res.json({ success: true, leaderboard: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/matches', (req, res) => {
  try {
    const matches = db.getMatches();
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/user/profile', (req, res) => {
  try {
    const { userId, name, avatar } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

    const updatedUser = db.upsertUser(userId, name, avatar);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const users = db.getUsers();
    const matches = db.getMatches();
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
      
      // Broadcast state update to everyone in room
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

  // Make Game Move (Server Authoritative)
  socket.on('make_move', ({ roomId, move }) => {
    const result = roomManager.handleMove({ roomId, socketId: socket.id, move });
    if (result.error) {
      socket.emit('move_error', { message: result.error });
      return;
    }

    io.to(roomId).emit('room_updated', result.room);
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
