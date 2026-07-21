import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { audio } from '../utils/audio';

const SocketContext = createContext();

const AVATARS = ['🎮', '👾', '🚀', '👑', '⚔️', '🦊', '🐯', '🤖', '🎲', '🧩'];

function getInitialUser() {
  try {
    const saved = localStorage.getItem('arcade_user');
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  const defaultUser = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    name: 'Player_' + Math.floor(1000 + Math.random() * 9000),
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
  };
  localStorage.setItem('arcade_user', JSON.stringify(defaultUser));
  return defaultUser;
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(getInitialUser());
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [searchingGameType, setSearchingGameType] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // Server URL logic (defaults to local 4000 port or VITE_SERVER_URL)
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to Arcade server:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('room_updated', (updatedRoom) => {
      setRoom({ ...updatedRoom });
      audio.playMove();
    });

    newSocket.on('match_found', ({ room: matchedRoom }) => {
      setIsSearchingQuickMatch(false);
      setSearchingGameType(null);
      setRoom(matchedRoom);
      
      // Determine player index
      const idx = matchedRoom.players.findIndex(p => p.id === user.id);
      setPlayerIndex(idx !== -1 ? idx : 0);
      audio.playWin();
    });

    newSocket.on('chat_updated', ({ room: updatedRoom }) => {
      setRoom({ ...updatedRoom });
      audio.playClick();
    });

    newSocket.on('move_error', ({ message }) => {
      setErrorMsg(message);
      audio.playLose();
      setTimeout(() => setErrorMsg(null), 3000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateUserProfile = async (name, avatar) => {
    const updated = { ...user, name, avatar };
    setUser(updated);
    localStorage.setItem('arcade_user', JSON.stringify(updated));

    try {
      await fetch(`${SERVER_URL}/api/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name, avatar })
      });
    } catch (err) {
      console.error('Failed to sync profile to server:', err);
    }
  };

  const createRoom = (gameType, callback) => {
    if (!socket) return;
    audio.playClick();
    socket.emit('create_room', { user, gameType }, (res) => {
      if (res.success) {
        setRoom(res.room);
        setPlayerIndex(res.playerIndex);
        if (callback) callback(res);
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  const joinRoom = (roomId, callback) => {
    if (!socket) return;
    audio.playClick();
    socket.emit('join_room', { roomId, user }, (res) => {
      if (res.success) {
        setRoom(res.room);
        setPlayerIndex(res.playerIndex ?? 0);
        if (callback) callback(res);
      } else {
        setErrorMsg(res.error);
        if (callback) callback(res);
      }
    });
  };

  const startQuickMatch = (gameType) => {
    if (!socket) return;
    audio.playClick();
    setIsSearchingQuickMatch(true);
    setSearchingGameType(gameType);

    socket.emit('quick_match', { user, gameType }, (res) => {
      if (res.matched) {
        setIsSearchingQuickMatch(false);
        setSearchingGameType(null);
        setRoom(res.room);
        const idx = res.room.players.findIndex(p => p.id === user.id);
        setPlayerIndex(idx !== -1 ? idx : 0);
      }
    });
  };

  const cancelQuickMatch = () => {
    if (!socket) return;
    audio.playClick();
    socket.emit('cancel_quick_match');
    setIsSearchingQuickMatch(false);
    setSearchingGameType(null);
  };

  const makeMove = (move) => {
    if (!socket || !room) return;
    socket.emit('make_move', { roomId: room.id, move });
  };

  const sendChat = (message, type = 'text') => {
    if (!socket || !room) return;
    socket.emit('send_chat', { roomId: room.id, message, type });
  };

  const requestRematch = () => {
    if (!socket || !room) return;
    audio.playClick();
    socket.emit('request_rematch', { roomId: room.id });
  };

  const leaveRoom = () => {
    if (!socket || !room) return;
    audio.playClick();
    socket.emit('leave_room', { roomId: room.id });
    setRoom(null);
    setPlayerIndex(null);
  };

  const toggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        user,
        room,
        playerIndex,
        isSearchingQuickMatch,
        searchingGameType,
        errorMsg,
        isMuted,
        avatars: AVATARS,
        SERVER_URL,
        updateUserProfile,
        createRoom,
        joinRoom,
        startQuickMatch,
        cancelQuickMatch,
        makeMove,
        sendChat,
        requestRematch,
        leaveRoom,
        toggleSound,
        setErrorMsg
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
