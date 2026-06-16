import React from 'react';
import { ClueEntry } from '../../types';
import styles from './ClueEditor.module.css';

interface Props {
  slots: ClueEntry[];
  onChange: (slots: ClueEntry[]) => void;
}

export default function ClueEditor({ slots, onChange }: Props) {
  function update(idx: number, field: keyof ClueEntry, value: string) {
    const next = slots.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    onChange(next);
  }

  const across = slots.filter(s => s.direction === 'across');
  const down   = slots.filter(s => s.direction === 'down');

  function renderGroup(group: ClueEntry[], label: string) {
    if (!group.length) return null;
    return (
      <section className={styles.group}>
        <h4 className={styles.groupLabel}>{label}</h4>
        {group.map(slot => {
          const idx = slots.indexOf(slot);
          const answerLen = Array.from(slot.answer).length;
          const invalid = slot.answer && answerLen !== slot.length;
          return (
            <div key={`${slot.number}-${slot.direction}`} className={styles.row}>
              <span className={styles.badge}>{slot.number}</span>
              <div className={styles.fields}>
                <div className={styles.answerRow}>
                  <input
                    className={styles.answer}
                    placeholder={`ಉತ್ತರ (${slot.length} ಅಕ್ಷರ)`}
                    value={slot.answer}
                    onChange={e => update(idx, 'answer', e.target.value)}
                    lang="kn"
                  />
                  <span className={invalid ? styles.lenBad : styles.lenOk}>
                    {answerLen}/{slot.length}
                  </span>
                </div>
                <input
                  className={styles.clue}
                  placeholder="ಕನ್ನಡ ಸೂಚನೆ (clue in Kannada) *"
                  value={slot.clue}
                  onChange={e => update(idx, 'clue', e.target.value)}
                  lang="kn"
                />
                <input
                  className={styles.clueEn}
                  placeholder="English hint (optional)"
                  value={slot.clue_en ?? ''}
                  onChange={e => update(idx, 'clue_en', e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </section>
    );
  }

  if (!slots.length) {
    return <p className={styles.empty}>Draw the grid first — blocked cells create word slots.</p>;
  }

  return (
    <div className={styles.editor}>
      {renderGroup(across, 'ಅಡ್ಡ — Across')}
      {renderGroup(down,   'ಕೆಳಗೆ — Down')}
    </div>
  );
}
