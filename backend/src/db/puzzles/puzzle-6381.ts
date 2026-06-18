// Puzzle 6381 - Prajavani Kannada Crossword
// Grid derived from printed image (ground truth).
// Black cells: (0,4) (1,1)(1,3-7) (2,4)(2,5) (3,1)(3,2)(3,4)(3,5)(3,7)
//              (4,0)(4,1)(4,7)(4,8) (5,1)(5,2)(5,4)(5,6)(5,7) (6,3)(6,4)
//              (7,1)(7,2)(7,3)(7,4)(7,7) (8,4)
// Numbers: 7@(2,6) — (2,5) is black, NOT open
// Slots: 1A(4) 1D(4) 2D(3) 3A(4) 4D(4) 5A(4) 6D(4) 7A(3) 7D(3)
//        8A(5) 8D(3) 9D(5) 10D(4) 11D(4) 12A(3) 13A(4) 14D(3) 15A(4) 16A(4)
// Note: no 10A (5,1 is black), no 6A (row 2 col 3 left is open)

const puzzle6381 = {
  id: '6381',
  title: 'Prajavani Crossword 6381',
  title_kn: 'ಪ್ರಜಾವಾಣಿ ಪದಬಂಧ',
  difficulty: 'medium',

  across_clues: [
    { number: 1,  clue: 'ಮನದೊಳಗಿರುವ ವಂಶ!',                        answer: 'ಮನೆತನ',     length: 4 },
    { number: 3,  clue: 'ಒಪ್ಪವಾಗಿ ಬಂದಿರುವ ಸೌಕರ್ಯ',                answer: 'ಅನುಕೂಲ',    length: 4 },
    { number: 5,  clue: 'ಮಧುರವಾದ ಧ್ವನಿ',                           answer: 'ಕಲರವ',      length: 4 },
    { number: 7,  clue: 'ಸ್ವಾಭಾವಿಕ ವಾದುದು ಸಜದಲ್ಲಿದೆ!',             answer: 'ಸಹಜ',       length: 3 },
    { number: 8,  clue: 'ಯಾವುದೇ ಅಪರಾಧವನ್ನು ಮಾಡದಿರುವವನು',           answer: 'ನಿರಪರಾಧಿ',  length: 5 },
    { number: 12, clue: 'ಸೂಕ್ಷ್ಮವಾದ ಪರಿಶೀಲನೆ',                     answer: 'ಸಮೀಕ್ಷೆ',   length: 3 },
    { number: 13, clue: 'ಪರಸ್ಪರ ಸಹಾಯ',                             answer: 'ಸಹಕಾರ',     length: 4 },
    { number: 15, clue: 'ಅದೇ ತಾನೇ ಕಡೆದ ಹೊಸಬೆಣ್ಣೆ',                 answer: 'ನವನೀತ',     length: 4 },
    { number: 16, clue: 'ವರ ಪಡೆದಿರುವ ಬೇಡ',                         answer: 'ವನಚರ',      length: 4 },
  ],

  down_clues: [
    { number: 1,  clue: 'ಇನ್ನೂ ಮರಿ! ಈ ಹೆಣ್ಣುದುಂಬಿ!',               answer: 'ಮಧುಕರಿ',   length: 4 },
    { number: 2,  clue: 'ತವರಿನವರು ನೀಡಿರುವ ಲೋಹ',                   answer: 'ತವರ',       length: 3 },
    { number: 4,  clue: 'ಅವಶ್ಯಕ ವಸ್ತು',                            answer: 'ಲವಾಜಮೆ',   length: 4 },
    { number: 6,  clue: 'ವರನಲ್ಲಿ ಪ್ರತಿನಿಧಿ ಕಾಣಿಸಿದನೇ?',             answer: 'ವಕ್ತಾರರು',  length: 4 },
    { number: 7,  clue: 'ಸತ್ತವರನ್ನು ಹೂಳುವ ಸ್ಥಳ',                   answer: 'ಸಮಾಧಿ',     length: 3 },
    { number: 8,  clue: 'ಪರೀಕ್ಷೆಯನ್ನು ಎದುರು ನೋಡುವುದು!',             answer: 'ನಿರೀಕ್ಷೆ', length: 3 },
    { number: 9,  clue: 'ರಾಯರಿಂದ ಬಂದಿರುವ ನಿರೂಪ',                   answer: 'ರಾಯಸಗಾರ',  length: 5 },
    { number: 10, clue: 'ಮನೆಯ ಇನ್ನೊಂದು ಹೆಸರು',                    answer: 'ವಾಸಸ್ಥಾನ',  length: 4 },
    { number: 11, clue: 'ಪುರದಲ್ಲಿ ದೊರೆತ ಸನ್ಮಾನ',                   answer: 'ಪುರಸ್ಕಾರ',  length: 4 },
    { number: 14, clue: 'ವನದ ಕೊನೆಗೆ ಮಾಡಿದ ಯಜ್ಞ',                   answer: 'ಹವನ',       length: 3 },
  ],
};

export default puzzle6381;
