import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, Trophy, History, Gamepad2, User } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenProfile }) {
  const { user, connected, isMuted, toggleSound } = useSocket();

  return (
    <header className="sticky top-0 z-50 bg-[#F4F0EA]/90 backdrop-blur-md border-b-[3px] border-[#1E1E24] px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('lobby')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#6C5CE7] border-[3px] border-[#1E1E24] shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-white text-xl group-hover:scale-105 transition-transform">
            🎮
          </div>
          <div>
            <span className="font-['Fredoka'] text-2xl font-bold tracking-wide text-[#1E1E24]">
              Arcade<span className="text-[#FF5A5F]">Arena</span>
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5C5C66]">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#06D6A0]' : 'bg-[#FF5A5F] animate-ping'}`} />
              <span>{connected ? 'Server Ready' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 bg-white border-[3px] border-[#1E1E24] p-1.5 rounded-2xl shadow-[3px_3px_0px_#1E1E24]">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-['Fredoka'] font-semibold text-sm transition-all ${
              activeTab === 'lobby'
                ? 'bg-[#FFD166] border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24]'
                : 'hover:bg-gray-100 text-[#5C5C66]'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Games</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-['Fredoka'] font-semibold text-sm transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-[#06D6A0] border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24]'
                : 'hover:bg-gray-100 text-[#5C5C66]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-['Fredoka'] font-semibold text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-[#4EA8DE] text-white border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24]'
                : 'hover:bg-gray-100 text-[#5C5C66]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </nav>

        {/* Right Actions: Sound + User Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className="w-10 h-10 rounded-xl bg-white border-[3px] border-[#1E1E24] shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-[#1E1E24] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] transition-all"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-[#FF5A5F]" /> : <Volume2 className="w-5 h-5 text-[#06D6A0]" />}
          </button>

          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FF70A6] border-[3px] border-[#1E1E24] shadow-[3px_3px_0px_#1E1E24] text-white font-['Fredoka'] font-semibold hover:scale-105 active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            <span className="text-xl">{user.avatar}</span>
            <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
            <User className="w-4 h-4 opacity-80" />
          </button>
        </div>
      </div>
    </header>
  );
}
