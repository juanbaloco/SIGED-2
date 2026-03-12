import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, mustChangePassword, user } = useAuthStore();
  const location = useLocation();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7fb' }}>
      <div style={{ textAlign: 'center', color: '#003366' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p style={{ fontFamily: 'system-ui', fontWeight: 600 }}>Cargando…</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && !roles.some(r => user?.roles?.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}