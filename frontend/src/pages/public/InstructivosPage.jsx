import React, { useState } from 'react';

const C = {
  navy: '#003366', blue: '#0057A8', gold: '#C8A84B',
  light: '#E8F0FA', white: '#FFFFFF', text: '#1A2B4A', muted: '#5A6A85',
};

const secciones = [
  {
    id: 'entidades',
    icon: '🏛️',
    title: 'Creación o actualización de información de entidades públicas',
    intro: 'Para la creación o actualización de información en el módulo de entidades únicamente se reciben las solicitudes a través del correo electrónico soportesigep2@funcionpublica.gov.co, adjuntando los actos administrativos (resolución, acuerdo, ley, decreto, acta, ordenanza) que soportan la solicitud.',
    items: [
      { nombre: 'Formato Creación de Entidades — Estructura Nomenclatura y Planta Territoriales', tipo: 'XLSX', icono: '📊' },
      { nombre: 'Formato Empleos Docentes Secretarías de Educación', tipo: 'XLSX', icono: '📊' },
      { nombre: 'Formato Empleos Docentes Universidades', tipo: 'XLSX', icono: '📊' },
      { nombre: 'Instructivo Actualización de Entidades', tipo: 'PDF', icono: '📄' },
    ],
    alerta: '⚠️ No adjuntar manual de funciones. Solo actos administrativos.',
  },
  {
    id: 'formatos',
    icon: '📄',
    title: 'Formatos',
    intro: 'Descargue los formatos oficiales requeridos para el diligenciamiento y gestión de información en el SIGEP II.',
    items: [
      { nombre: 'Formato Único de Hoja de Vida — SIGEP II', tipo: 'PDF', icono: '📄' },
      { nombre: 'Formato Declaración de Bienes y Rentas', tipo: 'PDF', icono: '📄' },
      { nombre: 'Formato Registro de Conflictos de Interés', tipo: 'PDF', icono: '📄' },
      { nombre: 'Formato Vinculación de Servidor Público', tipo: 'DOCX', icono: '📝' },
      { nombre: 'Formato Retiro del Servicio', tipo: 'DOCX', icono: '📝' },
    ],
  },
  {
    id: 'ley2013',
    icon: '⚖️',
    title: 'Información para cumplimiento de la Ley 2013',
    intro: 'Recursos e instructivos para el cumplimiento de la Ley 2013 de 2019 sobre la declaración de bienes, rentas, conflictos de interés e impuesto sobre la renta por parte de servidores públicos, contratistas y demás sujetos obligados.',
    items: [
      { nombre: 'Instructivo Declaración de Bienes y Rentas — Persona Natural', tipo: 'PDF', icono: '📄' },
      { nombre: 'Instructivo Declaración de Bienes y Rentas — Persona Jurídica', tipo: 'PDF', icono: '📄' },
      { nombre: 'Preguntas Frecuentes — Ley 2013 de 2019', tipo: 'PDF', icono: '📄' },
      { nombre: 'Circular Externa 100-006 de 2022 — Diligenciamiento Formato DBR', tipo: 'PDF', icono: '📄' },
      { nombre: 'Acceso al Aplicativo Ley 2013', tipo: 'LINK', icono: '🔗', url: 'https://www.funcionpublica.gov.co/fdci/login/auth?opcionDestino=LEY2012' },
    ],
    alerta: 'ℹ️ Para contratistas, la declaración de Bienes y Rentas se realiza en el aplicativo de Ley 2013. Los datos de acceso son diferentes al portal de SIGEP.',
  },
  {
    id: 'manual',
    icon: '📘',
    title: 'Manual de Gestión de Entidades en el SIGEP II',
    intro: 'Guías completas para administradores del sistema, Jefes de Talento Humano y servidores públicos sobre el uso y gestión dentro del SIGEP II.',
    items: [
      { nombre: 'Manual para Administradores del Sistema', tipo: 'PDF', icono: '📄' },
      { nombre: 'Guía de Acceso Unificado SIGEP II', tipo: 'PDF', icono: '📄' },
      { nombre: 'Manual Hoja de Vida — Servidor Público', tipo: 'PDF', icono: '📄' },
      { nombre: 'Guía Gestión de Planta de Personal', tipo: 'PDF', icono: '📄' },
      { nombre: 'Manual Módulo de Bienestar Social e Incentivos', tipo: 'PDF', icono: '📄' },
    ],
  },
  {
    id: 'videos',
    icon: '🎬',
    title: 'Videos Tutoriales',
    intro: 'Material audiovisual de capacitación para el uso correcto del SIGEP II, dirigido a servidores públicos, contratistas, Jefes de Talento Humano y administradores del sistema.',
    items: [
      { nombre: 'Tutorial: Registro y actualización de Hoja de Vida', tipo: 'VIDEO', icono: '▶️' },
      { nombre: 'Tutorial: Declaración de Bienes y Rentas paso a paso', tipo: 'VIDEO', icono: '▶️' },
      { nombre: 'Tutorial: Acceso y recuperación de contraseña', tipo: 'VIDEO', icono: '▶️' },
      { nombre: 'Tutorial: Gestión de entidades para JTH', tipo: 'VIDEO', icono: '▶️' },
      { nombre: 'Tutorial: Carga de soportes documentales', tipo: 'VIDEO', icono: '▶️' },
    ],
  },
];

