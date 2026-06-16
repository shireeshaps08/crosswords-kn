import { pool } from './pool';

/*
  5×5 grid — three intersecting Kannada words:

       0    1    2    3    4
  0  [ ■ ][ ■ ][ ■ ][ ■ ][ ■ ]
  1  [ ■ ][ ನ ][ ಗ ][ ರ ][ ■ ]   #1A: ನಗರ (city)
  2  [ ■ ][ ■ ][ ಮ ][ ■ ][ ■ ]   #1D: ಗಮನ (attention), runs c2 r1→r3
  3  [ ■ ][ ಕ ][ ನ ][ ಕ ][ ■ ]   #2A: ಕನಕ (gold)
  4  [ ■ ][ ■ ][ ■ ][ ■ ][ ■ ]

  Intersections:
    r1c2 = ಗ  →  #1A col-1  and  #1D row-0
    r3c2 = ನ  →  #2A col-1  and  #1D row-2
*/

type Cell = { row: number; col: number; letter: string; blocked: boolean; number?: number };

function blocked(row: number, col: number): Cell {
  return { row, col, letter: '', blocked: true };
}
function open(row: number, col: number, letter: string, number?: number): Cell {
  return { row, col, letter, blocked: false, ...(number !== undefined ? { number } : {}) };
}

const grid: Cell[][] = [
  [blocked(0,0), blocked(0,1), blocked(0,2), blocked(0,3), blocked(0,4)],
  [blocked(1,0), open(1,1,'ನ',1), open(1,2,'ಗ',2), open(1,3,'ರ'), blocked(1,4)],
  [blocked(2,0), blocked(2,1), open(2,2,'ಮ'), blocked(2,3), blocked(2,4)],
  [blocked(3,0), open(3,1,'ಕ',3), open(3,2,'ನ'), open(3,3,'ಕ'), blocked(3,4)],
  [blocked(4,0), blocked(4,1), blocked(4,2), blocked(4,3), blocked(4,4)],
];

const clues = {
  across: [
    {
      number: 1, direction: 'across',
      clue: 'ಜನರು ವಾಸಿಸುವ ದೊಡ್ಡ ಸ್ಥಳ',
      clue_en: 'A large place where people live (city)',
      answer: 'ನಗರ',
      row: 1, col: 1, length: 3,
    },
    {
      number: 3, direction: 'across',
      clue: 'ಬೆಳ್ಳಿಗಿಂತ ಅಮೂಲ್ಯವಾದ ಲೋಹ',
      clue_en: 'A precious metal more valuable than silver (gold)',
      answer: 'ಕನಕ',
      row: 3, col: 1, length: 3,
    },
  ],
  down: [
    {
      number: 2, direction: 'down',
      clue: 'ಮನಸ್ಸಿನ ಏಕಾಗ್ರತೆ ಅಥವಾ ಗಮನ',
      clue_en: 'Focus or attention of the mind',
      answer: 'ಗಮನ',
      row: 1, col: 2, length: 3,
    },
  ],
};

async function seed() {
  await pool.query(`DELETE FROM leaderboard`);
  await pool.query(`DELETE FROM game_sessions`);
  await pool.query(`DELETE FROM puzzles`);

  const { rows: adminRows } = await pool.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
  const adminId = adminRows[0]?.id ?? null;

  await pool.query(
    `INSERT INTO puzzles (title, title_kn, difficulty, grid, clues, solution, created_by, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
    [
      'Kannada Words - Level 1',
      'ಕನ್ನಡ ಪದಗಳು - ಹಂತ ೧',
      'easy',
      JSON.stringify(grid),
      JSON.stringify(clues),
      JSON.stringify(grid),
      adminId,
    ]
  );

  console.log('Seed complete — 1 puzzle inserted.');
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
