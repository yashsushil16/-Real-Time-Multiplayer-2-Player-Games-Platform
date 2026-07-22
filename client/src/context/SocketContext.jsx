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
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    picture: null,
    isGoogle: false
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

  const updateUserProfile = async (name, avatar, picture = null) => {
    const updated = { ...user, name, avatar, picture: picture ?? user.picture };
    setUser(updated);
    localStorage.setItem('arcade_user', JSON.stringify(updated));

    if (socket) {
      socket.emit('update_profile', { user: updated });
    }

    try {
      await fetch(`${SERVER_URL}/api/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name,
          avatar,
          picture: updated.picture,
          googleId: user.googleId,
          email: user.email,
          isGoogle: user.isGoogle
        })
      });
    } catch (err) {
      console.error('Failed to sync profile to server:', err);
    }
  };

  const loginWithGoogle = async ({ token, googleUser, isSimulated }) => {
    try {
      const payload = token 
        ? { token, guestUserId: user?.id } 
        : { isSimulated: true, guestUserId: user?.id, ...googleUser };

      const res = await fetch(`${SERVER_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        const fullUser = {
          ...data.user,
          avatar: data.user.avatar || '👑',
          isGoogle: true
        };
        setUser(fullUser);
        localStorage.setItem('arcade_user', JSON.stringify(fullUser));
        
        if (socket) {
          socket.emit('update_profile', { user: fullUser });
        }

        audio.playWin();
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Google login server error:', err);
      setErrorMsg(err.message || 'Google login failed');
      setTimeout(() => setErrorMsg(null), 5000);
      // Fallback local set
      const fallbackUser = googleUser || {};
      if (fallbackUser.googleId) {
        const localUser = {
          id: 'usr_g_' + fallbackUser.googleId,
          googleId: fallbackUser.googleId,
          name: fallbackUser.name,
          email: fallbackUser.email,
          picture: fallbackUser.picture,
          avatar: '👑',
          isGoogle: true
        };
        setUser(localUser);
        localStorage.setItem('arcade_user', JSON.stringify(localUser));
      }
    }
  };

  const logoutUser = () => {
    const defaultUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: 'Player_' + Math.floor(1000 + Math.random() * 9000),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      picture: null,
      isGoogle: false
    };
    setUser(defaultUser);
    localStorage.setItem('arcade_user', JSON.stringify(defaultUser));
    audio.playClick();
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
        const idx = res.room?.players?.findIndex(p => p.id === user.id) ?? -1;
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

  const switchGame = (gameType, callback) => {
    if (!socket || !room) return;
    audio.playClick();
    socket.emit('switch_game', { roomId: room.id, gameType }, (res) => {
      if (callback) callback(res);
      if (!res.success) {
        setErrorMsg(res.error);
        setTimeout(() => setErrorMsg(null), 3000);
      }
    });
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
        loginWithGoogle,
        logoutUser,
        createRoom,
        joinRoom,
        startQuickMatch,
        cancelQuickMatch,
        makeMove,
        sendChat,
        requestRematch,
        leaveRoom,
        switchGame,
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
