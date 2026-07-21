import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { ArrowDown } from 'lucide-react';

export default function ConnectFourBoard() {
  const { room, playerIndex, makeMove } = useSocket();
  const gameState = room?.gameState;

  if (!gameState) return null;

  const isMyTurn = gameState.turn === playerIndex;
  const isFinished = gameState.status === 'finished';

  const handleDrop = (col) => {
    if (!isMyTurn || isFinished) return;
    makeMove({ col });
  };

  const isWinCell = (r, c) => {
    return gameState.winningCells?.some(([wr, wc]) => wr === r && wc === c);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-4">
      {/* Turn Banner */}
      <div className={`badge-geo text-sm py-1.5 px-4 ${isMyTurn ? 'badge-yellow' : 'badge-coral'}`}>
        {isFinished
          ? 'Match Completed'
          : (isMyTurn ? "👉 Your Turn: Select a Column to Drop" : "⏳ Opponent is Thinking...")}
      </div>

      {/* Connect 4 Frame Container */}
      <div className="bg-[#4EA8DE] border-[4px] border-[#1E1E24] shadow-[8px_8px_0px_#1E1E24] p-4 rounded-3xl space-y-3">
        {/* Column Arrow Drop Buttons */}
        <div className="grid grid-cols-7 gap-2 px-1">
          {Array(7).fill(null).map((_, colIdx) => (
            <button
              key={colIdx}
              onClick={() => handleDrop(colIdx)}
              disabled={!isMyTurn || isFinished}
              className={`h-9 rounded-xl border-[2px] border-[#1E1E24] flex items-center justify-center transition-all ${
                isMyTurn && !isFinished
                  ? 'bg-[#FFD166] hover:bg-[#FF70A6] shadow-[2px_2px_0px_#1E1E24] hover:scale-105'
                  : 'bg-white/40 cursor-not-allowed'
              }`}
            >
              <ArrowDown className="w-4 h-4 text-[#1E1E24]" />
            </button>
          ))}
        </div>

        {/* 6x7 Token Grid */}
        <div className="grid grid-rows-6 gap-2 bg-[#1E1E24] p-3 rounded-2xl">
          {gameState.board.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-7 gap-2">
              {row.map((cell, cIdx) => {
                const win = isWinCell(rIdx, cIdx);

                return (
                  <div
                    key={cIdx}
                    onClick={() => handleDrop(cIdx)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] border-[#1E1E24] flex items-center justify-center transition-all ${
                      win
                        ? 'bg-[#FFD166] animate-pulse-slow shadow-[0_0_12px_#FFD166] scale-110'
                        : cell === 'P1'
                        ? 'bg-[#FF5A5F] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
                        : cell === 'P2'
                        ? 'bg-[#FFD166] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
                        : 'bg-[#F4F0EA] shadow-[inset_0_4px_6px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    {cell && (
                      <div className={`w-3 h-3 rounded-full ${win ? 'bg-white' : 'bg-white/30'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
