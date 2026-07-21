import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import confetti from 'canvas-confetti';
import { Copy, Check, LogOut, RotateCcw, Send, MessageCircle, Trophy, Smile } from 'lucide-react';
import RPSBoard from './boards/RPSBoard';
import TicTacToeBoard from './boards/TicTacToeBoard';
import ConnectFourBoard from './boards/ConnectFourBoard';
import DotsAndBoxesBoard from './boards/DotsAndBoxesBoard';
import CheckersBoard from './boards/CheckersBoard';
import { audio } from '../utils/audio';

export default function GameRoom() {
  const { room, user, playerIndex, leaveRoom, sendChat, requestRematch } = useSocket();
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const chatEndRef = useRef(null);

  const gameState = room?.gameState;
  const isFinished = gameState?.status === 'finished';

  // Trigger win sound & confetti when match finishes
  useEffect(() => {
    if (isFinished) {
      if (gameState.isDraw) {
        audio.playLose();
      } else if (gameState.winner === playerIndex) {
        audio.playWin();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        audio.playLose();
      }
    }
  }, [isFinished]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.chat]);

  if (!room) return null;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput('');
  };

  const handleEmojiClick = (emoji) => {
    sendChat(emoji, 'emoji');
  };

  const renderBoard = () => {
    switch (room.gameType) {
      case 'rockPaperScissors':
        return <RPSBoard />;
      case 'ticTacToe':
        return <TicTacToeBoard />;
      case 'connectFour':
        return <ConnectFourBoard />;
      case 'dotsAndBoxes':
        return <DotsAndBoxesBoard />;
      case 'checkers':
        return <CheckersBoard />;
      default:
        return <TicTacToeBoard />;
    }
  };

  const player1 = room.players[0];
  const player2 = room.players[1];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar: Room Info & Exit */}
      <div className="card-geo bg-white p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="badge-geo badge-purple text-base">
            🎮 {room.gameName}
          </span>
          
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gray-100 border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] font-mono text-sm font-bold hover:bg-[#FFD166] transition-all"
          >
            <span>CODE: {room.id}</span>
            {copiedCode ? <Check className="w-4 h-4 text-[#06D6A0]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={leaveRoom}
          className="btn-geo btn-geo-coral text-sm py-2 px-4"
        >
          <LogOut className="w-4 h-4" /> Leave Room
        </button>
      </div>

      {/* Main Gameplay Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Game Scorecards & Board */}
        <div className="lg:col-span-2 space-y-6">
          {/* Player Scorecards Header */}
          <div className="grid grid-cols-2 gap-4">
            {/* Player 1 Card */}
            <div className={`card-geo p-4 flex items-center gap-3 transition-all ${
              gameState?.turn === 0 && !isFinished
                ? 'bg-[#FFD166] border-[4px] shadow-[6px_6px_0px_#1E1E24] scale-102'
                : 'bg-white'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#FF70A6] border-[2px] border-[#1E1E24] flex items-center justify-center text-2xl flex-shrink-0">
                {player1?.avatar || '👤'}
              </div>
              <div className="min-w-0">
                <div className="font-['Fredoka'] font-bold text-[#1E1E24] truncate">
                  {player1?.name || 'Waiting...'}
                </div>
                <div className="text-xs font-semibold text-[#5C5C66]">
                  {player1 ? (player1.id === user.id ? '(You - P1)' : 'Player 1') : 'Waiting for P2'}
                </div>
              </div>
            </div>

            {/* Player 2 Card */}
            <div className={`card-geo p-4 flex items-center gap-3 transition-all ${
              gameState?.turn === 1 && !isFinished
                ? 'bg-[#FFD166] border-[4px] shadow-[6px_6px_0px_#1E1E24] scale-102'
                : 'bg-white'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-[#06D6A0] border-[2px] border-[#1E1E24] flex items-center justify-center text-2xl flex-shrink-0">
                {player2?.avatar || '⏳'}
              </div>
              <div className="min-w-0">
                <div className="font-['Fredoka'] font-bold text-[#1E1E24] truncate">
                  {player2?.name || 'Waiting...'}
                </div>
                <div className="text-xs font-semibold text-[#5C5C66]">
                  {player2 ? (player2.id === user.id ? '(You - P2)' : 'Player 2') : 'Share Room Code!'}
                </div>
              </div>
            </div>
          </div>

          {/* Active Game Board View */}
          <div className="card-geo bg-white p-6 relative">
            {room.players.length < 2 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFD166] border-[3px] border-[#1E1E24] shadow-[4px_4px_0px_#1E1E24] flex items-center justify-center text-3xl animate-bounce">
                  ⏳
                </div>
                <h3 className="text-2xl font-bold text-[#1E1E24]">Waiting for Player 2</h3>
                <p className="text-sm font-semibold text-[#5C5C66] max-w-sm mx-auto">
                  Share code <span className="font-mono bg-[#FFD166] px-2 py-0.5 rounded border border-[#1E1E24]">{room.id}</span> with a friend to begin!
                </p>
              </div>
            ) : (
              renderBoard()
            )}
          </div>

          {/* Match Finished Actions: Rematch & Victory Overlay */}
          {isFinished && (
            <div className="card-geo bg-[#FFD166] p-6 text-center space-y-4 animate-pop">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-white border-[3px] border-[#1E1E24] shadow-[4px_4px_0px_#1E1E24] flex items-center justify-center text-4xl">
                {gameState.isDraw ? '🤝' : (gameState.winner === playerIndex ? '🏆' : '💥')}
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-[#1E1E24]">
                  {gameState.isDraw
                    ? "It's a Draw!"
                    : (gameState.winner === playerIndex ? "Victory is Yours!" : "Better Luck Next Time!")}
                </h3>
                <p className="text-sm font-bold text-[#1E1E24]/80 mt-1">
                  Match ended. Hit rematch to play again immediately!
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={requestRematch}
                  className="btn-geo btn-geo-primary text-base py-3 px-8"
                >
                  <RotateCcw className="w-5 h-5" /> Request Rematch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Chat & Emoji Reaction Bar */}
        <div className="card-geo bg-white p-4 h-[560px] flex flex-col justify-between">
          <div className="pb-3 border-b-[3px] border-[#1E1E24] flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#6C5CE7]" />
            <h3 className="font-['Fredoka'] text-lg font-bold text-[#1E1E24]">Room Chat</h3>
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 px-1">
            {room.chat?.length === 0 ? (
              <div className="text-center py-10 text-xs font-semibold text-gray-400">
                No messages yet. Send a quick reaction!
              </div>
            ) : (
              room.chat?.map((msg) => (
                <div key={msg.id} className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>{msg.avatar}</span>
                    <span className="font-bold text-[#1E1E24]">{msg.sender}</span>
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                  </div>
                  <div className={`p-2 rounded-xl border-[2px] border-[#1E1E24] font-semibold text-sm max-w-[85%] ${
                    msg.type === 'emoji'
                      ? 'bg-[#FFD166] text-2xl w-fit'
                      : 'bg-gray-50 text-[#1E1E24]'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Emoji Quick Reactions */}
          <div className="pt-2 border-t-[2px] border-gray-200">
            <div className="flex justify-between gap-1 mb-2">
              {['😄', '🔥', '👏', '🏆', '😱', '💩'].map((em) => (
                <button
                  key={em}
                  onClick={() => handleEmojiClick(em)}
                  className="w-9 h-9 rounded-lg bg-gray-50 border-[2px] border-[#1E1E24] flex items-center justify-center text-lg hover:bg-[#FFD166] active:scale-95 transition-all"
                >
                  {em}
                </button>
              ))}
            </div>

            {/* Text Chat Input Form */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="input-geo py-2 text-sm"
              />
              <button
                type="submit"
                className="btn-geo btn-geo-purple px-3 py-2"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
