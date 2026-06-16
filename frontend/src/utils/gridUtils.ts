import { GridCell, ClueEntry } from '../types';

export function makeEmptyGrid(rows: number, cols: number): GridCell[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      row: r, col: c, letter: '', blocked: false,
    }))
  );
}

export function computeSlots(grid: GridCell[][]): ClueEntry[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const slots: ClueEntry[] = [];
  let num = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].blocked) continue;

      const startsAcross =
        (c === 0 || grid[r][c - 1].blocked) &&
        c + 1 < cols && !grid[r][c + 1].blocked;

      const startsDown =
        (r === 0 || grid[r - 1][c].blocked) &&
        r + 1 < rows && !grid[r + 1][c].blocked;

      if (!startsAcross && !startsDown) continue;

      if (startsAcross) {
        let len = 0;
        for (let dc = c; dc < cols && !grid[r][dc].blocked; dc++) len++;
        slots.push({ number: num, direction: 'across', row: r, col: c, length: len, clue: '', answer: '' });
      }
      if (startsDown) {
        let len = 0;
        for (let dr = r; dr < rows && !grid[dr][c].blocked; dr++) len++;
        slots.push({ number: num, direction: 'down', row: r, col: c, length: len, clue: '', answer: '' });
      }
      num++;
    }
  }
  return slots;
}

export function applyNumbers(grid: GridCell[][], slots: ClueEntry[]): GridCell[][] {
  const g = grid.map(row => row.map(cell => ({ ...cell, number: undefined as number | undefined })));
  const seen = new Set<string>();
  for (const slot of slots) {
    const key = `${slot.row},${slot.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      g[slot.row][slot.col].number = slot.number;
    }
  }
  return g;
}

export function buildSolution(grid: GridCell[][], slots: ClueEntry[]): GridCell[][] {
  const sol = grid.map(row => row.map(cell => ({ ...cell, letter: '' })));
  for (const slot of slots) {
    const chars = Array.from(slot.answer);
    for (let i = 0; i < slot.length && i < chars.length; i++) {
      const r = slot.direction === 'across' ? slot.row : slot.row + i;
      const c = slot.direction === 'across' ? slot.col + i : slot.col;
      sol[r][c].letter = chars[i];
    }
  }
  return sol;
}

export function validatePuzzle(slots: ClueEntry[]): string[] {
  const errors: string[] = [];
  for (const slot of slots) {
    const label = `${slot.number} ${slot.direction}`;
    const chars = Array.from(slot.answer);
    if (!slot.answer.trim()) errors.push(`${label}: answer is empty`);
    else if (chars.length !== slot.length) errors.push(`${label}: answer has ${chars.length} letters but slot needs ${slot.length}`);
    if (!slot.clue.trim()) errors.push(`${label}: Kannada clue is empty`);
  }
  return errors;
}
