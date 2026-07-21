import React from 'react';
import { useSocket } from '../../context/SocketContext';

export default function DotsAndBoxesBoard() {
  const { room, playerIndex, makeMove } = useSocket();
  const gameState = room?.gameState;

  if (!gameState) return null;

  const isMyTurn = gameState.turn === playerIndex;
  const isFinished = gameState.status === 'finished';

  const handleLineClick = (type, row, col) => {
    if (!isMyTurn || isFinished) return;
    makeMove({ type, row, col });
  };

  const pKey = playerIndex === 0 ? 'p1' : 'p2';
  const oppKey = playerIndex === 0 ? 'p2' : 'p1';

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4">
      {/* Score Tracker & Turn Banner */}
      <div className="flex items-center gap-6 bg-[#06D6A0] border-[3px] border-[#1E1E24] shadow-[4px_4px_0px_#1E1E24] px-6 py-3 rounded-2xl">
        <div className="text-center">
          <div className="text-xs font-bold text-[#1E1E24] uppercase">Your Boxes</div>
          <div className="text-3xl font-extrabold text-[#1E1E24]">{gameState.scores[pKey]}</div>
        </div>
        <div className="text-2xl font-bold text-[#1E1E24]">:</div>
        <div className="text-center">
          <div className="text-xs font-bold text-[#1E1E24] uppercase">Opponent</div>
          <div className="text-3xl font-extrabold text-[#1E1E24]">{gameState.scores[oppKey]}</div>
        </div>
      </div>

      <div className={`badge-geo text-sm py-1.5 px-4 ${isMyTurn ? 'badge-yellow' : 'badge-coral'}`}>
        {isFinished
          ? 'Match Completed'
          : (isMyTurn ? "👉 Your Turn: Draw a Line" : "⏳ Opponent is Drawing...")}
      </div>

      {/* Dots & Boxes Grid Container */}
      <div className="bg-white border-[4px] border-[#1E1E24] shadow-[8px_8px_0px_#1E1E24] p-6 rounded-3xl inline-block">
        <div className="flex flex-col space-y-2">
          {Array(4).fill(null).map((_, rIdx) => (
            <React.Fragment key={rIdx}>
              {/* Row of Horizontal Lines & Dots */}
              <div className="flex items-center space-x-2">
                {Array(3).fill(null).map((_, cIdx) => {
                  const hDrawn = gameState.hEdges[rIdx][cIdx] !== null;
                  const linePlayer = gameState.hEdges[rIdx][cIdx];

                  return (
                    <React.Fragment key={cIdx}>
                      {/* Dot */}
                      <div className="w-5 h-5 rounded-full bg-[#1E1E24] border-[2px] border-[#1E1E24] shadow-[1px_1px_0px_#1E1E24] flex-shrink-0" />
                      {/* Horizontal Line Bar */}
                      <button
                        onClick={() => handleLineClick('h', rIdx, cIdx)}
                        disabled={hDrawn || !isMyTurn || isFinished}
                        className={`h-4 w-16 sm:w-20 rounded-md border-[2px] border-[#1E1E24] transition-all ${
                          hDrawn
                            ? (linePlayer === 0 ? 'bg-[#FF5A5F]' : 'bg-[#6C5CE7]')
                            : (isMyTurn && !isFinished
                                ? 'bg-gray-100 hover:bg-[#FFD166] cursor-pointer'
                                : 'bg-gray-100 cursor-not-allowed')
                        }`}
                      />
                    </React.Fragment>
                  );
                })}
                {/* Last Dot in Row */}
                <div className="w-5 h-5 rounded-full bg-[#1E1E24] border-[2px] border-[#1E1E24] shadow-[1px_1px_0px_#1E1E24] flex-shrink-0" />
              </div>

              {/* Row of Vertical Lines & Boxes (only if rIdx < 3) */}
              {rIdx < 3 && (
                <div className="flex items-center space-x-2">
                  {Array(3).fill(null).map((_, cIdx) => {
                    const vDrawn = gameState.vEdges[rIdx][cIdx] !== null;
                    const vPlayer = gameState.vEdges[rIdx][cIdx];
                    const boxOwner = gameState.boxes[rIdx][cIdx];

                    return (
                      <React.Fragment key={cIdx}>
                        {/* Vertical Line Bar */}
                        <button
                          onClick={() => handleLineClick('v', rIdx, cIdx)}
                          disabled={vDrawn || !isMyTurn || isFinished}
                          className={`w-5 h-16 sm:h-20 rounded-md border-[2px] border-[#1E1E24] transition-all flex-shrink-0 ${
                            vDrawn
                              ? (vPlayer === 0 ? 'bg-[#FF5A5F]' : 'bg-[#6C5CE7]')
                              : (isMyTurn && !isFinished
                                  ? 'bg-gray-100 hover:bg-[#FFD166] cursor-pointer'
                                  : 'bg-gray-100 cursor-not-allowed')
                          }`}
                        />
                        {/* Box Center Area */}
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-[2px] border-dashed border-gray-300 flex items-center justify-center font-['Fredoka'] text-xl font-extrabold transition-all ${
                          boxOwner === 0
                            ? 'bg-[#FF5A5F]/20 text-[#FF5A5F] border-solid border-[#FF5A5F] animate-pop'
                            : boxOwner === 1
                            ? 'bg-[#6C5CE7]/20 text-[#6C5CE7] border-solid border-[#6C5CE7] animate-pop'
                            : 'bg-gray-50/50'
                        }`}>
                          {boxOwner === 0 && 'P1'}
                          {boxOwner === 1 && 'P2'}
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {/* Last Vertical Line in Row */}
                  {(() => {
                    const vDrawn = gameState.vEdges[rIdx][3] !== null;
                    const vPlayer = gameState.vEdges[rIdx][3];
                    return (
                      <button
                        onClick={() => handleLineClick('v', rIdx, 3)}
                        disabled={vDrawn || !isMyTurn || isFinished}
                        className={`w-5 h-16 sm:h-20 rounded-md border-[2px] border-[#1E1E24] transition-all flex-shrink-0 ${
                          vDrawn
                            ? (vPlayer === 0 ? 'bg-[#FF5A5F]' : 'bg-[#6C5CE7]')
                            : (isMyTurn && !isFinished
                                ? 'bg-gray-100 hover:bg-[#FFD166] cursor-pointer'
                                : 'bg-gray-100 cursor-not-allowed')
                        }`}
                      />
                    );
                  })()}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
