import { Server, Socket } from 'socket.io';
import { User } from '../models/User';
import { gameManager } from '../services/gameManager';
import { verifyToken } from '../middleware/auth';

// Track socket → user mapping
const socketUserMap = new Map<string, { userId: string; username: string }>();

// Rate limiting: track last answer submission time per socket
const lastSubmitTime = new Map<string, number>();
const THROTTLE_MS = 1000; // 1 second between submissions

export function registerSocketHandlers(io: Server): void {
  gameManager.setIO(io);

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // --- user:join (token-based) ---
    socket.on('user:join', async (data: { token: unknown }) => {
      try {
        const { token } = data;

        if (typeof token !== 'string' || !token) {
          socket.emit('error', { message: 'Authentication required.' });
          return;
        }

        // Verify JWT token
        const payload = verifyToken(token);
        if (!payload) {
          socket.emit('error', { message: 'Invalid or expired session. Please login again.' });
          return;
        }

        // Look up user by ID
        const user = await User.findById(payload.userId).select(
          'username attempted correct'
        );

        if (!user) {
          socket.emit('error', { message: 'User not found. Please signup again.' });
          return;
        }

        // Map this socket to the user
        socketUserMap.set(socket.id, {
          userId: user._id.toString(),
          username: user.username,
        });

        // Track this user as connected
        gameManager.addUser();

        // Send join confirmation
        socket.emit('user:joined', {
          userId: user._id,
          username: user.username,
          attempted: user.attempted,
          correct: user.correct,
        });

        // Send current game state if a question is active
        const activeQuestion = gameManager.getActiveQuestion();
        if (activeQuestion) {
          socket.emit('question:new', {
            questionId: activeQuestion._id,
            expression: activeQuestion.expression,
            duration: 60,
          });
          socket.emit('question:tick', {
            remainingSeconds: gameManager.getRemainingSeconds(),
          });
        }

        // Broadcast updated user count
        io.emit('user:count', { count: gameManager.getConnectedUsers() });

        console.log(`User joined: ${user.username} (${socket.id})`);
      } catch (error) {
        console.error('Error in user:join:', error);
        socket.emit('error', { message: 'Server error. Please try again.' });
      }
    });

    // --- answer:submit ---
    socket.on(
      'answer:submit',
      async (data: { questionId: unknown; answer: unknown }) => {
        try {
          const userData = socketUserMap.get(socket.id);
          if (!userData) {
            socket.emit('error', { message: 'You must join first.' });
            return;
          }

          const { questionId, answer } = data;

          // Validate inputs
          if (typeof questionId !== 'string' || typeof answer !== 'number') {
            socket.emit('error', { message: 'Invalid submission.' });
            return;
          }

          if (!Number.isInteger(answer)) {
            socket.emit('error', {
              message: 'Answer must be an integer.',
            });
            return;
          }

          // Throttle: max 1 submission per second
          const now = Date.now();
          const lastTime = lastSubmitTime.get(socket.id) || 0;
          if (now - lastTime < THROTTLE_MS) {
            socket.emit('error', { message: 'Too fast! Wait a moment.' });
            return;
          }
          lastSubmitTime.set(socket.id, now);

          // Process the answer
          const result = await gameManager.handleAnswer(
            userData.userId,
            questionId,
            answer
          );

          if (result.alreadySolved) {
            socket.emit('answer:result', {
              correct: false,
              message: 'This question has already been solved!',
            });
          } else if (!result.correct) {
            socket.emit('answer:result', {
              correct: false,
              message: 'Wrong answer. Try again!',
            });
          } else {
            socket.emit('answer:result', {
              correct: true,
              message: 'Correct! You won this round!',
            });
          }
        } catch (error) {
          console.error('Error in answer:submit:', error);
          socket.emit('error', { message: 'Server error. Please try again.' });
        }
      }
    );

    // --- leaderboard:request ---
    socket.on('leaderboard:request', async () => {
      try {
        const users = await User.find()
          .sort({ correct: -1 })
          .limit(5)
          .select('username correct attempted')
          .lean();

        socket.emit('leaderboard:update', { users });
      } catch (error) {
        console.error('Error in leaderboard:request:', error);
        socket.emit('error', {
          message: 'Failed to fetch leaderboard.',
        });
      }
    });

    // --- disconnect ---
    socket.on('disconnect', () => {
      const userData = socketUserMap.get(socket.id);
      if (userData) {
        gameManager.removeUser();
        socketUserMap.delete(socket.id);
        lastSubmitTime.delete(socket.id);
        console.log(`User disconnected: ${userData.username} (${socket.id})`);
      }
    });
  });
}
