import { Routes, Route, Link } from 'react-router-dom';
import PuzzleList from './pages/PuzzleList';
import PuzzlePlay from './pages/PuzzlePlay';
import StaticAdmin from './pages/admin/StaticAdmin';
import StaticPuzzleEdit from './pages/admin/StaticPuzzleEdit';

export default function App() {
  return (
    <>
      <nav style={{ padding: '0.75rem 1.5rem', background: '#1a1a2e', color: '#fff', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem' }}>ಪ್ರಜಾವಾಣಿ ಪದಬಂಧ</Link>
        <Link to="/puzzles" style={{ color: '#ccc', textDecoration: 'none' }}>ಪಜಲ್‌ಗಳು</Link>
      </nav>
      <Routes>
        <Route path="/" element={<PuzzleList />} />
        <Route path="/puzzles" element={<PuzzleList />} />
        <Route path="/puzzle/:id" element={<PuzzlePlay />} />
        <Route path="/manage-xk9p2" element={<StaticAdmin />} />
        <Route path="/manage-xk9p2/puzzle/:id/edit" element={<StaticPuzzleEdit />} />
      </Routes>
    </>
  );
}
