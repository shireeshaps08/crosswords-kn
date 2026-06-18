import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPuzzles } from '../../services/puzzleService';
import { PuzzleSummary } from '../../types';
import styles from '../admin/AdminDashboard.module.css';

const DIFF_LABEL: Record<string, string> = { easy: 'ಸುಲಭ', medium: 'ಮಧ್ಯಮ', hard: 'ಕಷ್ಟ' };

export default function StaticAdmin() {
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPuzzles().then(d => setPuzzles(d.puzzles)).finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h2>Admin — ಪಜಲ್ ನಿರ್ವಹಣೆ</h2>
        <span style={{ fontSize: '0.8rem', color: '#888' }}>Demo (static)</span>
      </div>

      {loading && <p className={styles.msg}>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</p>}
      {!loading && puzzles.length === 0 && <p className={styles.msg}>ಯಾವುದೇ ಪಜಲ್ ಇಲ್ಲ</p>}
      {!loading && puzzles.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ಶೀರ್ಷಿಕೆ</th>
              <th>ತೊಂದರೆ</th>
              <th>ಕ್ರಿಯೆಗಳು</th>
            </tr>
          </thead>
          <tbody>
            {puzzles.map(p => (
              <tr key={p.id}>
                <td>
                  <div className={styles.titleKn}>{p.title_kn}</div>
                  <div className={styles.titleEn}>{p.title}</div>
                </td>
                <td>
                  <span className={`${styles.diff} ${styles[p.difficulty]}`}>
                    {DIFF_LABEL[p.difficulty] ?? p.difficulty}
                  </span>
                </td>
                <td className={styles.actions}>
                  <Link to={`/puzzle/${p.id}`} className={styles.btnPreview}>▶ ಆಡಿ</Link>
                  <Link to={`/manage-xk9p2/puzzle/${p.id}/edit`} className={styles.btnEdit}>✏️ Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
