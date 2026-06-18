import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

type FilterTab = 'all' | 'draft' | 'published';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [puzzles, setPuzzles] = useState<PuzzleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');

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

  const filtered = puzzles.filter(p =>
    filter === 'draft'     ? !p.published :
    filter === 'published' ?  p.published : true
  );

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h2>Admin — ಪಜಲ್ ನಿರ್ವಹಣೆ</h2>
        <Link to="/admin/puzzle/new" className={styles.btnNew}>+ ಹೊಸ ಪಜಲ್</Link>
      </div>

      {!loading && (
        <div className={styles.filterTabs}>
          {(['all', 'draft', 'published'] as FilterTab[]).map(f => {
            const count = f === 'all' ? puzzles.length
              : f === 'draft' ? puzzles.filter(p => !p.published).length
              : puzzles.filter(p => p.published).length;
            return (
              <button
                key={f}
                className={`${styles.tab} ${filter === f ? styles.tabActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'ಎಲ್ಲ' : f === 'draft' ? '📝 ಡ್ರಾಫ್ಟ್' : '✅ ಪ್ರಕಟಿತ'}
                <span className={styles.tabCount}>({count})</span>
              </button>
            );
          })}
        </div>
      )}

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
            {filtered.length === 0 && (
              <tr><td colSpan={6} className={styles.msg}>ಯಾವುದೇ ಪಜಲ್ ಇಲ್ಲ</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <a
                    href={p.published ? `/puzzle/${p.id}` : `/admin/preview/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.titleLink}
                  >
                    <div className={styles.titleKn}>{p.title_kn}</div>
                    <div className={styles.titleEn}>{p.title}</div>
                  </a>
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
                  <a
                    className={styles.btnPreview}
                    href={`/admin/preview/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    👁 Preview
                  </a>
                  <button
                    className={styles.btnEdit}
                    onClick={() => navigate(`/admin/puzzle/${p.id}/edit`)}
                    disabled={busy === p.id}
                  >
                    ✏️ Edit
                  </button>
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
