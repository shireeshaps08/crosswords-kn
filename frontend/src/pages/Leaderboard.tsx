import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import styles from './Leaderboard.module.css';

interface GlobalEntry {
  id: string;
  username: string;
  puzzles_solved: number;
  total_words: number;
  total_score: number;
}

interface UserStats {
  puzzles_solved: number;
  total_words: number;
  total_score: number;
  last_played_at: string | null;
  global_rank: number | null;
}

export default function Leaderboard() {
  const { user, token } = useAuthStore();
  const [entries, setEntries] = useState<GlobalEntry[]>([]);
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetches: Promise<void>[] = [
      api.get('/leaderboard').then(r => setEntries(r.data.leaderboard)),
    ];
    if (token) {
      fetches.push(
        api.get('/users/me/stats').then(r => setMyStats(r.data.stats)).catch(() => {})
      );
    }
    Promise.all(fetches).finally(() => setLoading(false));
  }, [token]);

  function medal(i: number) {
    return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
  }

  function fmtDate(s: string | null) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('kn-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <main className={styles.container}>
      <h2>🏆 ಲೀಡರ್‌ಬೋರ್ಡ್</h2>

      {/* Personal stats card — shown only when logged in */}
      {user && myStats && (
        <div className={styles.statsCard}>
          <div className={styles.statsCardTitle}>
            <span className={styles.avatar}>{user.username[0].toUpperCase()}</span>
            <span>{user.username} ಅವರ ಅಂಕಿ ಅಂಶ</span>
            {myStats.global_rank && (
              <span className={styles.rankBadge}>#{myStats.global_rank} ಸ್ಥಾನ</span>
            )}
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{myStats.total_words}</span>
              <span className={styles.statLabel}>ಪೂರ್ಣ ಪದಗಳು</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{myStats.puzzles_solved}</span>
              <span className={styles.statLabel}>ಪಜಲ್‌ಗಳು</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{myStats.total_score.toLocaleString('kn-IN')}</span>
              <span className={styles.statLabel}>ಒಟ್ಟು ಸ್ಕೋರ್</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{fmtDate(myStats.last_played_at)}</span>
              <span className={styles.statLabel}>ಕೊನೆಯ ಆಟ</span>
            </div>
          </div>
        </div>
      )}

      {user && !myStats && !loading && (
        <div className={styles.noStats}>
          ಇನ್ನೂ ಯಾವುದೇ ಪಜಲ್ ಪೂರ್ಣ ಮಾಡಿಲ್ಲ. <a href="/puzzles">ಆಡಲು ಪ್ರಾರಂಭಿಸಿ!</a>
        </div>
      )}

      {loading ? (
        <p className={styles.msg}>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>ಹೆಸರು</th>
              <th>ಪದಗಳು ✓</th>
              <th>ಪಜಲ್‌ಗಳು</th>
              <th>ಒಟ್ಟು ಸ್ಕೋರ್</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const isMe = user?.username === e.username;
              return (
                <tr
                  key={e.username}
                  className={[
                    i < 3 ? styles[`rank${i + 1}`] : '',
                    isMe ? styles.myRow : '',
                  ].join(' ')}
                >
                  <td>{medal(i)}</td>
                  <td>
                    {e.username}
                    {isMe && <span className={styles.youBadge}> ನೀವು</span>}
                  </td>
                  <td className={styles.wordCol}>{e.total_words}</td>
                  <td>{e.puzzles_solved}</td>
                  <td>{e.total_score.toLocaleString('kn-IN')}</td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.msg}>ಇನ್ನೂ ಯಾರೂ ಆಡಿಲ್ಲ</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