const tipColors = {
  PDF:   { bg: '#FFF3F3', color: '#C62828' },
  XLSX:  { bg: '#F1F8E9', color: '#2E7D32' },
  DOCX:  { bg: '#E3F2FD', color: '#1565C0' },
  VIDEO: { bg: '#F3E5F5', color: '#6A1B9A' },
  LINK:  { bg: '#FFF8E1', color: '#F57F17' },
};

export default function InstructivosPage() {
  const [activeId, setActiveId] = useState(null);

  const toggle = (id) => setActiveId(prev => prev === id ? null : id);

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.pageHeader}>
        <div style={styles.headerInner}>
          <span style={styles.headerTag}>Recursos oficiales</span>
          <h1 style={styles.headerTitle}>Instructivos y Formatos</h1>
          <p style={styles.headerDesc}>
            Acceda a los formatos, instructivos, manuales y videos tutoriales oficiales
            del Sistema de Gestión del Empleo Público SIGEP II.
          </p>
        </div>
      </div>

      {/* Índice rápido */}
      <div style={styles.indexBar}>
        <div style={styles.indexInner}>
          {secciones.map(s => (
            <button key={s.id} style={styles.indexBtn}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              {s.icon} {s.title.split(' ').slice(0, 3).join(' ')}…
            </button>
          ))}
        </div>
      </div>

      {/* Secciones acordeón */}
      <div style={styles.content}>
        {secciones.map((s) => (
          <div key={s.id} id={s.id} style={styles.seccion}>
            <button style={styles.seccionHeader} onClick={() => toggle(s.id)}>
              <div style={styles.seccionHeaderLeft}>
                <span style={styles.seccionIcon}>{s.icon}</span>
                <span style={styles.seccionTitle}>{s.title}</span>
              </div>
              <span style={{ ...styles.chevron, transform: activeId === s.id ? 'rotate(180deg)' : 'none' }}>
                ▼
              </span>
            </button>

            {activeId === s.id && (
              <div style={styles.seccionBody}>
                <p style={styles.seccionIntro}>{s.intro}</p>

                {s.alerta && (
                  <div style={styles.alerta}>{s.alerta}</div>
                )}

                <div style={styles.itemsGrid}>
                  {s.items.map((item, i) => {
                    const tip = tipColors[item.tipo] || tipColors.PDF;
                    return (
                      <div key={i} style={styles.itemCard}>
                        <span style={styles.itemIcon}>{item.icono}</span>
                        <div style={styles.itemInfo}>
                          <p style={styles.itemNombre}>{item.nombre}</p>
                          <span style={{ ...styles.itemTipo, background: tip.bg, color: tip.color }}>
                            {item.tipo}
                          </span>
                        </div>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer" style={styles.downloadBtn}>
                            Acceder →
                          </a>
                        ) : (
                          <button style={styles.downloadBtn}>
                            ↓ Descargar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contacto */}
      <div style={styles.contactBox}>
        <div style={styles.contactInner}>
          <span style={styles.contactIcon}>📬</span>
          <div>
            <p style={styles.contactTitle}>¿No encuentra lo que busca?</p>
            <p style={styles.contactDesc}>
              Escríbanos a{' '}
              <a href="mailto:soportesigep2@funcionpublica.gov.co" style={styles.contactLink}>
                soportesigep2@funcionpublica.gov.co
              </a>{' '}
              indicando su nombre, tipo y número de documento y la descripción de su requerimiento.
              También puede comunicarse al <strong>601 7395656 Opción 2</strong>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

const styles = {
  page: { background: '#F4F7FB', minHeight: '60vh' },
  pageHeader: {
    background: `linear-gradient(135deg, #003366, #0057A8)`,
    padding: '56px 40px',
  },
  headerInner: { maxWidth: 800, margin: '0 auto', textAlign: 'center', color: '#fff' },
  headerTag: {
    display: 'inline-block', background: 'rgba(200,168,75,0.2)', color: '#C8A84B',
    border: '1px solid rgba(200,168,75,0.4)', borderRadius: 20, padding: '4px 14px',
    fontSize: 12, fontWeight: 700, marginBottom: 14, letterSpacing: 0.5,
  },
  headerTitle: { fontSize: 36, fontWeight: 900, margin: '0 0 12px', color: '#fff' },
  headerDesc: { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 },

  indexBar: { background: '#fff', borderBottom: '1px solid #E0E8F4', padding: '12px 40px', position: 'sticky', top: 68, zIndex: 50 },
  indexInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap' },
  indexBtn: {
    padding: '6px 12px', background: '#E8F0FA', color: '#003366', border: 'none',
    borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },

  content: { maxWidth: 900, margin: '32px auto', padding: '0 24px 40px' },

  seccion: { background: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', border: '1px solid #E0E8F4', boxShadow: '0 2px 8px rgba(0,51,102,0.05)' },
  seccionHeader: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', textAlign: 'left', gap: 12,
  },
  seccionHeaderLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  seccionIcon: { fontSize: 26, flexShrink: 0 },
  seccionTitle: { fontSize: 15, fontWeight: 700, color: '#003366', lineHeight: 1.3 },
  chevron: { fontSize: 12, color: '#5A6A85', transition: 'transform 0.25s', flexShrink: 0 },

  seccionBody: { padding: '0 24px 24px', borderTop: '1px solid #E8F0FA' },
  seccionIntro: { fontSize: 14, color: '#5A6A85', lineHeight: 1.7, margin: '16px 0' },
  alerta: {
    background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, color: '#5D4037', marginBottom: 16,
  },

  itemsGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  itemCard: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    background: '#F8FAFD', border: '1px solid #E0E8F4', borderRadius: 8,
  },
  itemIcon: { fontSize: 22, flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemNombre: { fontSize: 13, fontWeight: 600, color: '#1A2B4A', margin: '0 0 4px' },
  itemTipo: { display: 'inline-block', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  downloadBtn: {
    padding: '7px 14px', background: '#003366', color: '#fff', border: 'none',
    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    whiteSpace: 'nowrap', textDecoration: 'none', fontFamily: 'inherit',
  },

  contactBox: { background: '#003366', padding: '32px 40px' },
  contactInner: { maxWidth: 900, margin: '0 auto', display: 'flex', gap: 20, alignItems: 'flex-start' },
  contactIcon: { fontSize: 36, flexShrink: 0 },
  contactTitle: { fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 6px' },
  contactDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 },
  contactLink: { color: '#C8A84B', fontWeight: 600 },
};