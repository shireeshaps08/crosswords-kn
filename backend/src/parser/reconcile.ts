import * as fs from 'fs';
import * as path from 'path';
import { splitAksharas } from './baraha';
import { GridResult, GridCell } from './grid';
import { ClueResult, ParsedClue } from './clues';
import { AnswersResult, AnswerEntry } from './answers';

const DATA_INTERMEDIATE = path.resolve(__dirname, '../../data/intermediate');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Slot {
  number: number;
  direction: 'across' | 'down';
  cells: Array<{ row: number; col: number }>;
  cellCount: number;
}

export interface ReconciledEntry {
  number: number;
  direction: 'across' | 'down';
  clueRaw: string;
  answerUnicode: string;
  aksharas: string[];
  aksharaCount: number;
  clueLength: number;    // from the N.<text>(L) clue field
  slotCellCount: number; // from the grid slot
  cells: Array<{ row: number; col: number }>;
  ok: boolean;           // aksharaCount === clueLength === slotCellCount
}

export interface ReconcileFlag {
  puzzleId: number;
  number: number;
  direction: 'across' | 'down';
  aksharaCount: number;
  clueLength: number;
  slotCellCount: number;
  detail: string;
}

export interface ReconcileResult {
  puzzleId: number;
  entries: ReconciledEntry[];
  flags: ReconcileFlag[];
  missingClues: string[];    // slots that have no matching clue
  missingAnswers: string[];  // slots that have no matching answer
}

// ── Slot derivation ───────────────────────────────────────────────────────────

function isOpen(cells: GridCell[][], r: number, c: number): boolean {
  return r >= 0 && r < cells.length &&
         c >= 0 && c < cells[0].length &&
         !cells[r][c].blocked;
}

/**
 * Derive all ACROSS and DOWN slots from the grid.
 * A slot starts at a numbered cell.  Minimum word length = 3 (per CLAUDE.md).
 */
export function deriveSlots(grid: GridResult): Slot[] {
  const { cells } = grid;
  const slots: Slot[] = [];

  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const cell = cells[r][c];
      if (cell.blocked || cell.number === undefined) continue;

      // ACROSS: starts here if left is blocked/edge AND right is open
      const acrossStart =
        !isOpen(cells, r, c - 1) && isOpen(cells, r, c + 1);

      if (acrossStart) {
        const slotCells: Array<{ row: number; col: number }> = [];
        let cc = c;
        while (isOpen(cells, r, cc)) {
          slotCells.push({ row: r, col: cc });
          cc++;
        }
        if (slotCells.length >= 3) {
          slots.push({
            number: cell.number,
            direction: 'across',
            cells: slotCells,
            cellCount: slotCells.length,
          });
        }
      }

      // DOWN: starts here if top is blocked/edge AND bottom is open
      const downStart =
        !isOpen(cells, r - 1, c) && isOpen(cells, r + 1, c);

      if (downStart) {
        const slotCells: Array<{ row: number; col: number }> = [];
        let rr = r;
        while (isOpen(cells, rr, c)) {
          slotCells.push({ row: rr, col: c });
          rr++;
        }
        if (slotCells.length >= 3) {
          slots.push({
            number: cell.number,
            direction: 'down',
            cells: slotCells,
            cellCount: slotCells.length,
          });
        }
      }
    }
  }

  return slots;
}

// ── Reconciliation ────────────────────────────────────────────────────────────

function slotKey(number: number, direction: 'across' | 'down'): string {
  return `${number}-${direction}`;
}

