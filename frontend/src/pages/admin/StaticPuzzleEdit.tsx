import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPuzzle } from '../../services/puzzleService';
import { Puzzle, ClueEntry } from '../../types';

const STORAGE_KEY = (id: string) => `static-clues-${id}`;

export default function StaticPuzzleEdit() {
  const { id } = useParams<{ id: string }>();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [clues, setClues] = useState<ClueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPuzzle(id).then(r => {
      const p = r.puzzle;
      setPuzzle(p);

      const base: ClueEntry[] = [
        ...(p.clues?.across ?? []),
        ...(p.clues?.down ?? []),
      ];
      const stored = localStorage.getItem(STORAGE_KEY(id));
      if (stored) {
        try {
          const overrides: Record<string, { clue: string; answer: string }> = JSON.parse(stored);
          setClues(base.map(c => {
            const k = `${c.number}-${c.direction}`;
            return overrides[k] ? { ...c, ...overrides[k] } : c;
          }));
          return;
        } catch { /* fall through */ }
      }
      setClues(base);
    }).finally(() => setLoading(false));
  }, [id]);

  function handleChange(idx: number, field: 'clue' | 'answer', value: string) {
    setClues(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    setSaved(false);
  }

  function handleSave() {
    if (!id) return;
    const overrides: Record<string, { clue: string; answer: string }> = {};
    for (const c of clues) overrides[`${c.number}-${c.direction}`] = { clue: c.clue, answer: c.answer };
    localStorage.setItem(STORAGE_KEY(id), JSON.stringify(overrides));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (!id || !puzzle) return;
    localStorage.removeItem(STORAGE_KEY(id));
    setClues([...(puzzle.clues?.across ?? []), ...(puzzle.clues?.down ?? [])]);
    setSaved(false);
  }

  if (loading) return <div style={{ padding: '2rem' }}>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</div>;
  if (!puzzle)  return <div style={{ padding: '2rem' }}>Puzzle not found</div>;

  const across = clues.filter(c => c.direction === 'across');
  const down   = clues.filter(c => c.direction === 'down');

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', fontFamily: 'var(--font-kn)', margin: 0 }}>{puzzle.title_kn}</h2>
          <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{puzzle.title} — {puzzle.difficulty}</p>
        </div>
        <Link to="/manage-xk9p2" style={{ color: '#666', fontSize: '0.85rem', textDecoration: 'none' }}>← ಹಿಂದೆ</Link>
      </div>

      <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#795548' }}>
        Demo mode — edits are saved to your browser's local storage only.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <ClueSection title="ಎಡದಿಂದ ಬಲಕ್ಕೆ (Across)" clues={across} allClues={clues} onChange={handleChange} />
        <ClueSection title="ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ (Down)"   clues={down}   allClues={clues} onChange={handleChange} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <button onClick={handleSave} style={btnPrimary}>
          {saved ? '✅ Saved!' : 'ಉಳಿಸಿ (Save)'}
        </button>
        <button onClick={handleReset} style={btnSecondary}>Reset to original</button>
        <Link to={`/puzzle/${id}`} style={{ ...btnSecondary, textDecoration: 'none' }}>▶ Play puzzle</Link>
      </div>
    </main>
  );
}

function ClueSection({
  title, clues, allClues, onChange,
}: {
  title: string;
  clues: ClueEntry[];
  allClues: ClueEntry[];
  onChange: (idx: number, field: 'clue' | 'answer', value: string) => void;
}) {
  return (
    <section>
      <h3 style={{ fontFamily: 'var(--font-kn)', fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>{title}</h3>
      {clues.map(c => {
        const idx = allClues.findIndex(x => x.number === c.number && x.direction === c.direction);
        return (
          <div key={`${c.number}-${c.direction}`} style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
              {c.number}. <span style={{ color: '#888', fontWeight: 400, fontSize: '0.8rem' }}>({c.length} ಅಕ್ಷರ)</span>
            </div>
            <div style={{ marginBottom: '0.3rem' }}>
              <label style={labelStyle}>ಸುಳಿವು (Clue)</label>
              <input
                style={inputStyle}
                value={c.clue}
                onChange={e => onChange(idx, 'clue', e.target.value)}
                placeholder="clue..."
              />
            </div>
            <div>
              <label style={labelStyle}>ಉತ್ತರ (Answer)</label>
              <input
                style={{ ...inputStyle, fontFamily: 'var(--font-kn)' }}
                value={c.answer}
                onChange={e => onChange(idx, 'answer', e.target.value)}
                placeholder="answer..."
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' };
const btnSecondary: React.CSSProperties = { background: '#f4f6f7', color: '#444', border: '1px solid #d5d8dc', padding: '0.5rem 1.25rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem', display: 'inline-block' };
