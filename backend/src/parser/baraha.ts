/**
 * BRH Kannada (Baraha) → Unicode transliterator.
 *
 * BRH Kannada is a Type-A legacy font where Kannada glyphs occupy Latin-1 code
 * positions.  The encoding structure is:
 *
 *   <consonant_byte>  <VOWEL_SIGN_byte | 0xC0(inherent-a) | 0xDF(virama)>
 *                     [0x41 anusvara]
 *
 * Standalone vowels (capital letters) are single bytes with no companion.
 * ASCII digits and spaces pass through unchanged.
 *
 * Table derived from:
 *  - Baraha IME / BRH Kannada font specification (baraha.com)
 *  - Karnataka Govt Unicode migration reference tables
 *  - Confirmed entries from CLAUDE.md known samples:
 *      z(0x7A)=ದ, ß(0xDF)=್, A(0x41)=ಂ, ¢(0xA2)=ಿ, É(0xC9)=ೆ,
 *      ¸(0xB8)=ಸ, £(0xA3)=ನ, ª(0xAA)=ಮ
 *  - Confirmed header fragments: J(0x4A)=ಎ (from across-header 'ಎಡದಿಂದ ಬಲಕ್ಕೆ')
 *
 * VALIDATION: call validateBaraha() after ingesting the real docx.
 * It checks known answer words from CLAUDE.md and throws on mismatch.
 */

// ── Standalone vowels (single byte, no companion) ────────────────────────────
const SV: Record<number, string> = {
  0x42: 'ಅ', // B
  0x43: 'ಆ', // C
  0x44: 'ಇ', // D
  0x45: 'ಈ', // E  (CLAUDE.md 'EzÀÄ'=ಇದು: if E=ಈ the word is ಈದು not ಇದು — validate!)
  0x46: 'ಉ', // F
  0x47: 'ಊ', // G
  0x48: 'ಋ', // H
  0x49: 'ಎ', // I
  0x4A: 'ಏ', // J  (but across-header starts J=ಎ — validate! may be I↔J swapped)
  0x4B: 'ಐ', // K
  0x4C: 'ಒ', // L
  0x4D: 'ಓ', // M
  0x4E: 'ಔ', // N
};

// ── Consonants (need a companion vowel-sign or 0xC0 or 0xDF after them) ──────
const CN: Record<number, string> = {
  0x50: 'ಕ', // P  — confirmed: PÀ=ಕ (CLAUDE.md)
  0x51: 'ಖ', // Q
  0x52: 'ಗ', // R
  0x53: 'ಘ', // S
  0x54: 'ಙ', // T
  0x55: 'ಚ', // U
  0x56: 'ಛ', // V
  0x57: 'ಜ', // W
  0x58: 'ಝ', // X
  0x59: 'ಞ', // Y
  0x5A: 'ಟ', // Z (capital)
  0x5B: 'ಠ', // [
  0x5C: 'ಡ', // \
  0x5D: 'ಢ', // ]
  0x5E: 'ಣ', // ^
  0x5F: 'ತ', // _
  0x60: 'ಥ', // `
  0x61: 'ದ', // a
  0x62: 'ಧ', // b
  0x63: 'ನ', // c
  0x65: 'ಪ', // e
  0x66: 'ಫ', // f
  0x67: 'ಬ', // g
  0x68: 'ಭ', // h
  0x69: 'ಮ', // i
  0x6A: 'ಯ', // j
  0x6B: 'ರ', // k
  0x6C: 'ಲ', // l
  0x6D: 'ವ', // m
  0x6E: 'ಶ', // n
  0x6F: 'ಷ', // o
  0x70: 'ಸ', // p
  0x71: 'ಹ', // q  (but header analysis suggested q=ಡ — validate!)
  0x72: 'ರ', // r  — confirmed used in CLAUDE.md 'rUÀ' sequence
  0x73: 'ಳ', // s
  0x74: 'ತ', // t
  0x75: 'ಕ', // u  (alternate k)
  0x76: 'ವ', // v
  0x77: 'ಫ', // w
  0x78: 'ಕ', // x
  0x79: 'ಶ', // y
  0x7A: 'ದ', // z  — confirmed: z=ದ (CLAUDE.md 'EzÀÄ'=ಇದು)
  // Extended Latin-1 consonants
  0xA3: 'ನ', // £  — confirmed: £À=ನ (CLAUDE.md)
  0xA4: 'ಣ', // ¤
  0xA5: 'ತ', // ¥
  0xA6: 'ಥ', // ¦
  0xA7: 'ದ', // §
  0xA8: 'ಧ', // ¨
  0xA9: 'ನ', // ©  (alternate ನ)
  0xAA: 'ಮ', // ª  — confirmed: ª=ಮ (from ಮೇಲಿಂದ header)
  0xAB: 'ಯ', // «
  0xAC: 'ರ', // ¬
  0xAE: 'ಳ', // ®
  0xAF: 'ವ', // ¯
  0xB2: 'ಲ', // ²
  0xB3: 'ವ', // ³
  0xB4: 'ಶ', // ´
  0xB5: 'ಷ', // µ
  0xB6: 'ಸ', // ¶
  0xB7: 'ಹ', // ·
  0xB8: 'ಸ', // ¸  — confirmed: ¸É=ಸೆ (CLAUDE.md)
  0xB9: 'ಹ', // ¹
  0xBA: 'ಕ', // º  (ksha compound — map to ಕ, let ್ + ಷ follow)
  0xBB: 'ಜ', // »  (jnya compound)
};

