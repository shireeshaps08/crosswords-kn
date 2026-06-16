import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.brand}>ಕನ್ನಡ ಕ್ರಾಸ್‌ವರ್ಡ್</Link>
      <div className={styles.links}>
        <Link to="/puzzles">ಪಜಲ್‌ಗಳು</Link>
        <Link to="/leaderboard">ಲೀಡರ್‌ಬೋರ್ಡ್</Link>
        {user ? (
          <>
            {user.role === 'admin' && <Link to="/admin" className={styles.adminLink}>Admin</Link>}
            <span className={styles.username}>{user.username}</span>
            <button className={styles.btnOutline} onClick={handleLogout}>ಹೊರಹೋಗು</button>
          </>
        ) : (
          <>
            <Link to="/login">ಲಾಗಿನ್</Link>
            <Link to="/register" className={styles.btnPrimary}>ನೋಂದಾಯಿಸಿ</Link>
          </>
        )}
      </div>
    </nav>
  );
}