export function reconcile(
  puzzleId: number,
  grid: GridResult,
  clues: ClueResult,
  answers: AnswersResult,
): ReconcileResult {
  const slots = deriveSlots(grid);

  // Index everything by number+direction
  const slotMap = new Map<string, Slot>();
  for (const s of slots) slotMap.set(slotKey(s.number, s.direction), s);

  const clueMap = new Map<string, ParsedClue>();
  for (const c of [...clues.across, ...clues.down])
    clueMap.set(slotKey(c.number, c.direction), c);

  const answerMap = new Map<string, AnswerEntry>();
  for (const a of [...answers.across, ...answers.down])
    answerMap.set(slotKey(a.number, a.direction), a);

  const entries: ReconciledEntry[] = [];
  const flags: ReconcileFlag[] = [];
  const missingClues: string[] = [];
  const missingAnswers: string[] = [];

  // Walk slots as the source of truth for which entries should exist
  for (const slot of slots) {
    const key = slotKey(slot.number, slot.direction);
    const clue = clueMap.get(key);
    const answer = answerMap.get(key);

    if (!clue) {
      missingClues.push(key);
      continue;  // can't do triple-check without clue length
    }
    if (!answer) {
      missingAnswers.push(key);
      continue;  // can't do triple-check without answer
    }

    const aksharas = splitAksharas(answer.answerUnicode);
    const aksharaCount = aksharas.length;
    const clueLength = clue.length;
    const slotCellCount = slot.cellCount;
    const ok = aksharaCount === clueLength && clueLength === slotCellCount;

    const entry: ReconciledEntry = {
      number: slot.number,
      direction: slot.direction,
      clueRaw: clue.clueRaw,
      answerUnicode: answer.answerUnicode,
      aksharas,
      aksharaCount,
      clueLength,
      slotCellCount,
      cells: slot.cells,
      ok,
    };

    entries.push(entry);

    if (!ok) {
      flags.push({
        puzzleId,
        number: slot.number,
        direction: slot.direction,
        aksharaCount,
        clueLength,
        slotCellCount,
        detail: `aksharas(${aksharaCount}) clue(${clueLength}) slot(${slotCellCount})`,
      });
    }
  }

  return { puzzleId, entries, flags, missingClues, missingAnswers };
}

// ── File-based pipeline ───────────────────────────────────────────────────────

function loadJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export async function processReconcile(puzzleIds: number[]): Promise<void> {
  const outDir = path.join(DATA_INTERMEDIATE, 'reconciled');
  fs.mkdirSync(outDir, { recursive: true });

  const allFlags: ReconcileFlag[] = [];

  for (const id of puzzleIds) {
    console.log(`\n[reconcile] puzzle ${id}…`);

    const grid    = loadJson<GridResult>  (path.join(DATA_INTERMEDIATE, 'grid',    `${id}.json`));
    const clues   = loadJson<ClueResult>  (path.join(DATA_INTERMEDIATE, 'clues',   `${id}.json`));
    const answers = loadJson<AnswersResult>(path.join(DATA_INTERMEDIATE, 'answers', `${id}.json`));

    const result = reconcile(id, grid, clues, answers);

    const outPath = path.join(outDir, `${id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`[reconcile] wrote → ${outPath}`);
    console.log(`[reconcile] entries: ${result.entries.length}  flags: ${result.flags.length}`);

    if (result.missingClues.length > 0)
      console.log(`[reconcile] missing clues: ${result.missingClues.join(', ')}`);
    if (result.missingAnswers.length > 0)
      console.log(`[reconcile] missing answers: ${result.missingAnswers.join(', ')}`);

    allFlags.push(...result.flags);
  }

  // ── Flag report ──────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log('FLAG REPORT');
  console.log('══════════════════════════════════════════');

  if (allFlags.length === 0) {
    console.log('✓ Zero flags — all triple-equality checks passed.');
  } else {
    console.log(`${allFlags.length} flag(s):\n`);
    for (const f of allFlags) {
      console.log(
        `  puzzle ${f.puzzleId}  ${f.direction} #${f.number}` +
        `  aksharas=${f.aksharaCount}  clue_len=${f.clueLength}  slot_cells=${f.slotCellCount}` +
        `  — ${f.detail}`,
      );
    }
  }
  console.log('══════════════════════════════════════════');
}
