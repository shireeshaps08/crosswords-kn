import React from 'react';
import clsx from 'clsx';
import { GridCell } from '../../types';
import { applyNumbers, computeSlots } from '../../utils/gridUtils';
import styles from './GridBuilder.module.css';

interface Props {
  grid: GridCell[][];
  onChange: (grid: GridCell[][]) => void;
}

export default function GridBuilder({ grid, onChange }: Props) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const slots = computeSlots(grid);
  const numbered = applyNumbers(grid, slots);

  function toggleCell(r: number, c: number) {
    const next = grid.map(row => row.map(cell => ({ ...cell })));
    next[r][c].blocked = !next[r][c].blocked;
    onChange(next);
  }

  function applySymmetry(r: number, c: number) {
    const next = grid.map(row => row.map(cell => ({ ...cell })));
    const blocked = !next[r][c].blocked;
    next[r][c].blocked = blocked;
    // 180° rotational symmetry
    next[rows - 1 - r][cols - 1 - c].blocked = blocked;
    onChange(next);
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.hint}>Click a cell to block it. Right-click to apply 180° symmetry.</p>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {numbered.flat().map(cell => (
          <div
            key={`${cell.row},${cell.col}`}
            className={clsx(styles.cell, { [styles.blocked]: cell.blocked })}
            onClick={() => toggleCell(cell.row, cell.col)}
            onContextMenu={e => { e.preventDefault(); applySymmetry(cell.row, cell.col); }}
          >
            {!cell.blocked && cell.number && (
              <span className={styles.num}>{cell.number}</span>
            )}
          </div>
        ))}
      </div>
      <p className={styles.slotCount}>{slots.length} word slot{slots.length !== 1 ? 's' : ''} detected</p>
    </div>
  );
}
