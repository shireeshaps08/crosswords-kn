# Project: Prajavani Kannada Crossword DOCX Parser

## Established facts (do not re-derive)

- Source is a `.docx`. Each puzzle is a Word TABLE. There are ~140 tables total
  (puzzles + 1×2 layout wrapper tables — ignore wrappers).
- GRID is NOT an image. Each grid square is a `<w:tc>` whose `<w:tcPr><w:shd>` carries
  a fill. Fill `000000` (and near-blacks `404040`, `0C0C0C`) = BLOCKED cell.
  `FFFFFF` / `"auto"` / no shd = OPEN cell. Open cells may contain a printed clue number.
- CLUE tables have 4 columns. The column under the `"ಎಡದಿಂದ ಬಲಕ್ಕೆ"` header = ACROSS;
  the column under `"ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ"` = DOWN. Identify columns by these header labels,
  NOT by a hardcoded index.
- Clue format inside a cell: `N.<clue text>(L)` where `L` is the answer length.
- `L` counts AKSHARAS (one akshara per grid cell), NOT Unicode codepoints.
  One akshara = consonant + optional vowel sign / virama+consonant (multiple codepoints).
- Text is legacy Baraha "BRH Kannada" font = ASCII-mapped, NOT Unicode.
  Example: `"EzÀÄ PÀ£ÀßrUÀgÀ ¸É£Àì¸ï"` renders as `"ಇದು ಕನ್ನಡಿಗರ ಸೆನ್ಸಸ್"`.
  A deterministic ASCII→Unicode remap is required on every extracted string.
- The footer block `"ಹಿಂದಿನ ಪದಬಂಧದ ಉತ್ತರ"` ("answer to the PREVIOUS crossword")
  holds the SOLUTION WORDS for puzzle N−1. So puzzle 6380's answers live in 6381's footer.

## Stack & rules

- TypeScript / Node. Unzip with `jszip`, parse with `fast-xml-parser` (or `@xmldom/xmldom`).
- DO NOT use `mammoth` — it flattens to HTML and discards shading + table geometry.
- Reversibility: never mutate the raw docx; keep raw + every intermediate JSON.
- Validate, don't trust: assert grid/clue/akshara consistency and flag mismatches.

## Kannada grapheme splitting

Regex for one akshara (crossword cell = one grapheme cluster):

```ts
const AKSHARA_RE = /[ಅ-ಹೞೠೡ]((್[ಅ-ಹೞ])*[಼-ೌೕೖ್]?)/gu;
```

Half-consonants (e.g. `ಲ್`) occupy their own cell in the printed grid and must be
treated as a separate akshara unit — do not merge them into the following consonant.

## Grid numbering

Auto-number cells left→right, top→bottom. A cell gets a number if it starts an ACROSS
word (left neighbour is blocked or edge, AND right neighbour is open) OR a DOWN word
(top neighbour is blocked or edge, AND bottom neighbour is open). Minimum word length = 3.

## Known puzzle facts

- Puzzle 6380: 9×9 grid, answers confirmed from the PDF image.
- Puzzle 6381: 9×9 grid. Black cells at:
  `(0,4) (1,1)(1,3)(1,4)(1,5)(1,7) (2,4) (3,1)(3,2)(3,4)(3,5)(3,7)`
  `(4,0)(4,1)(4,7)(4,8) (5,3)(5,4)(5,6)(5,7)`
  `(6,3)(6,4) (7,1)(7,3)(7,4) (8,4)`
  Corrections from grid image: (3,5) added, (5,1) removed, (7,6) removed vs prior list.
  Clue numbers: 1@(0,0) 2@(0,2) 3@(0,5) 4@(0,8) 5@(2,0) 6@(2,3) 7@(2,5)
  8@(4,2) 9@(4,5) 10@(5,0) 11@(5,8) 12@(6,0) 13@(6,5) 14@(6,6) 15@(8,0) 16@(8,5)
  Slots: 1(A4,D4) 2(D3) 3(A4) 4(D4) 5(A4) 6(D3) 7(A4) 8(A5,D5) 9(D5) 10(A3,D4) 11(D4) 12(A3) 13(A4) 14(D3) 15(A4) 16(A4)
  3-across answer is `ಸೌಲಭ್ಯ` (len=3), NOT `ಅನುಕೂಲ`.
  16-across answer `ವಾಲ್ಮೀಕಿ` uses crossword split: `ವಾ|ಲ್|ಮೀ|ಕಿ` (4 cells).
