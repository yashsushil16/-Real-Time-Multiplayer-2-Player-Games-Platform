import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Trophy, Medal, Award, Flame } from 'lucide-react';

export default function Leaderboard() {
  const { SERVER_URL } = useSocket();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load leaderboard:', err);
        setLoading(false);
      });
  }, [SERVER_URL]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Title Header */}
      <div className="card-geo bg-[#06D6A0] p-6 text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white border-[3px] border-[#1E1E24] shadow-[3px_3px_0px_#1E1E24] flex items-center justify-center text-3xl">
          🏆
        </div>
        <h1 className="text-3xl font-extrabold text-[#1E1E24]">Global Leaderboards</h1>
        <p className="text-sm font-semibold text-[#1E1E24]/80">
          Rankings updated in real-time based on match ELO ratings.
        </p>
      </div>

      {/* Leaderboard Table Container */}
      <div className="card-geo bg-white p-6">
        {loading ? (
          <div className="text-center py-12 font-bold text-gray-500">
            Loading rankings...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 font-bold text-gray-400">
            No games played yet. Play a match to get on the board!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-[3px] border-[#1E1E24] text-xs font-bold text-[#5C5C66] uppercase">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4 text-center">ELO Rating</th>
                  <th className="py-3 px-4 text-center">W / L / D</th>
                  <th className="py-3 px-4 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-gray-100 font-semibold text-sm">
                {leaderboard.map((user, idx) => {
                  const totalGames = user.wins + user.losses + user.draws;
                  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        {idx === 0 ? (
                          <span className="w-8 h-8 rounded-xl bg-[#FFD166] border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] inline-flex items-center justify-center text-lg">
                            🥇
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-8 h-8 rounded-xl bg-[#E0E0E0] border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] inline-flex items-center justify-center text-lg">
                            🥈
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-8 h-8 rounded-xl bg-[#E07A5F] text-white border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] inline-flex items-center justify-center text-lg">
                            🥉
                          </span>
                        ) : (
                          <span className="font-['Fredoka'] font-bold text-base px-2">
                            #{idx + 1}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-1 bg-gray-100 rounded-lg border border-[#1E1E24]">
                            {user.avatar}
                          </span>
                          <span className="font-['Fredoka'] text-base font-bold text-[#1E1E24]">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="badge-geo badge-purple font-mono text-sm">
                          <Flame className="w-4 h-4 text-[#FFD166]" /> {user.elo} ELO
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-[#1E1E24]">
                        <span className="text-[#06D6A0] font-bold">{user.wins}W</span> /{' '}
                        <span className="text-[#FF5A5F] font-bold">{user.losses}L</span> /{' '}
                        <span className="text-gray-400 font-bold">{user.draws}D</span>
                      </td>

                      <td className="py-4 px-4 text-right font-['Fredoka'] font-bold text-[#1E1E24]">
                        {winRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
