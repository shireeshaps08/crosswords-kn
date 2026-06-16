import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
