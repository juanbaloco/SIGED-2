import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RecoverPasswordPage from './pages/RecoverPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardLayout, { DashboardHome } from './pages/DashboardLayout';
import UserManagementPage from './pages/UserManagementPage';

export default function App() {
  const init = useAuthStore(s => s.init);

  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'system-ui, sans-serif', fontSize: 14 },
        success: { iconTheme: { primary: '#003366', secondary: '#fff' } },
      }} />

      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recover-password" element={<RecoverPasswordPage />} />

        {/* Cambio de contraseña (requiere auth) */}
        <Route path="/change-password" element={
          <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>
        } />

        {/* Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardLayout /></ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="usuarios" element={
            <ProtectedRoute roles={['JTH', 'ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          } />
          <Route path="hoja-vida" element={
            <ProtectedRoute roles={['SERVIDOR', 'JTH', 'ADMIN']}>
              <div style={{ padding: 20, background: '#fff', borderRadius: 12, maxWidth: 800 }}>
                <h2 style={{ color: '#003366' }}>📋 Hoja de Vida</h2>
                <p style={{ color: '#666' }}>Módulo 2 — En desarrollo (HU-006 a HU-015)</p>
              </div>
            </ProtectedRoute>
          } />
        </Route>

        {/* Redirect raíz */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
