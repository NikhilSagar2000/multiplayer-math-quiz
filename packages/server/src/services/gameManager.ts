import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { Question, IQuestion } from '../models/Question';
import { User } from '../models/User';
import { generateQuestion } from './questionGenerator';

const QUESTION_DURATION = 60; // seconds
const COOLDOWN_DURATION = 5; // seconds

interface AnswerResult {
  correct: boolean;
  alreadySolved: boolean;
  winner?: string;
}

class GameManager {
  private io: Server | null = null;
  private connectedUsers = new Set<string>();
  private activeQuestion: IQuestion | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private cooldownTimeout: ReturnType<typeof setTimeout> | null = null;
  private remainingSeconds = 0;
  private isRunning = false;

  setIO(io: Server): void {
    this.io = io;
  }

  getActiveQuestion(): IQuestion | null {
    return this.activeQuestion;
  }

  getRemainingSeconds(): number {
    return this.remainingSeconds;
  }

  getConnectedUsers(): number {
    return this.connectedUsers.size;
  }

  addUser(userId: string): void {
    const wasEmpty = this.connectedUsers.size === 0;
    this.connectedUsers.add(userId);
    this.io?.emit('user:count', { count: this.connectedUsers.size });

    if (wasEmpty && !this.isRunning) {
      this.startGame();
    }
  }

  removeUser(userId: string): void {
    this.connectedUsers.delete(userId);
    this.io?.emit('user:count', { count: this.connectedUsers.size });

    if (this.connectedUsers.size === 0) {
      this.stopGame();
    }
  }

  private async startGame(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('Game started — generating first question');
    await this.nextQuestion();
  }

  private stopGame(): void {
    this.isRunning = false;
    this.clearTimers();
    this.activeQuestion = null;
    console.log('Game stopped — no connected users');
  }

  private clearTimers(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
      this.cooldownTimeout = null;
    }
  }

  private async nextQuestion(): Promise<void> {
    if (!this.isRunning || this.connectedUsers.size === 0) return;

    try {
      // Generate and save question
      const { expression, answer } = generateQuestion();

      const session = await mongoose.startSession();
      try {
        let question: IQuestion | null = null;

        await session.withTransaction(async () => {
          // Mark any leftover active questions as expired
          await Question.updateMany(
            { status: 'active' },
            { status: 'expired' },
            { session }
          );

          const created = await Question.create(
            [{ expression, answer, status: 'active' }],
            { session }
          );
          question = created[0];
        });

        session.endSession();

        if (!question) {
          console.error('Failed to create question');
          return;
        }

        const savedQuestion = question as IQuestion;
        this.activeQuestion = savedQuestion;
        this.remainingSeconds = QUESTION_DURATION;

        // Broadcast new question to all clients
        this.io?.emit('question:new', {
          questionId: savedQuestion._id,
          expression: savedQuestion.expression,
          duration: QUESTION_DURATION,
        });

        // Start countdown timer
        this.startTimer();
      } catch (error) {
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error generating next question:', error);
      // Retry after a short delay
      setTimeout(() => this.nextQuestion(), 2000);
    }
  }

  private startTimer(): void {
    this.clearTimers();

    this.tickInterval = setInterval(async () => {
      this.remainingSeconds--;

      this.io?.emit('question:tick', {
        remainingSeconds: this.remainingSeconds,
      });

      if (this.remainingSeconds <= 0) {
        await this.expireQuestion();
      }
    }, 1000);
  }

  private async expireQuestion(): Promise<void> {
    this.clearTimers();

    if (!this.activeQuestion) return;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Question.findOneAndUpdate(
          { _id: this.activeQuestion!._id, status: 'active' },
          { status: 'expired' },
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    this.io?.emit('question:expired', {
      questionId: this.activeQuestion._id,
      answer: this.activeQuestion.answer,
    });

    this.activeQuestion = null;
    this.startCooldown();
  }

  private startCooldown(): void {
    let cooldown = COOLDOWN_DURATION;
    this.io?.emit('question:countdown', { seconds: cooldown });

    const countdownInterval = setInterval(() => {
      cooldown--;
      this.io?.emit('question:countdown', { seconds: cooldown });

      if (cooldown <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    this.cooldownTimeout = setTimeout(() => {
      clearInterval(countdownInterval);
      this.nextQuestion();
    }, COOLDOWN_DURATION * 1000);
  }

  async handleAnswer(
    userId: string,
    questionId: string,
    submittedAnswer: number
  ): Promise<AnswerResult> {
    if (!this.activeQuestion) {
      return { correct: false, alreadySolved: true };
    }

    if (this.activeQuestion._id.toString() !== questionId) {
      return { correct: false, alreadySolved: true };
    }

    // Check if answer is correct
    if (submittedAnswer !== this.activeQuestion.answer) {
      // Wrong answer — increment attempted count
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await User.updateOne(
            { _id: userId },
            { $inc: { attempted: 1 } },
            { session }
          );
        });
      } finally {
        session.endSession();
      }
      return { correct: false, alreadySolved: false };
    }

    // Correct answer — atomic update to claim the question
    const session = await mongoose.startSession();
    try {
      let winner: string | undefined;

      await session.withTransaction(async () => {
        const updated = await Question.findOneAndUpdate(
          {
            _id: questionId,
            status: 'active',
          },
          {
            status: 'solved',
            solvedBy: new mongoose.Types.ObjectId(userId),
            solvedAt: new Date(),
          },
          { new: true, session }
        );

        if (!updated) {
          // Question already solved by someone else
          return;
        }

        // Update user scores
        const user = await User.findOneAndUpdate(
          { _id: userId },
          { $inc: { attempted: 1, correct: 1 } },
          { new: true, session }
        );

        winner = user?.username;
      });

      session.endSession();

      if (!winner) {
        return { correct: true, alreadySolved: true };
      }

      // Stop the timer and broadcast win
      this.clearTimers();
      this.activeQuestion = null;

      this.io?.emit('question:solved', {
        questionId,
        username: winner,
        answer: submittedAnswer,
      });

      // Start cooldown before next question
      this.startCooldown();

      return { correct: true, alreadySolved: false, winner };
    } catch (error) {
      session.endSession();
      console.error('Error handling answer:', error);
      throw error;
    }
  }
}

// Singleton instance
export const gameManager = new GameManager();
