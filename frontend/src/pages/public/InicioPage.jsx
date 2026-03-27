import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const C = {
  navy: '#003366', blue: '#0057A8', gold: '#C8A84B',
  light: '#E8F0FA', white: '#FFFFFF', text: '#1A2B4A', muted: '#5A6A85',
};

const declaraciones = [
  {
    icon: '📋',
    title: 'Hoja de Vida',
    desc: 'Registro y actualización de la hoja de vida del servidor público. Incluye datos personales, formación académica, experiencia laboral y soportes documentales.',
    tag: 'Módulo activo',
    tagColor: '#1B5E20',
    tagBg: '#E8F5E9',
  },
  {
    icon: '💼',
    title: 'Declaración de Bienes y Rentas',
    desc: 'Obligación de todos los servidores públicos en cumplimiento del artículo 122 de la Constitución, la Ley 190 de 1995 y el Decreto 1083 de 2015.',
    tag: 'Ley 2013 de 2019',
    tagColor: '#0D47A1',
    tagBg: '#E3F2FD',
  },
  {
    icon: '⚖️',
    title: 'Conflictos de Interés',
    desc: 'Registro de situaciones que puedan generar conflictos entre el interés particular del servidor y el ejercicio de sus funciones públicas.',
    tag: 'Obligatorio',
    tagColor: '#E65100',
    tagBg: '#FFF3E0',
  },
  {
    icon: '🏛️',
    title: 'Gestión de Entidades',
    desc: 'Administración de la información institucional: planta de personal, empleos, manuales de funciones y estructura organizacional de entidades públicas.',
    tag: 'JTH / Administrador',
    tagColor: '#4A148C',
    tagBg: '#F3E5F5',
  },
];

const novedades = [
  {
    fecha: 'Marzo 2025',
    titulo: 'Actualización del módulo de Hoja de Vida',
    desc: 'Se habilitó la carga de soportes en formato PDF y JPG para todos los campos de formación académica y experiencia laboral.',
  },
  {
    fecha: 'Enero 2025',
    titulo: 'Integración con Ley 2013',
    desc: 'El sistema ahora permite la consulta directa del historial de declaraciones de bienes y rentas desde el perfil del servidor público.',
  },
  {
    fecha: 'Noviembre 2024',
    titulo: 'Reconocimiento SIGEP II',
    desc: 'El Instituto Departamental de Cultura, Deporte y Turismo de Caquetá recibió reconocimiento por la exitosa implementación del SIGEP II.',
  },
];

