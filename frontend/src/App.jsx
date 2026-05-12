import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Páginas públicas
import PublicLayout from './pages/public/PublicLayout';
import InicioPage from './pages/public/InicioPage';
import InstructivosPage from './pages/public/InstructivosPage';

// Auth
import LoginPage from './pages/LoginPage';
import RecoverPasswordPage from './pages/RecoverPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

// Dashboard
import DashboardLayout, { DashboardHome } from './pages/DashboardLayout';
import UserManagementPage from './pages/UserManagementPage';
import HojaVidaPage from './pages/HojaVidaPage';

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
        {/* ── Públicas con navbar SIGEP II ── */}
        <Route element={<PublicLayout />}>
          <Route path="/inicio" element={<InicioPage />} />
          <Route path="/instructivos" element={<InstructivosPage />} />
        </Route>

        {/* ── Auth (sin navbar) ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recover-password" element={<RecoverPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ── Cambio de contraseña (requiere auth) ── */}
        <Route path="/change-password" element={
          <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>
        } />

        {/* ── Dashboard (requiere auth) ── */}
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
              <HojaVidaPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </BrowserRouter>
  );
}