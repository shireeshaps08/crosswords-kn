import { pool } from './pool';
import puzzle6381 from './puzzles/puzzle-6381';

// Puzzle 6381 — 9×9 grid
// Black cells from printed image (ground truth).
// Numbers: 1@(0,0) 2@(0,2) 3@(0,5) 4@(0,8) 5@(2,0) 6@(2,3) 7@(2,5)
//          8@(4,2) 9@(4,5) 10@(5,0) 11@(5,8) 12@(6,0) 13@(6,5) 14@(6,6) 15@(8,0) 16@(8,5)
// Slots: 1A(4) 1D(4) 2D(3) 3A(4) 4D(4) 5A(4) 6D(7) 7A(3) 8A(4) 8D(3)
//        9D(5) 10D(4) 11D(4) 12A(9) 14D(3) 15A(4) 16A(4)

const ROWS = 9;
const COLS = 9;

const BLACK = new Set([
  '0,4',
  '1,1','1,3','1,4','1,5','1,7',
  '2,4',
  '3,1','3,2','3,4','3,7',
  '4,0','4,1','4,7','4,8',
  '5,1','5,3','5,4','5,6','5,7',
  '6,3','6,4',
  '7,1','7,3','7,4','7,6',
  '8,4',
]);

const NUMBERS: Record<string, number> = {
  '0,0': 1, '0,2': 2, '0,5': 3, '0,8': 4,
  '2,0': 5, '2,3': 6, '2,5': 7,
  '4,2': 8, '4,5': 9,
  '5,0': 10, '5,8': 11,
  '6,0': 12, '6,5': 13, '6,6': 14,
  '8,0': 15, '8,5': 16,
};

// Build lookup maps from puzzle-6381.ts reference data
const ANSWERS: Record<string, string> = {};
const CLUES: Record<string, string> = {};
const LENGTHS: Record<string, number> = {};

for (const c of puzzle6381.across_clues) {
  const key = `${c.number}-across`;
  ANSWERS[key] = c.answer;
  CLUES[key]   = c.clue;
  LENGTHS[key] = c.length;
}
for (const c of puzzle6381.down_clues) {
  const key = `${c.number}-down`;
  ANSWERS[key] = c.answer;
  CLUES[key]   = c.clue;
  LENGTHS[key] = c.length;
}

function isOpen(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS && !BLACK.has(`${r},${c}`);
}

const AKSHARA_RE = /[ಅ-ಹೞೠೡ]((್[ಅ-ಹೞ])*[಼-ೌೕೖ್]?)/gu;
function splitAksharas(str: string): string[] {
  return [...str.matchAll(new RegExp(AKSHARA_RE.source, 'gu'))].map(m => m[0]);
}

interface Slot { number: number; direction: 'across'|'down'; cells: {row:number;col:number}[] }

function deriveSlots(): Slot[] {
  const slots: Slot[] = [];
  for (const [key, num] of Object.entries(NUMBERS)) {
    const [r, c] = key.split(',').map(Number);
    // Across: starts when left is blocked/edge and right is open
    if (!isOpen(r, c - 1) && isOpen(r, c + 1)) {
      const cells: {row:number;col:number}[] = [];
      let cc = c;
      while (isOpen(r, cc)) { cells.push({ row: r, col: cc }); cc++; }
      if (cells.length >= 3) slots.push({ number: num, direction: 'across', cells });
    }
    // Down: starts when top is blocked/edge and bottom is open
    if (!isOpen(r - 1, c) && isOpen(r + 1, c)) {
      const cells: {row:number;col:number}[] = [];
      let rr = r;
      while (isOpen(rr, c)) { cells.push({ row: rr, col: c }); rr++; }
      if (cells.length >= 3) slots.push({ number: num, direction: 'down', cells });
    }
  }
  return slots;
}