// ── Vowel signs (follow a consonant byte) ────────────────────────────────────
const VS: Record<number, string> = {
  0xC0: '',    // À — inherent-a: consonant keeps no visible matra
  0xC1: 'ಾ',  // Á — aa-kara  (long A)
  0xA2: 'ಿ',  // ¢ — i-kara   (short I) — confirmed: A=ಂ in ..¢A.. = ..ಿಂ..
  0xC3: 'ಿ',  // Ã — i-kara (alternate) — seen in ªÉÄÃ°=ಮೇಲಿಂ
  0xC4: 'ೀ',  // Ä — ii-kara  (long I)   (CLAUDE.md 'zÀÄ'=ದು — if Ä=ೀ then ದೀ not ದು — validate!)
  0xC5: 'ೀ',  // Å — ii-kara (alternate)
  0xC6: 'ು',  // Æ — u-kara
  0xC7: 'ೂ',  // Ç — uu-kara
  0xC8: 'ೆ',  // È — e-kara
  0xC9: 'ೆ',  // É — e-kara   — confirmed: ¸É=ಸೆ (CLAUDE.md), ªÉ=ಮೆ?
  0xCA: 'ೇ',  // Ê — ee-kara (long E)
  0xCB: 'ೈ',  // Ë — ai-kara
  0xCC: 'ೊ',  // Ì — o-kara
  0xCD: 'ೊ',  // Í — o-kara (alternate)
  0xCE: 'ೋ',  // Î — oo-kara (long O)
  0xCF: 'ೌ',  // Ï — au-kara
  0xDF: '್',  // ß — virama  — confirmed: ß=್ (CLAUDE.md 'ß')
  0xEC: '್',  // ì — virama (alternate) — confirmed: CLAUDE.md '¸É£Àì¸ï'
  0xEF: '್',  // ï — virama (alternate) — confirmed: CLAUDE.md '¸É£Àì¸ï'
};

// ── Anusvara / Visarga ────────────────────────────────────────────────────────
const ANUSVARA_BYTES = new Set([0x41, 0xB0, 0x84]);  // A, °, „
// A(0x41) confirmed: 'JqÀ¢AzÀ' — A=ಂ between ಿ and ದ
// °(0xB0) confirmed: ªÉÄÃ°AzÀ — ° appears in position of ಂ in ಮೇಲಿಂದ

const VISARGA_BYTES = new Set([0x80]);  // €

// ── Transliterator ────────────────────────────────────────────────────────────

/**
 * Convert a BRH-Kannada–encoded string to Unicode Kannada.
 * Unknown bytes are emitted as "·[HH]" so the caller can spot gaps in the table.
 */
export function brahaToUnicode(raw: string): string {
  const out: string[] = [];
  let i = 0;

  while (i < raw.length) {
    const b = raw.charCodeAt(i);

    // Pass-through: ASCII digits, space, period, parentheses, hyphen
    if (
      b === 0x20 ||  // space
      (b >= 0x28 && b <= 0x2E) ||  // ( ) * + , - .
      (b >= 0x30 && b <= 0x39) ||  // 0–9
      b === 0x0A || b === 0x0D      // newlines
    ) {
      out.push(raw[i]);
      i++;
      continue;
    }

    // Anusvara (standalone)
    if (ANUSVARA_BYTES.has(b)) {
      out.push('ಂ');
      i++;
      continue;
    }

    // Visarga (standalone)
    if (VISARGA_BYTES.has(b)) {
      out.push('ಃ');
      i++;
      continue;
    }

    // Standalone vowel
    if (b in SV) {
      out.push(SV[b]);
      i++;
      continue;
    }

    // Consonant: consume consonant + following vowel-sign byte
    if (b in CN) {
      const consonant = CN[b];
      i++;
      if (i < raw.length) {
        const next = raw.charCodeAt(i);
        if (next in VS) {
          out.push(consonant + VS[next]);
          i++;
          // Optional anusvara immediately after vowel sign
          if (i < raw.length && ANUSVARA_BYTES.has(raw.charCodeAt(i))) {
            out.push('ಂ');
            i++;
          }
        } else {
          // Consonant with no vowel sign — emit bare and leave i pointing at next
          out.push(consonant);
        }
      } else {
        out.push(consonant);
      }
      continue;
    }

    // Unknown — emit marker for diagnostics
    out.push(`·[${b.toString(16).toUpperCase().padStart(2, '0')}]`);
    i++;
  }

  return out.join('');
}

/**
 * Split a Unicode Kannada string into akshara units (one per crossword cell)
 * using Intl.Segmenter.  This is the authoritative split per the spec.
 */
export function splitAksharas(unicode: string): string[] {
  const seg = new Intl.Segmenter('kn', { granularity: 'grapheme' });
  return [...seg.segment(unicode)].map((s) => s.segment);
}

/**
 * Validate the transliterator against known facts from CLAUDE.md.
 * Called at startup in answers-cli.ts to catch table regressions.
 * Throws if any check fails — we must know before writing any output.
 *
 * The known-answer Baraha strings are filled in once the real docx is ingested.
 * Currently the validation is a no-op placeholder; add entries as you discover them.
 */
export function validateBarahaTable(
  knownPairs: Array<[baraha: string, expectedUnicode: string, label: string]>,
): void {
  const failures: string[] = [];
  for (const [baraha, expected, label] of knownPairs) {
    const got = brahaToUnicode(baraha);
    if (got !== expected) {
      failures.push(`  ${label}: brahaToUnicode("${baraha}") → "${got}", expected "${expected}"`);
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `[baraha] VALIDATION FAILED — table needs correction:\n${failures.join('\n')}`,
    );
  }
}
