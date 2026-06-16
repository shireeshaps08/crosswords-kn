import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { GridCell, ClueEntry, CellValue } from '../types';
import styles from './CrosswordGrid.module.css';
import KannadaKeyboard from './KannadaKeyboard';
import { processChar, commitBuffer, getBufferPreview, splitKannadaGraphemes } from '../utils/transliterate';

interface Props {
  grid: GridCell[][];
  clues: { across: ClueEntry[]; down: ClueEntry[] };
  userValues: Map<string, string>;
  onCellChange: (update: CellValue) => void;
  correctCells?: Set<string>;
  completed?: boolean;
}

type Direction = 'across' | 'down';

export default function CrosswordGrid({ grid, clues, userValues, onCellChange, correctCells, completed }: Props) {
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<Direction>('across');
  const inputRef = useRef<HTMLInputElement>(null);

  // English phonetic buffer for the currently selected cell (physical keyboard support)
  const inputBuffer = useRef<string>('');
  const [cellPreview, setCellPreview] = useState<string>('');

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const getActiveClue = useCallback((): ClueEntry | null => {
    if (!selected) return null;
    const list = direction === 'across' ? clues.across : clues.down;
    return list.find(c => {
      if (direction === 'across') return c.row === selected.row && selected.col >= c.col && selected.col < c.col + c.length;
      return c.col === selected.col && selected.row >= c.row && selected.row < c.row + c.length;
    }) ?? null;
  }, [selected, direction, clues]);

  const isHighlighted = useCallback((row: number, col: number): boolean => {
    const clue = getActiveClue();
    if (!clue) return false;
    if (direction === 'across') return clue.row === row && col >= clue.col && col < clue.col + clue.length;
    return clue.col === col && row >= clue.row && row < clue.row + clue.length;
  }, [getActiveClue, direction]);

  function resetBuffer() {
    inputBuffer.current = '';
    setCellPreview('');
  }

  function flushBuffer(row: number, col: number) {
    if (!inputBuffer.current) return;
    const value = commitBuffer(inputBuffer.current);
    if (value) onCellChange({ row, col, value });
    resetBuffer();
  }

  function getNextCell(row: number, col: number): { row: number; col: number } | null {
    if (direction === 'across') {
      for (let c = col + 1; c < cols; c++) if (!grid[row][c].blocked) return { row, col: c };
    } else {
      for (let r = row + 1; r < rows; r++) if (!grid[r][col].blocked) return { row: r, col };
    }
    return null;
  }

  function moveToNext(row: number, col: number) {
    const next = getNextCell(row, col);
    if (next) setSelected(next);
  }

  function moveToPrev(row: number, col: number) {
    if (direction === 'across') {
      for (let c = col - 1; c >= 0; c--) { if (!grid[row][c].blocked) { setSelected({ row, col: c }); return; } }
    } else {
      for (let r = row - 1; r >= 0; r--) { if (!grid[r][col].blocked) { setSelected({ row: r, col }); return; } }
    }
  }

  function handleCellClick(row: number, col: number) {
    if (grid[row][col].blocked) return;
    if (selected && (selected.row !== row || selected.col !== col)) {
      flushBuffer(selected.row, selected.col);
      resetBuffer();
    }
    if (selected?.row === row && selected?.col === col) {
      setDirection(d => d === 'across' ? 'down' : 'across');
    } else {
      setSelected({ row, col });
    }
    inputRef.current?.focus();
  }

  // ── On-screen Kannada keyboard handlers ────────────────────────────────────

  function handleKbChar(akshara: string) {
    if (!selected || completed) return;
    onCellChange({ row: selected.row, col: selected.col, value: akshara });
    resetBuffer();
    moveToNext(selected.row, selected.col);
  }

  function handleKbBackspace() {
    if (!selected || completed) return;
    const { row, col } = selected;
    const key = `${row},${col}`;
    if (userValues.get(key)) {
      onCellChange({ row, col, value: '' });
    } else {
      moveToPrev(row, col);
    }
  }

  // ── Physical / hardware keyboard handlers ──────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!selected || completed) return;
    const { row, col } = selected;

    if (e.key === 'ArrowRight') {
      flushBuffer(row, col); resetBuffer();
      setDirection('across');
      for (let c = col + 1; c < cols; c++) { if (!grid[row][c].blocked) { setSelected({ row, col: c }); break; } }
      return;
    }
    if (e.key === 'ArrowLeft') {
      flushBuffer(row, col); resetBuffer();
      setDirection('across');
      for (let c = col - 1; c >= 0; c--) { if (!grid[row][c].blocked) { setSelected({ row, col: c }); break; } }
      return;
    }
    if (e.key === 'ArrowDown') {
      flushBuffer(row, col); resetBuffer();
      setDirection('down');
      for (let r = row + 1; r < rows; r++) { if (!grid[r][col].blocked) { setSelected({ row: r, col }); break; } }
      return;
    }
    if (e.key === 'ArrowUp') {
      flushBuffer(row, col); resetBuffer();
      setDirection('down');
      for (let r = row - 1; r >= 0; r--) { if (!grid[r][col].blocked) { setSelected({ row: r, col }); break; } }
      return;
    }
    if (e.key === 'Backspace') {
      if (inputBuffer.current) {
        inputBuffer.current = inputBuffer.current.slice(0, -1);
        setCellPreview(inputBuffer.current ? getBufferPreview(inputBuffer.current) : '');
      } else {
        const key = `${row},${col}`;
        if (userValues.get(key)) {
          onCellChange({ row, col, value: '' });
        } else {
          moveToPrev(row, col);
        }
      }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      flushBuffer(row, col);
      moveToNext(row, col);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      flushBuffer(row, col);
      setDirection(d => d === 'across' ? 'down' : 'across');
    }
  }

  function handleKannadaText(text: string, startRow: number, startCol: number) {
    const aksharas = splitKannadaGraphemes(text);
    let row = startRow;
    let col = startCol;
    for (const akshara of aksharas) {
      onCellChange({ row, col, value: akshara });
      const next = getNextCell(row, col);
      if (!next) break;
      ({ row, col } = next);
    }
    setSelected({ row, col });
    resetBuffer();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || completed) return;
    const raw = e.target.value;
    if (!raw) return;
    if (inputRef.current) inputRef.current.value = '';

    const firstCp = (Array.from(raw)[0] ?? '').codePointAt(0) ?? 0;
    if (firstCp >= 0x0C80 && firstCp <= 0x0CFF) {
      handleKannadaText(raw, selected.row, selected.col);
      return;
    }

    // English phonetic — feed through transliterator
    let curRow = selected.row;
    let curCol = selected.col;
    let buf = inputBuffer.current;
    let moved = false;

    for (const char of Array.from(raw)) {
      const result = processChar(buf, char);
      buf = result.newBuffer;
      if (result.committed !== null) {
        onCellChange({ row: curRow, col: curCol, value: result.committed });
        if (result.advance) {
          const next = getNextCell(curRow, curCol);
          if (next) { curRow = next.row; curCol = next.col; moved = true; }
        }
      }
    }

    inputBuffer.current = buf;
    if (moved) setSelected({ row: curRow, col: curCol });
    setCellPreview(buf ? getBufferPreview(buf) : '');
  }

  function handleCompositionEnd(e: React.CompositionEvent) {
    if (!selected || completed) return;
    const text = e.data;
    if (!text) return;
    if (inputRef.current) inputRef.current.value = '';

    const firstCp = (Array.from(text)[0] ?? '').codePointAt(0) ?? 0;
    if (firstCp >= 0x0C80 && firstCp <= 0x0CFF) {
      handleKannadaText(text, selected.row, selected.col);
    } else {
      handleChange({ target: { value: text } } as React.ChangeEvent<HTMLInputElement>);
    }
  }

  useEffect(() => { inputRef.current?.focus(); }, [selected]);

  const activeClue = getActiveClue();

  return (
    <div className={styles.wrapper}>
      {/* Hidden input for physical / hardware keyboard support */}
      <input
        ref={inputRef}
        className={styles.hiddenInput}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onCompositionEnd={handleCompositionEnd}
        aria-label="Crossword input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="none"
      />

      {activeClue && (
        <div className={styles.activeClue}>
          <span className={styles.clueNumber}>{activeClue.number} {direction === 'across' ? '→' : '↓'}</span>
          <span>{activeClue.clue}</span>
          {activeClue.clue_en && <span className={styles.clueEn}> ({activeClue.clue_en})</span>}
        </div>
      )}

      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {grid.flat().map(cell => {
          const key = `${cell.row},${cell.col}`;
          const isSelected = selected?.row === cell.row && selected?.col === cell.col;
          const isHl = isHighlighted(cell.row, cell.col);
          const value = isSelected && cellPreview ? cellPreview : (userValues.get(key) ?? '');
          const isCorrect = correctCells?.has(key);

          return (
            <div
              key={key}
              className={clsx(styles.cell, {
                [styles.blocked]: cell.blocked,
                [styles.selected]: isSelected,
                [styles.highlighted]: isHl && !isSelected,
                [styles.correct]: isCorrect,
              })}
              onClick={() => handleCellClick(cell.row, cell.col)}
            >
              {!cell.blocked && (
                <>
                  {cell.number && <span className={styles.cellNumber}>{cell.number}</span>}
                  <span className={styles.cellLetter}>{value}</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* On-screen Kannada keyboard — always visible when a cell is selected */}
      {selected && !completed && (
        <KannadaKeyboard
          onChar={handleKbChar}
          onBackspace={handleKbBackspace}
        />
      )}
    </div>
  );
}
