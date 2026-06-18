import { processAnswers, FOOTER_SOURCE_MAP } from './answers';

// Map: source-puzzle-id (whose footer to read) → table index in document.parsed.json.
// The footer for puzzle P lives in the table immediately after puzzle P's clue table.
// Fill in after running ingest + table inventory on the real docx.
//
// We need footers of 6383, 6384, 6385 to get answers for 6382, 6383, 6384.
// Puzzle 6385 is out of scope as a playable puzzle but its footer must be parsed.
const FOOTER_TABLE_MAP: Record<number, number> = {
  // ── Fill in after Prompt 0 inventory ──
  // 6383: 10,
  // 6384: 14,
  // 6385: 18,
};

// Known Baraha→Unicode pairs for table validation (fill in once docx is ingested).
// Format: [barahaString, expectedUnicode, label]
// Example — 16-across of puzzle 6381 = ವಾಲ್ಮೀಕಿ.  Add its Baraha form here.
const KNOWN_PAIRS: Array<[string, string, string]> = [
  // ['<baraha>', 'ವಾಲ್ಮೀಕಿ', '6381-16A'],
  // ['<baraha>', 'ಸೌಲಭ್ಯ',   '6381-3A'],
];

if (Object.keys(FOOTER_TABLE_MAP).length === 0) {
  console.error(
    '[answers-cli] FOOTER_TABLE_MAP is empty.\n' +
    'Run ingest on the real Prajavani docx, complete the table inventory,\n' +
    'then populate FOOTER_TABLE_MAP with the footer table indices for puzzles:\n' +
    Object.entries(FOOTER_SOURCE_MAP)
      .map(([src, tgt]) => `  source puzzle ${src} → answers for ${tgt}`)
      .join('\n'),
  );
  process.exit(1);
}

processAnswers(FOOTER_TABLE_MAP, KNOWN_PAIRS)
  .then(() => console.log('\n[answers-cli] done.'))
  .catch((err) => {
    console.error('[answers-cli] error:', err);
    process.exit(1);
  });
