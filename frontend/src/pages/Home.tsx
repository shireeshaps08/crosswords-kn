import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  return (
    <main className={styles.hero}>
      <h1>ಕನ್ನಡ ಕ್ರಾಸ್‌ವರ್ಡ್</h1>
      <p>ಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿ ಕ್ರಾಸ್‌ವರ್ಡ್ ಪಜಲ್‌ಗಳನ್ನು ಆಡಿ ಆನಂದಿಸಿ!</p>
      <div className={styles.actions}>
        <Link to="/puzzles" className={styles.btnPrimary}>ಈಗಲೇ ಆಡಿ</Link>
        <Link to="/register" className={styles.btnSecondary}>ನೋಂದಾಯಿಸಿ</Link>
      </div>
      <div className={styles.features}>
        <div className={styles.feature}><span>🏆</span><h3>ಲೀಡರ್‌ಬೋರ್ಡ್</h3><p>ನಿಮ್ಮ ಸ್ಕೋರ್ ಹೋಲಿಸಿ</p></div>
        <div className={styles.feature}><span>📚</span><h3>ಹಲವು ಪಜಲ್‌ಗಳು</h3><p>Easy, Medium, Hard</p></div>
        <div className={styles.feature}><span>👤</span><h3>ಗೆಸ್ಟ್ ಆಟ</h3><p>ನೋಂದಣಿ ಇಲ್ಲದೆ ಆಡಿ</p></div>
      </div>
    </main>
  );
}
