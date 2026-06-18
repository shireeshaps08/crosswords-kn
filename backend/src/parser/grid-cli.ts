import { processGrids } from './grid';

// Mapping of puzzle ID → table index within document.parsed.json.
// Table indices are 0-based. Update this once the real docx is ingested
// and the table inventory (Prompt 0) is complete.
//
// Example layout for the full Prajavani docx (fill in after inventory):
//   6382 → table 4  (grid table for puzzle 6382)
//   6383 → table 8  (grid table for puzzle 6383)
//   6384 → table 12 (grid table for puzzle 6384)
//
// For smoke_test.docx with a single table:
//   9999 → table 0
const PUZZLE_TABLE_MAP: Record<number, number> = {
  // ── Fill these in after running ingest on the real docx ──
  // 6382: 4,
  // 6383: 8,
  // 6384: 12,

  // Smoke-test entry (smoke_test.docx, 1 table)
  9999: 0,
};

processGrids(PUZZLE_TABLE_MAP)
  .then(() => console.log('\n[grid-cli] done.'))
  .catch((err) => {
    console.error('[grid-cli] error:', err);
    process.exit(1);
  });
