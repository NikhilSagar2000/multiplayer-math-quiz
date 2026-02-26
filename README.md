# Math Arena

A real-time competitive math quiz where multiple users compete to solve BODMAS math problems. The first user to submit the correct answer wins the round.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Database | MongoDB (Atlas M0 free tier) |
| Deployment | Render.com |

## Architecture

### Monorepo Structure
```
packages/
  client/   → React SPA (Vite)
  server/   → Express + Socket.io API
```

### Key Design Decisions

**Concurrency handling:** Atomic MongoDB `findOneAndUpdate` within transactions ensures exactly one winner per question. The query `{ _id: questionId, status: "active", answer: submittedAnswer }` atomically validates the answer AND claims the question in a single operation.

**Server-driven timing:** All timers run server-side (60s question duration, 5s cooldown). Clients receive tick updates every second. This prevents client-side timer drift and manipulation.

**BODMAS question generator:** Builds random expressions with 2-4 operations, numbers 1-50, optional parentheses. Uses a safe recursive descent parser (no `eval()`). Answers are guaranteed positive integers.

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
# Edit .env with your MongoDB Atlas connection string
```

3. Start development servers:
```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

4. Open http://localhost:5173 in multiple browser tabs to test.

## How It Works

1. Users enter a username to join (no signup needed)
2. A BODMAS math question appears with a 60-second timer
3. First correct answer wins the round
4. 5-second cooldown, then a new question appears
5. Questions auto-generate while users are connected
6. Trophy icon shows top 5 players by correct answers

## Noted Corners & Production Improvements

These are areas where I kept the implementation simple for the time constraint, with notes on what a production version would include:

- **No Redis:** Single-server deployment means in-process Socket.io state works fine. For horizontal scaling, add Redis as Socket.io adapter and for pub/sub.
- **No structured logging:** Using `console.log/error`. Production would use Winston or Pino with JSON format.
- **No CI/CD:** No automated test pipeline. Would add GitHub Actions with Jest for unit tests and Playwright for E2E.
- **No rate limiting middleware:** Only socket-level throttle (1 answer/sec). Would add `express-rate-limit` for HTTP endpoints.
- **No input sanitization library:** Manual validation only. Would add `express-validator` or `zod`.
- **No monitoring:** No APM, error tracking, or alerting. Would add Sentry or Datadog.
- **Simple username auth:** No passwords, sessions, or JWT. Would add proper auth for a real product.

## Deployment

### Render.com

1. Connect your GitHub repo to Render
2. Use the `render.yaml` blueprint for auto-configuration
3. Set environment variables:
   - `MONGODB_URI` — your Atlas connection string
   - `CORS_ORIGIN` — your frontend URL (e.g., `https://math-arena-client.onrender.com`)
   - `VITE_SERVER_URL` — your backend URL (e.g., `https://math-arena-server.onrender.com`)
