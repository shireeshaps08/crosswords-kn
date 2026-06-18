import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPuzzles } from '../services/puzzleService';
import { PuzzleSummary } from '../types';
import styles from './PuzzleList.module.css';

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'ಸುಲಭ', medium: 'ಮಧ್ಯಮ', hard: 'ಕಷ್ಟ' };

export default function PuzzleList() {
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([]);
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPuzzles(difficulty ? { difficulty } : undefined)
      .then(data => setPuzzles(data.puzzles))
      .finally(() => setLoading(false));
  }, [difficulty]);

  return (
    <main className={styles.container}>
      <h2>ಪಜಲ್‌ಗಳು</h2>
      <div className={styles.filters}>
        {['', 'easy', 'medium', 'hard'].map(d => (
          <button key={d} className={difficulty === d ? styles.active : ''} onClick={() => setDifficulty(d)}>
            {d ? DIFFICULTY_LABEL[d] : 'ಎಲ್ಲ'}
          </button>
        ))}
      </div>
      {loading ? <p className={styles.msg}>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</p> : (
        <div className={styles.grid}>
          {puzzles.length === 0 && <p className={styles.msg}>ಯಾವುದೇ ಪಜಲ್ ಇಲ್ಲ</p>}
          {puzzles.map(p => (
            <Link key={p.id} to={`/puzzle/${p.id}`} className={styles.card}>
              <span className={`${styles.badge} ${styles[p.difficulty]}`}>{DIFFICULTY_LABEL[p.difficulty]}</span>
              <h3>{p.title_kn}</h3>
              <p className={styles.sub}>{p.title}</p>
              <p className={styles.meta}>{p.play_count} ಬಾರಿ ಆಡಲಾಗಿದೆ</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
