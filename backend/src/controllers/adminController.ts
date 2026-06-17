import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { redis } from '../db/redis';

// ── Grid utilities (mirrored from frontend/src/utils/gridUtils.ts) ────────────

interface GridCell { row: number; col: number; letter: string; blocked: boolean; number?: number; }
interface ClueInput { number: number; clue: string; answer: string; clue_en?: string; direction: 'across' | 'down'; row: number; col: number; length: number; }

function computeSlots(grid: GridCell[][]): Array<{ number: number; direction: 'across'|'down'; row: number; col: number; length: number }> {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const slots: Array<{ number: number; direction: 'across'|'down'; row: number; col: number; length: number }> = [];
  let num = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].blocked) continue;
      const startsAcross = (c === 0 || grid[r][c-1].blocked) && c+1 < cols && !grid[r][c+1].blocked;
      const startsDown   = (r === 0 || grid[r-1][c].blocked) && r+1 < rows && !grid[r+1][c].blocked;
      if (!startsAcross && !startsDown) continue;
      if (startsAcross) {
        let len = 0;
        for (let dc = c; dc < cols && !grid[r][dc].blocked; dc++) len++;
        slots.push({ number: num, direction: 'across', row: r, col: c, length: len });
      }
      if (startsDown) {
        let len = 0;
        for (let dr = r; dr < rows && !grid[dr][c].blocked; dr++) len++;
        slots.push({ number: num, direction: 'down', row: r, col: c, length: len });
      }
      num++;
    }
  }
  return slots;
}

function applyNumbers(grid: GridCell[][]): GridCell[][] {
  const g = grid.map(row => row.map(cell => ({ ...cell, number: undefined as number | undefined })));
  const slots = computeSlots(grid);
  const seen = new Set<string>();
  for (const slot of slots) {
    const key = `${slot.row},${slot.col}`;
    if (!seen.has(key)) { seen.add(key); g[slot.row][slot.col].number = slot.number; }
  }
  return g;
}

// Split Kannada text into grapheme clusters using Unicode regex
function splitGraphemes(text: string): string[] {
  // Each Kannada akshara = base consonant/vowel + optional matras/virama/anusvara
  const re = /[ಀ-೿][಼ಾ-ೄೆ-ೋ್ಂಃ]*/gu;
  const matches = text.match(re);
  return matches ?? Array.from(text);
}

function buildSolution(grid: GridCell[][], clues: ClueInput[]): GridCell[][] {
  const sol = grid.map(row => row.map(cell => ({ ...cell, letter: '' })));
  for (const clue of clues) {
    const graphemes = splitGraphemes(clue.answer);
    for (let i = 0; i < graphemes.length; i++) {
      const r = clue.direction === 'across' ? clue.row : clue.row + i;
      const c = clue.direction === 'across' ? clue.col + i : clue.col;
      if (r < sol.length && c < sol[r].length && !sol[r][c].blocked) sol[r][c].letter = graphemes[i];
    }
  }
  return sol;
}

async function scanDel(pattern: string) {
  try {
    let cursor = '0';
    const keys: string[] = [];
    do {
      const [next, found] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      keys.push(...found);
    } while (cursor !== '0');
    if (keys.length) await redis.del(...keys);
  } catch { /* Redis unavailable — skip cache eviction */ }
}

// Fetch any puzzle (published or draft) — admin only
export async function getPuzzleAdmin(req: Request, res: Response) {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT id, title, title_kn, difficulty, grid, clues, published, created_at
     FROM puzzles WHERE id = $1`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Puzzle not found' });
  res.json({ puzzle: rows[0] });
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

// ── Import a puzzle from a structured JSON payload ────────────────────────────
// Body: { title, title_kn, difficulty, blocked, clues }
//   blocked: boolean[][] — 9×9 (or N×M) true=black false=open
//   clues: { across: ClueInput[], down: ClueInput[] }
//     ClueInput: { number, clue, answer, clue_en?, direction, row, col, length }
export async function importPuzzle(req: Request, res: Response) {
  const { title, title_kn, difficulty = 'medium', blocked, clues } = req.body as {
    title: string;
    title_kn: string;
    difficulty: 'easy' | 'medium' | 'hard';
    blocked: boolean[][];
    clues: { across: ClueInput[]; down: ClueInput[] };
  };

  if (!title || !title_kn) return res.status(400).json({ error: 'title and title_kn are required' });
  if (!blocked || !Array.isArray(blocked)) return res.status(400).json({ error: 'blocked grid is required' });

  // Build the empty GridCell[][] from the blocked pattern
  const rawGrid: GridCell[][] = blocked.map((row, r) =>
    row.map((isBlocked, c) => ({ row: r, col: c, letter: '', blocked: isBlocked }))
  );

  // Auto-number via computeSlots
  const numberedGrid = applyNumbers(rawGrid);

  // Merge slot positions into clues
  const allClues: ClueInput[] = [...(clues.across ?? []), ...(clues.down ?? [])];

  // Build solution 2D grid
  const solution = buildSolution(numberedGrid, allClues);

  const cluesObj = {
    across: clues.across ?? [],
    down:   clues.down   ?? [],
  };

  const { rows } = await pool.query(
    `INSERT INTO puzzles (title, title_kn, difficulty, grid, clues, solution, published, created_by)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,false,$7) RETURNING id`,
    [
      title, title_kn, difficulty,
      JSON.stringify(numberedGrid),
      JSON.stringify(cluesObj),
      JSON.stringify(solution),
      req.user?.sub ?? null,
    ]
  );

  await scanDel('puzzles:list:*');
  res.status(201).json({ id: rows[0].id });
}
