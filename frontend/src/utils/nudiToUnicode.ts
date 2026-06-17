// Nudi 5.0 (Karnataka Govt standard) → Unicode Kannada converter
// Same char means different things depending on position:
//   after a consonant → matra form; otherwise → standalone vowel
// '' matra = inherent 'a' — no extra Unicode char needed

// [nudiAscii, standaloneUnicode, matraUnicode]
const VOWELS: [string, string, string][] = [
  ['A', 'ಆ', 'ಾ'],
  ['i', 'ಇ', 'ಿ'],
  ['I', 'ಈ', 'ೀ'],
  ['u', 'ಉ', 'ು'],
  ['U', 'ಊ', 'ೂ'],
  ['e', 'ಎ', 'ೆ'],
  ['E', 'ಏ', 'ೇ'],
  ['o', 'ಒ', 'ೊ'],
  ['O', 'ಓ', 'ೋ'],
  ['a', 'ಅ', ''],  // inherent vowel — no matra output after consonant
];

// Multi-char vowels (checked before single-char to get longest match)
const MULTI_VOWELS: [string, string, string][] = [
  ['au', 'ಔ', 'ೌ'],
  ['ai', 'ಐ', 'ೈ'],
  ['ou', 'ಔ', 'ೌ'],  // alternate encoding
];

// [nudiAscii, unicodeChar]
const CONSONANTS: [string, string][] = [
  // Multi-char consonants first
  ['~j', 'ಞ'],
  // Single-char consonants
  ['k', 'ಕ'], ['K', 'ಖ'], ['g', 'ಗ'], ['G', 'ಘ'], ['Z', 'ಙ'],
  ['c', 'ಚ'], ['C', 'ಛ'], ['j', 'ಜ'], ['J', 'ಝ'], ['Y', 'ಞ'],
  ['t', 'ಟ'], ['Q', 'ಠ'], ['d', 'ಡ'], ['D', 'ಢ'], ['N', 'ಣ'],
  ['w', 'ತ'], ['W', 'ಥ'], ['f', 'ಧ'], ['n', 'ನ'],
  ['p', 'ಪ'], ['P', 'ಫ'], ['b', 'ಬ'], ['B', 'ಭ'], ['m', 'ಮ'],
  ['y', 'ಯ'], ['r', 'ರ'], ['l', 'ಲ'], ['v', 'ವ'],
  ['s', 'ಸ'], ['S', 'ಶ'], ['z', 'ಷ'], ['h', 'ಹ'],
  ['q', 'ಳ'], ['L', 'ಳ'], ['R', 'ಱ'],
  ['x', 'ಕ್ಷ'],  // shorthand conjunct
];

const SPECIALS: [string, string, boolean][] = [
  // [nudi, unicode, keepConsonantState]
  ['||', '॥', false],
  ['|',  '।', false],
  ['/',  '್', true],   // halant — keep consonant state for cluster
  ['^',  '್', true],
  ['M',  'ಂ', false],  // anusvara
  ['H',  'ಃ', false],  // visarga
  ['#',  'ಃ', false],
  ['$',  'ಂ', false],
  ['~',  'ಁ', false],  // chandrabindu (must come after ~j multi-char check)
];

export function nudiToUnicode(input: string): string {
  let out = '';
  let afterConsonant = false;
  let pos = 0;

  while (pos < input.length) {
    let matched = false;

    // Multi-char special sequences (longest match first)
    if (!matched) {
      for (const [nudi, unicode, keepState] of SPECIALS) {
        if (nudi.length > 1 && input.startsWith(nudi, pos)) {
          out += unicode;
          afterConsonant = keepState;
          pos += nudi.length;
          matched = true;
          break;
        }
      }
    }

    // Multi-char consonants
    if (!matched) {
      for (const [nudi, unicode] of CONSONANTS) {
        if (nudi.length > 1 && input.startsWith(nudi, pos)) {
          out += unicode;
          afterConsonant = true;
          pos += nudi.length;
          matched = true;
          break;
        }
      }
    }

    // Multi-char vowels
    if (!matched) {
      for (const [nudi, standalone, matra] of MULTI_VOWELS) {
        if (input.startsWith(nudi, pos)) {
          out += afterConsonant ? matra : standalone;
          afterConsonant = false;
          pos += nudi.length;
          matched = true;
          break;
        }
      }
    }

    // Single-char matching
    if (!matched) {
      const ch = input[pos];

      // Single-char specials
      for (const [nudi, unicode, keepState] of SPECIALS) {
        if (nudi.length === 1 && ch === nudi) {
          out += unicode;
          afterConsonant = keepState;
          matched = true;
          break;
        }
      }

      // Single-char consonants
      if (!matched) {
        for (const [nudi, unicode] of CONSONANTS) {
          if (nudi.length === 1 && ch === nudi) {
            out += unicode;
            afterConsonant = true;
            matched = true;
            break;
          }
        }
      }

      // Single-char vowels
      if (!matched) {
        for (const [nudi, standalone, matra] of VOWELS) {
          if (ch === nudi) {
            out += afterConsonant ? matra : standalone;
            afterConsonant = false;
            matched = true;
            break;
          }
        }
      }

      // Pass through (digits, spaces, punctuation, unknown)
      if (!matched) {
        out += ch;
        afterConsonant = false;
      }

      pos++;
    }
  }

  return out;
}
