import dotenv from 'dotenv';
import path from 'path';

// In dev, load .env from project root; in production, env vars are injected
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/db';
import { registerSocketHandlers } from './handlers/socketHandlers';
import authRoutes from './routes/auth';

const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

async function start() {
  await connectDB();
  registerSocketHandlers(io);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { io };
