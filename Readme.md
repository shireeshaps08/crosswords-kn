# ಕನ್ನಡ ಕ್ರಾಸ್‌ವರ್ಡ್ (Kannada Crossword)

A full-stack Kannada crossword puzzle app built for Karnataka users on Android.

## Features

- On-screen Kannada keyboard with vowel picker — no device language settings required
- Phonetic transliteration (type `ka` → ಕ, `shi` → ಶಿ) for physical/hardware keyboards
- User authentication (register / login / guest play)
- Leaderboard tracking words completed, puzzles solved, and score — persists across sessions
- Admin panel to create and publish puzzles
- Redis caching, rate limiting, and gzip compression

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| Cache / Rate-limit | Redis 7 |
| Container | Docker Compose |

## Quick Start

```bash
docker compose up --build -d
```

- Frontend: http://localhost:3200
- Backend API: http://localhost:4000

## First-time setup

```bash
# Run DB migrations
docker compose exec backend node dist/db/migrate.js

# (Optional) seed sample puzzles
docker compose exec backend node dist/db/seed.js

# Create an admin user
docker compose exec backend node dist/db/create-admin.js
```

## Project Structure

```
crossword-kn/
├── frontend/        # React app (Vite)
│   └── src/
│       ├── components/   # CrosswordGrid, KannadaKeyboard, CluePanel …
│       ├── pages/        # Home, PuzzlePlay, Leaderboard, Admin …
│       └── utils/        # transliterate.ts, gridUtils.ts
├── backend/         # Express API
│   └── src/
│       ├── controllers/  # auth, puzzle, session, leaderboard, admin
│       ├── db/           # pool, redis, migrate, seed
│       ├── middleware/   # auth, validate, errorHandler
│       └── routes/
├── infrastructure/  # AWS CloudFormation + deploy script
└── docker-compose.yml
```
