import React from 'react';
import { useSocket } from '../../context/SocketContext';

export default function RPSBoard() {
  const { room, playerIndex, makeMove } = useSocket();
  const gameState = room?.gameState;

  if (!gameState) return null;

  const pKey = playerIndex === 0 ? 'p1' : 'p2';
  const oppKey = playerIndex === 0 ? 'p2' : 'p1';

  const myChoice = gameState.choices[pKey];
  const oppChoice = gameState.choices[oppKey];
  const isFinished = gameState.status === 'finished';

  const handleSelect = (choice) => {
    if (myChoice || isFinished) return;
    makeMove({ choice });
  };

  const choiceIcons = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-4">
      {/* Score Tracker Banner */}
      <div className="flex items-center gap-6 bg-[#FFD166] border-[3px] border-[#1E1E24] shadow-[4px_4px_0px_#1E1E24] px-6 py-3 rounded-2xl">
        <div className="text-center">
          <div className="text-xs font-bold text-[#1E1E24] uppercase">You</div>
          <div className="text-3xl font-extrabold text-[#1E1E24]">{gameState.scores[pKey]}</div>
        </div>
        <div className="text-2xl font-bold text-[#1E1E24]">—</div>
        <div className="text-center">
          <div className="text-xs font-bold text-[#1E1E24] uppercase">Opponent</div>
          <div className="text-3xl font-extrabold text-[#1E1E24]">{gameState.scores[oppKey]}</div>
        </div>
      </div>

      {/* Round Result Reveal / Status */}
      {gameState.lastRound && (
        <div className="card-geo bg-white p-4 text-center max-w-sm w-full animate-pop">
          <div className="text-xs font-bold text-[#5C5C66] uppercase mb-1">
            Last Round Outcome
          </div>
          <div className="flex items-center justify-center gap-4 text-3xl font-bold my-2">
            <span>{choiceIcons[gameState.lastRound.p1Choice]}</span>
            <span className="text-sm font-bold text-gray-400">VS</span>
            <span>{choiceIcons[gameState.lastRound.p2Choice]}</span>
          </div>
          <div className="font-['Fredoka'] font-bold text-[#6C5CE7]">
            {gameState.lastRound.winner === 'draw'
              ? '🤝 Round Tie!'
              : (gameState.lastRound.winner === pKey ? '🎉 You won the round!' : '💥 Opponent won the round!')}
          </div>
        </div>
      )}

      {/* Choices Selection Area */}
      <div className="space-y-4 text-center">
        <div className="font-['Fredoka'] text-xl font-bold text-[#1E1E24]">
          {myChoice 
            ? (oppChoice ? 'Round finished!' : 'Waiting for opponent selection...') 
            : 'Make your move for this round:'}
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {[
            { id: 'rock', label: 'Rock', icon: '✊' },
            { id: 'paper', label: 'Paper', icon: '✋' },
            { id: 'scissors', label: 'Scissors', icon: '✌️' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              disabled={!!myChoice || isFinished}
              className={`w-24 h-28 sm:w-28 sm:h-32 rounded-2xl border-[3px] border-[#1E1E24] flex flex-col items-center justify-center gap-2 transition-all ${
                myChoice === item.id
                  ? 'bg-[#06D6A0] shadow-[5px_5px_0px_#1E1E24] scale-105'
                  : (myChoice || isFinished
                      ? 'bg-gray-100 opacity-60 cursor-not-allowed shadow-none'
                      : 'bg-white shadow-[4px_4px_0px_#1E1E24] hover:bg-[#FFD166] hover:-translate-y-1')
              }`}
            >
              <span className="text-4xl sm:text-5xl">{item.icon}</span>
              <span className="font-['Fredoka'] font-bold text-sm text-[#1E1E24]">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
