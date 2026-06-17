import api from './api';
import { Puzzle, PuzzleSummary, CellValue } from '../types';

const STATIC = import.meta.env.VITE_STATIC === 'true';
const BASE = import.meta.env.BASE_URL ?? '/';

export async function fetchPuzzles(params?: { difficulty?: string }): Promise<{ puzzles: PuzzleSummary[] }> {
  if (STATIC) {
    const r = await fetch(`${BASE}data/puzzles.json`);
    const data = await r.json();
    if (params?.difficulty) {
      data.puzzles = data.puzzles.filter((p: PuzzleSummary) => p.difficulty === params.difficulty);
    }
    return data;
  }
  return api.get('/puzzles', { params }).then(r => r.data);
}

export async function fetchPuzzle(id: string): Promise<{ puzzle: Puzzle & { solution?: { row: number; col: number; letter: string; blocked: boolean }[][]; total_cells?: number } }> {
  if (STATIC) {
    const r = await fetch(`${BASE}data/puzzle-${id}.json`);
    return r.json();
  }
  return api.get(`/puzzles/${id}`).then(r => r.data);
}

export async function createSession(
  puzzleId: string,
  totalCells: number,
): Promise<{ session_id: string; total_cells: number }> {
  if (STATIC) {
    return { session_id: 'local', total_cells: totalCells };
  }
  return api.post(`/puzzles/${puzzleId}/sessions`).then(r => r.data);
}

export async function submitCells(
  sessionId: string,
  updates: CellValue[],
  // Used only in static mode for local checking
  solution: { row: number; col: number; letter: string; blocked: boolean }[][] | null,
  allValues: Map<string, string>,
): Promise<{ correct_cells: number; total_cells: number; words_completed: number; total_words?: number; completed: boolean; score?: number }> {
  if (STATIC && solution) {
    const openCells = solution.flat().filter(c => !c.blocked);
    const totalCells = openCells.length;
    let correct = 0;
    for (const cell of openCells) {
      const key = `${cell.row},${cell.col}`;
      if (allValues.get(key) === cell.letter) correct++;
    }
    return {
      correct_cells: correct,
      total_cells: totalCells,
      words_completed: 0,
      completed: correct === totalCells,
      score: correct === totalCells ? 1000 : 0,
    };
  }
  return api.patch(`/sessions/${sessionId}`, { cell_updates: updates }).then(r => r.data);
}
