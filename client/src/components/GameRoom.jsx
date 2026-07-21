import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import confetti from 'canvas-confetti';
import { Copy, Check, LogOut, RotateCcw, Send, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const chatEndRef = useRef(null);

  const gameState = room?.gameState;
  const isFinished = gameState?.status === 'finished';

  useEffect(() => {
    if (isFinished) {
      if (gameState.isDraw) {
        audio.playLose();
      } else if (gameState.winner === playerIndex) {
        audio.playWin();
        confetti({
          particleCount: 80,
          spread: 60,
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
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Bar: Room Info & Actions */}
      <div className="card-geo bg-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="badge-geo badge-purple text-xs sm:text-sm">
            🎮 {room.gameName}
          </span>
          
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 border-[2px] border-[#1E1E24] shadow-[1.5px_1.5px_0px_#1E1E24] font-mono text-xs sm:text-sm font-bold hover:bg-[#FFD166] transition-all"
          >
            <span>CODE: {room.id}</span>
            {copiedCode ? <Check className="w-3.5 h-3.5 text-[#06D6A0]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Chat Toggle Button */}
          <button
            onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
            className="lg:hidden btn-geo btn-geo-white text-xs py-1.5 px-3"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Chat ({room.chat?.length || 0})</span>
            {isMobileChatOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={leaveRoom}
            className="btn-geo btn-geo-coral text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Leave
          </button>
        </div>
      </div>

      {/* Main Gameplay Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Left 2 Cols: Game Scorecards & Board */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Player Scorecards Header */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {/* Player 1 Card */}
            <div className={`card-geo p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 transition-all ${
              gameState?.turn === 0 && !isFinished
                ? 'bg-[#FFD166] border-[3px] sm:border-[4px] shadow-[4px_4px_0px_#1E1E24]'
                : 'bg-white'
            }`}>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FF70A6] border-[2px] border-[#1E1E24] flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 overflow-hidden">
                {player1?.picture ? (
                  <img src={player1.picture} alt={player1.name} className="w-full h-full object-cover" />
                ) : (
                  player1?.avatar || '👤'
                )}
              </div>
              <div className="min-w-0">
                <div className="font-['Fredoka'] font-bold text-xs sm:text-base text-[#1E1E24] truncate">
                  {player1?.name || 'Waiting...'}
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-[#5C5C66] truncate">
                  {player1 ? (player1.id === user.id ? '(You)' : 'P1') : 'Waiting'}
                </div>
              </div>
            </div>

            {/* Player 2 Card */}
            <div className={`card-geo p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 transition-all ${
              gameState?.turn === 1 && !isFinished
                ? 'bg-[#FFD166] border-[3px] sm:border-[4px] shadow-[4px_4px_0px_#1E1E24]'
                : 'bg-white'
            }`}>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#06D6A0] border-[2px] border-[#1E1E24] flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 overflow-hidden">
                {player2?.picture ? (
                  <img src={player2.picture} alt={player2.name} className="w-full h-full object-cover" />
                ) : (
                  player2?.avatar || '⏳'
                )}
              </div>
              <div className="min-w-0">
                <div className="font-['Fredoka'] font-bold text-xs sm:text-base text-[#1E1E24] truncate">
                  {player2?.name || 'Waiting...'}
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-[#5C5C66] truncate">
                  {player2 ? (player2.id === user.id ? '(You)' : 'P2') : 'Share Code'}
                </div>
              </div>
            </div>
          </div>

          {/* Active Game Board View */}
          <div className="card-geo bg-white p-3 sm:p-6 relative overflow-hidden">
            {room.players.length < 2 ? (
              <div className="text-center py-8 sm:py-12 space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-[#FFD166] border-[3px] border-[#1E1E24] shadow-[4px_4px_0px_#1E1E24] flex items-center justify-center text-2xl sm:text-3xl animate-bounce">
                  ⏳
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1E1E24]">Waiting for Player 2</h3>
                <p className="text-xs sm:text-sm font-semibold text-[#5C5C66] max-w-sm mx-auto">
                  Share code <span className="font-mono bg-[#FFD166] px-2 py-0.5 rounded border border-[#1E1E24]">{room.id}</span> with a friend to begin!
                </p>
              </div>
            ) : (
              renderBoard()
            )}
          </div>

          {/* Match Finished Overlay */}
          {isFinished && (
            <div className="card-geo bg-[#FFD166] p-4 sm:p-6 text-center space-y-3 sm:space-y-4 animate-pop">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl sm:rounded-3xl bg-white border-[3px] border-[#1E1E24] shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-3xl sm:text-4xl">
                {gameState.isDraw ? '🤝' : (gameState.winner === playerIndex ? '🏆' : '💥')}
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1E1E24]">
                  {gameState.isDraw
                    ? "It's a Draw!"
                    : (gameState.winner === playerIndex ? "Victory is Yours!" : "Better Luck Next Time!")}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#1E1E24]/80 mt-1">
                  Match ended. Hit rematch to play again!
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={requestRematch}
                  className="btn-geo btn-geo-primary text-sm sm:text-base py-2.5 px-6"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /> Rematch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Chat & Emoji Bar */}
        <div className={`card-geo bg-white p-4 h-[480px] lg:h-[540px] flex flex-col justify-between ${
          isMobileChatOpen ? 'block' : 'hidden lg:flex'
        }`}>
          <div className="pb-2.5 border-b-[3px] border-[#1E1E24] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#6C5CE7]" />
              <h3 className="font-['Fredoka'] text-base sm:text-lg font-bold text-[#1E1E24]">Room Chat</h3>
            </div>
            <button
              onClick={() => setIsMobileChatOpen(false)}
              className="lg:hidden text-xs font-bold text-gray-500 hover:text-black"
            >
              Close ✖
            </button>
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 px-1">
            {room.chat?.length === 0 ? (
              <div className="text-center py-8 text-xs font-semibold text-gray-400">
                No messages yet. Send a quick reaction!
              </div>
            ) : (
              room.chat?.map((msg) => (
                <div key={msg.id} className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {msg.picture ? (
                      <img src={msg.picture} alt="" className="w-4 h-4 rounded-full border border-[#1E1E24] object-cover" />
                    ) : (
                      <span>{msg.avatar}</span>
                    )}
                    <span className="font-bold text-[#1E1E24]">{msg.sender}</span>
                    <span className="text-[9px] text-gray-400">{msg.time}</span>
                  </div>
                  <div className={`p-2 rounded-xl border-[2px] border-[#1E1E24] font-semibold text-xs sm:text-sm max-w-[85%] ${
                    msg.type === 'emoji'
                      ? 'bg-[#FFD166] text-xl w-fit'
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
          <div className="pt-2 border-t-[2px] border-gray-200 space-y-2">
            <div className="flex justify-between gap-1">
              {['😄', '🔥', '👏', '🏆', '😱', '💩'].map((em) => (
                <button
                  key={em}
                  onClick={() => handleEmojiClick(em)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-50 border-[2px] border-[#1E1E24] flex items-center justify-center text-base sm:text-lg hover:bg-[#FFD166] active:scale-95 transition-all"
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
                placeholder="Type message..."
                className="input-geo py-1.5 px-3 text-xs sm:text-sm"
              />
              <button
                type="submit"
                className="btn-geo btn-geo-primary px-3 py-1.5 text-xs"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
