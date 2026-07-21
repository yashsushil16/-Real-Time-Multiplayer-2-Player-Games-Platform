import React, { useState } from 'react';
import { useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import Leaderboard from './components/Leaderboard';
import MatchHistory from './components/MatchHistory';
import UserProfileModal from './components/UserProfileModal';

export default function App() {
  const { room } = useSocket();
  const [activeTab, setActiveTab] = useState('lobby');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0EA]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="flex-1">
        {/* If player is currently inside an active game room, render GameRoom */}
        {room ? (
          <GameRoom />
        ) : (
          <>
            {activeTab === 'lobby' && <Lobby />}
            {activeTab === 'leaderboard' && <Leaderboard />}
            {activeTab === 'history' && <MatchHistory />}
          </>
        )}
      </main>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <footer className="py-6 border-t-[3px] border-[#1E1E24] bg-white text-center text-xs font-bold text-[#5C5C66] mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-['Fredoka'] text-sm text-[#1E1E24]">
            🎮 Arcade<span className="text-[#FF5A5F]">Arena</span> — 2-Player Multiplayer Hub
          </div>
          <div>
            Built with React, Express, Socket.io & Web Audio API
          </div>
        </div>
      </footer>
    </div>
  );
}
