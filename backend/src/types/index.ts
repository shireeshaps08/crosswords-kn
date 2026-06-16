export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  created_at: Date;
}

export interface ClueEntry {
  number: number;
  clue: string;       // Kannada clue text
  clue_en?: string;   // optional English hint
  answer: string;     // Kannada answer
  row: number;
  col: number;
  direction: 'across' | 'down';
  length: number;
}

export interface GridCell {
  row: number;
  col: number;
  letter: string;     // Kannada letter
  blocked: boolean;
  number?: number;
}

export interface Puzzle {
  id: string;
  title: string;
  title_kn: string;
  difficulty: 'easy' | 'medium' | 'hard';
  grid: GridCell[][];
  clues: { across: ClueEntry[]; down: ClueEntry[] };
  solution: GridCell[][];
  published: boolean;
  created_at: Date;
}

export interface SessionState {
  grid: { row: number; col: number; value: string }[];
  correct_cells: number;
  total_cells: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  time_taken_s: number;
  achieved_at: Date;
}

export interface JwtPayload {
  sub: string;       // user id
  username: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}
