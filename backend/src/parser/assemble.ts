import * as fs from 'fs';
import * as path from 'path';
import { GridResult } from './grid';
import { ClueResult } from './clues';
import { AnswersResult } from './answers';
import { ReconcileResult, deriveSlots } from './reconcile';
import { splitAksharas } from './baraha';

const DATA_INTERMEDIATE = path.resolve(__dirname, '../../data/intermediate');
const DATA_OUTPUT        = path.resolve(__dirname, '../../data/output');

// ── iPuz types (minimal subset) ───────────────────────────────────────────────

interface IpuzCell {
  cell?: number;       // clue number if this cell is numbered
  style?: { shapebg?: string };
}

interface IpuzClueEntry {
  number: number;
  clue: string;        // still Baraha for now — Unicode conversion is a later step
  answer: string;      // Unicode answer
  cells: Array<{ row: number; col: number }>;
}

interface IpuzPuzzle {
  version: string;
  kind: string[];
  id: string;
  dimensions: { width: number; height: number };
  grid: Array<Array<IpuzCell | '#'>>;   // '#' = blocked
  clues: {
    Across: IpuzClueEntry[];
    Down: IpuzClueEntry[];
  };
}

// ── Per-puzzle verdict ────────────────────────────────────────────────────────

export interface PuzzleVerdict {
  puzzleId: number;
  acrossCount: number;
  downCount: number;
  flagCount: number;
  missingClues: number;
  missingAnswers: number;
  verdict: 'pass' | 'needs-review';
}

// ── Assembly ──────────────────────────────────────────────────────────────────

function loadJson<T>(p: string): T {
  if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

export function assemblePuzzle(
  grid: GridResult,
  clues: ClueResult,
  answers: AnswersResult,
  reconciled: ReconcileResult,
): IpuzPuzzle {
  const { puzzleId } = grid;

  // ── Grid: build numbered cell map ──
  const ipuzGrid: Array<Array<IpuzCell | '#'>> = [];
  for (let r = 0; r < grid.rows; r++) {
    const row: Array<IpuzCell | '#'> = [];
    for (let c = 0; c < grid.cols; c++) {
      const cell = grid.cells[r][c];
      if (cell.blocked) {
        row.push('#');
      } else if (cell.number !== undefined) {
        row.push({ cell: cell.number });
      } else {
        row.push({});
      }
    }
    ipuzGrid.push(row);
  }

  // ── Clues: use reconciled entries (they carry cells + answer) ──
  const acrossEntries: IpuzClueEntry[] = [];
  const downEntries: IpuzClueEntry[] = [];

  for (const entry of reconciled.entries) {
    const ipuzEntry: IpuzClueEntry = {
      number: entry.number,
      clue: entry.clueRaw,
      answer: entry.answerUnicode,
      cells: entry.cells,
    };
    if (entry.direction === 'across') acrossEntries.push(ipuzEntry);
    else downEntries.push(ipuzEntry);
  }

  // Sort by clue number
  acrossEntries.sort((a, b) => a.number - b.number);
  downEntries.sort((a, b) => a.number - b.number);

  return {
    version: 'http://ipuz.org/v2',
    kind: ['http://ipuz.org/crossword#1'],
    id: `prajavani-${puzzleId}`,
    dimensions: { width: grid.cols, height: grid.rows },
    grid: ipuzGrid,
    clues: {
      Across: acrossEntries,
      Down: downEntries,
    },
  };
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export async function processAssemble(puzzleIds: number[]): Promise<void> {
  fs.mkdirSync(DATA_OUTPUT, { recursive: true });

  const verdicts: PuzzleVerdict[] = [];

  for (const id of puzzleIds) {
    console.log(`\n[assemble] puzzle ${id}…`);

    const grid       = loadJson<GridResult>    (path.join(DATA_INTERMEDIATE, 'grid',       `${id}.json`));
    const clues      = loadJson<ClueResult>    (path.join(DATA_INTERMEDIATE, 'clues',      `${id}.json`));
    const answers    = loadJson<AnswersResult> (path.join(DATA_INTERMEDIATE, 'answers',    `${id}.json`));
    const reconciled = loadJson<ReconcileResult>(path.join(DATA_INTERMEDIATE, 'reconciled', `${id}.json`));

    const puzzle = assemblePuzzle(grid, clues, answers, reconciled);

    const outPath = path.join(DATA_OUTPUT, `${id}.ipuz.json`);
    fs.writeFileSync(outPath, JSON.stringify(puzzle, null, 2), 'utf8');
    console.log(`[assemble] wrote → ${outPath}`);

    const verdict: PuzzleVerdict = {
      puzzleId: id,
      acrossCount: puzzle.clues.Across.length,
      downCount: puzzle.clues.Down.length,
      flagCount: reconciled.flags.length,
      missingClues: reconciled.missingClues.length,
      missingAnswers: reconciled.missingAnswers.length,
      verdict:
        reconciled.flags.length === 0 &&
        reconciled.missingClues.length === 0 &&
        reconciled.missingAnswers.length === 0
          ? 'pass'
          : 'needs-review',
    };
    verdicts.push(verdict);
  }

  // ── Pilot summary ──
  const summaryPath = path.join(DATA_OUTPUT, 'pilot-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(verdicts, null, 2), 'utf8');
  console.log(`\n[assemble] pilot summary → ${summaryPath}`);

  console.log('\n══════════════════════════════════════════');
  console.log('PILOT SUMMARY');
  console.log('══════════════════════════════════════════');
  console.log(`${'Puzzle'.padEnd(8)} ${'Across'.padEnd(8)} ${'Down'.padEnd(6)} ${'Flags'.padEnd(7)} ${'Verdict'}`);
  console.log('─'.repeat(46));
  for (const v of verdicts) {
    const flag = v.flagCount > 0 ? `${v.flagCount}` : '0';
    const miss = v.missingClues + v.missingAnswers > 0
      ? ` (+${v.missingClues}mc/${v.missingAnswers}ma)`
      : '';
    console.log(
      `${String(v.puzzleId).padEnd(8)} ${String(v.acrossCount).padEnd(8)} ${String(v.downCount).padEnd(6)} ${(flag+miss).padEnd(7)} ${v.verdict}`,
    );
  }
  console.log('══════════════════════════════════════════');
  const allPass = verdicts.every((v) => v.verdict === 'pass');
  console.log(allPass ? '\n✓ All puzzles pass — ready to backfill.' : '\n⚠ Some puzzles need manual review before backfill.');
}
