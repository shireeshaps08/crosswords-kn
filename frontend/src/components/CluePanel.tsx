import React from 'react';
import { ClueEntry } from '../types';
import styles from './CluePanel.module.css';

interface Props {
  clues: { across: ClueEntry[]; down: ClueEntry[] };
  activeClueNumber?: number;
  activeDirection?: 'across' | 'down';
  onClueClick: (clue: ClueEntry) => void;
}

export default function CluePanel({ clues, activeClueNumber, activeDirection, onClueClick }: Props) {
  function renderList(list: ClueEntry[], dir: 'across' | 'down') {
    return list.map(c => (
      <li
        key={`${dir}-${c.number}`}
        className={activeClueNumber === c.number && activeDirection === dir ? styles.active : ''}
        onClick={() => onClueClick(c)}
      >
        <span className={styles.num}>{c.number}.</span>
        <span>{c.clue}</span>
        {c.clue_en && <span className={styles.en}> ({c.clue_en})</span>}
      </li>
    ));
  }

  return (
    <div className={styles.panel}>
      <section>
        <h3>ಅಡ್ಡ (Across)</h3>
        <ol className={styles.list}>{renderList(clues.across, 'across')}</ol>
      </section>
      <section>
        <h3>ಕೆಳಗೆ (Down)</h3>
        <ol className={styles.list}>{renderList(clues.down, 'down')}</ol>
      </section>
    </div>
  );
}
