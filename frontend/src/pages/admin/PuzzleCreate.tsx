import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { GridCell, ClueEntry } from '../../types';
import GridBuilder from '../../components/admin/GridBuilder';
import ClueEditor from '../../components/admin/ClueEditor';
import CrosswordGrid from '../../components/CrosswordGrid';
import {
  makeEmptyGrid, computeSlots, applyNumbers, buildSolution, validatePuzzle
} from '../../utils/gridUtils';
import styles from './PuzzleCreate.module.css';

type Step = 'layout' | 'clues' | 'preview';

const STEP_LABELS: Record<Step, string> = {
  layout:  '1. Grid Layout',
  clues:   '2. Clues & Answers',
  preview: '3. Preview & Publish',
};

export default function PuzzleCreate() {
  const navigate = useNavigate();
  const [step, setStep]           = useState<Step>('layout');
  const [rows, setRows]           = useState(9);
  const [cols, setCols]           = useState(9);
  const [grid, setGrid]           = useState<GridCell[][]>(makeEmptyGrid(9, 9));
  const [slots, setSlots]         = useState<ClueEntry[]>([]);
  const [title, setTitle]         = useState('');
  const [titleKn, setTitleKn]     = useState('');
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('easy');
  const [errors, setErrors]       = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);

  // Recompute slots whenever grid changes
  useEffect(() => {
    const newSlots = computeSlots(grid);
    setSlots(prev => newSlots.map(ns => {
      const existing = prev.find(p => p.number === ns.number && p.direction === ns.direction);
      return existing ? { ...ns, clue: existing.clue, answer: existing.answer, clue_en: existing.clue_en } : ns;
    }));
  }, [grid]);

  function handleResize(newRows: number, newCols: number) {
    setRows(newRows);
    setCols(newCols);
    setGrid(makeEmptyGrid(newRows, newCols));
    setSlots([]);
  }

  function goToClues() {
    if (computeSlots(grid).length === 0) {
      setErrors(['Grid has no word slots. Block some cells to create words.']);
      return;
    }
    setErrors([]);
    setStep('clues');
  }

  function goToPreview() {
    // Allow preview with partial data so admin can see the grid layout
    setErrors([]);
    setStep('preview');
  }

  async function savePuzzle(publish: boolean) {
    const errs = validatePuzzle(slots);
    if (!title.trim()) errs.unshift('English title is required');
    if (!titleKn.trim()) errs.unshift('Kannada title is required');
    if (errs.length) { setErrors(errs); setStep('clues'); return; }
    setSaving(true);
    try {
      const numberedGrid = applyNumbers(grid, slots);
      const solution     = buildSolution(numberedGrid, slots);
      const cluesObj     = {
        across: slots.filter(s => s.direction === 'across'),
        down:   slots.filter(s => s.direction === 'down'),
      };
      await api.post('/puzzles', {
        title, title_kn: titleKn, difficulty,
        grid: numberedGrid, clues: cluesObj, solution,
        published: publish,
      });
      navigate('/admin');
    } catch (err: any) {
      setErrors([err.response?.data?.error ?? 'ಉಳಿಸಲು ವಿಫಲ']);
    } finally {
      setSaving(false);
    }
  }

  const previewGrid = applyNumbers(grid, slots);
  const previewClues = {
    across: slots.filter(s => s.direction === 'across'),
    down:   slots.filter(s => s.direction === 'down'),
  };

  return (
    <main className={styles.container}>
      <div className={styles.topBar}>
        <h2>ಹೊಸ ಪಜಲ್ ರಚಿಸಿ</h2>
        <div className={styles.steps}>
          {(['layout','clues','preview'] as Step[]).map(s => (
            <span key={s} className={`${styles.stepLabel} ${step === s ? styles.activeStep : ''}`}>
              {STEP_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* Puzzle meta — always visible */}
      <div className={styles.meta}>
        <label>
          Title (English) *
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Kannada Words - Level 1" />
        </label>
        <label>
          ಶೀರ್ಷಿಕೆ (Kannada) *
          <input value={titleKn} onChange={e => setTitleKn(e.target.value)} placeholder="ಕನ್ನಡ ಪದಗಳು" lang="kn" />
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

      {/* ── Step 1: Grid Layout ── */}
      {step === 'layout' && (
        <div className={styles.stepContent}>
          <div className={styles.sizeRow}>
            <label>
              Rows
              <input type="number" min={3} max={15} value={rows}
                onChange={e => handleResize(Number(e.target.value), cols)} />
            </label>
            <label>
              Columns
              <input type="number" min={3} max={15} value={cols}
                onChange={e => handleResize(rows, Number(e.target.value))} />
            </label>
          </div>
          <GridBuilder grid={grid} onChange={setGrid} />
          <div className={styles.navRow}>
            <button className={styles.btnPrimary} onClick={goToClues}>
              ಮುಂದೆ: Clues & Answers →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Clues & Answers ── */}
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
            <button className={styles.btnPrimary} onClick={goToPreview}>ಮುಂದೆ: Preview →</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview & Publish ── */}
      {step === 'preview' && (
        <div className={styles.stepContent}>
          <p className={styles.sectionLabel}>Player view — verify it looks correct before publishing</p>
          <div className={styles.previewArea}>
            {/* Static read-only grid for preview */}
            <div>
              <div
                className={styles.previewGrid}
                style={{ gridTemplateColumns: `repeat(${previewGrid[0]?.length ?? 0}, 1fr)` }}
              >
                {previewGrid.flat().map(cell => (
                  <div
                    key={`${cell.row},${cell.col}`}
                    className={cell.blocked ? styles.previewCellBlocked : styles.previewCell}
                  >
                    {!cell.blocked && cell.number && (
                      <span className={styles.previewCellNum}>{cell.number}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.previewClues}>
              <h4>ಅಡ್ಡ (Across)</h4>
              {previewClues.across.length === 0
                ? <p className={styles.noClues}>No across clues yet</p>
                : <ol>
                    {previewClues.across.map(c => (
                      <li key={c.number}>
                        <strong>{c.number}.</strong>{' '}
                        {c.clue || <em className={styles.empty}>clue empty</em>}
                        {c.answer && <span className={styles.answerHint}> [{c.answer}]</span>}
                      </li>
                    ))}
                  </ol>
              }
              <h4>ಕೆಳಗೆ (Down)</h4>
              {previewClues.down.length === 0
                ? <p className={styles.noClues}>No down clues yet</p>
                : <ol>
                    {previewClues.down.map(c => (
                      <li key={c.number}>
                        <strong>{c.number}.</strong>{' '}
                        {c.clue || <em className={styles.empty}>clue empty</em>}
                        {c.answer && <span className={styles.answerHint}> [{c.answer}]</span>}
                      </li>
                    ))}
                  </ol>
              }
            </div>
          </div>
          <div className={styles.navRow}>
            <button className={styles.btnSecondary} onClick={() => setStep('clues')}>← Clues</button>
            <button className={styles.btnDraft} onClick={() => savePuzzle(false)} disabled={saving}>
              {saving ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : '📝 ಡ್ರಾಫ್ಟ್ ಉಳಿಸಿ'}
            </button>
            <button className={styles.btnPublish} onClick={() => savePuzzle(true)} disabled={saving}>
              {saving ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : '✅ ಪ್ರಕಟಿಸಿ'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
