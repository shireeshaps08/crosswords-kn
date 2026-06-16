import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { cacheGet, cacheSet, redis, TTL } from '../db/redis';

export async function getLeaderboard(req: Request, res: Response) {
  const { puzzle_id } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const cacheKey = `leaderboard:${puzzle_id}:${limit}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT RANK() OVER (ORDER BY l.score DESC, l.time_taken_s ASC) AS rank,
            u.username, l.score, l.time_taken_s, l.words_completed, l.achieved_at
     FROM leaderboard l JOIN users u ON u.id = l.user_id
     WHERE l.puzzle_id = $1 ORDER BY rank LIMIT $2`,
    [puzzle_id, limit]
  );
  const payload = { leaderboard: rows };
  await cacheSet(cacheKey, payload, TTL.LEADERBOARD);
  res.json(payload);
}

export async function getGlobalLeaderboard(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const cacheKey = `leaderboard:global:${limit}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT u.id,
            u.username,
            COUNT(l.id)::int                        AS puzzles_solved,
            COALESCE(SUM(l.words_completed), 0)::int AS total_words,
            COALESCE(SUM(l.score), 0)::int           AS total_score
     FROM leaderboard l JOIN users u ON u.id = l.user_id
     GROUP BY u.id, u.username
     ORDER BY total_words DESC, total_score DESC, puzzles_solved DESC
     LIMIT $1`,
    [limit]
  );
  const payload = { leaderboard: rows };
  await cacheSet(cacheKey, payload, TTL.LEADERBOARD);
  res.json(payload);
}

export async function getUserStats(req: Request, res: Response) {
  const userId = req.user!.sub;
  const cacheKey = `stats:${userId}`;

  const cached = await cacheGet<object>(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int                          AS puzzles_solved,
       COALESCE(SUM(words_completed), 0)::int AS total_words,
       COALESCE(SUM(score), 0)::int           AS total_score,
       MAX(achieved_at)                        AS last_played_at
     FROM leaderboard
     WHERE user_id = $1`,
    [userId]
  );

  // Also find the user's global rank by total_words
  const { rows: rankRows } = await pool.query(
    `SELECT rank FROM (
       SELECT user_id,
              RANK() OVER (ORDER BY SUM(words_completed) DESC, SUM(score) DESC) AS rank
       FROM leaderboard GROUP BY user_id
     ) r WHERE user_id = $1`,
    [userId]
  );

  const payload = {
    stats: {
      ...rows[0],
      global_rank: rankRows[0]?.rank ?? null,
    },
  };
  // Cache for 30 s (same as leaderboard)
  await redis.set(cacheKey, JSON.stringify(payload), 'EX', TTL.LEADERBOARD);
  res.json(payload);
}
