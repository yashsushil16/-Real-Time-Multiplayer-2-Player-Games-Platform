import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { ShieldAlert, CheckCircle2, Flame, Award, AlertTriangle } from 'lucide-react';

const SUIT_SYMBOLS = {
  hearts: { symbol: '♥', color: 'text-[#FF5A5F]' },
  diamonds: { symbol: '♦', color: 'text-[#FF5A5F]' },
  clubs: { symbol: '♣', color: 'text-[#1E1E24]' },
  spades: { symbol: '♠', color: 'text-[#1E1E24]' }
};

export default function BluffBoard() {
  const { room, playerIndex, makeMove } = useSocket();
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [timeLeft, setTimeLeft] = useState(6);

  const gameState = room?.gameState;

  // Challenge window timer sync
  useEffect(() => {
    if (gameState?.status === 'challengeWindow' && gameState?.challengeDeadline) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((gameState.challengeDeadline - Date.now()) / 1000));
        setTimeLeft(remaining);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [gameState?.status, gameState?.challengeDeadline]);

  // Clear card selection when turn changes or after move
  useEffect(() => {
    setSelectedCardIds([]);
  }, [gameState?.turn, gameState?.status]);

  if (!gameState) return null;

  const isMyTurn = gameState.turn === playerIndex;
  const isFinished = gameState.status === 'finished';
  const isChallengePhase = gameState.status === 'challengeWindow';
  const myHand = gameState.hands?.[playerIndex] || [];
  
  const opponentIndex = room.players.findIndex((_, idx) => idx !== playerIndex);
  const opponentPlayer = room.players[opponentIndex];
  const opponentHandCount = gameState.handCounts?.[opponentIndex] ?? 0;

  const totalPileCount = (gameState.pile || []).reduce((acc, entry) => acc + (entry.cardCount || 0), 0);
  const lastPlay = gameState.lastPlay;
  const lastChallenge = gameState.lastChallengeResult;

  const toggleSelectCard = (id) => {
    if (!isMyTurn || isChallengePhase || isFinished) return;
    if (selectedCardIds.includes(id)) {
      setSelectedCardIds(selectedCardIds.filter(cardId => cardId !== id));
    } else {
      if (selectedCardIds.length >= 4) return;
      setSelectedCardIds([...selectedCardIds, id]);
    }
  };

  const handlePlayCards = () => {
    if (selectedCardIds.length === 0 || selectedCardIds.length > 4) return;
    makeMove({
      type: 'play_cards',
      cardIds: selectedCardIds
    });
    setSelectedCardIds([]);
  };

  const handleCallBluff = () => {
    makeMove({
      type: 'call_bluff'
    });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-6 py-2 select-none">
      
      {/* Required Rank Cycle Header */}
      <div className="w-full card-geo bg-[#FFD166] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🃏</span>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1E1E24]/70">Required Claim</span>
            <h2 className="text-2xl font-black text-[#1E1E24] font-['Fredoka']">
              Must Declare: <span className="underline decoration-[#FF70A6] decoration-4">{gameState.requiredRank}</span>s
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`badge-geo text-sm py-1.5 px-4 ${
            isFinished
              ? 'badge-purple'
              : isChallengePhase
              ? 'badge-coral animate-pulse'
              : isMyTurn
              ? 'badge-yellow'
              : 'badge-teal'
          }`}>
            {isFinished
              ? 'Match Complete'
              : isChallengePhase
              ? (lastPlay?.playerIndex === playerIndex ? '⏳ Opponent evaluating play...' : '🚨 Challenge Window Open!')
              : isMyTurn
              ? '👉 Your Turn (Play 1-4 Cards)'
              : `⏳ ${opponentPlayer?.name || 'Opponent'}'s Turn`}
          </span>
        </div>
      </div>

      {/* Opponent Area */}
      <div className="w-full card-geo bg-white p-4 flex items-center justify-between border-[3px] border-[#1E1E24]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#06D6A0] border-[2.5px] border-[#1E1E24] flex items-center justify-center text-2xl font-bold shadow-[2px_2px_0px_#1E1E24]">
            {opponentPlayer?.avatar || '👤'}
          </div>
          <div>
            <div className="font-bold text-[#1E1E24] flex items-center gap-2">
              <span>{opponentPlayer?.name || 'Opponent'}</span>
              {gameState.turn === opponentIndex && !isFinished && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#06D6A0] animate-ping" />
              )}
            </div>
            <div className="text-xs font-semibold text-[#5C5C66]">
              {opponentHandCount} card{opponentHandCount !== 1 ? 's' : ''} in hand
            </div>
          </div>
        </div>

        {/* Fan of Opponent Face-Down Cards */}
        <div className="flex -space-x-4 overflow-hidden py-1">
          {Array.from({ length: Math.min(opponentHandCount, 8) }).map((_, idx) => (
            <div
              key={idx}
              className="w-8 h-12 rounded-lg bg-[#6C5CE7] border-[2px] border-[#1E1E24] shadow-[1.5px_1.5px_0px_#1E1E24] flex items-center justify-center text-white text-xs font-black transform -rotate-3"
            >
              ♠
            </div>
          ))}
        </div>
      </div>

      {/* Central Bluff Pile & Action Center */}
      <div className="w-full card-geo bg-[#4EA8DE]/10 border-[3px] border-[#1E1E24] p-6 flex flex-col items-center justify-center relative min-h-[220px]">
        {/* Last Play Bubble */}
        {lastPlay && (
          <div className="mb-4 bg-white border-[2.5px] border-[#1E1E24] rounded-2xl px-4 py-2 shadow-[3px_3px_0px_#1E1E24] animate-pop text-center">
            <span className="text-xs font-bold text-[#5C5C66] block">Last Play Claim</span>
            <span className="font-black text-[#1E1E24] text-base">
              {lastPlay.playerIndex === playerIndex ? 'You' : opponentPlayer?.name} played{' '}
              <span className="text-[#FF70A6]">{lastPlay.cardCount}</span> card(s) as{' '}
              <span className="underline font-mono">{lastPlay.claimedRank}s</span>
            </span>
          </div>
        )}

        {/* Pile Stack Visual */}
        <div className="relative my-2 flex items-center justify-center">
          {totalPileCount === 0 ? (
            <div className="w-24 h-32 rounded-2xl border-[3px] border-dashed border-[#1E1E24]/40 flex flex-col items-center justify-center text-center p-2">
              <span className="text-3xl opacity-40">📥</span>
              <span className="text-xs font-bold text-[#1E1E24]/50 mt-1">Pile Empty</span>
            </div>
          ) : (
            <div className="relative">
              {Array.from({ length: Math.min(totalPileCount, 6) }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute w-24 h-32 rounded-2xl bg-[#FF70A6] border-[3px] border-[#1E1E24] shadow-[4px_4px_0px_#1E1E24] flex flex-col items-center justify-center text-white font-extrabold text-2xl transition-transform"
                  style={{
                    top: `-${idx * 4}px`,
                    left: `${idx * 3}px`,
                    transform: `rotate(${((idx % 3) - 1) * 4}deg)`
                  }}
                >
                  <div className="w-16 h-24 rounded-xl border-[2px] border-white/40 flex items-center justify-center">
                    🃏
                  </div>
                </div>
              ))}
              <div className="w-24 h-32 opacity-0" />
            </div>
          )}
        </div>

        <div className="mt-4 font-black text-[#1E1E24] text-lg">
          Bluff Pile: <span className="bg-[#FFD166] px-2.5 py-0.5 rounded-lg border border-[#1E1E24]">{totalPileCount} Cards</span>
        </div>

        {/* Challenge Button & Countdown Bar */}
        {isChallengePhase && lastPlay?.playerIndex !== playerIndex && !isFinished && (
          <div className="w-full max-w-md mt-4 space-y-3 animate-pop">
            <div className="w-full bg-gray-200 h-3 rounded-full border-[2px] border-[#1E1E24] overflow-hidden">
              <div
                className="bg-[#FF5A5F] h-full transition-all duration-200"
                style={{ width: `${(timeLeft / 6) * 100}%` }}
              />
            </div>

            <button
              onClick={handleCallBluff}
              className="btn-geo btn-geo-coral w-full py-3.5 text-lg flex items-center justify-center gap-2 animate-bounce"
            >
              <Flame className="w-6 h-6 text-white" />
              <span>CALL BLUFF! ({timeLeft}s)</span>
            </button>
          </div>
        )}
      </div>

      {/* Challenge Reveal Modal / Banner */}
      {lastChallenge && (
        <div className="w-full card-geo bg-white p-4 border-[3px] border-[#1E1E24] shadow-[4px_4px_0px_#1E1E24] animate-pop">
          <div className="flex items-center gap-3">
            {lastChallenge.wasTruthful ? (
              <CheckCircle2 className="w-8 h-8 text-[#06D6A0] flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-[#FF5A5F] flex-shrink-0" />
            )}
            <div>
              <h4 className="font-extrabold text-[#1E1E24] text-base">
                {lastChallenge.wasTruthful ? 'TRUTHFUL PLAY!' : 'BLUFF CAUGHT!'}
              </h4>
              <p className="text-xs font-semibold text-[#5C5C66]">
                {lastChallenge.wasTruthful
                  ? `${lastChallenge.challengedIndex === playerIndex ? 'You' : opponentPlayer?.name} told the truth! Challenger took the pile.`
                  : `${lastChallenge.challengedIndex === playerIndex ? 'You' : opponentPlayer?.name} lied! Bluffer took the pile.`}
              </p>
            </div>
          </div>

          {/* Revealed Cards Display */}
          {lastChallenge.revealedCards && (
            <div className="mt-3 pt-3 border-t-[2px] border-[#1E1E24] flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-extrabold text-[#1E1E24]">Revealed Cards:</span>
              {lastChallenge.revealedCards.map((card, idx) => {
                const suitInfo = SUIT_SYMBOLS[card.suit] || { symbol: '♠', color: 'text-black' };
                return (
                  <div
                    key={idx}
                    className="w-10 h-14 bg-white border-[2px] border-[#1E1E24] rounded-lg shadow-[2px_2px_0px_#1E1E24] flex flex-col items-center justify-center font-bold text-xs"
                  >
                    <span>{card.rank}</span>
                    <span className={suitInfo.color}>{suitInfo.symbol}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* User Hand View */}
      <div className="w-full card-geo bg-white p-4 border-[3px] border-[#1E1E24] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#1E1E24] text-lg font-['Fredoka']">Your Cards ({myHand.length})</span>
            {selectedCardIds.length > 0 && (
              <span className="badge-geo badge-purple text-xs">
                {selectedCardIds.length} Selected
              </span>
            )}
          </div>

          {isMyTurn && !isChallengePhase && !isFinished && (
            <button
              onClick={handlePlayCards}
              disabled={selectedCardIds.length === 0}
              className={`btn-geo text-sm py-2 px-5 ${
                selectedCardIds.length > 0
                  ? 'btn-geo-primary'
                  : 'bg-gray-200 border-[#1E1E24] cursor-not-allowed opacity-60'
              }`}
            >
              Play {selectedCardIds.length} Card{selectedCardIds.length !== 1 ? 's' : ''} (Claim {gameState.requiredRank}s)
            </button>
          )}
        </div>

        {/* Hand Cards Grid */}
        <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start min-h-[120px] p-2 bg-gray-50 rounded-2xl border-[2px] border-[#1E1E24]">
          {myHand.length === 0 ? (
            <div className="w-full text-center py-6 font-extrabold text-[#06D6A0] text-lg">
              🎉 Empty Hand! Victory Achieved!
            </div>
          ) : (
            myHand.map((card) => {
              const isSelected = selectedCardIds.includes(card.id);
              const suitInfo = SUIT_SYMBOLS[card.suit] || { symbol: '♠', color: 'text-black' };

              return (
                <button
                  key={card.id}
                  onClick={() => toggleSelectCard(card.id)}
                  disabled={!isMyTurn || isChallengePhase || isFinished}
                  className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-[2.5px] border-[#1E1E24] flex flex-col justify-between p-2 font-['Fredoka'] font-black transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#FFD166] -translate-y-3 shadow-[4px_6px_0px_#1E1E24] ring-4 ring-[#FF70A6]'
                      : 'bg-white hover:bg-gray-100 hover:-translate-y-1 shadow-[2.5px_2.5px_0px_#1E1E24]'
                  }`}
                >
                  <div className="flex justify-between items-start text-xs sm:text-sm">
                    <span>{card.rank}</span>
                    <span className={suitInfo.color}>{suitInfo.symbol}</span>
                  </div>

                  <div className={`text-2xl sm:text-3xl text-center ${suitInfo.color}`}>
                    {suitInfo.symbol}
                  </div>

                  <div className="flex justify-between items-end text-xs sm:text-sm rotate-180">
                    <span>{card.rank}</span>
                    <span className={suitInfo.color}>{suitInfo.symbol}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
