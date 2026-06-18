export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface GridCell {
  row: number;
  col: number;
  letter: string;
  blocked: boolean;
  number?: number;
}

export interface ClueEntry {
  number: number;
  clue: string;
  clue_en?: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  length: number;
}

export interface Puzzle {
  id: string;
  title: string;
  title_kn: string;
  difficulty: 'easy' | 'medium' | 'hard';
  grid: GridCell[][];
  clues: { across: ClueEntry[]; down: ClueEntry[] };
  created_at: string;
  total_cells?: number;
  solution?: { row: number; col: number; letter: string; blocked: boolean }[][];
}

export interface PuzzleSummary {
  id: string;
  title: string;
  title_kn: string;
  difficulty: 'easy' | 'medium' | 'hard';
  play_count: number;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  time_taken_s: number;
  achieved_at: string;
}

export interface CellValue {
  row: number;
  col: number;
  value: string;
}
