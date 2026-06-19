// Puzzle 6381 - Prajavani Kannada Crossword
// Black cells (ground truth from printed image):
//   (0,4)
//   (1,1)(1,3)(1,4)(1,5)(1,6)(1,7)
//   (2,4)(2,5)
//   (3,1)(3,2)(3,4)(3,5)(3,7)
//   (4,0)(4,1)(4,7)(4,8)
//   (5,1)(5,3)(5,4)(5,6)(5,7)
//   (6,3)(6,4)
//   (7,1)(7,2)(7,3)(7,4)(7,5)(7,6)(7,7)
//   (8,4)
// Numbers: 1@(0,0) 2@(0,2) 3@(0,5) 4@(0,8) 5@(2,0) 6@(2,3) 7@(2,6)
//          8@(4,2) 9@(4,5) 10@(5,0) 11@(5,8) 12@(6,0) 13@(6,5) 14@(8,0) 15@(8,5)

const puzzle6381 = {
  id: '6381',
  title: 'Prajavani Crossword 6381',
  title_kn: 'ಪ್ರಜಾವಾಣಿ ಪದಬಂಧ',
  difficulty: 'medium',

  across_clues: [
    { number: 1,  clue: 'ಮನದೊಳಗಿರುವ ವಂಶ!',                        answer: 'ಮನೆತನ',    length: 4 },
    { number: 3,  clue: 'ಒಪ್ಪವಾಗಿ ಬಂದಿರುವ ಸೌಕರ್ಯ',                answer: 'ಸೌಲಭ್ಯ',   length: 3 },
    { number: 5,  clue: 'ಮಧುರವಾದ ಧ್ವನಿ',                           answer: 'ಕಲರವ',     length: 4 },
    { number: 7,  clue: 'ಸ್ವಾಭಾವಿಕ ವಾದುದು ಸಜದಲ್ಲಿದೆ!',             answer: 'ಸಹಜ',      length: 3 },
    { number: 8,  clue: 'ಯಾವುದೇ ಅಪರಾಧವನ್ನು ಮಾಡದಿರುವವನು',           answer: 'ನಿರಪರಾಧಿ', length: 4 },
    { number: 12, clue: 'ಸೂಕ್ಷ್ಮವಾದ ಪರಿಶೀಲನೆ',                     answer: 'ಸಮೀಕ್ಷೆ',  length: 5 },
    { number: 13, clue: 'ಪರಸ್ಪರ ಸಹಾಯ',                             answer: 'ಸಹಕಾರ',    length: 4 },
    { number: 14, clue: 'ಅದೇ ತಾನೇ ಕಡೆದ ಹೊಸಬೆಣ್ಣೆ',                 answer: 'ನವನೀತ',    length: 4 },
    { number: 15, clue: 'ವರ ಪಡೆದಿರುವ ಬೇಡ',                         answer: 'ವಾಲ್ಮೀಕಿ', length: 4 },
  ],

  down_clues: [
    { number: 1,  clue: 'ಇನ್ನೂ ಮರಿ! ಈ ಹೆಣ್ಣುದುಂಬಿ!',               answer: 'ಮಧುಕರಿ',  length: 4 },
    { number: 2,  clue: 'ತವರಿನವರು ನೀಡಿರುವ ಲೋಹ',                   answer: 'ತವರ',      length: 3 },
    { number: 4,  clue: 'ಅವಶ್ಯಕ ವಸ್ತು',                            answer: 'ಲವಾಜಮೆ',  length: 4 },
    { number: 6,  clue: 'ವರನಲ್ಲಿ ಪ್ರತಿನಿಧಿ ಕಾಣಿಸಿದನೇ?',             answer: 'ವಕ್ತಾರರು', length: 5 },
    { number: 7,  clue: 'ಸತ್ತವರನ್ನು ಹೂಳುವ ಸ್ಥಳ',                    answer: 'ಸಮಾಧಿ',   length: 3 },
    { number: 8,  clue: 'ಪರೀಕ್ಷೆಯನ್ನು ಎದುರು ನೋಡುವುದು!',             answer: 'ನಿರೀಕ್ಷೆ', length: 3 },
    { number: 9,  clue: 'ರಾಯರಿಂದ ಬಂದಿರುವ ನಿರೂಪ',                   answer: 'ರಾಯಸಗಾರ', length: 3 },
    { number: 10, clue: 'ಮನೆಯ ಇನ್ನೊಂದು ಹೆಸರು',                    answer: 'ವಾಸಸ್ಥಾನ', length: 4 },
    { number: 11, clue: 'ಪುರದಲ್ಲಿ ದೊರೆತ ಸನ್ಮಾನ',                   answer: 'ಪುರಸ್ಕಾರ', length: 4 },
  ],
};

export default puzzle6381;
