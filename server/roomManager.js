import { createInitialGameState, processGameMove } from './gameEngine/index.js';
import { db } from './db.js';

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.quickMatchQueues = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom({ socketId, user, gameType }) {
    let roomId = this.generateRoomCode();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomCode();
    }

    const initialGameState = createInitialGameState(gameType);

    const room = {
      id: roomId,
      gameType,
      gameName: initialGameState.gameName,
      players: [
        {
          socketId,
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          picture: user.picture || null,
          isReady: false
        }
      ],
      spectators: [],
      gameState: initialGameState,
      chat: [],
      rematchVotes: [],
      createdAt: Date.now(),
      accumulatedScores: {}
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom({ roomId, socketId, user }) {
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    const room = this.rooms.get(cleanRoomId);

    if (!room) {
      return { success: false, error: 'Room not found. Check your 6-digit code.' };
    }

    const existingPlayerIndex = room.players.findIndex(p => p.id === user.id || p.socketId === socketId);
    if (existingPlayerIndex !== -1) {
      room.players[existingPlayerIndex].socketId = socketId;
      room.players[existingPlayerIndex].picture = user.picture || room.players[existingPlayerIndex].picture;
      return { success: true, room, playerIndex: existingPlayerIndex };
    }

    if (room.players.length < 2) {
      room.players.push({
        socketId,
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        picture: user.picture || null,
        isReady: true
      });
      const playerIndex = room.players.length - 1;

      // Initialize accumulatedScores
      if (!room.accumulatedScores) room.accumulatedScores = {};
      room.accumulatedScores[user.id] = 0;
      if (room.players[0]) {
        room.accumulatedScores[room.players[0].id] = room.accumulatedScores[room.players[0].id] || 0;
      }
      room.accumulatedScores.draws = room.accumulatedScores.draws || 0;

      if (room.players.length === 2) {
        room.gameState.status = 'playing';
      }

      return { success: true, room, playerIndex };
    } else {
      room.spectators.push({ socketId, name: user.name });
      return { success: true, room, isSpectator: true };
    }
  }

  findQuickMatch({ socketId, user, gameType }) {
    if (!this.quickMatchQueues.has(gameType)) {
      this.quickMatchQueues.set(gameType, []);
    }

    const queue = this.quickMatchQueues.get(gameType);
    const filteredQueue = queue.filter(item => item.socketId !== socketId && item.user.id !== user.id);
    this.quickMatchQueues.set(gameType, filteredQueue);

    if (filteredQueue.length > 0) {
      const opponent = filteredQueue.shift();
      const room = this.createRoom({ socketId: opponent.socketId, user: opponent.user, gameType });
      this.joinRoom({ roomId: room.id, socketId, user });

      return { matched: true, room, opponentSocketId: opponent.socketId };
    } else {
      filteredQueue.push({ socketId, user });
      return { matched: false, inQueue: true };
    }
  }

  removeFromQueue(socketId) {
    for (const [gameType, queue] of this.quickMatchQueues.entries()) {
      this.quickMatchQueues.set(gameType, queue.filter(item => item.socketId !== socketId));
    }
  }

  async handleMove({ roomId, socketId, move }) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return { error: 'You are not a player in this room' };

    const result = processGameMove(room.gameState, playerIndex, move);
    if (!result.valid) {
      return { error: result.reason };
    }

    if (room.gameState.status === 'finished') {
      let winnerName = null;
      if (!room.gameState.isDraw && room.gameState.winner !== null) {
        winnerName = room.players[room.gameState.winner]?.name;
      }

      // Increment room-level accumulated scores
      if (!room.accumulatedScores) {
        room.accumulatedScores = {};
      }
      if (room.gameState.isDraw) {
        room.accumulatedScores.draws = (room.accumulatedScores.draws || 0) + 1;
      } else if (room.gameState.winner !== null) {
        const winnerPlayer = room.players[room.gameState.winner];
        if (winnerPlayer) {
          room.accumulatedScores[winnerPlayer.id] = (room.accumulatedScores[winnerPlayer.id] || 0) + 1;
        }
      }

      await db.recordMatch({
        gameType: room.gameType,
        gameName: room.gameName,
        player1: room.players[0],
        player2: room.players[1],
        winner: winnerName,
        isDraw: room.gameState.isDraw,
        score: room.gameState.scores ? `${room.gameState.scores.p1} - ${room.gameState.scores.p2}` : (room.gameState.isDraw ? 'Draw' : 'Victory')
      });
    }

    return { success: true, room };
  }

  handleChat({ roomId, socketId, message, type = 'text' }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const sender = room.players.find(p => p.socketId === socketId) || 
                   room.spectators.find(s => s.socketId === socketId);

    const chatMsg = {
      id: 'chat_' + Date.now(),
      sender: sender ? sender.name : 'Player',
      avatar: sender ? sender.avatar || '💬' : '💬',
      picture: sender ? sender.picture || null : null,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    room.chat.push(chatMsg);
    if (room.chat.length > 30) room.chat.shift();

    return { room, chatMsg };
  }

  handleRematch({ roomId, socketId }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return null;

    if (!room.rematchVotes) {
      room.rematchVotes = [];
    }

    if (!room.rematchVotes.includes(player.id)) {
      room.rematchVotes.push(player.id);
    }

    if (room.rematchVotes.length >= 2) {
      room.gameState = createInitialGameState(room.gameType);
      room.gameState.status = 'playing';
      room.rematchVotes = [];
      return { reset: true, room };
    }

    return { reset: false, room, votes: room.rematchVotes.length };
  }

  updatePlayerProfile(socketId, newUser) {
    for (const [roomId, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === socketId);
      if (playerIndex !== -1) {
        room.players[playerIndex].id = newUser.id;
        room.players[playerIndex].name = newUser.name;
        room.players[playerIndex].avatar = newUser.avatar;
        room.players[playerIndex].picture = newUser.picture || null;
        return room;
      }
    }
    return null;
  }

  switchGame({ roomId, gameType, socketId }) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return { success: false, error: 'Only players can switch games' };

    const initialGameState = createInitialGameState(gameType);
    room.gameType = gameType;
    room.gameName = initialGameState.gameName;
    room.gameState = initialGameState;

    if (room.players.length === 2) {
      room.gameState.status = 'playing';
    }

    room.rematchVotes = [];

    // System chat notification
    const chatMsg = {
      id: 'chat_' + Date.now(),
      sender: 'System 🤖',
      avatar: '🤖',
      picture: null,
      message: `Game switched to ${room.gameName}!`,
      type: 'text',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    room.chat.push(chatMsg);
    if (room.chat.length > 30) room.chat.shift();

    return { success: true, room };
  }

  handleDisconnect(socketId) {
    this.removeFromQueue(socketId);

    for (const [roomId, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === socketId);
      if (playerIndex !== -1) {
        room.players[playerIndex].disconnected = true;
        room.rematchVotes = []; // Clear rematch votes on player disconnect
        
        setTimeout(() => {
          const currentRoom = this.rooms.get(roomId);
          if (currentRoom && currentRoom.players.every(p => p.disconnected)) {
            this.rooms.delete(roomId);
          }
        }, 60000);

        return { room, playerDisconnectedIndex: playerIndex };
      }
    }
    return null;
  }
}
