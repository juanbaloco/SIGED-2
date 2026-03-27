import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const C = {
  navy:   '#003366',
  blue:   '#0057A8',
  gold:   '#C8A84B',
  light:  '#E8F0FA',
  white:  '#FFFFFF',
  gray:   '#F4F7FB',
  text:   '#1A2B4A',
  muted:  '#5A6A85',
};

const instructivosMenu = [
  {
    title: 'Creación o actualización de información de entidades públicas',
    icon: '🏛️',
    desc: 'Solicitudes para crear o actualizar módulo de entidades. Las solicitudes se reciben únicamente a través del correo soportesigep2@funcionpublica.gov.co adjuntando los actos administrativos correspondientes.',
    links: [
      'Formato Creación de Entidades Estructura Nomenclatura y Planta entidades Territoriales',
      'Formato Empleos Docentes Secretarias de Educación',
      'Formato Empleos Docentes Universidades',
    ],
  },
  {
    title: 'Formatos',
    icon: '📄',
    desc: 'Descargue los formatos oficiales requeridos para el diligenciamiento y gestión de información en el SIGEP II.',
    links: [
      'Formato Único de Hoja de Vida',
      'Formato Declaración de Bienes y Rentas',
      'Formato Conflictos de Interés',
      'Formato Vinculación de Servidor Público',
    ],
  },
  {
    title: 'Información para cumplimiento de la Ley 2013',
    icon: '⚖️',
    desc: 'Información y recursos para el cumplimiento de la Ley 2013 de 2019 sobre declaración de bienes, rentas y conflictos de interés.',
    links: [
      'Instructivo Declaración de Bienes y Rentas — Persona Natural',
      'Instructivo Declaración de Bienes y Rentas — Persona Jurídica',
      'Preguntas Frecuentes Ley 2013',
      'Acceso al Aplicativo Ley 2013',
    ],
  },
  {
    title: 'Manual de Gestión de Entidades en el SIGEP II',
    icon: '📘',
    desc: 'Guía completa para administradores y Jefes de Talento Humano sobre la gestión de entidades dentro del sistema SIGEP II.',
    links: [
      'Manual para Administradores del Sistema',
      'Guía de Acceso Unificado SIGEP II',
      'Manual Hoja de Vida — Servidor Público',
      'Guía Gestión de Planta de Personal',
    ],
  },
  {
    title: 'Videos Tutoriales',
    icon: '🎬',
    desc: 'Material audiovisual de capacitación para el uso del SIGEP II, disponible para servidores públicos, contratistas y administradores.',
    links: [
      'Tutorial: Registro de Hoja de Vida',
      'Tutorial: Declaración de Bienes y Rentas',
      'Tutorial: Acceso y Recuperación de Contraseña',
      'Tutorial: Gestión de Entidades para JTH',
    ],
  },
];

