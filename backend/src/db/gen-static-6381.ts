// Generates static JSON for puzzle 6381 (gh-pages static hosting)
import * as fs from 'fs';
import * as path from 'path';

function splitGraphemes(str: string): string[] {
  const re = /[ಅ-ಹೞೠೡ]((್[ಅ-ಹೞ])*[಼-ೌೕೖ್]?)/gu;
  return str.match(re) ?? [];
}

function splitCrossword(str: string): string[] {
  if (str === 'ವಾಲ್ಮೀಕಿ') return ['ವಾ', 'ಲ್', 'ಮೀ', 'ಕಿ'];
  return splitGraphemes(str);
}

type Cell = { row: number; col: number; letter: string; blocked: boolean; number?: number };

const blocked: [number, number][] = [
  [0,4],
  [1,1],[1,3],[1,4],[1,5],[1,7],
  [2,4],
  [3,1],[3,2],[3,4],[3,7],
  [4,0],[4,1],[4,7],[4,8],
  [5,1],[5,3],[5,4],[5,6],[5,7],
  [6,3],[6,4],
  [7,1],[7,3],[7,4],[7,6],
  [8,4],
];
const blockedSet = new Set(blocked.map(([r, c]) => `${r},${c}`));

const grid: Cell[][] = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => ({
    row: r, col: c, letter: '', blocked: blockedSet.has(`${r},${c}`),
  }))
);

const numbers: [number, number, number][] = [
  [0,0,1],[0,2,2],[0,5,3],[0,8,4],
  [2,0,5],[2,3,6],[2,5,7],
  [4,2,8],[4,5,9],
  [5,0,10],[5,8,11],
  [6,0,12],[6,5,13],[6,6,14],
  [8,0,15],[8,5,16],
];
for (const [r, c, n] of numbers) grid[r][c].number = n;

const clues = {
  across: [
    { number:1,  clue:'ಮನದೊಳಗಿರುವ ವಂಶ!',                   answer:'ಮನೆತನ',    direction:'across', row:0, col:0, length:4 },
    { number:3,  clue:'ಒಪ್ಪವಾಗಿ ಬಂದಿರುವ ಸೌಕರ್ಯ',           answer:'ಸೌಲಭ್ಯ',   direction:'across', row:0, col:5, length:3 },
    { number:5,  clue:'ಮಧುರವಾದ ಧ್ವನಿ',                      answer:'ಕಲರವ',     direction:'across', row:2, col:0, length:4 },
    { number:7,  clue:'ಸ್ವಾಭಾವಿಕ ವಾದುದು ಸಜದಲ್ಲಿದೆ!',        answer:'ಸಹಜ',      direction:'across', row:2, col:5, length:3 },
    { number:8,  clue:'ಯಾವುದೇ ಅಪರಾಧವನ್ನು ಮಾಡದಿರುವವನು',      answer:'ನಿರಪರಾಧಿ', direction:'across', row:4, col:2, length:5 },
    { number:12, clue:'ಸೂಕ್ಷ್ಮವಾದ ಪರಿಶೀಲನೆ',                answer:'ಸಮೀಕ್ಷೆ',  direction:'across', row:6, col:0, length:3 },
    { number:13, clue:'ಪರಸ್ಪರ ಸಹಾಯ',                        answer:'ಸಹಕಾರ',    direction:'across', row:6, col:5, length:4 },
    { number:15, clue:'ಅದೇ ತಾನೇ ಕಡೆದ ಹೊಸಬೆಣ್ಣೆ',            answer:'ನವನೀತ',    direction:'across', row:8, col:0, length:4 },
    { number:16, clue:'ವರ ಪಡೆದಿರುವ ಬೇಡ',                    answer:'ವಾಲ್ಮೀಕಿ', direction:'across', row:8, col:5, length:4 },
  ],
  down: [
    { number:1,  clue:'ಇನ್ನೂ ಮರಿ! ಈ ಹೆಣ್ಣುದುಂಬಿ!',          answer:'ಮಧುಕರ',    direction:'down', row:0, col:0, length:4 },
    { number:2,  clue:'ತವರಿನವರು ನೀಡಿರುವ ಲೋಹ',              answer:'ತವರ',       direction:'down', row:0, col:2, length:3 },
    { number:4,  clue:'ಅವಶ್ಯಕ ವಸ್ತು',                       answer:'ಆವಶ್ಯಕ',   direction:'down', row:0, col:8, length:4 },
    { number:6,  clue:'ವರನಲ್ಲಿ ಪ್ರತಿನಿಧಿ ಕಾಣಿಸಿದನೇ?',        answer:'ವಕ್ತಾರ',   direction:'down', row:2, col:3, length:3 },
    { number:7,  clue:'ಸತ್ತವರನ್ನು ಹೂಳುವ ಸ್ಥಳ',              answer:'ಸಮಾಧಿ',    direction:'down', row:2, col:5, length:3 },
    { number:8,  clue:'ಪರೀಕ್ಷೆಯನ್ನು ಎದುರು ನೋಡುವುದು!',        answer:'ನಿರೀಕ್ಷೆ', direction:'down', row:4, col:2, length:3 },
    { number:9,  clue:'ರಾಯರಿಂದ ಬಂದಿರುವ ನಿರೂಪ',              answer:'ರಾಯಸ',      direction:'down', row:4, col:5, length:3 },
    { number:10, clue:'ಮನೆಯನ್ನು ಹೀಗೂ ಹೇಳುತ್ತಾರೆ',           answer:'ವಾಸಸ್ಥಾನ', direction:'down', row:5, col:0, length:4 },
    { number:11, clue:'ಪುರದಲ್ಲಿ ದೊರೆತ ಸನ್ಮಾನ',              answer:'ಪುರಸ್ಕಾರ', direction:'down', row:5, col:8, length:4 },
    { number:14, clue:'ವನದ ಕೊನೆಗೆ ಮಾಡಿದ ಯಜ್ಞ',              answer:'ಹವನ',       direction:'down', row:6, col:6, length:3 },
  ],
};

