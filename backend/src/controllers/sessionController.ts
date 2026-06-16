import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { redis, TTL } from '../db/redis';

interface ClueEntry {
  number: number; row: number; col: number;
  direction: 'across' | 'down'; length: number;
}
interface GridCell { row: number; col: number; letter: string; blocked: boolean; }

function computeWordsCompleted(
  clues: { across: ClueEntry[]; down: ClueEntry[] },
  grid: Record<string, string>,
  solution: GridCell[][]
): number {
  const all = [...(clues?.across ?? []), ...(clues?.down ?? [])];
  let count = 0;
  for (const clue of all) {
    let ok = true;
    for (let i = 0; i < clue.length; i++) {
      const r = clue.direction === 'across' ? clue.row : clue.row + i;
      const c = clue.direction === 'across' ? clue.col + i : clue.col;
      if (grid[`${r},${c}`] !== solution[r]?.[c]?.letter) { ok = false; break; }
    }
    if (ok) count++;
  }
  return count;
}

function totalWords(clues: { across: ClueEntry[]; down: ClueEntry[] }): number {
  return (clues?.across?.length ?? 0) + (clues?.down?.length ?? 0);
}

export async function startSession(req: Request, res: Response) {
  const { puzzle_id } = req.params;
  const userId = req.user?.sub ?? null;
  const guestToken = userId ? null : (req.headers['x-guest-token'] as string | undefined ?? null);

  if (!userId && !guestToken) {
    return res.status(400).json({ error: 'Provide x-guest-token header or authenticate' });
  }

  const { rows: prows } = await pool.query(
    `SELECT solution, clues FROM puzzles WHERE id = $1 AND published = true`, [puzzle_id]
  );
  if (!prows[0]) return res.status(404).json({ error: 'Puzzle not found' });

  const solution: GridCell[][] = prows[0].solution;
  const clues: { across: ClueEntry[]; down: ClueEntry[] } = prows[0].clues;
  const totalCells = solution.flat().filter(c => !c.blocked).length;

  const { rows } = await pool.query(
    `INSERT INTO game_sessions (puzzle_id, user_id, guest_token, state)
     VALUES ($1, $2, $3, $4)
     RETURNING id, started_at`,
    [puzzle_id, userId, guestToken,
     JSON.stringify({ grid: [], correct_cells: 0, total_cells: totalCells })]
  );
  const sessionId = rows[0].id;

  const hotState = {
    puzzle_id,
    user_id: userId,
    guest_token: guestToken,
    solution,
    clues,
    grid: {} as Record<string, string>,
    total_cells: totalCells,
    started_at: rows[0].started_at,
  };
  await redis.set(`session:${sessionId}`, JSON.stringify(hotState), 'EX', TTL.SESSION);

  res.status(201).json({
    session_id: sessionId,
    started_at: rows[0].started_at,
    total_cells: totalCells,
    total_words: totalWords(clues),
  });
}

