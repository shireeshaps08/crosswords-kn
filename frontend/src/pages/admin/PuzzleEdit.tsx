import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { GridCell, ClueEntry } from '../../types';
import GridBuilder from '../../components/admin/GridBuilder';
import ClueEditor from '../../components/admin/ClueEditor';
import { computeSlots, applyNumbers, buildSolution } from '../../utils/gridUtils';
import styles from './PuzzleCreate.module.css';

type Step = 'layout' | 'clues' | 'save';

export default function PuzzleEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep]             = useState<Step>('layout');
  const [title, setTitle]           = useState('');
  const [titleKn, setTitleKn]       = useState('');
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [grid, setGrid]             = useState<GridCell[][]>([]);
  const [slots, setSlots]           = useState<ClueEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState<string[]>([]);
  const [saved, setSaved]           = useState(false);

  // Load existing puzzle
  useEffect(() => {
    if (!id) return;
    api.get(`/admin/puzzles/${id}/preview`).then(r => {
      const p = r.data.puzzle;
      setTitle(p.title);
      setTitleKn(p.title_kn);
      setDifficulty(p.difficulty);

      // Restore grid from DB (strip letter values so it becomes the layout grid)
      const loadedGrid: GridCell[][] = (p.grid ?? []).map((row: any[]) =>
        row.map((cell: any) => ({
          row: cell.row,
          col: cell.col,
          letter: '',
          blocked: cell.blocked ?? false,
          number: cell.number,
        }))
      );
      setGrid(loadedGrid);

      // Restore existing clue text, merged onto freshly computed slots
      const existingClues: ClueEntry[] = [
        ...(p.clues?.across ?? []),
        ...(p.clues?.down ?? []),
      ].map((c: any) => ({
        number: c.number,
        direction: c.direction as 'across'|'down',
        clue: c.clue ?? '',
        answer: c.answer ?? '',
        clue_en: c.clue_en ?? '',
        row: c.row ?? 0,
        col: c.col ?? 0,
        length: c.length ?? 0,
        cells: c.cells,
      }));

      const computed = computeSlots(loadedGrid);
      const merged = computed.map(ns => {
        const ex = existingClues.find(e => e.number === ns.number && e.direction === ns.direction);
        return ex ? { ...ns, clue: ex.clue, answer: ex.answer, clue_en: ex.clue_en } : ns;
      });
      setSlots(merged);
    }).finally(() => setLoading(false));
  }, [id]);

  // Recompute slots when grid changes, preserving existing clue text
  useEffect(() => {
    if (grid.length === 0) return;
    const computed = computeSlots(grid);
    setSlots(prev => computed.map(ns => {
      const ex = prev.find(p => p.number === ns.number && p.direction === ns.direction);
      return ex ? { ...ns, clue: ex.clue, answer: ex.answer, clue_en: ex.clue_en ?? '' } : ns;
    }));
  }, [grid]);

  async function handleSave() {
    if (!title.trim() || !titleKn.trim()) {
      setErrors(['Title fields are required']);
      return;
    }
    setSaving(true);
    setErrors([]);
    try {
      const numbered = applyNumbers(grid, slots);
      const solution = buildSolution(numbered, slots);
      await api.patch(`/admin/puzzles/${id}`, {
        title, title_kn: titleKn, difficulty,
        blocked: grid.map(row => row.map(c => c.blocked)),
        clues: {
          across: slots.filter(s => s.direction === 'across'),
          down:   slots.filter(s => s.direction === 'down'),
        },
        grid: numbered,
        solution,
      });
      setSaved(true);
      setTimeout(() => navigate('/admin'), 1200);
    } catch (err: any) {
      setErrors([err.response?.data?.error ?? 'ಉಳಿಸಲು ವಿಫಲ']);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.container}>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</div>;

  return (
    <main className={styles.container}>
      <div className={styles.topBar}>
        <h2>ಪಜಲ್ ಸಂಪಾದಿಸಿ</h2>
        <div className={styles.steps}>
          {(['layout','clues','save'] as Step[]).map(s => (
            <span key={s} className={`${styles.stepLabel} ${step === s ? styles.activeStep : ''}`}>
              {s === 'layout' ? '1. Grid Layout' : s === 'clues' ? '2. Clues & Answers' : '3. Save'}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.meta}>
        <label>
          Title (English) *
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <label>
          ಶೀರ್ಷಿಕೆ (Kannada) *
          <input value={titleKn} onChange={e => setTitleKn(e.target.value)} lang="kn" />
        </label>
        <label>
          Difficulty
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
            <option value="easy">ಸುಲಭ (Easy)</option>
            <option value="medium">ಮಧ್ಯಮ (Medium)</option>
            <option value="hard">ಕಷ್ಟ (Hard)</option>
          </select>
        </label>
      </div>

      {errors.length > 0 && (
        <ul className={styles.errors}>
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}

      {saved && (
        <div style={{ background: '#d5f5e3', border: '1px solid #27ae60', borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          ✅ ಉಳಿಸಲಾಗಿದೆ! Admin ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂದಿರುಗುತ್ತಿದ್ದೇನೆ...
        </div>
      )}

      {/* Step 1: Grid Layout */}
      {step === 'layout' && grid.length > 0 && (
        <div className={styles.stepContent}>
          <p className={styles.sectionLabel}>Click cells to toggle black/white</p>
          <GridBuilder grid={grid} onChange={setGrid} />
          <div className={styles.navRow}>
            <button className={styles.btnSecondary} onClick={() => navigate('/admin')}>← ರದ್ದು</button>
            <button className={styles.btnPrimary} onClick={() => setStep('clues')}>
              ಮುಂದೆ: Clues & Answers →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Clues & Answers */}
      {step === 'clues' && (
        <div className={styles.stepContent}>
          <div className={styles.cluesLayout}>
            <div className={styles.gridPreviewSmall}>
              <p className={styles.sectionLabel}>Grid reference</p>
              <GridBuilder grid={grid} onChange={setGrid} />
            </div>
            <div className={styles.clueEditorWrap}>
              <p className={styles.sectionLabel}>Enter answer + clue for each slot</p>
              <ClueEditor slots={slots} onChange={setSlots} />
            </div>
          </div>
          <div className={styles.navRow}>
            <button className={styles.btnSecondary} onClick={() => setStep('layout')}>← Grid Layout</button>
            <button className={styles.btnPrimary} onClick={() => setStep('save')}>ಮುಂದೆ: Save →</button>
          </div>
        </div>
      )}

      {/* Step 3: Save */}
      {step === 'save' && (
        <div className={styles.stepContent}>
          <p className={styles.sectionLabel}>Review and save as draft</p>
          <div className={styles.previewClues}>
            <h4>ಅಡ್ಡ (Across) — {slots.filter(s=>s.direction==='across').length} clues</h4>
            <ol>
              {slots.filter(s=>s.direction==='across').map(c => (
                <li key={c.number}>
                  <strong>{c.number}.</strong> {c.clue || <em className={styles.empty}>clue empty</em>}
                  {c.answer && <span className={styles.answerHint}> [{c.answer}]</span>}
                </li>
              ))}
            </ol>
            <h4>ಕೆಳಗೆ (Down) — {slots.filter(s=>s.direction==='down').length} clues</h4>
            <ol>
              {slots.filter(s=>s.direction==='down').map(c => (
                <li key={c.number}>
                  <strong>{c.number}.</strong> {c.clue || <em className={styles.empty}>clue empty</em>}
                  {c.answer && <span className={styles.answerHint}> [{c.answer}]</span>}
                </li>
              ))}
            </ol>
          </div>
          <div className={styles.navRow}>
            <button className={styles.btnSecondary} onClick={() => setStep('clues')}>← Clues</button>
            <button className={styles.btnDraft} onClick={handleSave} disabled={saving}>
              {saving ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : '💾 ಡ್ರಾಫ್ಟ್ ಉಳಿಸಿ'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
