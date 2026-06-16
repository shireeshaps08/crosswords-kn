const HALANT = '್'; // ್

// Order matters: longer patterns before shorter ones
const CONSONANTS: [string, string][] = [
  ['kh',  'ಖ'], ['gh',  'ಘ'],
  ['chh', 'ಛ'], ['Ch',  'ಛ'], ['ch',  'ಚ'],
  ['jh',  'ಝ'],
  ['Th',  'ಠ'], ['Dh',  'ಢ'],
  ['th',  'ಥ'], ['dh',  'ಧ'],
  ['ph',  'ಫ'], ['bh',  'ಭ'],
  ['Sh',  'ಷ'], ['sh',  'ಶ'],
  ['k',   'ಕ'], ['g',   'ಗ'], ['G',   'ಙ'],
  ['c',   'ಚ'], ['j',   'ಜ'], ['J',   'ಞ'],
  ['T',   'ಟ'], ['D',   'ಡ'], ['N',   'ಣ'],
  ['t',   'ತ'], ['d',   'ದ'], ['n',   'ನ'],
  ['p',   'ಪ'], ['f',   'ಫ'], ['b',   'ಬ'], ['m',   'ಮ'],
  ['y',   'ಯ'], ['r',   'ರ'], ['R',   'ಱ'],
  ['l',   'ಲ'], ['L',   'ಳ'],
  ['v',   'ವ'], ['w',   'ವ'],
  ['S',   'ಶ'], ['s',   'ಸ'], ['h',   'ಹ'],
];

// [romanPattern, standalone vowel, vowel sign (matra)]
// Ambiguous vowels ('a','i','u','e','o') can extend to longer forms like 'aa','ii','uu','ee','oo'
const VOWELS: [string, string, string][] = [
  ['aa', 'ಆ', 'ಾ'],
  ['ii', 'ಈ', 'ೀ'],
  ['uu', 'ಊ', 'ೂ'],
  ['ee', 'ಏ', 'ೇ'],
  ['ai', 'ಐ', 'ೈ'],
  ['au', 'ಔ', 'ೌ'],
  ['ou', 'ಔ', 'ೌ'],
  ['oo', 'ಓ', 'ೋ'],
  ['A',  'ಆ', 'ಾ'],
  ['I',  'ಈ', 'ೀ'],
  ['U',  'ಊ', 'ೂ'],
  ['E',  'ಏ', 'ೇ'],
  ['O',  'ಓ', 'ೋ'],
  ['a',  'ಅ', ''],       // implicit — no vowel sign after consonant
  ['i',  'ಇ', 'ಿ'],
  ['u',  'ಉ', 'ು'],
  ['e',  'ಎ', 'ೆ'],
  ['o',  'ಒ', 'ೊ'],
];

// These single-char vowels could extend (a→aa/ai/au, i→ii, u→uu, e→ee, o→oo/ou)
const AMBIGUOUS_VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);

function matchCons(s: string): [string, string] | null {
  for (const [p, kn] of CONSONANTS) if (s.startsWith(p)) return [p, kn];
  return null;
}

function matchVowel(s: string): [string, string, string] | null {
  for (const v of VOWELS) if (s.startsWith(v[0])) return v;
  return null;
}

function isKannada(char: string): boolean {
  const cp = char.codePointAt(0) ?? 0;
  return cp >= 0x0C80 && cp <= 0x0CFF;
}

export interface InputResult {
  preview: string;
  committed: string | null; // null = still composing, advance to next cell when non-null
  newBuffer: string;        // remainder to carry into the next cell's buffer
  advance: boolean;
}

// Parse the accumulated English buffer into a Kannada akshara.
function parseBuffer(buf: string): InputResult {
  if (!buf) return { preview: '', committed: null, newBuffer: '', advance: false };

  let pos = 0;
  const consonants: string[] = [];
  let vowelPat = '';
  let vowelStandalone = '';
  let vowelSign = '';
  let vowelAmbiguous = false;

  while (pos < buf.length) {
    const rest = buf.slice(pos);
    const vowelMatch = matchVowel(rest);
    if (vowelMatch) {
      [vowelPat, vowelStandalone, vowelSign] = vowelMatch;
      vowelAmbiguous = AMBIGUOUS_VOWELS.has(vowelPat);
      pos += vowelPat.length;
      break;
    }
    const consMatch = matchCons(rest);
    if (consMatch) {
      consonants.push(consMatch[1]);
      pos += consMatch[0].length;
    } else {
      // Unrecognized character — pass through as-is
      return { preview: buf[pos], committed: buf[pos], newBuffer: buf.slice(pos + 1), advance: true };
    }
  }

  const remainder = buf.slice(pos);
  const hasMore = remainder.length > 0;
  const base = consonants.join(HALANT);

  if (!vowelPat) {
    // Consonant(s) only — waiting for a vowel
    if (hasMore) {
      // Shouldn't normally happen; commit with implicit 'a'
      return { preview: base, committed: base, newBuffer: remainder, advance: true };
    }
    return { preview: base, committed: null, newBuffer: buf, advance: false };
  }

  // Have consonant(s) + vowel, or pure vowel
  const akshara = consonants.length > 0
    ? base + vowelSign        // consonant cluster + vowel sign
    : vowelStandalone;        // standalone vowel

  if (!vowelAmbiguous || hasMore) {
    // Vowel is complete (unambiguous or followed by more text)
    return { preview: akshara, committed: akshara, newBuffer: remainder, advance: true };
  }

  // Ambiguous vowel with nothing following — wait to see if it extends
  return { preview: akshara, committed: null, newBuffer: buf, advance: false };
}

// Process one new character against the current English input buffer.
export function processChar(buffer: string, char: string): InputResult {
  // Direct Kannada character (from a Kannada keyboard or IME)
  if (isKannada(char)) {
    return { preview: char, committed: char, newBuffer: '', advance: true };
  }
  return parseBuffer(buffer + char);
}

// Force-commit whatever is in the buffer (e.g., on Space / arrow key / cell tap).
export function commitBuffer(buffer: string): string {
  if (!buffer) return '';
  const r = parseBuffer(buffer);
  return r.committed ?? r.preview;
}

// Preview of current buffer state without committing.
export function getBufferPreview(buffer: string): string {
  if (!buffer) return '';
  return parseBuffer(buffer).preview;
}

// Split a Kannada string into individual akshara grapheme clusters.
export function splitKannadaGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new (Intl as any).Segmenter('kn', { granularity: 'grapheme' });
    return [...seg.segment(text)].map((s: any) => s.segment as string);
  }
  // Fallback: split on each new Kannada base character
  const chars = Array.from(text);
  const result: string[] = [];
  let current = '';
  for (const ch of chars) {
    const cp = ch.codePointAt(0) ?? 0;
    const isBase =
      (cp >= 0x0C85 && cp <= 0x0C94) ||   // independent vowels
      (cp >= 0x0C95 && cp <= 0x0CB9) ||   // consonants
      (cp >= 0x0CE0 && cp <= 0x0CE1);     // vocalic letters
    if (isBase && current) {
      result.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current) result.push(current);
  return result;
}