export async function updateSession(req: Request, res: Response) {
  const { session_id } = req.params;
  const { cell_updates } = req.body;
  const userId = req.user?.sub ?? null;
  const guestToken = req.headers['x-guest-token'] as string | undefined ?? null;

  const raw = await redis.get(`session:${session_id}`);
  if (!raw) return updateSessionFromDB(req, res);

  const hot = JSON.parse(raw);

  if (userId) {
    if (hot.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
  } else if (guestToken) {
    if (hot.guest_token !== guestToken) return res.status(403).json({ error: 'Forbidden' });
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }

  for (const { row, col, value } of cell_updates) {
    hot.grid[`${row},${col}`] = value;
  }

  const solution: GridCell[][] = hot.solution;
  const solFlat = solution.flat().filter(c => !c.blocked);
  let correctCells = 0;
  for (const cell of solFlat) {
    if (hot.grid[`${cell.row},${cell.col}`] === cell.letter) correctCells++;
  }

  const wordsCompleted = computeWordsCompleted(hot.clues, hot.grid, solution);
  const completed = correctCells === hot.total_cells;
  const score = completed ? Math.round((correctCells / hot.total_cells) * 1000) : 0;

  await redis.set(`session:${session_id}`, JSON.stringify(hot), 'EX', TTL.SESSION);

  if (completed) {
    const timeTaken = Math.floor((Date.now() - new Date(hot.started_at).getTime()) / 1000);
    const gridArr = Object.entries(hot.grid).map(([key, value]) => {
      const [r, c] = (key as string).split(',').map(Number);
      return { row: r, col: c, value };
    });
    await pool.query(
      `UPDATE game_sessions SET state=$1, completed=true, score=$2,
       completed_at=NOW(), time_taken_s=$3 WHERE id=$4`,
      [JSON.stringify({ grid: gridArr, correct_cells: correctCells, total_cells: hot.total_cells }),
       score, timeTaken, session_id]
    );
    if (userId) {
      await pool.query(
        `INSERT INTO leaderboard (puzzle_id, user_id, score, time_taken_s, words_completed)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (puzzle_id, user_id) DO UPDATE
         SET score            = GREATEST(leaderboard.score, EXCLUDED.score),
             time_taken_s     = LEAST(leaderboard.time_taken_s, EXCLUDED.time_taken_s),
             words_completed  = GREATEST(leaderboard.words_completed, EXCLUDED.words_completed),
             achieved_at      = NOW()`,
        [hot.puzzle_id, userId, score, timeTaken, wordsCompleted]
      );
      await redis.del(`leaderboard:${hot.puzzle_id}`, 'leaderboard:global',
                      `stats:${userId}`);
    }
    await redis.del(`session:${session_id}`);
  }

  res.json({
    correct_cells: correctCells,
    total_cells: hot.total_cells,
    words_completed: wordsCompleted,
    total_words: totalWords(hot.clues),
    completed,
    score,
  });
}

async function updateSessionFromDB(req: Request, res: Response) {
  const { session_id } = req.params;
  const { cell_updates } = req.body;
  const userId = req.user?.sub ?? null;
  const guestToken = req.headers['x-guest-token'] as string | undefined ?? null;

  const { rows: srows } = await pool.query(
    `SELECT s.*, p.solution, p.clues FROM game_sessions s
     JOIN puzzles p ON p.id = s.puzzle_id
     WHERE s.id = $1 AND s.completed = false`, [session_id]
  );
  if (!srows[0]) return res.status(404).json({ error: 'Session not found or already completed' });
  const session = srows[0];

  if (userId) {
    if (session.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
  } else if (guestToken) {
    if (session.guest_token !== guestToken) return res.status(403).json({ error: 'Forbidden' });
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const solution: GridCell[][] = session.solution;
  const clues: { across: ClueEntry[]; down: ClueEntry[] } = session.clues;
  const state = session.state;
  const gridMap: Record<string, string> = {};
  for (const c of (state.grid ?? [])) gridMap[`${c.row},${c.col}`] = c.value;
  for (const { row, col, value } of cell_updates) gridMap[`${row},${col}`] = value;

  const solFlat = solution.flat().filter(c => !c.blocked);
  let correctCells = 0;
  for (const cell of solFlat) {
    if (gridMap[`${cell.row},${cell.col}`] === cell.letter) correctCells++;
  }
  const wordsCompleted = computeWordsCompleted(clues, gridMap, solution);
  const totalCells: number = state.total_cells;
  const completed = correctCells === totalCells;
  const score = completed ? Math.round((correctCells / totalCells) * 1000) : 0;
  const gridArr = Object.entries(gridMap).map(([key, value]) => {
    const [r, c] = (key as string).split(',').map(Number);
    return { row: r, col: c, value };
  });

  await pool.query(
    `UPDATE game_sessions SET state=$1, completed=$2, score=$3,
     completed_at=CASE WHEN $2 THEN NOW() ELSE NULL END WHERE id=$4`,
    [JSON.stringify({ grid: gridArr, correct_cells: correctCells, total_cells: totalCells }),
     completed, score, session_id]
  );

  if (completed && userId) {
    const timeTaken = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
    await pool.query(
      `INSERT INTO leaderboard (puzzle_id, user_id, score, time_taken_s, words_completed)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (puzzle_id, user_id) DO UPDATE
       SET score           = GREATEST(leaderboard.score, EXCLUDED.score),
           time_taken_s    = LEAST(leaderboard.time_taken_s, EXCLUDED.time_taken_s),
           words_completed = GREATEST(leaderboard.words_completed, EXCLUDED.words_completed),
           achieved_at     = NOW()`,
      [session.puzzle_id, userId, score, timeTaken, wordsCompleted]
    );
    await redis.del(`leaderboard:${session.puzzle_id}`, 'leaderboard:global',
                    `stats:${userId}`);
  }
  res.json({
    correct_cells: correctCells,
    total_cells: totalCells,
    words_completed: wordsCompleted,
    total_words: totalWords(clues),
    completed,
    score,
  });
}