function NavDropdown({ items, onClose }) {
  return (
    <div style={styles.dropdown}>
      {items.map((item, i) => (
        <button key={i} style={styles.dropdownItem} onClick={onClose}>
          <span style={styles.dropdownIcon}>{item.icon}</span>
          <span style={styles.dropdownLabel}>{item.title}</span>
        </button>
      ))}
    </div>
  );
}

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.page}>
      {/* ── Barra superior institucional ── */}
      <div style={styles.topBar}>
        <span style={styles.topBarText}>
          🇨🇴 Departamento Administrativo de la Función Pública — República de Colombia
        </span>
        <a href="https://www.funcionpublica.gov.co" target="_blank" rel="noreferrer" style={styles.topBarLink}>
          funcionpublica.gov.co
        </a>
      </div>

      {/* ── Navbar principal ── */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navInner}>
          {/* Logo */}
          <Link to="/inicio" style={styles.logo}>
            <div style={styles.logoMark}>
              <span style={styles.logoSigep}>SIGEP</span>
              <span style={styles.logoTwo}>II</span>
            </div>
            <div style={styles.logoText}>
              <span style={styles.logoTitle}>Sistema de Gestión</span>
              <span style={styles.logoSub}>del Empleo Público</span>
            </div>
          </Link>

          {/* Nav links — desktop */}
          <div style={styles.navLinks}>
            <Link to="/inicio" style={{ ...styles.navLink, ...(isActive('/inicio') ? styles.navLinkActive : {}) }}>
              ¿Qué es SIGEP II?
            </Link>

            {/* Dropdown Instructivos */}
            <div ref={dropRef} style={styles.dropWrapper}>
              <button
                style={{ ...styles.navLink, ...styles.navBtn, ...(menuOpen ? styles.navLinkActive : {}) }}
                onClick={() => setMenuOpen(o => !o)}
              >
                Instructivos y Formatos
                <span style={{ marginLeft: 5, fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: menuOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>
              {menuOpen && (
                <NavDropdown items={instructivosMenu} onClose={() => {
                  setMenuOpen(false);
                  navigate('/instructivos');
                }} />
              )}
            </div>
          </div>

          {/* CTA Login */}
          <Link to="/login" style={styles.loginBtn}>
            <span>🔐</span> Ingresar
          </Link>

          {/* Mobile hamburger */}
          <button style={styles.hamburger} onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={styles.mobileMenu}>
            <Link to="/inicio" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>¿Qué es SIGEP II?</Link>
            <Link to="/instructivos" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>Instructivos y Formatos</Link>
            <Link to="/login" style={styles.mobileLinkBtn} onClick={() => setMobileOpen(false)}>🔐 Ingresar al sistema</Link>
          </div>
        )}
      </nav>

      {/* ── Contenido de la página ── */}
      <main style={styles.main}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerBrand}>
            <div style={styles.logoMark}>
              <span style={{ ...styles.logoSigep, fontSize: 18 }}>SIGEP</span>
              <span style={{ ...styles.logoTwo, fontSize: 15 }}>II</span>
            </div>
            <p style={styles.footerDesc}>
              Sistema de Información y Gestión del Empleo Público para el Estado Colombiano.
            </p>
          </div>
          <div style={styles.footerCol}>
            <p style={styles.footerColTitle}>Soporte</p>
            <p style={styles.footerColItem}>soportesigep2@funcionpublica.gov.co</p>
            <p style={styles.footerColItem}>601 7395656 Opción 2</p>
          </div>
          <div style={styles.footerCol}>
            <p style={styles.footerColTitle}>Legal</p>
            <p style={styles.footerColItem}>Ley 909 de 2004</p>
            <p style={styles.footerColItem}>Ley 2013 de 2019</p>
            <p style={styles.footerColItem}>Decreto 1083 de 2015</p>
          </div>
        </div>
        <div style={styles.footerBottom}>
          © {new Date().getFullYear()} Departamento Administrativo de la Función Pública — República de Colombia
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', system-ui, sans-serif", background: C.white },
  topBar: {
    background: C.navy, color: 'rgba(255,255,255,0.75)', fontSize: 11,
    padding: '6px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  topBarText: { letterSpacing: 0.3 },
  topBarLink: { color: C.gold, textDecoration: 'none', fontSize: 11, fontWeight: 600 },
  nav: {
    background: C.white, borderBottom: `1px solid #E0E8F4`,
    position: 'sticky', top: 0, zIndex: 100,
    transition: 'box-shadow 0.3s',
  },
  navScrolled: { boxShadow: '0 2px 20px rgba(0,51,102,0.12)' },
  navInner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    display: 'flex', alignItems: 'center', gap: 8, height: 68,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 32 },
  logoMark: { display: 'flex', alignItems: 'center', gap: 2 },
  logoSigep: { fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: 1 },
  logoTwo: { fontSize: 18, fontWeight: 900, color: C.gold, background: 'rgba(200,168,75,0.12)', borderRadius: 5, padding: '1px 5px' },
  logoText: { display: 'flex', flexDirection: 'column', borderLeft: `2px solid ${C.light}`, paddingLeft: 10 },
  logoTitle: { fontSize: 12, fontWeight: 700, color: C.navy, lineHeight: 1.2 },
  logoSub: { fontSize: 10, color: C.muted, lineHeight: 1.2 },
  navLinks: { display: 'flex', gap: 4, flex: 1 },
  navLink: {
    padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
    color: C.text, textDecoration: 'none', transition: 'all 0.2s',
    borderBottom: '2px solid transparent',
  },
  navLinkActive: { color: C.blue, borderBottomColor: C.blue, fontWeight: 700 },
  navBtn: { background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  dropWrapper: { position: 'relative' },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, background: C.white,
    border: '1px solid #E0E8F4', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,51,102,0.12)',
    minWidth: 380, padding: '8px', zIndex: 200, marginTop: 4,
  },
  dropdownItem: {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
    padding: '10px 12px', background: 'none', border: 'none', borderRadius: 8,
    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
    fontFamily: 'inherit',
  },
  dropdownIcon: { fontSize: 20, flexShrink: 0 },
  dropdownLabel: { fontSize: 13, fontWeight: 500, color: C.text, lineHeight: 1.3 },
  loginBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 20px', background: C.navy, color: C.white,
    borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700,
    marginLeft: 'auto', whiteSpace: 'nowrap', transition: 'background 0.2s',
  },
  hamburger: {
    display: 'none', background: 'none', border: 'none',
    fontSize: 22, cursor: 'pointer', color: C.navy, padding: 4,
  },
  mobileMenu: {
    background: C.white, borderTop: '1px solid #E0E8F4',
    display: 'flex', flexDirection: 'column', padding: '12px 24px 20px',
  },
  mobileLink: { padding: '12px 0', color: C.text, textDecoration: 'none', fontSize: 15, fontWeight: 500, borderBottom: '1px solid #F0F4FA' },
  mobileLinkBtn: {
    marginTop: 12, padding: '12px', background: C.navy, color: C.white,
    borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center',
  },
  main: { flex: 1 },
  footer: { background: C.navy, color: 'rgba(255,255,255,0.8)', marginTop: 'auto' },
  footerInner: {
    maxWidth: 1200, margin: '0 auto', padding: '40px 40px 24px',
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 40,
  },
  footerBrand: {},
  footerDesc: { fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginTop: 12, maxWidth: 300 },
  footerCol: {},
  footerColTitle: { fontWeight: 700, fontSize: 13, color: C.gold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  footerColItem: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  footerBottom: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center', padding: '16px 40px', fontSize: 11, color: 'rgba(255,255,255,0.4)',
  },
};