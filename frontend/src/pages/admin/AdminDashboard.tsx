import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './AdminDashboard.module.css';

interface PuzzleRow {
  id: string;
  title: string;
  title_kn: string;
  difficulty: string;
  published: boolean;
  play_count: number;
  created_by: string;
  created_at: string;
}

const DIFF_LABEL: Record<string, string> = { easy: 'ಸುಲಭ', medium: 'ಮಧ್ಯಮ', hard: 'ಕಷ್ಟ' };

export default function AdminDashboard() {
  const [puzzles, setPuzzles] = useState<PuzzleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/puzzles').then(r => setPuzzles(r.data.puzzles)).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`"${title}" ಅಳಿಸಬೇಕೇ?`)) return;
    setBusy(id);
    await api.delete(`/admin/puzzles/${id}`);
    setPuzzles(p => p.filter(x => x.id !== id));
    setBusy(null);
  }

  async function handleTogglePublish(id: string) {
    setBusy(id);
    const { data } = await api.patch(`/admin/puzzles/${id}/publish`);
    setPuzzles(p => p.map(x => x.id === id ? { ...x, published: data.published } : x));
    setBusy(null);
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h2>Admin — ಪಜಲ್ ನಿರ್ವಹಣೆ</h2>
        <Link to="/admin/puzzle/new" className={styles.btnNew}>+ ಹೊಸ ಪಜಲ್</Link>
      </div>

      {loading ? <p className={styles.msg}>ಲೋಡ್...</p> : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ಶೀರ್ಷಿಕೆ</th>
              <th>ತೊಂದರೆ</th>
              <th>ಸ್ಥಿತಿ</th>
              <th>ಆಟಗಳು</th>
              <th>ರಚಿಸಿದವರು</th>
              <th>ಕ್ರಿಯೆಗಳು</th>
            </tr>
          </thead>
          <tbody>
            {puzzles.length === 0 && (
              <tr><td colSpan={6} className={styles.msg}>ಯಾವುದೇ ಪಜಲ್ ಇಲ್ಲ</td></tr>
            )}
            {puzzles.map(p => (
              <tr key={p.id}>
                <td>
                  <div className={styles.titleKn}>{p.title_kn}</div>
                  <div className={styles.titleEn}>{p.title}</div>
                </td>
                <td><span className={`${styles.diff} ${styles[p.difficulty]}`}>{DIFF_LABEL[p.difficulty]}</span></td>
                <td>
                  <span className={p.published ? styles.published : styles.draft}>
                    {p.published ? '✅ Published' : '📝 Draft'}
                  </span>
                </td>
                <td>{p.play_count}</td>
                <td className={styles.muted}>{p.created_by ?? '—'}</td>
                <td className={styles.actions}>
                  <button
                    className={styles.btnToggle}
                    onClick={() => handleTogglePublish(p.id)}
                    disabled={busy === p.id}
                  >
                    {p.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    className={styles.btnDelete}
                    onClick={() => handleDelete(p.id, p.title_kn)}
                    disabled={busy === p.id}
                  >
                    ಅಳಿಸು
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
