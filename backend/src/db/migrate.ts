import { pool } from './pool';

const schema = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    VARCHAR(50) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS puzzles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255) NOT NULL,
  title_kn    VARCHAR(255) NOT NULL,
  difficulty  VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  grid        JSONB NOT NULL,
  clues       JSONB NOT NULL,
  solution    JSONB NOT NULL,
  published   BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  puzzle_id     UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_token   VARCHAR(64),
  state         JSONB NOT NULL DEFAULT '{}',
  completed     BOOLEAN NOT NULL DEFAULT false,
  score         INTEGER NOT NULL DEFAULT 0,
  time_taken_s  INTEGER,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  CONSTRAINT session_owner CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  puzzle_id     UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score         INTEGER NOT NULL,
  time_taken_s  INTEGER NOT NULL,
  achieved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (puzzle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_puzzle_score
  ON leaderboard(puzzle_id, score DESC, time_taken_s ASC);

-- words_completed added in v2
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS words_completed INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sessions_user   ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_puzzle ON game_sessions(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_sessions_guest  ON game_sessions(guest_token) WHERE guest_token IS NOT NULL;

-- Speeds up the published puzzle list query
CREATE INDEX IF NOT EXISTS idx_puzzles_published_created
  ON puzzles(published, created_at DESC);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
