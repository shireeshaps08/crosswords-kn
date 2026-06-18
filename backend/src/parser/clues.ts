import * as fs from 'fs';
import * as path from 'path';

const DATA_INTERMEDIATE = path.resolve(__dirname, '../../data/intermediate');

// Baraha (BRH Kannada) encoded fragments for the two column headers.
// These are the first few characters of each label; matching by prefix is
// sufficient and more robust than exact-matching the full encoded string.
//
// ಎಡದಿಂದ ಬಲಕ್ಕೆ (Across) — Baraha starts with "JqÀ"
// ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ (Down)   — Baraha starts with "ªÉÄÃ°" or "ªÉÄÃ"
const ACROSS_FRAGMENTS = ['JqÀ', 'ಎಡ'];
const DOWN_FRAGMENTS   = ['ªÉÄÃ', 'ಮೇ'];

export interface ParsedClue {
  number: number;
  direction: 'across' | 'down';
  clueRaw: string;  // Baraha-encoded, not yet converted to Unicode
  length: number;
}

export interface ParseWarning {
  direction: 'across' | 'down';
  row: number;
  rawText: string;
  reason: string;
}

export interface ClueResult {
  puzzleId: number;
  tableIndex: number;
  across: ParsedClue[];
  down: ParsedClue[];
  warnings: ParseWarning[];
}

// Concatenate all text runs from a single w:tc into one string.
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

// Determine whether a cell header text identifies the ACROSS or DOWN column.
// Returns 'across', 'down', or null if neither.
function matchHeader(text: string): 'across' | 'down' | null {
  for (const frag of ACROSS_FRAGMENTS) {
    if (text.includes(frag)) return 'across';
  }
  for (const frag of DOWN_FRAGMENTS) {
    if (text.includes(frag)) return 'down';
  }
  return null;
}

// Parse "N.<clue text>(L)" into its components.
// Returns null if the cell is empty or whitespace-only (normal for ragged tables).
// Returns a warning object if text is present but doesn't parse.
const CLUE_RE = /^\s*(\d+)\.\s*(.*?)\(\s*(\d+)\s*\)\s*$/s;

function parseClueCell(
  text: string,
  direction: 'across' | 'down',
  rowIndex: number,
): { clue: ParsedClue } | { warn: ParseWarning } | null {
  if (text === '') return null;

  const m = text.match(CLUE_RE);
  if (!m) {
    // Try recovering a partial match: maybe the closing paren is missing/garbled.
    // Accept "N.<text>" with no length if we can at least get number+text.
    const partial = text.match(/^\s*(\d+)\.\s*(.+)$/s);
    if (partial) {
      return {
        warn: {
          direction,
          row: rowIndex,
          rawText: text,
          reason: 'missing or garbled closing (L) — clue number and text recovered but length unknown',
        },
      };
    }
    return {
      warn: {
        direction,
        row: rowIndex,
        rawText: text,
        reason: 'does not match N.<text>(L) shape',
      },
    };
  }

  return {
    clue: {
      number: parseInt(m[1], 10),
      direction,
      clueRaw: m[2].trim(),
      length: parseInt(m[3], 10),
    },
  };
}

export function extractClues(
  parsed: Record<string, unknown>,
  puzzleId: number,
  tableIndex: number,
): ClueResult {
  const body = (
    (parsed['w:document'] as Record<string, unknown>)['w:body'] as Record<string, unknown>
  );
  const tables = (body['w:tbl'] as unknown[]) ?? [];

  if (tableIndex >= tables.length) {
    throw new Error(
      `[clues ${puzzleId}] tableIndex ${tableIndex} out of range (document has ${tables.length} tables)`,
    );
  }

  const tbl = tables[tableIndex] as Record<string, unknown>;
  const rows = (tbl['w:tr'] as unknown[]) ?? [];

  if (rows.length === 0) {
    throw new Error(`[clues ${puzzleId}] table ${tableIndex} has no rows`);
  }

  // ── Step 1: Find across and down column indices from the header row ──
  const headerRow = rows[0] as Record<string, unknown>;
  const headerCells = (headerRow['w:tc'] as unknown[]) ?? [];

  let acrossCol = -1;
  let downCol = -1;

  for (let ci = 0; ci < headerCells.length; ci++) {
    const text = cellText(headerCells[ci] as Record<string, unknown>);
    const match = matchHeader(text);
    if (match === 'across') acrossCol = ci;
    if (match === 'down') downCol = ci;
  }

  if (acrossCol === -1) {
    throw new Error(
      `[clues ${puzzleId}] could not find ACROSS column header ("ಎಡದಿಂದ ಬಲಕ್ಕೆ") in table ${tableIndex}. ` +
      `Header cells: ${headerCells.map((c) => JSON.stringify(cellText(c as Record<string, unknown>))).join(', ')}`,
    );
  }
  if (downCol === -1) {
    throw new Error(
      `[clues ${puzzleId}] could not find DOWN column header ("ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ") in table ${tableIndex}. ` +
      `Header cells: ${headerCells.map((c) => JSON.stringify(cellText(c as Record<string, unknown>))).join(', ')}`,
    );
  }

  // ── Step 2: Walk clue rows (skip row 0 = header) ──
  const across: ParsedClue[] = [];
  const down: ParsedClue[] = [];
  const warnings: ParseWarning[] = [];

  for (let ri = 1; ri < rows.length; ri++) {
    const tr = rows[ri] as Record<string, unknown>;
    const cells = (tr['w:tc'] as unknown[]) ?? [];

    for (const [colIdx, direction] of [[acrossCol, 'across'], [downCol, 'down']] as [number, 'across' | 'down'][]) {
      if (colIdx >= cells.length) continue;

      const text = cellText(cells[colIdx] as Record<string, unknown>);
      const result = parseClueCell(text, direction, ri);

      if (result === null) continue;
      if ('warn' in result) {
        warnings.push(result.warn);
      } else {
        if (direction === 'across') across.push(result.clue);
        else down.push(result.clue);
      }
    }
  }

  return { puzzleId, tableIndex, across, down, warnings };
}

export async function processClues(
  puzzleTableMap: Record<number, number>,
): Promise<void> {
  const jsonPath = path.join(DATA_INTERMEDIATE, 'document.parsed.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`document.parsed.json not found at ${jsonPath} — run ingest first`);
  }

  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as Record<string, unknown>;
  const outDir = path.join(DATA_INTERMEDIATE, 'clues');
  fs.mkdirSync(outDir, { recursive: true });

  for (const [puzzleIdStr, tableIndex] of Object.entries(puzzleTableMap)) {
    const puzzleId = Number(puzzleIdStr);
    console.log(`\n[clues] extracting puzzle ${puzzleId} from table index ${tableIndex}…`);

    const result = extractClues(parsed, puzzleId, tableIndex);

    const outPath = path.join(outDir, `${puzzleId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`[clues] wrote → ${outPath}`);

    // ── Acceptance report ──
    console.log(`[clues] across: ${result.across.length} clues`);
    console.log(`[clues] down:   ${result.down.length} clues`);

    if (result.warnings.length === 0) {
      console.log(`[clues] no parse warnings`);
    } else {
      console.log(`[clues] WARNINGS (${result.warnings.length}):`);
      for (const w of result.warnings) {
        console.log(`  row ${w.row} [${w.direction}]: ${w.reason}`);
        console.log(`    raw: ${JSON.stringify(w.rawText)}`);
      }
    }
  }
}
