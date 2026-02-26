import { useState, useEffect, FormEvent } from 'react';
import { useGame } from '../context/GameContext';
import {
  signup,
  login,
  getMe,
  saveSession,
  getStoredSession,
  clearSession,
} from '../services/api';

type Mode = 'loading' | 'returning' | 'login' | 'signup';

export function JoinScreen() {
  const { joinGame, isConnected } = useGame();
  const [mode, setMode] = useState<Mode>('loading');
  const [storedUsername, setStoredUsername] = useState('');
  const [storedToken, setStoredToken] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      const session = getStoredSession();
      if (!session) {
        setMode('login');
        return;
      }

      try {
        await getMe(session.token);
        setStoredUsername(session.username);
        setStoredToken(session.token);
        setMode('returning');
      } catch {
        clearSession();
        setMode('login');
      }
    }
    checkSession();
  }, []);

  function handleContinue() {
    if (storedToken) {
      joinGame(storedToken);
    }
  }

  function handleSwitchUser() {
    clearSession();
    setStoredUsername('');
    setStoredToken('');
    setMode('login');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      setError('Username must be 3-20 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Only letters, numbers, and underscores allowed.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (mode === 'signup') {
        result = await signup(trimmedUsername, password, confirmPassword);
      } else {
        result = await login(trimmedUsername, password);
      }

      saveSession(result.token, result.user.username);
      joinGame(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Math Arena</h1>
          <p className="text-slate-400 text-sm">
            Compete in real-time math challenges
          </p>
        </div>

        {/* Returning user mode */}
        {mode === 'returning' && (
          <div className="space-y-4">
            <p className="text-center text-slate-300">
              Welcome back, <span className="text-amber-500 font-semibold">{storedUsername}</span>!
            </p>
            <button
              onClick={handleContinue}
              disabled={!isConnected}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors"
            >
              {isConnected ? 'Continue Playing' : 'Connecting...'}
            </button>
            <button
              onClick={handleSwitchUser}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
            >
              Switch User
            </button>
          </div>
        )}

        {/* Login / Signup mode */}
        {(mode === 'login' || mode === 'signup') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                autoFocus
                maxLength={20}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={!isConnected || isSubmitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors"
            >
              {!isConnected
                ? 'Connecting...'
                : isSubmitting
                ? 'Please wait...'
                : mode === 'signup'
                ? 'Sign Up'
                : 'Login'}
            </button>

            <p className="text-center text-sm text-slate-400">
              {mode === 'login' ? (
                <>
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                    className="text-amber-500 hover:text-amber-400 font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="text-amber-500 hover:text-amber-400 font-medium"
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
