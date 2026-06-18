import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPuzzle } from '../../services/puzzleService';
import { Puzzle, ClueEntry, GridCell } from '../../types';

const STORAGE_KEY = (id: string) => `static-clues-${id}`;

export default function StaticPuzzleEdit() {
  const { id } = useParams<{ id: string }>();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [clues, setClues] = useState<ClueEntry[]>([]);
  const [gridLetters, setGridLetters] = useState<Map<string, string>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    fetchPuzzle(id).then(r => {
      const p = r.puzzle;
      setPuzzle(p);

      const src = p.solution ?? p.grid;
      const letters = new Map<string, string>();
      for (const row of src) {
        for (const cell of row) {
          if (!cell.blocked && cell.letter) letters.set(`${cell.row},${cell.col}`, cell.letter);
        }
      }
      setGridLetters(letters);

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

  function getCellClue(row: number, col: number): ClueEntry | null {
    if (!puzzle) return null;
    const all = [...(puzzle.clues.across ?? []), ...(puzzle.clues.down ?? [])].filter(c => c.direction === direction);
    for (const c of all) {
      for (let i = 0; i < c.length; i++) {
        const r = direction === 'across' ? c.row : c.row + i;
        const cc = direction === 'across' ? c.col + i : c.col;
        if (r === row && cc === col) return c;
      }
    }
    return null;
  }

  function getHighlightedCells(): Set<string> {
    if (!puzzle || !selectedCell) return new Set();
    const clue = getCellClue(selectedCell.row, selectedCell.col);
    if (!clue) return new Set();
    const cells = new Set<string>();
    for (let i = 0; i < clue.length; i++) {
      const r = direction === 'across' ? clue.row : clue.row + i;
      const c = direction === 'across' ? clue.col + i : clue.col;
      cells.add(`${r},${c}`);
    }
    return cells;
  }

  function handleCellClick(cell: GridCell) {
    if (cell.blocked) return;
    if (selectedCell?.row === cell.row && selectedCell?.col === cell.col) {
      setDirection(d => d === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ row: cell.row, col: cell.col });
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!puzzle || !selectedCell) return;
    const { row, col } = selectedCell;

    if (e.key === 'Backspace') {
      const k = `${row},${col}`;
      if (gridLetters.has(k)) {
        setGridLetters(prev => { const n = new Map(prev); n.delete(k); return n; });
      } else {
        moveCursor(-1);
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowRight') { moveAbs(row, col + 1); e.preventDefault(); return; }
    if (e.key === 'ArrowLeft')  { moveAbs(row, col - 1); e.preventDefault(); return; }
    if (e.key === 'ArrowDown')  { moveAbs(row + 1, col); e.preventDefault(); return; }
    if (e.key === 'ArrowUp')    { moveAbs(row - 1, col); e.preventDefault(); return; }
  }

  function handleInput(e: React.FormEvent<HTMLInputElement>) {
    if (!puzzle || !selectedCell) return;
    const val = (e.nativeEvent as InputEvent).data ?? '';
    if (!val) return;
    const k = `${selectedCell.row},${selectedCell.col}`;
    setGridLetters(prev => { const n = new Map(prev); n.set(k, val); return n; });
    moveCursor(1);
    (e.target as HTMLInputElement).value = '';
  }

  function moveAbs(r: number, c: number) {
    if (!puzzle) return;
    const g = puzzle.grid;
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return;
    if (g[r][c].blocked) return;
    setSelectedCell({ row: r, col: c });
  }

  function moveCursor(delta: number) {
    if (!puzzle || !selectedCell) return;
    const g = puzzle.grid;
    let { row, col } = selectedCell;
    for (let step = 0; step < g.length * g[0].length; step++) {
      if (direction === 'across') col += delta;
      else row += delta;
      if (row < 0 || row >= g.length || col < 0 || col >= g[0].length) return;
      if (!g[row][col].blocked) { setSelectedCell({ row, col }); return; }
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</div>;
  if (!puzzle)  return <div style={{ padding: '2rem' }}>Puzzle not found</div>;

  const across = clues.filter(c => c.direction === 'across');
  const down   = clues.filter(c => c.direction === 'down');
  const highlighted = getHighlightedCells();
  const activeClue = selectedCell ? getCellClue(selectedCell.row, selectedCell.col) : null;
  const CELL = 44;

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
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

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Editable grid */}
        <div>
          {activeClue ? (
            <div style={{ marginBottom: '0.75rem', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.9rem', fontFamily: 'var(--font-kn)', maxWidth: CELL * puzzle.grid[0].length }}>
              <strong>{activeClue.number}{direction === 'across' ? 'A' : 'D'}.</strong> {activeClue.clue}
              <span style={{ color: '#888', marginLeft: 6, fontSize: '0.8rem' }}>({activeClue.length} ಅಕ್ಷರ)</span>
            </div>
          ) : (
            <div style={{ marginBottom: '0.75rem', height: '2.5rem' }} />
          )}

          {/* Hidden input to capture keystrokes */}
          <input
            ref={inputRef}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            style={{ position: 'fixed', opacity: 0, width: 1, height: 1, pointerEvents: 'none', top: 0, left: 0 }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${puzzle.grid[0].length}, ${CELL}px)`,
              border: '2px solid #333',
              width: 'fit-content',
              cursor: 'pointer',
            }}
          >
            {puzzle.grid.map((row, ri) =>
              row.map((cell, ci) => {
                const k = `${ri},${ci}`;
                const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;
                const isHighlighted = highlighted.has(k);
                const letter = gridLetters.get(k) ?? '';
                let bg = '#fff';
                if (cell.blocked) bg = '#222';
                else if (isSelected) bg = '#f9c74f';
                else if (isHighlighted) bg = '#d0eaff';

                return (
                  <div
                    key={k}
                    onClick={() => handleCellClick(cell)}
                    style={{
                      width: CELL,
                      height: CELL,
                      background: bg,
                      border: '1px solid #aaa',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      userSelect: 'none',
                    }}
                  >
                    {!cell.blocked && cell.number && (
                      <span style={{ position: 'absolute', top: 1, left: 2, fontSize: 9, lineHeight: 1, color: '#555', fontWeight: 600 }}>
                        {cell.number}
                      </span>
                    )}
                    {!cell.blocked && (
                      <span style={{ fontSize: 18, fontFamily: 'var(--font-kn)', lineHeight: 1 }}>
                        {letter}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.5rem' }}>
            Click to select · click again to toggle across/down · type to fill
          </p>
        </div>

        {/* Clue editor */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <ClueSection title="ಎಡದಿಂದ ಬಲಕ್ಕೆ (Across)" clues={across} allClues={clues} onChange={handleChange} activeClue={activeClue && direction === 'across' ? activeClue : null} />
            <ClueSection title="ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ (Down)"   clues={down}   allClues={clues} onChange={handleChange} activeClue={activeClue && direction === 'down'   ? activeClue : null} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button onClick={handleSave} style={btnPrimary}>
              {saved ? '✅ Saved!' : 'ಉಳಿಸಿ (Save)'}
            </button>
            <button onClick={handleReset} style={btnSecondary}>Reset to original</button>
            <Link to={`/puzzle/${id}`} style={{ ...btnSecondary, textDecoration: 'none' }}>▶ Play puzzle</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function ClueSection({
  title, clues, allClues, onChange, activeClue,
}: {
  title: string;
  clues: ClueEntry[];
  allClues: ClueEntry[];
  onChange: (idx: number, field: 'clue' | 'answer', value: string) => void;
  activeClue: ClueEntry | null;
}) {
  return (
    <section>
      <h3 style={{ fontFamily: 'var(--font-kn)', fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>{title}</h3>
      {clues.map(c => {
        const idx = allClues.findIndex(x => x.number === c.number && x.direction === c.direction);
        const isActive = activeClue?.number === c.number && activeClue?.direction === c.direction;
        return (
          <div
            key={`${c.number}-${c.direction}`}
            style={{
              marginBottom: '1.25rem',
              padding: isActive ? '0.5rem' : undefined,
              background: isActive ? '#e8f5e9' : undefined,
              borderRadius: isActive ? 4 : undefined,
              border: isActive ? '1px solid #a5d6a7' : undefined,
            }}
          >
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
