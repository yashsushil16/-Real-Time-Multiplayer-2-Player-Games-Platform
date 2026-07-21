import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Crown } from 'lucide-react';

export default function CheckersBoard() {
  const { room, playerIndex, makeMove } = useSocket();
  const gameState = room?.gameState;
  const [selectedPos, setSelectedPos] = useState(null); // [r, c]

  if (!gameState) return null;

  const isMyTurn = gameState.turn === playerIndex;
  const isFinished = gameState.status === 'finished';

  const handleSquareClick = (r, c) => {
    if (!isMyTurn || isFinished) return;

    const piece = gameState.board[r][c];

    // If clicking own piece, select it
    if (piece && piece.player === playerIndex) {
      setSelectedPos([r, c]);
      return;
    }

    // If a piece is currently selected and clicking target square
    if (selectedPos) {
      makeMove({
        from: selectedPos,
        to: [r, c]
      });
      setSelectedPos(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-4">
      {/* Turn Banner */}
      <div className={`badge-geo text-sm py-1.5 px-4 ${isMyTurn ? 'badge-yellow' : 'badge-coral'}`}>
        {isFinished
          ? 'Match Completed'
          : (isMyTurn ? "👉 Your Turn: Select & Move Checkers Piece" : "⏳ Opponent is Thinking...")}
      </div>

      {/* 8x8 Board Container */}
      <div className="bg-[#6C5CE7] border-[4px] border-[#1E1E24] shadow-[8px_8px_0px_#1E1E24] p-3 rounded-3xl">
        <div className="grid grid-rows-8 gap-0 border-[3px] border-[#1E1E24] rounded-xl overflow-hidden">
          {gameState.board.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-8 gap-0">
              {row.map((piece, cIdx) => {
                const isDarkSquare = (rIdx + cIdx) % 2 === 1;
                const isSelected = selectedPos && selectedPos[0] === rIdx && selectedPos[1] === cIdx;

                return (
                  <div
                    key={cIdx}
                    onClick={() => isDarkSquare && handleSquareClick(rIdx, cIdx)}
                    className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center relative transition-all ${
                      isDarkSquare
                        ? (isSelected
                            ? 'bg-[#FFD166] ring-4 ring-[#1E1E24] z-10'
                            : 'bg-[#1E1E24] cursor-pointer hover:bg-[#32323D]')
                        : 'bg-[#F4F0EA]'
                    }`}
                  >
                    {piece && (
                      <div
                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full border-[2px] border-[#1E1E24] flex items-center justify-center shadow-[2px_2px_0px_#1E1E24] transition-transform ${
                          piece.player === 0
                            ? 'bg-[#FF5A5F] text-white'
                            : 'bg-[#06D6A0] text-[#1E1E24]'
                        } ${isSelected ? 'scale-110' : ''}`}
                      >
                        {piece.king && <Crown className="w-4 h-4 text-white fill-current" />}
                      </div>
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
