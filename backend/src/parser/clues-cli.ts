import { processClues } from './clues';

// Mapping of puzzle ID → table index of the CLUE table within document.parsed.json.
// These are separate table indices from the grid tables in grid-cli.ts.
// Fill in after running ingest on the real docx and completing the table inventory.
//
// Example (update after Prompt 0 inventory):
//   6382 → table 5   (clue table for puzzle 6382, immediately after its grid table)
//   6383 → table 9
//   6384 → table 13
const CLUE_TABLE_MAP: Record<number, number> = {
  // ── Fill these in after running ingest on the real docx ──
  // 6382: 5,
  // 6383: 9,
  // 6384: 13,
};

if (Object.keys(CLUE_TABLE_MAP).length === 0) {
  console.error(
    '[clues-cli] CLUE_TABLE_MAP is empty.\n' +
    'Run ingest on the real Prajavani docx, then run the table inventory\n' +
    'to find the clue table indices and populate CLUE_TABLE_MAP.',
  );
  process.exit(1);
}

processClues(CLUE_TABLE_MAP)
  .then(() => console.log('\n[clues-cli] done.'))
  .catch((err) => {
    console.error('[clues-cli] error:', err);
    process.exit(1);
  });
