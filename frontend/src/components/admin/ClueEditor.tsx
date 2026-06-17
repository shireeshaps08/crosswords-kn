import React, { useState } from 'react';
import { ClueEntry } from '../../types';
import { nudiToUnicode } from '../../utils/nudiToUnicode';
import styles from './ClueEditor.module.css';

interface Props {
  slots: ClueEntry[];
  onChange: (slots: ClueEntry[]) => void;
}

export default function ClueEditor({ slots, onChange }: Props) {
  const [nudiMode, setNudiMode] = useState(false);
  const [nudiBuffers, setNudiBuffers] = useState<string[]>([]);

  function update(idx: number, field: keyof ClueEntry, value: string) {
    const next = slots.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    onChange(next);
  }

  function handleNudiInput(idx: number, raw: string) {
    const next = [...nudiBuffers];
    next[idx] = raw;
    setNudiBuffers(next);
    update(idx, 'clue', nudiToUnicode(raw));
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
                {nudiMode && (
                  <textarea
                    className={styles.nudiInput}
                    placeholder="Nudi ASCII ಇಲ್ಲಿ ಅಂಟಿಸಿ → ಮೇಲಿನ ಕ್ಷೇತ್ರಕ್ಕೆ ಸ್ವಯಂ convert ಆಗುತ್ತದೆ"
                    value={nudiBuffers[idx] ?? ''}
                    onChange={e => handleNudiInput(idx, e.target.value)}
                    rows={2}
                    spellCheck={false}
                    lang="en"
                  />
                )}
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
      <div className={styles.nudiToolbar}>
        <label className={styles.nudiToggleLabel}>
          <input
            type="checkbox"
            checked={nudiMode}
            onChange={e => {
              setNudiMode(e.target.checked);
              if (!e.target.checked) setNudiBuffers([]);
            }}
          />
          Nudi mode (ASCII → ಕನ್ನಡ live convert)
        </label>
        {nudiMode && (
          <span className={styles.nudiHint}>
            ನಿಮ್ಮ Nudi ದಾಖಲೆಯಿಂದ ಪ್ರತಿ ಸೂಚನೆ ಅಂಟಿಸಿ
          </span>
        )}
      </div>
      {renderGroup(across, 'ಅಡ್ಡ — Across')}
      {renderGroup(down,   'ಕೆಳಗೆ — Down')}
    </div>
  );
}
