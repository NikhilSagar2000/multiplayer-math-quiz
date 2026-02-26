# Math Arena

A real-time competitive math quiz where multiple users compete to solve BODMAS math problems. The first user to submit the correct answer wins the round.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Database | MongoDB (Atlas M0 free tier) |
| Auth | JWT (bcrypt password hashing, 1-day token expiry) |
| Deployment | Render.com |

## Architecture

### Monorepo Structure
```
packages/
  client/   → React SPA (Vite)
  server/   → Express + Socket.io API
```

### Key Design Decisions

**Concurrency handling:** Atomic MongoDB `findOneAndUpdate` within transactions ensures exactly one winner per question. The query `{ _id: questionId, status: "active" }` atomically claims the question in a single operation, preventing race conditions.

**Server-driven timing:** All timers run server-side (60s question duration, 5s cooldown). Clients receive tick updates every second. This prevents client-side timer drift and manipulation.

**BODMAS question generator:** Builds random expressions with 2-4 operations, numbers 1-50, optional parentheses. Uses a safe recursive descent parser (no `eval()`). Answers are guaranteed positive integers.

**Single session enforcement:** Only one active socket connection per user. Logging in from a new device kicks the previous session with a notification.

**Accurate online count:** Connected users are tracked via a userId-based Set (not socket count), so the same user on multiple tabs doesn't inflate the count.

**Transactions:** All write operations use MongoDB transactions for consistency (answer submission, user score updates, question lifecycle).

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### Local Development

1. Clone and install:
```bash
git clone https://github.com/NikhilSagar2000/multiplayer-math-quiz.git
cd multiplayer-math-quiz
npm install
```

2. Create `.env` from example:
```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string and JWT_SECRET
```

3. Start development servers:
```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

4. Open http://localhost:5173 in multiple browser tabs to test.

## How It Works

1. Sign up with a username and password (or log in if returning)
2. Session persists in localStorage — returning users can continue without re-entering credentials
3. A BODMAS math question appears with a 60-second timer
4. First correct answer wins the round
5. 5-second cooldown, then a new question auto-generates
6. Questions keep generating as long as at least one user is connected
7. Live score badge shows your correct/attempted count in the header
8. Trophy icon opens the leaderboard with top 5 players sorted by correct answers

## Deployment

### Render.com

1. Connect your GitHub repo to Render
2. Use the `render.yaml` blueprint for auto-configuration
3. Set environment variables:
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — a strong random string for signing tokens
   - `CORS_ORIGIN` — your frontend URL (e.g., `https://math-arena-client.onrender.com`)
   - `VITE_SERVER_URL` — your backend URL (e.g., `https://math-arena-server.onrender.com`)
