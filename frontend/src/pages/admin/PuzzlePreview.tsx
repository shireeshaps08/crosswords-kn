import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Puzzle, CellValue, ClueEntry } from '../../types';
import CrosswordGrid from '../../components/CrosswordGrid';
import CluePanel from '../../components/CluePanel';
import styles from '../PuzzlePlay.module.css';
import adminStyles from './PuzzlePreview.module.css';


export default function PuzzlePreview() {
  const { id } = useParams<{ id: string }>();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<Puzzle['grid']>([]);
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [userValues, setUserValues] = useState<Map<string, string>>(new Map());
  const [activeClue, setActiveClue] = useState<{ number: number; direction: 'across' | 'down' } | undefined>();

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/puzzles/${id}/preview`).then(r => {
      setPuzzle(r.data.puzzle);
      setGrid(r.data.puzzle.grid);
      setPublished(r.data.puzzle.published ?? false);
    });
  }, [id]);

  function handleToggleBlock(row: number, col: number) {
    setGrid(prev => prev.map((r, ri) =>
      r.map((cell, ci) =>
        ri === row && ci === col ? { ...cell, blocked: !cell.blocked } : cell
      )
    ));
  }

  function handleCellChange(update: CellValue) {
    setUserValues(prev => {
      const next = new Map(prev);
      next.set(`${update.row},${update.col}`, update.value);
      return next;
    });
  }

  async function handleTogglePublish() {
    if (!id) return;
    setBusy(true);
    const { data } = await api.patch(`/admin/puzzles/${id}/publish`);
    setPublished(data.published);
    setBusy(false);
  }

  if (!puzzle) return <div className={styles.loading}>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>{puzzle.title_kn}</h2>
          <p className={styles.sub}>
            {puzzle.title}
            {!published && (
              <span className={adminStyles.draftBadge}>📝 Draft Preview</span>
            )}
          </p>
        </div>
        <div className={adminStyles.headerActions}>
          <button
            className={published ? adminStyles.btnUnpublish : adminStyles.btnPublish}
            onClick={handleTogglePublish}
            disabled={busy}
          >
            {busy ? '...' : published ? 'Unpublish' : 'Publish'}
          </button>
          <Link to="/admin" className={adminStyles.backLink}>← Admin</Link>
        </div>
      </header>

      <div className={styles.playArea}>
        <CrosswordGrid
          grid={grid}
          clues={puzzle.clues}
          userValues={userValues}
          onCellChange={handleCellChange}
          onCellToggleBlock={handleToggleBlock}
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
