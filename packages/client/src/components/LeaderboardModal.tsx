import { useEffect } from 'react';
import { useGame } from '../context/GameContext';

interface LeaderboardModalProps {
  onClose: () => void;
}

const RANK_COLORS = [
  'text-amber-400',   // 1st
  'text-slate-300',   // 2nd
  'text-amber-700',   // 3rd
  'text-slate-400',   // 4th
  'text-slate-400',   // 5th
];

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const { leaderboard, requestLeaderboard } = useGame();

  useEffect(() => {
    requestLeaderboard();
  }, [requestLeaderboard]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M5 3h14a1 1 0 0 1 1 1v2a5 5 0 0 1-3.09 4.63A5.99 5.99 0 0 1 13 14.84V17h2a1 1 0 0 1 1 1v2H8v-2a1 1 0 0 1 1-1h2v-2.16a5.99 5.99 0 0 1-3.91-3.21A5 5 0 0 1 4 6V4a1 1 0 0 1 1-1zm1 2v1a3 3 0 0 0 2.09 2.86A6.01 6.01 0 0 1 8 8V5H6zm12 0h-2v3a6.01 6.01 0 0 1-.09.86A3 3 0 0 0 18 6V5z" />
            </svg>
            Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-slate-400 text-center py-8 text-sm">
            No scores yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.username}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-700/50"
              >
                <span
                  className={`text-lg font-bold w-8 text-center ${
                    RANK_COLORS[index] || 'text-slate-400'
                  }`}
                >
                  #{index + 1}
                </span>
                <span className="flex-1 text-white font-medium truncate">
                  {entry.username}
                </span>
                <div className="text-right">
                  <span className="text-amber-500 font-bold">
                    {entry.correct}
                  </span>
                  <span className="text-slate-500 text-xs ml-1">
                    / {entry.attempted}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
