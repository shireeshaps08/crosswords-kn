import { pool } from './pool';

// Puzzle 6381 — 9×9 grid
// Black cells — closest match to image that satisfies most PDF slot constraints:
//   (0,4)
//   (1,1)(1,3)(1,4)(1,5)(1,7)     ← (1,5) enables 7-down start at (2,5)
//   (2,4)
//   (3,1)(3,2)(3,4)(3,7)          ← (3,5) OPEN for 7-down
//   (4,0)(4,1)(4,7)(4,8)
//   (5,1)(5,3)(5,5)(5,6)          ← (5,5) stops 7-down at 3; (5,1) blocks spurious 10-across
//   (6,3)(6,4)
//   (7,1)(7,2)(7,3)(7,4)(7,5)     ← (7,2) stops 8-down at 3; (7,5) stops spurious 13-down
//   (8,4)
// Known limitation: 9-down has no grid slot (9@(4,5) top=(3,5) is open → not a down-start).
//
// Answers confirmed from PDF footer of puzzle 6382 (N-1 offset rule).

const ROWS = 9;
const COLS = 9;

const BLACK = new Set([
  '0,4',
  '1,1','1,3','1,4','1,5','1,7',
  '2,4',
  '3,1','3,2','3,4','3,7',
  '4,0','4,1','4,7','4,8',
  '5,1','5,3','5,5','5,6',
  '6,3','6,4',
  '7,1','7,2','7,3','7,4','7,5',
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

// Real answers from PDF — puzzle 6382 footer (N-1 offset)
const ANSWERS: Record<string, string> = {
  '1-across':  'ಮನೆತನ',
  '3-across':  'ಅನುಕೂಲ',
  '5-across':  'ಕಲರವ',
  '7-across':  'ಸಹಜ',
  '8-across':  'ನಿರಪರಾಧಿ',
  '12-across': 'ಸಮೀಕ್ಷೆ',
  '13-across': 'ಸಹಕಾರ',
  '15-across': 'ನವನೀತ',
  '16-across': 'ವನಚರ',
  '1-down':    'ಮಧುಕರಿ',
  '2-down':    'ತವರ',
  '4-down':    'ಲವಾಜಮೆ',
  '6-down':    'ವಕ್ತಾರ',
  '7-down':    'ಸಮಾಧಿ',
  '8-down':    'ನಿರೀಕ್ಷೆ',
  '9-down':    'ರಾಯಸ',
  '10-down':   'ವಾಸಸ್ಥಾನ',
  '11-down':   'ಪುರಸ್ಕಾರ',
  '14-down':   'ಹವನ',
};

// Derive slots (maximal runs from numbered cells, min length 3)
function isOpen(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS && !BLACK.has(`${r},${c}`);
}

interface Slot { number: number; direction: 'across'|'down'; cells: {row:number;col:number}[] }

function deriveSlots(): Slot[] {
  const slots: Slot[] = [];
  for (const [key, num] of Object.entries(NUMBERS)) {
    const [r, c] = key.split(',').map(Number);
    if (!isOpen(r, c - 1) && isOpen(r, c + 1)) {
      const cells: {row:number;col:number}[] = [];
      let cc = c;
      while (isOpen(r, cc)) { cells.push({ row: r, col: cc }); cc++; }
      if (cells.length >= 3) slots.push({ number: num, direction: 'across', cells });
    }
    if (!isOpen(r - 1, c) && isOpen(r + 1, c)) {
      const cells: {row:number;col:number}[] = [];
      let rr = r;
      while (isOpen(rr, c)) { cells.push({ row: rr, col: c }); rr++; }
      if (cells.length >= 3) slots.push({ number: num, direction: 'down', cells });
    }
  }
  return slots;
}

// Real clue text from PDF page 2 (puzzle 6381)
const CLUES: Record<string, string> = {
  '1-across':  'ಮನದೊಳಗಿರುವ ವಂಶ!',
  '3-across':  'ಒಪ್ಪವಾಗಿ ಬಂದಿರುವ ಸೌಕರ್ಯ',
  '5-across':  'ಮಧುರವಾದ ಧ್ವನಿ',
  '7-across':  'ಸ್ವಾಭಾವಿಕ ವಾದುದು ಸಜದಲ್ಲಿದೆ!',
  '8-across':  'ಯಾವುದೇ ಅಪರಾಧವನ್ನು ಮಾಡದಿರುವವನು',
  '12-across': 'ಸೂಕ್ಷ್ಮವಾದ ಪರಿಶೀಲನೆ',
  '13-across': 'ಪರಸ್ಪರ ಸಹಾಯ',
  '15-across': 'ಅದೇ ತಾನೇ ಕಡೆದ ಹೊಸಬೆಣ್ಣೆ',
  '16-across': 'ವರ ಪಡೆದಿರುವ ಬೇಡ',
  '1-down':    'ಇನ್ನೂ ಮರಿ! ಈ ಹೆಣ್ಣುದುಂಬಿ!',
  '2-down':    'ತವರಿನವರು ನೀಡಿರುವ ಲೋಹ',
  '4-down':    'ಅವಶ್ಯಕ ವಸ್ತು',
  '6-down':    'ವರನಲ್ಲಿ ಪ್ರತಿನಿಧಿ ಕಾಣಿಸಿದನೇ?',
  '7-down':    'ಸತ್ತವರನ್ನು ಹೂಳುವ ಸ್ಥಳ',
  '8-down':    'ಪರೀಕ್ಷೆಯನ್ನು ಎದುರು ನೋಡುವುದು!',
  '9-down':    'ರಾಯರಿಂದ ಬಂದಿರುವ ನಿರೂಪ',
  '10-down':   'ಮನೆಯನ್ನು ಹೀಗೂ ಹೇಳುತ್ತಾರೆ',
  '11-down':   'ಪುರದಲ್ಲಿ ದೊರೆತ ಸನ್ಮಾನ',
  '14-down':   'ವನದ ಕೊನೆಗೆ ಮಾಡಿದ ಯಜ್ಞ',
};

// Build grid: letter comes from the answer of whichever slot passes through the cell.
// When two slots intersect, across takes priority for the letter assignment.
function buildGridAndClues() {
  const slots = deriveSlots();
  const letterMap = new Map<string, string>();

  // Assign letters from answers into cells
  for (const slot of slots) {
    const key = `${slot.number}-${slot.direction}`;
    const answer = ANSWERS[key] ?? '';
    // Split answer into grapheme clusters
    const seg = new Intl.Segmenter('kn', { granularity: 'grapheme' });
    const aksharas = [...seg.segment(answer)].map(s => s.segment);
    for (let i = 0; i < slot.cells.length && i < aksharas.length; i++) {
      const ck = `${slot.cells[i].row},${slot.cells[i].col}`;
      if (!letterMap.has(ck)) letterMap.set(ck, aksharas[i]);  // across wins
    }
  }

  // Build grid[][]: {row,col,letter,blocked,number?}
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

  // Build clues structure
  const acrossClues = [];
  const downClues = [];
  for (const slot of slots.sort((a,b) => a.number - b.number || (a.direction === 'across' ? -1 : 1))) {
    const clueKey = `${slot.number}-${slot.direction}`;
    const entry = {
      number: slot.number,
      direction: slot.direction,
      clue: CLUES[clueKey] ?? `${slot.number} ${slot.direction === 'across' ? 'ಎಡದಿಂದ ಬಲಕ್ಕೆ' : 'ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ'}`,
      answer: ANSWERS[clueKey] ?? '',
      row: slot.cells[0].row,
      col: slot.cells[0].col,
      length: slot.cells.length,
    };
    if (slot.direction === 'across') acrossClues.push(entry);
    else downClues.push(entry);
  }

  // 9-down has no auto-derived slot (top neighbour of (4,5) is open).
  // Inject it manually so it appears in the clue panel.
  if (!downClues.find(c => c.number === 9)) {
    downClues.push({
      number: 9,
      direction: 'down',
      clue: CLUES['9-down'] ?? '9 ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ',
      answer: ANSWERS['9-down'] ?? '',
      row: 4, col: 5,
      length: 3,
    });
    downClues.sort((a, b) => a.number - b.number);
  }

  return { grid, clues: { across: acrossClues, down: downClues } };
}

async function seed6381() {
  const { grid, clues } = buildGridAndClues();

  const { rows: adminRows } = await pool.query(
    `SELECT id FROM users WHERE role='admin' LIMIT 1`
  );
  const adminId = adminRows[0]?.id ?? null;

  const { rowCount } = await pool.query(
    `UPDATE puzzles SET grid=$1, clues=$2, solution=$3, published=false WHERE title='Prajavani Crossword 6381'`,
    [JSON.stringify(grid), JSON.stringify(clues), JSON.stringify(grid)]
  );
  if ((rowCount ?? 0) === 0) {
    await pool.query(
      `INSERT INTO puzzles (title, title_kn, difficulty, grid, clues, solution, created_by, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,false)`,
      [
        'Prajavani Crossword 6381',
        'ಪ್ರಜಾವಾಣಿ ಪದಬಂಧ ೬೩೮೧',
        'medium',
        JSON.stringify(grid),
        JSON.stringify(clues),
        JSON.stringify(grid),
        adminId,
      ]
    );
    console.log('Puzzle 6381 inserted (draft).');
  } else {
    console.log('Puzzle 6381 updated (draft).');
  }
  await pool.end();
}

seed6381().catch(err => { console.error(err); process.exit(1); });
