import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { redis } from '../db/redis';

async function scanDel(pattern: string) {
  let cursor = '0';
  const keys: string[] = [];
  do {
    const [next, found] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = next;
    keys.push(...found);
  } while (cursor !== '0');
  if (keys.length) await redis.del(...keys);
}

export async function listAllPuzzles(_req: Request, res: Response) {
  const { rows } = await pool.query(
    `SELECT p.id, p.title, p.title_kn, p.difficulty, p.published, p.created_at,
            u.username AS created_by,
            (SELECT COUNT(*) FROM leaderboard l WHERE l.puzzle_id = p.id)::int AS play_count
     FROM puzzles p
     LEFT JOIN users u ON u.id = p.created_by
     ORDER BY p.created_at DESC`
  );
  res.json({ puzzles: rows });
}

export async function deletePuzzle(req: Request, res: Response) {
  const { id } = req.params;
  const { rowCount } = await pool.query(`DELETE FROM puzzles WHERE id = $1`, [id]);
  if (!rowCount) return res.status(404).json({ error: 'Puzzle not found' });
  // Evict all caches that may reference this puzzle
  await Promise.all([
    scanDel('puzzles:list:*'),
    redis.del(`puzzle:${id}`, `leaderboard:${id}`, 'leaderboard:global'),
  ]);
  res.json({ success: true });
}

export async function togglePublish(req: Request, res: Response) {
  const { id } = req.params;
  const { rows } = await pool.query(
    `UPDATE puzzles SET published = NOT published WHERE id = $1 RETURNING id, published`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Puzzle not found' });
  // Evict list cache so the change is immediately visible
  await Promise.all([
    scanDel('puzzles:list:*'),
    redis.del(`puzzle:${id}`),
  ]);
  res.json({ id: rows[0].id, published: rows[0].published });
}
