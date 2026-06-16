import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import styles from './Auth.module.css';

export default function Register() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/puzzles');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>ನೋಂದಣಿ</h2>
        {error && <p className={styles.error}>{error}</p>}
        <label>ಬಳಕೆದಾರ ಹೆಸರು<input value={username} onChange={e => setUsername(e.target.value)} minLength={3} required /></label>
        <label>ಇಮೇಲ್<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>ಪಾಸ್‌ವರ್ಡ್ (ಕನಿಷ್ಠ 8 ಅಕ್ಷರ)<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required /></label>
        <button type="submit" disabled={loading}>{loading ? 'ನೋಂದಣಿ...' : 'ನೋಂದಾಯಿಸಿ'}</button>
        <p>ಖಾತೆ ಇದೆಯೇ? <Link to="/login">ಲಾಗಿನ್</Link></p>
      </form>
    </main>
  );
}
