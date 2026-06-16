import React, { useState } from 'react';
import styles from './KannadaKeyboard.module.css';

interface Props {
  onChar: (akshara: string) => void;
  onBackspace: () => void;
}

const HALANT = '್';

const VOWELS = [
  'ಅ','ಆ','ಇ','ಈ','ಉ','ಊ',
  'ಎ','ಏ','ಐ','ಒ','ಓ','ಔ',
  'ಅಂ','ಅಃ',
];

const CONSONANTS = [
  'ಕ','ಖ','ಗ','ಘ','ಙ',
  'ಚ','ಛ','ಜ','ಝ','ಞ',
  'ಟ','ಠ','ಡ','ಢ','ಣ',
  'ತ','ಥ','ದ','ಧ','ನ',
  'ಪ','ಫ','ಬ','ಭ','ಮ',
  'ಯ','ರ','ಲ','ವ','ಶ',
  'ಷ','ಸ','ಹ','ಳ',
];

// [vowelSign, label shown on button]
const VOWEL_SIGNS: [string, string][] = [
  ['',         'ಅ'],  // implicit 'a'
  ['ಾ',  'ಾ'],  // aa
  ['ಿ',  'ಿ'],  // i
  ['ೀ',  'ೀ'],  // ii
  ['ು',  'ು'],  // u
  ['ೂ',  'ೂ'],  // uu
  ['ೆ',  'ೆ'],  // e
  ['ೇ',  'ೇ'],  // ee
  ['ೈ',  'ೈ'],  // ai
  ['ೊ',  'ೊ'],  // o
  ['ೋ',  'ೋ'],  // oo
  ['ೌ',  'ೌ'],  // au
];

export default function KannadaKeyboard({ onChar, onBackspace }: Props) {
  // pendingCluster holds accumulated base + any halants (e.g. 'ಕ' or 'ಕ್ಕ')
  const [pendingCluster, setPendingCluster] = useState<string>('');
  // mode: 'main' = pick consonant/vowel; 'vowelPick' = pick vowel sign for cluster
  const [mode, setMode] = useState<'main' | 'vowelPick'>('main');

  function handleConsonant(cons: string) {
    const cluster = pendingCluster + cons;
    setPendingCluster(cluster);
    setMode('vowelPick');
  }

  function handleVowelSign(sign: string) {
    onChar(pendingCluster + sign);
    setPendingCluster('');
    setMode('main');
  }

  function handleHalant() {
    // Append halant and go back to consonant picking for a cluster
    setPendingCluster(prev => prev + HALANT);
    setMode('main');
  }

  function handleVowel(v: string) {
    if (pendingCluster) {
      // Treat standalone vowel as committing the pending cluster first, then the vowel
      onChar(pendingCluster);
      setPendingCluster('');
      setMode('main');
    }
    onChar(v);
  }

  function handleBackspace() {
    if (pendingCluster) {
      setPendingCluster('');
      setMode('main');
    } else {
      onBackspace();
    }
  }

  // ── Vowel-sign picker (Phase 2) ────────────────────────────────────────────
  if (mode === 'vowelPick') {
    return (
      <div className={styles.keyboard}>
        <div className={styles.clusterLabel}>
          <span className={styles.clusterText}>{pendingCluster}</span>
          <span className={styles.clusterHint}> + ಸ್ವರ ಆಯ್ಕೆಮಾಡಿ</span>
        </div>
        <div className={styles.signGrid}>
          {VOWEL_SIGNS.map(([sign, label]) => (
            <button
              key={label}
              className={styles.signKey}
              onPointerDown={e => { e.preventDefault(); handleVowelSign(sign); }}
            >
              {pendingCluster + sign || label}
            </button>
          ))}
          <button
            className={styles.halantKey}
            onPointerDown={e => { e.preventDefault(); handleHalant(); }}
            title="ಒತ್ತಕ್ಷರ (consonant cluster)"
          >
            {pendingCluster + HALANT}
          </button>
        </div>
        <div className={styles.bottomRow}>
          <button
            className={styles.backBtn}
            onPointerDown={e => { e.preventDefault(); setPendingCluster(''); setMode('main'); }}
          >
            ← ಹಿಂದೆ
          </button>
          <button
            className={styles.bsBtn}
            onPointerDown={e => { e.preventDefault(); handleBackspace(); }}
          >
            ⌫
          </button>
        </div>
      </div>
    );
  }

  // ── Main keyboard (Phase 1) ────────────────────────────────────────────────
  return (
    <div className={styles.keyboard}>
      {pendingCluster && (
        <div className={styles.clusterLabel}>
          <span className={styles.clusterText}>{pendingCluster}</span>
          <span className={styles.clusterHint}> + ವ್ಯಂಜನ ಆಯ್ಕೆಮಾಡಿ</span>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionLabel}>ಸ್ವರಗಳು</div>
        <div className={styles.vowelGrid}>
          {VOWELS.map(v => (
            <button
              key={v}
              className={styles.key}
              onPointerDown={e => { e.preventDefault(); handleVowel(v); }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>ವ್ಯಂಜನಗಳು</div>
        <div className={styles.consGrid}>
          {CONSONANTS.map(c => (
            <button
              key={c}
              className={styles.key}
              onPointerDown={e => { e.preventDefault(); handleConsonant(c); }}
            >
              {c}
            </button>
          ))}
          <button
            className={styles.bsBtn}
            onPointerDown={e => { e.preventDefault(); handleBackspace(); }}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