function buildGridAndClues() {
  const slots = deriveSlots();
  const letterMap = new Map<string, string>();

  // Across fills first
  for (const slot of slots.filter(s => s.direction === 'across')) {
    const key = `${slot.number}-${slot.direction}`;
    const answer = ANSWERS[key] ?? '';
    const aksharas = splitAksharas(answer);
    const limit = LENGTHS[key] ?? slot.cells.length;
    for (let i = 0; i < limit && i < aksharas.length && i < slot.cells.length; i++) {
      letterMap.set(`${slot.cells[i].row},${slot.cells[i].col}`, aksharas[i]);
    }
  }
  // Down fills remaining empty cells
  for (const slot of slots.filter(s => s.direction === 'down')) {
    const key = `${slot.number}-${slot.direction}`;
    const answer = ANSWERS[key] ?? '';
    const aksharas = splitAksharas(answer);
    const limit = LENGTHS[key] ?? slot.cells.length;
    for (let i = 0; i < limit && i < aksharas.length && i < slot.cells.length; i++) {
      const ck = `${slot.cells[i].row},${slot.cells[i].col}`;
      if (!letterMap.has(ck)) letterMap.set(ck, aksharas[i]);
    }
  }

  // Build grid
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const ck = `${r},${c}`;
      const blocked = BLACK.has(ck);
      const number = NUMBERS[ck];
      row.push({
        row: r, col: c,
        letter: blocked ? '' : (letterMap.get(ck) ?? ''),
        blocked,
        ...(number !== undefined ? { number } : {}),
      });
    }
    grid.push(row);
  }

  // Build clues arrays
  const acrossClues = [];
  const downClues   = [];
  for (const slot of slots.sort((a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1))) {
    const key = `${slot.number}-${slot.direction}`;
    const entry = {
      number:    slot.number,
      direction: slot.direction,
      clue:      CLUES[key] ?? `${slot.number} ${slot.direction === 'across' ? 'ಎಡದಿಂದ ಬಲಕ್ಕೆ' : 'ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ'}`,
      answer:    ANSWERS[key] ?? '',
      row:       slot.cells[0].row,
      col:       slot.cells[0].col,
      length:    LENGTHS[key] ?? slot.cells.length,
    };
    if (slot.direction === 'across') acrossClues.push(entry);
    else                             downClues.push(entry);
  }

  return { grid, clues: { across: acrossClues, down: downClues } };
}

async function seed6381() {
  const { grid, clues } = buildGridAndClues();

  console.log('Grid:');
  for (const row of grid) {
    console.log(row.map((c: any) => c.blocked ? '■' : String(c.number ?? '·').padStart(2)).join(' '));
  }
  console.log(`\nAcross: ${clues.across.length}, Down: ${clues.down.length}`);
  console.log('Across:', clues.across.map((c: any) => `${c.number}(${c.length})`).join(' '));
  console.log('Down:  ', clues.down.map((c: any)   => `${c.number}(${c.length})`).join(' '));

  const { rows: adminRows } = await pool.query(
    `SELECT id FROM users WHERE role='admin' LIMIT 1`
  );
  const adminId = adminRows[0]?.id ?? null;

  const { rowCount } = await pool.query(
    `UPDATE puzzles SET grid=$1, clues=$2, solution=$3, published=false
     WHERE title='Prajavani Crossword 6381'`,
    [JSON.stringify(grid), JSON.stringify(clues), JSON.stringify(grid)]
  );
  if ((rowCount ?? 0) === 0) {
    await pool.query(
      `INSERT INTO puzzles (title, title_kn, difficulty, grid, clues, solution, created_by, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,false)`,
      [
        'Prajavani Crossword 6381',
        'ಪ್ರಜಾವಾಣಿ ಪದಬಂಧ',
        'medium',
        JSON.stringify(grid),
        JSON.stringify(clues),
        JSON.stringify(grid),
        adminId,
      ]
    );
    console.log('\nPuzzle 6381 inserted (draft).');
  } else {
    console.log('\nPuzzle 6381 updated (draft).');
  }
  await pool.end();
}

seed6381().catch(err => { console.error(err); process.exit(1); });
