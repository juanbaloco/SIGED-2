import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard',             label: 'Inicio',          icon: '🏠', roles: ['SERVIDOR', 'JTH', 'ADMIN'] },
  { path: '/dashboard/hoja-vida',   label: 'Mi Hoja de Vida', icon: '📋', roles: ['SERVIDOR', 'JTH', 'ADMIN'] },
  { path: '/dashboard/usuarios',    label: 'Gestión de Usuarios', icon: '👥', roles: ['JTH', 'ADMIN'] },
  { path: '/dashboard/change-password', label: 'Cambiar Contraseña', icon: '🔒', roles: ['SERVIDOR', 'JTH', 'ADMIN'] },
];

export default function DashboardLayout() {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada');
    navigate('/login', { replace: true });
  };

  const visibleItems = navItems.filter(item =>
    item.roles.some(r => user?.roles?.includes(r))
  );

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoWrap}>
            <span style={styles.logoText}>SIGEP</span>
            <span style={styles.logoII}>II</span>
          </div>
          <p style={styles.sidebarSubtitle}>Función Pública</p>
        </div>

        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p style={styles.userEmail}>{user?.email}</p>
            <p style={styles.userRole}>{user?.roles?.join(', ')}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {visibleItems.map(item => (
            <Link key={item.path} to={item.path}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navItemActive : {}),
              }}>
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          🚪 Cerrar sesión
        </button>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export function DashboardHome() {
  const { user } = useAuthStore();
  return (
    <div style={styles.content}>
      <h1 style={styles.pageTitle}>Bienvenido al Sistema SIGEP II</h1>
      <p style={styles.pageSubtitle}>
        Sistema de Gestión de Empleo Público — Departamento Administrativo de la Función Pública
      </p>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>📋</div>
          <h3 style={styles.cardTitle}>Mi Hoja de Vida</h3>
          <p style={styles.cardDesc}>Gestione y actualice su hoja de vida en el sistema.</p>
          <Link to="/dashboard/hoja-vida" style={styles.cardBtn}>Ir a Hoja de Vida</Link>
        </div>
        {(user?.roles?.includes('JTH') || user?.roles?.includes('ADMIN')) && (
          <div style={styles.card}>
            <div style={styles.cardIcon}>👥</div>
            <h3 style={styles.cardTitle}>Gestión de Usuarios</h3>
            <p style={styles.cardDesc}>Cree usuarios y gestione roles de servidores públicos.</p>
            <Link to="/dashboard/usuarios" style={styles.cardBtn}>Gestionar Usuarios</Link>
          </div>
        )}
        <div style={styles.card}>
          <div style={styles.cardIcon}>🔒</div>
          <h3 style={styles.cardTitle}>Seguridad</h3>
          <p style={styles.cardDesc}>Actualice su contraseña de acceso al sistema.</p>
          <Link to="/dashboard/change-password" style={styles.cardBtn}>Cambiar Contraseña</Link>
        </div>
      </div>
    </div>
  );
}

const C = '#003366';
const styles = {
  layout: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  sidebar: {
    width: 260, background: `linear-gradient(180deg, ${C}, #005599)`,
    display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', overflowY: 'auto',
  },
  sidebarHeader: { padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 },
  logoText: { fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: 2 },
  logoII: { fontSize: 20, fontWeight: 800, color: '#FFD700', background: 'rgba(255,215,0,0.15)', borderRadius: 4, padding: '0 5px' },
  sidebarSubtitle: { color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 11 },
  userInfo: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, alignItems: 'center' },
  avatar: {
    width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,215,0,0.2)',
    color: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16, flexShrink: 0,
  },
  userEmail: { color: '#fff', margin: 0, fontSize: 12, fontWeight: 600, wordBreak: 'break-all' },
  userRole: { color: 'rgba(255,255,255,0.5)', margin: '2px 0 0', fontSize: 11 },
  nav: { flex: 1, padding: '12px 12px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
    color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 14, marginBottom: 4,
    transition: 'all 0.2s',
  },
  navItemActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 },
  navIcon: { fontSize: 18, width: 22, textAlign: 'center' },
  logoutBtn: {
    margin: '8px 12px 20px', padding: '10px 14px', background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, textAlign: 'left',
  },
  main: { marginLeft: 260, flex: 1, background: '#f4f7fb', minHeight: '100vh', padding: 32 },
  content: { maxWidth: 900, margin: '0 auto' },
  pageTitle: { fontSize: 26, fontWeight: 800, color: C, margin: '0 0 8px' },
  pageSubtitle: { color: '#666', fontSize: 14, margin: '0 0 32px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: {
    background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 2px 12px rgba(0,0,51,0.08)', borderTop: `3px solid ${C}`,
  },
  cardIcon: { fontSize: 32, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: 700, color: C, margin: '0 0 8px' },
  cardDesc: { color: '#666', fontSize: 13, lineHeight: 1.5, margin: '0 0 16px' },
  cardBtn: {
    display: 'inline-block', padding: '8px 18px', background: C,
    color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600,
  },
};