export default function InicioPage() {
  return (
    <div style={styles.page}>

      {/* ── HERO ── */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            🇨🇴 República de Colombia · Función Pública
          </div>
          <h1 style={styles.heroTitle}>
            Bienvenido al <span style={styles.heroAccent}>SIGEP II</span>
          </h1>
          <p style={styles.heroDesc}>
            Sistema de Información y Gestión del Empleo Público para el Estado Colombiano.
            La plataforma transaccional que permite compilar, administrar y procesar la información
            del talento humano al servicio del Estado.
          </p>
          <div style={styles.heroActions}>
            <Link to="/login" style={styles.heroBtnPrimary}>
              🔐 Ingresar al sistema
            </Link>
            <Link to="/instructivos" style={styles.heroBtnSecondary}>
              📄 Instructivos y formatos
            </Link>
          </div>
          <div style={styles.heroStats}>
            <div style={styles.heroStat}><strong>+1.196.000</strong><span>servidores públicos</span></div>
            <div style={styles.heroStatDiv} />
            <div style={styles.heroStat}><strong>+6.000</strong><span>entidades nacionales</span></div>
            <div style={styles.heroStatDiv} />
            <div style={styles.heroStat}><strong>Desde 2010</strong><span>en operación</span></div>
          </div>
        </div>
        <div style={styles.heroVisual}>
          <div style={styles.heroCard}>
            <div style={styles.heroCardIcon}>🏛️</div>
            <p style={styles.heroCardText}>
              Liderado por el Departamento Administrativo de la Función Pública en cumplimiento del
              artículo 18 de la <strong>Ley 909 de 2004</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── QUÉ ES SIGEP II ── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>¿Qué es?</span>
            <h2 style={styles.sectionTitle}>El SIGEP II en detalle</h2>
            <p style={styles.sectionDesc}>
              Una herramienta clave al servicio de la administración pública y de los ciudadanos.
            </p>
          </div>

          <div style={styles.featureGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>📊</div>
              <h3 style={styles.featureTitle}>Plataforma Transaccional</h3>
              <p style={styles.featureText}>
                Permite contabilizar y llevar un estricto control de los servidores públicos del Estado colombiano,
                con información institucional tanto nacional como territorial.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🔒</div>
              <h3 style={styles.featureTitle}>Acceso Seguro</h3>
              <p style={styles.featureText}>
                Sistema de autenticación robusto con credenciales personales basadas en tipo y número
                de documento, garantizando la seguridad de la información del servidor público.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>📡</div>
              <h3 style={styles.featureTitle}>Insumo para Políticas Públicas</h3>
              <p style={styles.featureText}>
                La información gestionada sirve como insumo para la toma de decisiones institucionales
                y de gobierno, así como para la formulación de políticas de organización institucional.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>⚙️</div>
              <h3 style={styles.featureTitle}>Gestión Integral del Talento</h3>
              <p style={styles.featureText}>
                Las entidades adelantan procesos de gestión del talento humano: movilidad de personal,
                Plan Institucional de Capacitación y programas de bienestar social.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DECLARACIONES ── */}
      <section style={{ ...styles.section, background: C.light }}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>Módulos</span>
            <h2 style={styles.sectionTitle}>Declaraciones del SIGEP II</h2>
            <p style={styles.sectionDesc}>
              El sistema integra los principales módulos de gestión del empleo público colombiano.
            </p>
          </div>

          <div style={styles.declarGrid}>
            {declaraciones.map((d, i) => (
              <div key={i} style={styles.declarCard}>
                <div style={styles.declarIcon}>{d.icon}</div>
                <span style={{ ...styles.declarTag, color: d.tagColor, background: d.tagBg }}>
                  {d.tag}
                </span>
                <h3 style={styles.declarTitle}>{d.title}</h3>
                <p style={styles.declarDesc}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOVEDADES ── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>Noticias</span>
            <h2 style={styles.sectionTitle}>Lo nuevo en el SIGEP II</h2>
          </div>

          <div style={styles.newsGrid}>
            {novedades.map((n, i) => (
              <div key={i} style={styles.newsCard}>
                <span style={styles.newsFecha}>{n.fecha}</span>
                <h4 style={styles.newsTitulo}>{n.titulo}</h4>
                <p style={styles.newsDesc}>{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaTitle}>¿Listo para ingresar al sistema?</h2>
          <p style={styles.ctaDesc}>
            Use sus credenciales de acceso asignadas por el Jefe de Talento Humano de su entidad.
          </p>
          <Link to="/login" style={styles.ctaBtn}>
            🔐 Ingresar al SIGEP II
          </Link>
          <p style={styles.ctaHelp}>
            ¿Tiene problemas de acceso? Contacte a{' '}
            <a href="mailto:soportesigep2@funcionpublica.gov.co" style={{ color: C.gold }}>
              soportesigep2@funcionpublica.gov.co
            </a>
          </p>
        </div>
      </section>

    </div>
  );
}

const styles = {
  page: { background: C.white },

  // Hero
  hero: {
    background: `linear-gradient(135deg, ${C.navy} 0%, #004B8D 60%, #0057A8 100%)`,
    padding: '80px 40px 60px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 60, flexWrap: 'wrap',
  },
  heroContent: { maxWidth: 580, color: C.white },
  heroBadge: {
    display: 'inline-block', background: 'rgba(200,168,75,0.2)', color: C.gold,
    border: `1px solid rgba(200,168,75,0.4)`, borderRadius: 20,
    padding: '5px 14px', fontSize: 12, fontWeight: 600, marginBottom: 20, letterSpacing: 0.5,
  },
  heroTitle: { fontSize: 44, fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', color: C.white },
  heroAccent: { color: C.gold },
  heroDesc: { fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', margin: '0 0 32px' },
  heroActions: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 },
  heroBtnPrimary: {
    padding: '13px 28px', background: C.gold, color: C.navy, borderRadius: 8,
    textDecoration: 'none', fontWeight: 800, fontSize: 15,
  },
  heroBtnSecondary: {
    padding: '13px 28px', background: 'rgba(255,255,255,0.12)', color: C.white,
    border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
    textDecoration: 'none', fontWeight: 600, fontSize: 15,
  },
  heroStats: { display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' },
  heroStat: { display: 'flex', flexDirection: 'column', gap: 2,
    '& strong': { fontSize: 20, fontWeight: 800, color: C.white },
    '& span': { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  },
  heroStatDiv: { width: 1, height: 32, background: 'rgba(255,255,255,0.2)' },
  heroVisual: { maxWidth: 300 },
  heroCard: {
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 28, backdropFilter: 'blur(10px)',
  },
  heroCardIcon: { fontSize: 48, marginBottom: 16 },
  heroCardText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.7, margin: 0 },

  // Sections
  section: { padding: '72px 40px', background: C.white },
  sectionInner: { maxWidth: 1100, margin: '0 auto' },
  sectionHeader: { textAlign: 'center', marginBottom: 48 },
  sectionTag: {
    display: 'inline-block', background: C.light, color: C.blue,
    borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12,
  },
  sectionTitle: { fontSize: 32, fontWeight: 800, color: C.navy, margin: '0 0 12px' },
  sectionDesc: { fontSize: 16, color: C.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 },

  // Features
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 },
  featureCard: {
    background: C.white, border: '1px solid #E0E8F4', borderRadius: 12, padding: 24,
    transition: 'box-shadow 0.2s', boxShadow: '0 2px 8px rgba(0,51,102,0.05)',
  },
  featureIcon: { fontSize: 32, marginBottom: 12 },
  featureTitle: { fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 8px' },
  featureText: { fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 },

  // Declaraciones
  declarGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 },
  declarCard: {
    background: C.white, borderRadius: 12, padding: 24,
    boxShadow: '0 2px 12px rgba(0,51,102,0.08)', borderTop: `3px solid ${C.blue}`,
  },
  declarIcon: { fontSize: 36, marginBottom: 12 },
  declarTag: { display: 'inline-block', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, marginBottom: 10 },
  declarTitle: { fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 8px' },
  declarDesc: { fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 },

  // News
  newsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 },
  newsCard: {
    background: C.white, border: '1px solid #E0E8F4', borderRadius: 12, padding: 24,
    borderLeft: `4px solid ${C.gold}`,
  },
  newsFecha: { fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 0.5 },
  newsTitulo: { fontSize: 16, fontWeight: 700, color: C.navy, margin: '8px 0 8px' },
  newsDesc: { fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 },

  // CTA
  ctaSection: {
    background: `linear-gradient(135deg, ${C.navy}, #004B8D)`,
    padding: '64px 40px', textAlign: 'center',
  },
  ctaInner: { maxWidth: 560, margin: '0 auto' },
  ctaTitle: { fontSize: 30, fontWeight: 800, color: C.white, margin: '0 0 12px' },
  ctaDesc: { fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 28px', lineHeight: 1.6 },
  ctaBtn: {
    display: 'inline-block', padding: '14px 36px', background: C.gold,
    color: C.navy, borderRadius: 8, textDecoration: 'none', fontWeight: 800, fontSize: 16,
  },
  ctaHelp: { marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
};