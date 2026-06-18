import * as fs from 'fs';
import * as path from 'path';

const DATA_INTERMEDIATE = path.resolve(__dirname, '../../data/intermediate');

// Fill values that represent a blocked (black) cell
const BLOCKED_FILLS = new Set(['000000', '404040', '0c0c0c']);

export interface GridCell {
  row: number;
  col: number;
  blocked: boolean;
  number?: number;
}

export interface GridResult {
  puzzleId: number;
  tableIndex: number;
  rows: number;
  cols: number;
  cells: GridCell[][];
}

// Extract all text runs from a w:tc cell as a single concatenated string.
// Cell text in grid tables is ASCII (Baraha-encoded), so digit detection is safe.
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
  return parts.join('');
}

// Extract the leading integer clue number from a cell's text, if any.
// Format is "N." or just "N" at the start. Works in Baraha since digits are ASCII.
function extractNumber(text: string): number | undefined {
  const m = text.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : undefined;
}

// Read the fill attribute from w:tcPr → w:shd
function cellFill(tc: Record<string, unknown>): string | null {
  const tcPrArr = (tc['w:tcPr'] as unknown[] | undefined) ?? [];
  for (const tcPr of tcPrArr) {
    const shdArr = ((tcPr as Record<string, unknown>)['w:shd'] as unknown[] | undefined) ?? [];
    for (const shd of shdArr) {
      const fill = (shd as Record<string, unknown>)['@_w:fill'];
      if (typeof fill === 'string') return fill.toLowerCase();
    }
  }
  return null;
}

export function extractGrid(
  parsed: Record<string, unknown>,
  puzzleId: number,
  tableIndex: number,
): GridResult {
  const body = (
    (parsed['w:document'] as Record<string, unknown>)['w:body'] as Record<string, unknown>
  );
  const tables = (body['w:tbl'] as unknown[]) ?? [];

  if (tableIndex >= tables.length) {
    throw new Error(
      `[grid ${puzzleId}] tableIndex ${tableIndex} out of range (document has ${tables.length} tables)`,
    );
  }

  const tbl = tables[tableIndex] as Record<string, unknown>;
  const rows = (tbl['w:tr'] as unknown[]) ?? [];

  if (rows.length === 0) {
    throw new Error(`[grid ${puzzleId}] table ${tableIndex} has no rows`);
  }

  const cells: GridCell[][] = [];

  for (let ri = 0; ri < rows.length; ri++) {
    const tr = rows[ri] as Record<string, unknown>;
    const tcs = (tr['w:tc'] as unknown[]) ?? [];
    const rowCells: GridCell[] = [];

    for (let ci = 0; ci < tcs.length; ci++) {
      const tc = tcs[ci] as Record<string, unknown>;

      // HARD ASSERT: no horizontal merge
      const tcPrArr = (tc['w:tcPr'] as unknown[] | undefined) ?? [];
      for (const tcPr of tcPrArr) {
        const pr = tcPr as Record<string, unknown>;
        if ('w:gridSpan' in pr) {
          throw new Error(
            `[grid ${puzzleId}] HARD ASSERT FAIL: w:gridSpan found at row=${ri} col=${ci} — this is a layout wrapper table, not a grid table`,
          );
        }
        if ('w:vMerge' in pr) {
          throw new Error(
            `[grid ${puzzleId}] HARD ASSERT FAIL: w:vMerge found at row=${ri} col=${ci} — this is a layout wrapper table, not a grid table`,
          );
        }
      }

      const fill = cellFill(tc);
      const blocked =
        fill !== null
          ? BLOCKED_FILLS.has(fill)
          : false; // absent fill → open

      let number: number | undefined;
      if (!blocked) {
        const text = cellText(tc);
        number = extractNumber(text);
      }

      rowCells.push({ row: ri, col: ci, blocked, ...(number !== undefined ? { number } : {}) });
    }

    cells.push(rowCells);
  }

  // Validate all rows have the same column count
  const colCount = cells[0].length;
  for (let ri = 1; ri < cells.length; ri++) {
    if (cells[ri].length !== colCount) {
      throw new Error(
        `[grid ${puzzleId}] row ${ri} has ${cells[ri].length} cols but row 0 has ${colCount}`,
      );
    }
  }

  return {
    puzzleId,
    tableIndex,
    rows: cells.length,
    cols: colCount,
    cells,
  };
}

export function asciiRender(result: GridResult): string {
  const lines: string[] = [];
  for (const row of result.cells) {
    const parts = row.map((c) => {
      if (c.blocked) return '##';
      if (c.number !== undefined) return String(c.number).padStart(2, ' ');
      return ' .';
    });
    lines.push(parts.join('|'));
  }
  return lines.join('\n');
}

export async function processGrids(
  puzzleTableMap: Record<number, number>,
): Promise<void> {
  const jsonPath = path.join(DATA_INTERMEDIATE, 'document.parsed.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`document.parsed.json not found at ${jsonPath} — run ingest first`);
  }

  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as Record<string, unknown>;
  const outDir = path.join(DATA_INTERMEDIATE, 'grid');
  fs.mkdirSync(outDir, { recursive: true });

  for (const [puzzleIdStr, tableIndex] of Object.entries(puzzleTableMap)) {
    const puzzleId = Number(puzzleIdStr);
    console.log(`\n[grid] extracting puzzle ${puzzleId} from table index ${tableIndex}…`);

    const result = extractGrid(parsed, puzzleId, tableIndex);

    const outPath = path.join(outDir, `${puzzleId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`[grid] wrote → ${outPath}`);
    console.log(`[grid] dimensions: ${result.rows}r × ${result.cols}c`);
    console.log(`\n${asciiRender(result)}\n`);
  }
}
