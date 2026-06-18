import * as fs from 'fs';
import * as path from 'path';
import { brahaToUnicode, validateBarahaTable } from './baraha';

const DATA_INTERMEDIATE = path.resolve(__dirname, '../../data/intermediate');

// Baraha fragments that identify the footer header row.
// "ಹಿಂದಿನ ಪದಬಂಧದ ಉತ್ತರ" in BRH Kannada starts with these fragments.
// ಹ(B9/q?)  — we match both Baraha fragments and the Unicode substring.
const FOOTER_FRAGMENTS = [
  'ºÀ¢AzÀ',  // Baraha fragment likely appearing in "ಹಿಂದಿನ ..."
  'ªÀÄÄAzÀ', // alternate Baraha form
  'ಹಿಂದಿನ',  // Unicode form (if already converted)
  'padabandha', // romanized (unlikely but safe fallback)
];

// N-1 offset: the footer in puzzle P contains answers for puzzle P-1.
// For pilot puzzles 6382–6384 we need their answers, which live in footers of
// puzzles 6383–6385 respectively.  Puzzle 6385 is out of scope as a puzzle but
// its footer must be parsed to get 6384's answers.
// Map: footer-source-puzzle → answers-for-puzzle
export const FOOTER_SOURCE_MAP: Record<number, number> = {
  6383: 6382,
  6384: 6383,
  6385: 6384,
};

export interface AnswerEntry {
  numberRaw: string;    // "1.", "2." etc — raw prefix
  number: number;
  direction: 'across' | 'down';
  answerBaraha: string; // original Baraha-encoded answer text
  answerUnicode: string;
}

export interface AnswersResult {
  sourcePuzzleId: number;   // the puzzle whose footer we read
  answersPuzzleId: number;  // the puzzle these answers belong to
  tableIndex: number;
  across: AnswerEntry[];
  down: AnswerEntry[];
  warnings: string[];
}

// ── Helpers shared with clues.ts ──────────────────────────────────────────────

function cellText(tc: Record<string, unknown>): string {
  const paragraphs = (tc['w:p'] as unknown[] | undefined) ?? [];
  const parts: string[] = [];
  for (const p of paragraphs) {
    const runs = ((p as Record<string, unknown>)['w:r'] as unknown[] | undefined) ?? [];
    for (const r of runs) {
      const texts = ((r as Record<string, unknown>)['w:t'] as unknown[] | undefined) ?? [];
      for (const t of texts) {
        if (typeof t === 'string') parts.push(t);
        else if (typeof t === 'object' && t !== null && '#text' in t)
          parts.push((t as Record<string, unknown>)['#text'] as string);
      }
    }
  }
  return parts.join('').trim();
}

function isFooterHeader(text: string): boolean {
  return FOOTER_FRAGMENTS.some((f) => text.includes(f));
}

// Across/down section headers in the footer block (Baraha + Unicode).
// The footer lists answers grouped by "ಎಡದಿಂದ ಬಲಕ್ಕೆ:" and "ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ:".
const ACROSS_FRAGMENTS = ['JqÀ', 'ಎಡ'];
const DOWN_FRAGMENTS   = ['ªÉÄÃ', 'ಮೇ'];

function matchDirection(text: string): 'across' | 'down' | null {
  for (const f of ACROSS_FRAGMENTS) if (text.includes(f)) return 'across';
  for (const f of DOWN_FRAGMENTS)   if (text.includes(f)) return 'down';
  return null;
}

// Answer entries look like: "1. ಪದ" or "1.word" — number dot then Baraha text.
// The answer may span multiple runs or paragraphs in the same cell, but cellText()
// already concatenates them.
const ANSWER_RE = /^\s*(\d+)\.\s*(.+)$/s;

function parseAnswerCell(
  raw: string,
  direction: 'across' | 'down',
): AnswerEntry | null {
  const m = raw.match(ANSWER_RE);
  if (!m) return null;
  const answerBaraha = m[2].trim();
  const answerUnicode = brahaToUnicode(answerBaraha);
  return {
    numberRaw: `${m[1]}.`,
    number: parseInt(m[1], 10),
    direction,
    answerBaraha,
    answerUnicode,
  };
}

// ── Main extraction ───────────────────────────────────────────────────────────

/**
 * Extract answer entries from the footer table of a given source puzzle.
 *
 * The footer block is a table whose header row contains "ಹಿಂದಿನ ಪದಬಂಧದ ಉತ್ತರ".
 * Answers are listed in two sections: across and down, identified by their
 * section-header text.
 *
 * tableIndex: the index of the footer table in document.parsed.json.
 */