// Build solution grid (for local checking in static mode)
const solution: Cell[][] = grid.map(row => row.map(cell => ({ ...cell })));
for (const c of clues.across) {
  const letters = splitCrossword(c.answer);
  for (let i = 0; i < Math.min(letters.length, c.length); i++) {
    const cell = solution[c.row]?.[c.col + i];
    if (cell && !cell.blocked) cell.letter = letters[i];
  }
}
for (const c of clues.down) {
  const letters = splitGraphemes(c.answer);
  for (let i = 0; i < Math.min(letters.length, c.length); i++) {
    const cell = solution[c.row + i]?.[c.col];
    if (cell && !cell.blocked) cell.letter = letters[i];
  }
}

const openCells = solution.flat().filter(c => !c.blocked);
const totalCells = openCells.length;

const puzzle = {
  id: '6381',
  title: 'Puzzle 6381',
  title_kn: 'ಪದಬಂಧ 6381',
  difficulty: 'medium',
  grid,
  clues,
  solution: solution.map(row => row.map(c => ({ row: c.row, col: c.col, letter: c.letter, blocked: c.blocked }))),
  created_at: '2024-01-01T00:00:00.000Z',
  total_cells: totalCells,
};

const puzzleList = {
  puzzles: [
    {
      id: '6381',
      title: 'Puzzle 6381',
      title_kn: 'ಪದಬಂಧ 6381',
      difficulty: 'medium',
      play_count: 0,
      created_at: '2024-01-01T00:00:00.000Z',
    },
  ],
};

const outDir = path.join(__dirname, '../../../frontend/public/data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'puzzle-6381.json'), JSON.stringify({ puzzle }, null, 2));
fs.writeFileSync(path.join(outDir, 'puzzles.json'), JSON.stringify(puzzleList, null, 2));

console.log(`Written to ${outDir}`);
console.log(`Total open cells: ${totalCells}`);
console.log('Sample solution row 0:', solution[0].map(c => c.blocked ? '■' : c.letter || '_').join('|'));
