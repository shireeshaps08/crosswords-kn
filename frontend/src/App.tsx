import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import PuzzleList from './pages/PuzzleList';
import PuzzlePlay from './pages/PuzzlePlay';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import PuzzleCreate from './pages/admin/PuzzleCreate';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/puzzles" element={<PuzzleList />} />
        <Route path="/puzzle/:id" element={<PuzzlePlay />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/puzzle/new" element={<AdminRoute><PuzzleCreate /></AdminRoute>} />
      </Routes>
    </>
  );
}