export function extractAnswers(
  parsed: Record<string, unknown>,
  sourcePuzzleId: number,
  tableIndex: number,
  knownBarahaPairs: Array<[string, string, string]> = [],
): AnswersResult {
  // Validate Baraha table against any known pairs before doing real work
  if (knownBarahaPairs.length > 0) {
    validateBarahaTable(knownBarahaPairs);
  }

  const answersPuzzleId = FOOTER_SOURCE_MAP[sourcePuzzleId];
  if (answersPuzzleId === undefined) {
    throw new Error(
      `[answers] sourcePuzzleId ${sourcePuzzleId} is not in FOOTER_SOURCE_MAP`,
    );
  }

  const body = (
    (parsed['w:document'] as Record<string, unknown>)['w:body'] as Record<string, unknown>
  );
  const tables = (body['w:tbl'] as unknown[]) ?? [];

  if (tableIndex >= tables.length) {
    throw new Error(
      `[answers ${sourcePuzzleId}] tableIndex ${tableIndex} out of range (${tables.length} tables)`,
    );
  }

  const tbl = tables[tableIndex] as Record<string, unknown>;
  const rows = (tbl['w:tr'] as unknown[]) ?? [];

  // Verify this is actually a footer table by checking that at least one cell
  // in the first two rows contains the footer header fragment.
  const headerFound = rows.slice(0, 2).some((row) => {
    const tcs = ((row as Record<string, unknown>)['w:tc'] as unknown[]) ?? [];
    return tcs.some((tc) => isFooterHeader(cellText(tc as Record<string, unknown>)));
  });

  if (!headerFound) {
    throw new Error(
      `[answers ${sourcePuzzleId}] table ${tableIndex} does not look like a footer — ` +
      `"ಹಿಂದಿನ ಪದಬಂಧದ ಉತ್ತರ" fragment not found in first two rows`,
    );
  }

  const across: AnswerEntry[] = [];
  const down: AnswerEntry[] = [];
  const warnings: string[] = [];

  // The footer table layout varies:
  //   Option A — two-column table: left=across answers, right=down answers
  //     with section headers as the first content row after the footer title.
  //   Option B — single column with inline "ಎಡದಿಂದ..." / "ಮೇಲಿಂದ..." labels.
  //
  // Strategy: scan every cell of every row.  Track current direction by looking
  // for direction-header cells.  Collect answer cells into the current bucket.

  let currentDirection: 'across' | 'down' | null = null;

  for (const rowRaw of rows) {
    const row = rowRaw as Record<string, unknown>;
    const tcs = (row['w:tc'] as unknown[]) ?? [];

    for (const tcRaw of tcs) {
      const tc = tcRaw as Record<string, unknown>;
      const text = cellText(tc);
      if (text === '') continue;

      // Footer header cell — skip
      if (isFooterHeader(text)) continue;

      // Direction header cell?
      const dir = matchDirection(text);
      if (dir !== null) {
        currentDirection = dir;
        continue;
      }

      // Answer cell
      if (currentDirection === null) {
        warnings.push(`row before direction header: "${text.substring(0, 40)}"`);
        continue;
      }

      const entry = parseAnswerCell(text, currentDirection);
      if (entry === null) {
        warnings.push(`could not parse answer cell [${currentDirection}]: "${text.substring(0, 60)}"`);
        continue;
      }

      if (currentDirection === 'across') across.push(entry);
      else down.push(entry);
    }
  }

  return {
    sourcePuzzleId,
    answersPuzzleId,
    tableIndex,
    across,
    down,
    warnings,
  };
}

export async function processAnswers(
  footerTableMap: Record<number, number>,
  knownBarahaPairs: Array<[string, string, string]> = [],
): Promise<void> {
  const jsonPath = path.join(DATA_INTERMEDIATE, 'document.parsed.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`document.parsed.json not found at ${jsonPath} — run ingest first`);
  }

  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as Record<string, unknown>;
  const outDir = path.join(DATA_INTERMEDIATE, 'answers');
  fs.mkdirSync(outDir, { recursive: true });

  for (const [sourceIdStr, tableIndex] of Object.entries(footerTableMap)) {
    const sourceId = Number(sourceIdStr);
    console.log(
      `\n[answers] reading footer of puzzle ${sourceId} (table ${tableIndex}) → answers for puzzle ${FOOTER_SOURCE_MAP[sourceId]}…`,
    );

    const result = extractAnswers(parsed, sourceId, tableIndex, knownBarahaPairs);

    const outPath = path.join(outDir, `${result.answersPuzzleId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`[answers] wrote → ${outPath}`);
    console.log(`[answers] across: ${result.across.length}  down: ${result.down.length}`);

    if (result.warnings.length > 0) {
      console.log(`[answers] WARNINGS (${result.warnings.length}):`);
      for (const w of result.warnings) console.log(`  ${w}`);
    } else {
      console.log(`[answers] no warnings`);
    }
  }
}
