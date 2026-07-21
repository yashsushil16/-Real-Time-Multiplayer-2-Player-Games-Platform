import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Calendar, User, Globe } from 'lucide-react';

export default function MatchHistory() {
  const { user, SERVER_URL } = useSocket();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'mine'

  useEffect(() => {
    setLoading(true);
    const query = filterMode === 'mine' ? `?userId=${user.id}` : '';
    fetch(`${SERVER_URL}/api/matches${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMatches(data.matches);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load match history:', err);
        setLoading(false);
      });
  }, [SERVER_URL, filterMode, user.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="card-geo bg-[#4EA8DE] p-6 text-center space-y-3 text-white">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white border-[3px] border-[#1E1E24] shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-3xl">
          📜
        </div>
        <h1 className="text-3xl font-extrabold text-[#1E1E24]">Match History</h1>
        <p className="text-sm font-semibold text-[#1E1E24]/80">
          Persistent record of played battles, scores, and victorious players.
        </p>

        {/* Account Filter Tabs */}
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`btn-geo text-xs py-1.5 px-4 ${
              filterMode === 'all' ? 'btn-geo-yellow' : 'btn-geo-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> All Matches
          </button>

          <button
            onClick={() => setFilterMode('mine')}
            className={`btn-geo text-xs py-1.5 px-4 ${
              filterMode === 'mine' ? 'btn-geo-yellow' : 'btn-geo-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> My Account Matches
          </button>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-geo bg-white p-12 text-center font-bold text-gray-500">
            Loading match records...
          </div>
        ) : matches.length === 0 ? (
          <div className="card-geo bg-white p-12 text-center font-bold text-gray-400 space-y-2">
            <div className="text-4xl">⚔️</div>
            <div className="font-['Fredoka'] text-xl font-bold text-[#1E1E24]">
              {filterMode === 'mine' ? 'No match records for your account yet' : 'No recorded matches yet'}
            </div>
            <p className="text-sm text-gray-500">Play a match in the Lobby to start your history!</p>
          </div>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="card-geo bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              {/* Game Badge & Date */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="badge-geo badge-yellow text-sm">
                  {match.gameName}
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold text-[#5C5C66]">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(match.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Matchup Players & Score */}
              <div className="flex items-center gap-4 text-center">
                <div className="flex items-center gap-2">
                  {match.player1.picture ? (
                    <img src={match.player1.picture} alt="" className="w-7 h-7 rounded-full border border-[#1E1E24] object-cover" />
                  ) : (
                    <span className="text-xl">{match.player1.avatar}</span>
                  )}
                  <span className="font-['Fredoka'] font-bold text-[#1E1E24]">
                    {match.player1.name}
                  </span>
                </div>

                <div className="px-3 py-1 bg-gray-100 rounded-xl border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] text-xs font-mono font-bold">
                  {match.score}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-['Fredoka'] font-bold text-[#1E1E24]">
                    {match.player2.name}
                  </span>
                  {match.player2.picture ? (
                    <img src={match.player2.picture} alt="" className="w-7 h-7 rounded-full border border-[#1E1E24] object-cover" />
                  ) : (
                    <span className="text-xl">{match.player2.avatar}</span>
                  )}
                </div>
              </div>

              {/* Winner Tag */}
              <div className="w-full sm:w-auto text-right">
                {match.isDraw ? (
                  <span className="badge-geo badge-yellow">🤝 Draw</span>
                ) : (
                  <span className="badge-geo badge-teal">
                    🏆 {match.winner}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
