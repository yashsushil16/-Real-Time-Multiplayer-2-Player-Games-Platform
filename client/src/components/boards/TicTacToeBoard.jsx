import React from 'react';
import { useSocket } from '../../context/SocketContext';

export default function TicTacToeBoard() {
  const { room, playerIndex, makeMove } = useSocket();
  const gameState = room?.gameState;

  if (!gameState) return null;

  const isMyTurn = gameState.turn === playerIndex;
  const isFinished = gameState.status === 'finished';

  const handleClick = (index) => {
    if (!isMyTurn || gameState.board[index] !== null || isFinished) return;
    makeMove({ index });
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4">
      {/* Turn Indicator Banner */}
      <div className={`badge-geo text-sm py-1.5 px-4 ${isMyTurn ? 'badge-yellow' : 'badge-coral'}`}>
        {isFinished
          ? 'Match Completed'
          : (isMyTurn ? "👉 Your Turn (Mark Your Square)" : "⏳ Opponent is Thinking...")}
      </div>

      {/* 3x3 Board Grid */}
      <div className="grid grid-cols-3 gap-3 bg-[#1E1E24] p-3 rounded-3xl shadow-[6px_6px_0px_#1E1E24]">
        {gameState.board.map((cell, idx) => {
          const isWinningSquare = gameState.winningLine?.includes(idx);

          return (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              disabled={!isMyTurn || cell !== null || isFinished}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-[3px] border-[#1E1E24] flex items-center justify-center text-4xl sm:text-5xl font-['Fredoka'] font-extrabold transition-all ${
                isWinningSquare
                  ? 'bg-[#FFD166] animate-pulse-slow shadow-none scale-105 z-10'
                  : cell === 'X'
                  ? 'bg-[#FF70A6] text-white shadow-[2px_2px_0px_#1E1E24]'
                  : cell === 'O'
                  ? 'bg-[#06D6A0] text-[#1E1E24] shadow-[2px_2px_0px_#1E1E24]'
                  : (isMyTurn && !isFinished
                      ? 'bg-white hover:bg-gray-100 hover:scale-95 cursor-pointer'
                      : 'bg-white/80 cursor-not-allowed')
              }`}
            >
              {cell && <span className="animate-pop">{cell}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
