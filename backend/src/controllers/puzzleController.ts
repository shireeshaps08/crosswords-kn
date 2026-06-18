import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { redis, cacheGet, cacheSet, TTL } from '../db/redis';

export async function listPuzzles(req: Request, res: Response) {
  const { difficulty, page = '1', limit = '10' } = req.query;
  const cacheKey = `puzzles:list:${difficulty ?? 'all'}:p${page}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const offset = (Number(page) - 1) * Number(limit);
  const params: unknown[] = [Number(limit), offset];
  let where = 'WHERE published = true';
  if (difficulty) { params.push(difficulty); where += ` AND difficulty = $${params.length}`; }

  const { rows } = await pool.query(
    `SELECT id, title, title_kn, difficulty, created_at,
            (SELECT COUNT(*) FROM leaderboard WHERE puzzle_id = p.id) AS play_count
     FROM puzzles p ${where}
     ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    params
  );
  const payload = { puzzles: rows };
  await cacheSet(cacheKey, payload, TTL.PUZZLE_LIST);
  res.json(payload);
}

export async function getPuzzle(req: Request, res: Response) {
  const { id } = req.params;
  const cacheKey = `puzzle:${id}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT id, title, title_kn, difficulty, grid, clues, solution, created_at
     FROM puzzles WHERE id = $1 AND published = true`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Puzzle not found' });

  const grid = rows[0].grid as any[][];
  const totalCells = grid.flat().filter((c: any) => !c.blocked).length;
  const payload = { puzzle: { ...rows[0], total_cells: totalCells } };
  await cacheSet(cacheKey, payload, TTL.PUZZLE);
  res.json(payload);
}

export async function createPuzzle(req: Request, res: Response) {
  const { title, title_kn, difficulty, grid, clues, solution, published = false } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO puzzles (title, title_kn, difficulty, grid, clues, solution, created_by, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [title, title_kn, difficulty, JSON.stringify(grid), JSON.stringify(clues), JSON.stringify(solution), req.user!.sub, Boolean(published)]
  );
  if (published) {
    try {
      let cursor = '0';
      const keys: string[] = [];
      do {
        const [next, found] = await redis.scan(cursor, 'MATCH', 'puzzles:list:*', 'COUNT', 100);
        cursor = next;
        keys.push(...found);
      } while (cursor !== '0');
      if (keys.length) await redis.del(...keys);
    } catch { /* Redis unavailable */ }
  }
  res.status(201).json({ id: rows[0].id });
}
