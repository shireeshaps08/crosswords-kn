import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Puzzle, CellValue, ClueEntry } from '../types';
import CrosswordGrid from '../components/CrosswordGrid';
import CluePanel from '../components/CluePanel';
import styles from './PuzzlePlay.module.css';

export default function PuzzlePlay() {
  const { id } = useParams<{ id: string }>();
  const { user, initGuest } = useAuthStore();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userValues, setUserValues] = useState<Map<string, string>>(new Map());
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState({ correct: 0, total: 0, words: 0, totalWords: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [activeClue, setActiveClue] = useState<{ number: number; direction: 'across' | 'down' } | undefined>();
  const pendingRef = useRef<CellValue[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout>>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => { if (!user) initGuest(); }, [user, initGuest]);

  useEffect(() => {
    if (!id) return;
    api.get(`/puzzles/${id}`).then(r => setPuzzle(r.data.puzzle));
  }, [id]);

  useEffect(() => {
    if (!puzzle || !id) return;
    const totalWords = (puzzle.clues.across?.length ?? 0) + (puzzle.clues.down?.length ?? 0);
    api.post(`/puzzles/${id}/sessions`).then(r => {
      setSessionId(r.data.session_id);
      setProgress({ correct: 0, total: r.data.total_cells, words: 0, totalWords });
      startTimeRef.current = Date.now();
    });
  }, [puzzle, id]);

  useEffect(() => {
    if (completed) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [completed]);

  const flushUpdates = useCallback(async () => {
    if (!sessionId || pendingRef.current.length === 0) return;
    const updates = [...pendingRef.current];
    pendingRef.current = [];
    try {
      const { data } = await api.patch(`/sessions/${sessionId}`, { cell_updates: updates });
      setProgress(p => ({
        ...p,
        correct: data.correct_cells,
        total: data.total_cells,
        words: data.words_completed,
        totalWords: data.total_words ?? p.totalWords,
      }));
      if (data.completed) { setCompleted(true); setScore(data.score); }
      if (data.correct_cells > 0) {
        setCorrectCells(prev => {
          const next = new Set(prev);
          for (const u of updates) {
            const k = `${u.row},${u.col}`;
            if (userValues.get(k) === puzzle?.grid[u.row][u.col]?.letter) next.add(k);
          }
          return next;
        });
      }
    } catch { /* retry on next change */ }
  }, [sessionId, userValues, puzzle]);

  function handleCellChange(update: CellValue) {
    setUserValues(prev => {
      const next = new Map(prev);
      next.set(`${update.row},${update.col}`, update.value);
      return next;
    });
    pendingRef.current.push(update);
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flushUpdates, 800);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  if (!puzzle) return <div className={styles.loading}>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>{puzzle.title_kn}</h2>
          <p className={styles.sub}>{puzzle.title}</p>
        </div>
        <div className={styles.stats}>
          <span>⏱ {formatTime(elapsed)}</span>
          <span>{progress.correct}/{progress.total} ಅಕ್ಷರ</span>
          <span className={styles.wordStat}>{progress.words}/{progress.totalWords} ಪದ</span>
          {completed && <span className={styles.done}>✅ ಪೂರ್ಣ! ಸ್ಕೋರ್: {score}</span>}
        </div>
      </header>

      {completed && (
        <div className={styles.banner}>
          <div>🎉 ಅಭಿನಂದನೆ! ನೀವು ಪಜಲ್ ಪೂರ್ಣ ಮಾಡಿದ್ದೀರಿ!</div>
          <div className={styles.bannerStats}>
            <span>ಸ್ಕೋರ್: <strong>{score}</strong></span>
            <span>ಪದಗಳು: <strong>{progress.words}/{progress.totalWords}</strong></span>
            <span>ಸಮಯ: <strong>{formatTime(elapsed)}</strong></span>
          </div>
          {!user && (
            <div className={styles.bannerCta}>
              ಸ್ಕೋರ್ ಉಳಿಸಲು <a href="/register">ನೋಂದಾಯಿಸಿ</a> ಅಥವಾ <a href="/login">ಲಾಗಿನ್</a> ಮಾಡಿ
            </div>
          )}
        </div>
      )}

      <div className={styles.playArea}>
        <CrosswordGrid
          grid={puzzle.grid}
          clues={puzzle.clues}
          userValues={userValues}
          onCellChange={handleCellChange}
          correctCells={correctCells}
          completed={completed}
        />
        <aside className={styles.sidebar}>
          <CluePanel
            clues={puzzle.clues}
            activeClueNumber={activeClue?.number}
            activeDirection={activeClue?.direction}
            onClueClick={(c: ClueEntry) => setActiveClue({ number: c.number, direction: c.direction })}
          />
        </aside>
      </div>
    </main>
  );
}
