#!/usr/bin/env python3
"""
NUDI to Unicode Kannada Converter
Converts legacy NUDI font-encoded Kannada text to Unicode

Based on NUDI 5.0 (Karnataka Government Standard) character mappings
"""

import sys
import json

# Complete NUDI to Unicode mapping
NUDI_MAP = {
    # Basic consonants (a-z, A-Z)
    'k': 'ಕ', 'K': 'ಖ', 'g': 'ಗ', 'G': 'ಘ', 'Z': 'ಙ',
    'c': 'ಚ', 'C': 'ಛ', 'j': 'ಜ', 'J': 'ಝ', 'Y': 'ಞ',
    't': 'ಟ', 'Q': 'ಠ', 'd': 'ಡ', 'D': 'ಢ', 'N': 'ಣ',
    'w': 'ತ', 'W': 'ಥ', 'f': 'ಧ', 'n': 'ನ',
    'p': 'ಪ', 'P': 'ಫ', 'b': 'ಬ', 'B': 'ಭ', 'm': 'ಮ',
    'y': 'ಯ', 'r': 'ರ', 'l': 'ಲ', 'v': 'ವ', 'R': 'ಱ',
    's': 'ಸ', 'S': 'ಶ', 'z': 'ಷ', 'h': 'ಹ',
    'q': 'ಳ', 'L': 'ಳ', 'x': 'ಕ್ಷ',
    
    # Vowels (standalone)
    'a': 'ಅ', 'A': 'ಆ',
    'i': 'ಇ', 'I': 'ಈ',
    'u': 'ಉ', 'U': 'ಊ',
    'e': 'ಎ', 'E': 'ಏ',
    'o': 'ಒ', 'O': 'ಓ',
    
    # Latin-1 extended characters (À-ÿ) = Matras and special chars
    'À': 'ಾ',      # aa matra
    'Á': 'ಾ',
    'Â': '್',      # halant/virama
    'Ã': 'ಂ',      # anusvara
    'Ä': 'ೀ',      # ii matra
    'Å': 'ೆ',      # e matra
    'Æ': 'ೈ',      # ai matra
    'Ç': 'ೂ',      # uu matra
    'È': 'ೃ',      # ri matra
    'É': 'ೇ',      # ee matra
    'Ê': 'ೊ',      # o matra
    'Ë': 'ೋ',      # oo matra
    'Ì': 'ೌ',      # au matra
    '°': 'ಿ',      # i matra
    '®': 'ರ್',     # ra halant
    '«': 'ವ',
    'ª': 'ಾ',
    '¢': 'ಞ್',     # nya halant
    '£': 'ಸ್',     # sa halant
    '¥': 'ಅ',      # a vowel
    '§': 'ಜ್ಞ',    # gya
    '¨': 'ತ್ಸ',    # tsa
    '±': '೫',
    '·': '್ಯ',
    '¸': 'ನ್ಟ',    # nta
    '¹': 'ಿ',
    'ß': 'ರ್ಯ',    # rya
    'æ': '್ಜ',     # ja halant
    'µ': 'ಿ',
    '×': 'ಿ',
    'ñ': 'ೀ',
    'è': 'ೇ',
    'ö': '್ಯ',
    '~': '್',      # halant
    '|': '।',      # danda
    '||': '॥',     # double danda
}

def convert_nudi_to_unicode(nudi_text):
    """
    Convert NUDI-encoded text to Unicode Kannada.
    
    This is a basic converter that handles most common NUDI patterns.
    For complex text, manual verification is recommended.
    """
    result = []
    i = 0
    
    while i < len(nudi_text):
        ch = nudi_text[i]
        
        # Check for special two-character sequences
        if i + 1 < len(nudi_text):
            two_char = ch + nudi_text[i + 1]
            if two_char == '||':
                result.append('॥')
                i += 2
                continue
        
        # Check if character has a mapping
        if ch in NUDI_MAP:
            result.append(NUDI_MAP[ch])
            i += 1
            continue
        
        # Pass through unmapped characters (spaces, punctuation, numbers, etc.)
        result.append(ch)
        i += 1
    
    return ''.join(result)


def process_clues(clues_text):
    """Process a list of NUDI clues and convert them."""
    lines = clues_text.strip().split('\n')
    converted_clues = []
    
    for line in lines:
        if line.strip():
            converted_clues.append(convert_nudi_to_unicode(line))
    
    return converted_clues


if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Convert file or text from command line
        input_text = ' '.join(sys.argv[1:])
        output = convert_nudi_to_unicode(input_text)
        print(output)
    else:
        # Interactive mode
        print("NUDI to Unicode Kannada Converter")
        print("Type NUDI text and press Enter to convert (Ctrl+C to exit)")
        print("-" * 50)
        try:
            while True:
                nudi_input = input("\nEnter NUDI text: ")
                unicode_output = convert_nudi_to_unicode(nudi_input)
                print(f"Unicode: {unicode_output}")
        except KeyboardInterrupt:
            print("\nExiting...")
            sys.exit(0)
