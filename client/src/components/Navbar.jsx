import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, Trophy, History, Gamepad2, User, LogIn } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenProfile }) {
  const { user, connected, isMuted, toggleSound } = useSocket();

  return (
    <header className="sticky top-0 z-50 bg-[#F4F0EA]/95 backdrop-blur-md border-b-[3px] border-[#1E1E24] px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Always Visible Name */}
        <div 
          onClick={() => setActiveTab('lobby')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#6C5CE7] border-[2px] sm:border-[3px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] sm:shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-white text-base sm:text-xl group-hover:scale-105 transition-transform flex-shrink-0">
            🎮
          </div>
          <div>
            <span className="font-['Fredoka'] text-base sm:text-2xl font-bold tracking-wide text-[#1E1E24] leading-tight block">
              Yash's <span className="text-[#FF5A5F]">Arcade Arena</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-[#5C5C66]">
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${connected ? 'bg-[#06D6A0]' : 'bg-[#FF5A5F] animate-ping'}`} />
              <span className="text-[10px] sm:text-xs">{connected ? 'Server Ready' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-white border-[2px] sm:border-[3px] border-[#1E1E24] p-1 rounded-xl sm:rounded-2xl shadow-[2px_2px_0px_#1E1E24] sm:shadow-[3px_3px_0px_#1E1E24]">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-['Fredoka'] font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'lobby'
                ? 'bg-[#FFD166] border-[2px] border-[#1E1E24] shadow-[1px_1px_0px_#1E1E24]'
                : 'hover:bg-gray-100 text-[#5C5C66]'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Games</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-['Fredoka'] font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-[#06D6A0] border-[2px] border-[#1E1E24] shadow-[1px_1px_0px_#1E1E24]'
                : 'hover:bg-gray-100 text-[#5C5C66]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Ranks</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-['Fredoka'] font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-[#4EA8DE] text-white border-[2px] border-[#1E1E24] shadow-[1px_1px_0px_#1E1E24]'
                : 'hover:bg-gray-100 text-[#5C5C66]'
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </nav>

        {/* Right Actions: Sound + User Profile Badge */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={toggleSound}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border-[2px] sm:border-[3px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] flex items-center justify-center text-[#1E1E24] hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] transition-all flex-shrink-0"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5A5F]" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#06D6A0]" />}
          </button>

          <button
            onClick={onOpenProfile}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border-[2px] sm:border-[3px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] font-['Fredoka'] font-semibold hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] transition-all ${
              user.isGoogle ? 'bg-[#4EA8DE] text-white' : 'bg-[#FF70A6] text-white'
            }`}
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-[1.5px] border-[#1E1E24] object-cover flex-shrink-0"
              />
            ) : (
              <span className="text-base sm:text-xl">{user.avatar}</span>
            )}
            <span className="hidden md:inline max-w-[90px] truncate text-xs sm:text-sm">{user.name}</span>
            {user.isGoogle ? (
              <span className="text-[10px] bg-white/30 px-1 rounded font-mono font-bold">G</span>
            ) : (
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
