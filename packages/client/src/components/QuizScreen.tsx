import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { QuestionCard } from './QuestionCard';
import { Timer } from './Timer';
import { StatusMessage } from './StatusMessage';
import { LeaderboardModal } from './LeaderboardModal';

export function QuizScreen() {
  const {
    user,
    question,
    remainingSeconds,
    cooldownSeconds,
    gameStatus,
    statusMessage,
    connectedUsers,
    submitAnswer,
    logout,
  } = useGame();

  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top bar */}
      <header className="px-3 sm:px-6 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white shrink-0">Math Arena</h1>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
              {connectedUsers} online
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <span className="text-xs sm:text-sm text-slate-400 truncate max-w-[80px] sm:max-w-none">
              {user?.username}
            </span>
            {user && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full shrink-0">
                {user.correct}/{user.attempted}
              </span>
            )}
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              title="Logout"
            >
              Logout
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              title="Leaderboard"
            >
              <svg
                className="w-5 h-5 text-amber-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M5 3h14a1 1 0 0 1 1 1v2a5 5 0 0 1-3.09 4.63A5.99 5.99 0 0 1 13 14.84V17h2a1 1 0 0 1 1 1v2H8v-2a1 1 0 0 1 1-1h2v-2.16a5.99 5.99 0 0 1-3.91-3.21A5 5 0 0 1 4 6V4a1 1 0 0 1 1-1zm1 2v1a3 3 0 0 0 2.09 2.86A6.01 6.01 0 0 1 8 8V5H6zm12 0h-2v3a6.01 6.01 0 0 1-.09.86A3 3 0 0 0 18 6V5z" />
              </svg>
              <span className="text-sm font-medium text-amber-500 hidden sm:inline">Leaderboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-xl mx-auto w-full gap-6">
        {/* Timer (only when question is active) */}
        {question && gameStatus === 'active' && (
          <Timer remainingSeconds={remainingSeconds} totalSeconds={60} />
        )}

        {/* Question card */}
        {question && gameStatus === 'active' && (
          <QuestionCard
            expression={question.expression}
            onSubmit={submitAnswer}
          />
        )}

        {/* Cooldown state */}
        {gameStatus === 'cooldown' && (
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-2">Next question in</p>
            <p className="text-5xl font-bold text-amber-500 font-mono">
              {cooldownSeconds}
            </p>
          </div>
        )}

        {/* Waiting state */}
        {gameStatus === 'idle' && (
          <div className="text-center">
            <p className="text-slate-400">Waiting for a question...</p>
          </div>
        )}

        {/* Status message */}
        {statusMessage && (
          <StatusMessage text={statusMessage.text} type={statusMessage.type} />
        )}
      </main>

      {/* Leaderboard modal */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
