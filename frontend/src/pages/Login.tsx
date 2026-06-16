import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/puzzles');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>ಲಾಗಿನ್</h2>
        {error && <p className={styles.error}>{error}</p>}
        <label>ಇಮೇಲ್<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>ಪಾಸ್‌ವರ್ಡ್<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button type="submit" disabled={loading}>{loading ? 'ಲಾಗಿನ್...' : 'ಲಾಗಿನ್'}</button>
        <p>ಖಾತೆ ಇಲ್ಲವೇ? <Link to="/register">ನೋಂದಾಯಿಸಿ</Link></p>
      </form>
    </main>
  );
}
