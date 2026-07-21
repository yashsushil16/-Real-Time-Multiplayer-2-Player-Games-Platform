import { createInitialGameState, processGameMove } from './gameEngine/index.js';
import { db } from './db.js';

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> room object
    this.quickMatchQueues = new Map(); // gameType -> array of { socketId, user }
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
        { socketId, id: user.id, name: user.name, avatar: user.avatar, isReady: false }
      ],
      spectators: [],
      gameState: initialGameState,
      chat: [],
      rematchVotes: new Set(),
      createdAt: Date.now()
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

    // Check if player is already in room
    const existingPlayerIndex = room.players.findIndex(p => p.id === user.id || p.socketId === socketId);
    if (existingPlayerIndex !== -1) {
      // Reconnect player socket
      room.players[existingPlayerIndex].socketId = socketId;
      return { success: true, room, playerIndex: existingPlayerIndex };
    }

    if (room.players.length < 2) {
      room.players.push({
        socketId,
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isReady: true
      });
      const playerIndex = room.players.length - 1;

      // When 2nd player joins, start the match
      if (room.players.length === 2) {
        room.gameState.status = 'playing';
      }

      return { success: true, room, playerIndex };
    } else {
      // Spectator join
      room.spectators.push({ socketId, name: user.name });
      return { success: true, room, isSpectator: true };
    }
  }

  findQuickMatch({ socketId, user, gameType }) {
    if (!this.quickMatchQueues.has(gameType)) {
      this.quickMatchQueues.set(gameType, []);
    }

    const queue = this.quickMatchQueues.get(gameType);
    
    // Remove stale socket if already in queue
    const filteredQueue = queue.filter(item => item.socketId !== socketId && item.user.id !== user.id);
    this.quickMatchQueues.set(gameType, filteredQueue);

    if (filteredQueue.length > 0) {
      // Pair with waiting player
      const opponent = filteredQueue.shift();
      const room = this.createRoom({ socketId: opponent.socketId, user: opponent.user, gameType });
      
      // Join second player
      this.joinRoom({ roomId: room.id, socketId, user });

      return { matched: true, room, opponentSocketId: opponent.socketId };
    } else {
      // Add player to queue
      filteredQueue.push({ socketId, user });
      return { matched: false, inQueue: true };
    }
  }

  removeFromQueue(socketId) {
    for (const [gameType, queue] of this.quickMatchQueues.entries()) {
      this.quickMatchQueues.set(gameType, queue.filter(item => item.socketId !== socketId));
    }
  }

  handleMove({ roomId, socketId, move }) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return { error: 'You are not a player in this room' };

    const result = processGameMove(room.gameState, playerIndex, move);
    if (!result.valid) {
      return { error: result.reason };
    }

    // Check if match ended
    if (room.gameState.status === 'finished') {
      let winnerName = null;
      if (!room.gameState.isDraw && room.gameState.winner !== null) {
        winnerName = room.players[room.gameState.winner]?.name;
      }

      db.recordMatch({
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

    room.rematchVotes.add(socketId);

    // If both players voted for rematch
    if (room.rematchVotes.size >= 2) {
      room.gameState = createInitialGameState(room.gameType);
      room.gameState.status = 'playing';
      room.rematchVotes.clear();
      return { reset: true, room };
    }

    return { reset: false, room, votes: room.rematchVotes.size };
  }

  handleDisconnect(socketId) {
    this.removeFromQueue(socketId);

    for (const [roomId, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === socketId);
      if (playerIndex !== -1) {
        // Player disconnected - notify room
        room.players[playerIndex].disconnected = true;
        
        // Auto cleanup empty rooms after timeout
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
