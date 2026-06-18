import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPuzzles } from '../../services/puzzleService';
import { PuzzleSummary } from '../../types';

const DIFF_LABEL: Record<string, string> = { easy: 'ಸುಲಭ', medium: 'ಮಧ್ಯಮ', hard: 'ಕಷ್ಟ' };

export default function StaticAdmin() {
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPuzzles().then(d => setPuzzles(d.puzzles)).finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>ಪಜಲ್ ಪಟ್ಟಿ (Static)</h2>
      {loading && <p>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</p>}
      {!loading && puzzles.length === 0 && <p>ಯಾವುದೇ ಪಜಲ್ ಇಲ್ಲ</p>}
      {!loading && puzzles.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
              <th style={th}>ID</th>
              <th style={th}>ಶೀರ್ಷಿಕೆ</th>
              <th style={th}>Title</th>
              <th style={th}>ಕಷ್ಟ</th>
              <th style={th}>ಆಟ</th>
            </tr>
          </thead>
          <tbody>
            {puzzles.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>{p.id}</td>
                <td style={td}>{p.title_kn}</td>
                <td style={td}>{p.title}</td>
                <td style={td}>{DIFF_LABEL[p.difficulty] ?? p.difficulty}</td>
                <td style={td}>
                  <Link to={`/puzzle/${p.id}`} style={{ color: '#1a73e8' }}>▶ ಆಡಿ</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const th: React.CSSProperties = { padding: '0.6rem 0.75rem', fontWeight: 600, fontSize: '0.85rem' };
const td: React.CSSProperties = { padding: '0.6rem 0.75rem', fontSize: '0.9rem' };
