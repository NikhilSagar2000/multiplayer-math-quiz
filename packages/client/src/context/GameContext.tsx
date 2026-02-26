import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useSocket } from '../hooks/useSocket';
import { Socket } from 'socket.io-client';
import { clearSession, getStoredSession } from '../services/api';

interface UserData {
  userId: string;
  username: string;
  attempted: number;
  correct: number;
}

interface QuestionData {
  questionId: string;
  expression: string;
  duration: number;
}

interface LeaderboardEntry {
  username: string;
  correct: number;
  attempted: number;
}

type GameStatus =
  | 'idle'
  | 'active'
  | 'solved'
  | 'expired'
  | 'cooldown';

interface StatusMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

interface GameContextValue {
  socket: Socket | null;
  isConnected: boolean;
  user: UserData | null;
  question: QuestionData | null;
  remainingSeconds: number;
  cooldownSeconds: number;
  gameStatus: GameStatus;
  statusMessage: StatusMessage | null;
  connectedUsers: number;
  leaderboard: LeaderboardEntry[];
  joinGame: (token: string) => void;
  submitAnswer: (answer: number) => void;
  requestLeaderboard: () => void;
  logout: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState<UserData | null>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const tokenRef = useRef<string | null>(null);

  // Re-join on reconnect using stored token
  useEffect(() => {
    if (!socket || !isConnected || !user) return;
    const session = getStoredSession();
    if (session?.token) {
      socket.emit('user:join', { token: session.token });
    }
  }, [socket, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;

    socket.on('user:joined', (data: UserData) => {
      setUser(data);
    });

    socket.on('question:new', (data: QuestionData) => {
      setQuestion(data);
      setRemainingSeconds(data.duration);
      setGameStatus('active');
      setStatusMessage(null);
      setCooldownSeconds(0);
    });

    socket.on('question:tick', (data: { remainingSeconds: number }) => {
      setRemainingSeconds(data.remainingSeconds);
    });

    socket.on(
      'question:solved',
      (data: { username: string; answer: number; questionId: string }) => {
        setGameStatus('solved');
        setQuestion(null);
        setStatusMessage({
          text: `Solved by ${data.username}! Answer: ${data.answer}`,
          type: 'success',
        });
      }
    );

    socket.on(
      'question:expired',
      (data: { questionId: string; answer: number }) => {
        setGameStatus('expired');
        setQuestion(null);
        setStatusMessage({
          text: `Time's up! The answer was ${data.answer}`,
          type: 'info',
        });
      }
    );

    socket.on('question:countdown', (data: { seconds: number }) => {
      setGameStatus('cooldown');
      setCooldownSeconds(data.seconds);
    });

    socket.on('answer:result', (data: { correct: boolean; message: string }) => {
      if (!data.correct) {
        setStatusMessage({ text: data.message, type: 'error' });
      }
    });

    socket.on('user:count', (data: { count: number }) => {
      setConnectedUsers(data.count);
    });

    socket.on('leaderboard:update', (data: { users: LeaderboardEntry[] }) => {
      setLeaderboard(data.users);
    });

    socket.on('error', (data: { message: string }) => {
      setStatusMessage({ text: data.message, type: 'error' });
    });

    return () => {
      socket.off('user:joined');
      socket.off('question:new');
      socket.off('question:tick');
      socket.off('question:solved');
      socket.off('question:expired');
      socket.off('question:countdown');
      socket.off('answer:result');
      socket.off('user:count');
      socket.off('leaderboard:update');
      socket.off('error');
    };
  }, [socket]);

  const joinGame = useCallback(
    (token: string) => {
      tokenRef.current = token;
      socket?.emit('user:join', { token });
    },
    [socket]
  );

  const submitAnswer = useCallback(
    (answer: number) => {
      if (!question) return;
      socket?.emit('answer:submit', {
        questionId: question.questionId,
        answer,
      });
    },
    [socket, question]
  );

  const requestLeaderboard = useCallback(() => {
    socket?.emit('leaderboard:request');
  }, [socket]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setQuestion(null);
    setGameStatus('idle');
    setStatusMessage(null);
    tokenRef.current = null;
  }, []);

  return (
    <GameContext.Provider
      value={{
        socket,
        isConnected,
        user,
        question,
        remainingSeconds,
        cooldownSeconds,
        gameStatus,
        statusMessage,
        connectedUsers,
        leaderboard,
        joinGame,
        submitAnswer,
        requestLeaderboard,
        logout,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
