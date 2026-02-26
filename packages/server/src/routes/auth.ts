import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { generateToken, verifyToken } from '../middleware/auth';

const router = Router();

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Validate inputs
    if (!username || !password || !confirmPassword) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
      res.status(400).json({ error: 'Username must be 3-20 characters.' });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    // Check if username already exists
    const existing = await User.findOne({ username });
    if (existing) {
      res.status(409).json({ error: 'Username already taken.' });
      return;
    }

    // Create user with transaction
    const session = await mongoose.startSession();
    let user;

    try {
      await session.withTransaction(async () => {
        const created = await User.create([{ username, password }], { session });
        user = created[0];
      });
    } finally {
      session.endSession();
    }

    if (!user) {
      res.status(500).json({ error: 'Failed to create account.' });
      return;
    }

    const typedUser = user as InstanceType<typeof User>;
    const token = generateToken(typedUser._id.toString(), typedUser.username);

    res.status(201).json({
      token,
      user: {
        userId: typedUser._id,
        username: typedUser.username,
        attempted: typedUser.attempted,
        correct: typedUser.correct,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const token = generateToken(user._id.toString(), user.username);

    res.json({
      token,
      user: {
        userId: user._id,
        username: user.username,
        attempted: user.attempted,
        correct: user.correct,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided.' });
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }

    const user = await User.findById(payload.userId).select(
      'username attempted correct'
    );
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: {
        userId: user._id,
        username: user.username,
        attempted: user.attempted,
        correct: user.correct,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
