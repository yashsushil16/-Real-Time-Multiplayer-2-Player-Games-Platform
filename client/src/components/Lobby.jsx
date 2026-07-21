import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Play, Users, Zap, Hash, X, ArrowRight, ShieldAlert } from 'lucide-react';

const GAME_LINEUP = [
  {
    id: 'rockPaperScissors',
    title: 'Rock Paper Scissors',
    icon: '✂️',
    color: 'bg-[#FFD166]',
    tag: 'Casual',
    badgeColor: 'badge-yellow',
    desc: 'Simultaneous secret selection, first to 3 points wins!'
  },
  {
    id: 'ticTacToe',
    title: 'Tic-Tac-Toe',
    icon: '❌',
    color: 'bg-[#FF70A6]',
    tag: 'Classic',
    badgeColor: 'badge-coral',
    desc: '3 in a row on a 3x3 grid. Fast, strategy-packed matches.'
  },
  {
    id: 'connectFour',
    title: 'Connect 4',
    icon: '🟡',
    color: 'bg-[#4EA8DE]',
    tag: 'Tactical',
    badgeColor: 'badge-blue',
    desc: 'Gravity-drop tokens into columns to connect 4 in a row!'
  },
  {
    id: 'dotsAndBoxes',
    title: 'Dots & Boxes',
    icon: '🔳',
    color: 'bg-[#06D6A0]',
    tag: 'Strategy',
    badgeColor: 'badge-teal',
    desc: 'Connect dots to complete boxes. Extra turns for every box claimed.'
  },
  {
    id: 'checkers',
    title: 'Checkers',
    icon: '🔴',
    color: 'bg-[#6C5CE7]',
    tag: 'Mastery',
    badgeColor: 'badge-purple',
    desc: '8x8 board, diagonal jumps, piece captures, and kinging!'
  }
];

export default function Lobby() {
  const {
    createRoom,
    joinRoom,
    startQuickMatch,
    cancelQuickMatch,
    isSearchingQuickMatch,
    searchingGameType,
    errorMsg
  } = useSocket();

  const [selectedGame, setSelectedGame] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const handleCreatePrivateRoom = (gameId) => {
    createRoom(gameId);
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    joinRoom(joinCodeInput.trim().toUpperCase(), (res) => {
      if (res.success) {
        setShowJoinModal(false);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Banner / Hero Section */}
      <div className="card-geo bg-[#FFD166] flex flex-col md:flex-row items-center justify-between gap-6 p-8 relative overflow-hidden">
        <div className="space-y-3 max-w-xl z-10">
          <div className="badge-geo badge-purple">
            ⚡ Instant 2-Player Battle
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E1E24] leading-tight">
            Play Friends or Random Opponents!
          </h1>
          <p className="text-base font-semibold text-[#1E1E24]/80">
            Choose from 5 server-authoritative games. Share a 6-digit room code with a buddy or hit Quick Match to play instantly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 z-10 w-full md:w-auto">
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn-geo btn-geo-white w-full sm:w-auto text-base py-3 px-6"
          >
            <Hash className="w-5 h-5 text-[#6C5CE7]" /> Join with Room Code
          </button>
        </div>

        {/* Decorative Geometric Art */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#FF70A6] border-[4px] border-[#1E1E24] opacity-40 pointer-events-none" />
        <div className="absolute right-32 -top-10 w-24 h-24 bg-[#06D6A0] rotate-12 border-[4px] border-[#1E1E24] opacity-40 pointer-events-none" />
      </div>

      {/* Error Alert Toast */}
      {errorMsg && (
        <div className="card-geo bg-[#FF5A5F] text-white p-4 flex items-center gap-3 animate-pop">
          <ShieldAlert className="w-6 h-6 flex-shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Quick Match Searching Modal / Overlay */}
      {isSearchingQuickMatch && (
        <div className="modal-overlay">
          <div className="card-geo bg-white p-8 max-w-md w-full text-center space-y-6 animate-pop">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFD166] border-[3px] border-[#1E1E24] shadow-[4px_4px_0px_#1E1E24] flex items-center justify-center text-4xl animate-bounce">
              🔍
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#1E1E24]">Finding Opponent...</h3>
              <p className="text-sm font-semibold text-[#5C5C66] mt-1">
                Searching for another player for {searchingGameType}...
              </p>
            </div>

            <button
              onClick={cancelQuickMatch}
              className="btn-geo btn-geo-coral w-full py-3"
            >
              Cancel Matchmaking
            </button>
          </div>
        </div>
      )}

      {/* Join Room Code Modal */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="card-geo bg-white p-6 max-w-md w-full space-y-4 animate-pop relative">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[#FF5A5F] text-white border-[2px] border-[#1E1E24] flex items-center justify-center font-bold"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-[#1E1E24] flex items-center gap-2">
              <Hash className="w-6 h-6 text-[#6C5CE7]" /> Join Private Room
            </h3>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#1E1E24] mb-1">
                  6-Character Room Code
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="e.g. ABC123"
                  className="input-geo text-center text-2xl font-mono tracking-wider uppercase"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-geo btn-geo-teal w-full py-3"
              >
                Join Room Now <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Games Lineup Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1E1E24] flex items-center gap-2">
            <span>🎮</span> Select a Game to Play
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAME_LINEUP.map((game) => (
            <div
              key={game.id}
              className={`card-geo card-geo-hover ${game.color} flex flex-col justify-between p-6 space-y-6 relative overflow-hidden`}
            >
              <div className="space-y-3 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-4xl p-2 bg-white rounded-2xl border-[3px] border-[#1E1E24] shadow-[3px_3px_0px_#1E1E24]">
                    {game.icon}
                  </span>
                  <span className={`badge-geo ${game.badgeColor}`}>
                    {game.tag}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[#1E1E24] pt-2">
                  {game.title}
                </h3>
                <p className="text-sm font-semibold text-[#1E1E24]/80">
                  {game.desc}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-4 border-t-[3px] border-[#1E1E24] z-10">
                <button
                  onClick={() => startQuickMatch(game.id)}
                  className="btn-geo btn-geo-white w-full text-sm"
                >
                  <Zap className="w-4 h-4 text-[#FF5A5F]" /> Quick Match (Random)
                </button>
                
                <button
                  onClick={() => handleCreatePrivateRoom(game.id)}
                  className="btn-geo btn-geo-primary w-full text-sm"
                >
                  <Users className="w-4 h-4 text-white" /> Create Room Code
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
