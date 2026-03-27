import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

const C = { navy: '#003366', blue: '#0057A8', gold: '#C8A84B', white: '#FFFFFF' };

const rules = [
  { test: (v) => v.length >= 6,                 label: 'Mínimo 6 caracteres' },
  { test: (v) => /[a-zA-Z]/.test(v),            label: 'Al menos una letra' },
  { test: (v) => /\d/.test(v),                  label: 'Al menos un número' },
  { test: (v) => /[@#$%&*!¡¿?.,-]/.test(v),    label: 'Al menos un carácter especial (@#$%&*!)' },
];

// ─── Estados de pantalla ──────────────────────────────────────────────────────
const SCREEN = { LOADING: 'loading', VALID: 'valid', INVALID: 'invalid', SUCCESS: 'success' };

export default function ResetPasswordPage() {
  const [searchParams]    = useSearchParams();
  const token             = searchParams.get('token');
  const [screen, setScreen] = useState(token ? SCREEN.LOADING : SCREEN.INVALID);
  const [expiresAt, setExpiresAt] = useState(null);
  const [show, setShow]   = useState({ newPass: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const watchNew = watch('newPassword', '');

  // Verificar si el token sigue siendo válido al cargar la página
  useEffect(() => {
    if (!token) { setScreen(SCREEN.INVALID); return; }

    api.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then(res => {
        setExpiresAt(res.data.expiresAt);
        setScreen(SCREEN.VALID);
      })
      .catch(() => setScreen(SCREEN.INVALID));
  }, [token]);

  const onSubmit = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: values.newPassword });
      setScreen(SCREEN.SUCCESS);
    } catch (err) {
      const msg = err.response?.data?.message || 'El enlace es inválido o ha expirado';
      toast.error(msg);
      if (err.response?.status === 400) setScreen(SCREEN.INVALID);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header siempre visible */}
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <span style={styles.logoSigep}>SIGEP</span>
            <span style={styles.logoII}>II</span>
          </div>
          <p style={styles.headerSub}>Restablecer contraseña de acceso</p>
        </div>

        {/* ── CARGANDO ── */}
        {screen === SCREEN.LOADING && (
          <div style={styles.body}>
            <div style={styles.centered}>
              <div style={styles.spinner} />
              <p style={{ color: C.navy, fontWeight: 600, marginTop: 16 }}>Verificando enlace…</p>
            </div>
          </div>
        )}

        {/* ── TOKEN INVÁLIDO / EXPIRADO ── */}
        {screen === SCREEN.INVALID && (
          <div style={styles.body}>
            <div style={styles.centered}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ color: C.navy, margin: '0 0 10px', fontSize: 19 }}>Enlace inválido o expirado</h3>
              <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
                El enlace de recuperación no es válido, ya fue utilizado, o ha expirado (los enlaces tienen una duración de 1 hora).
              </p>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
                Solicite un nuevo enlace desde la pantalla de recuperación de contraseña.
              </p>
              <Link to="/recover-password" style={styles.btn}>
                Solicitar nuevo enlace
              </Link>
              <div style={{ marginTop: 14, textAlign: 'center' }}>
                <Link to="/login" style={styles.linkSmall}>← Volver al inicio de sesión</Link>
              </div>
            </div>
          </div>
        )}

        {/* ── FORMULARIO (token válido) ── */}
        {screen === SCREEN.VALID && (
          <form onSubmit={handleSubmit(onSubmit)} style={styles.body} noValidate>
            <div style={styles.infoBanner}>
              🔒 El enlace es válido. Establezca su nueva contraseña a continuación.
              {expiresAt && (
                <span style={{ display: 'block', fontSize: 11, marginTop: 4, color: '#1565C0' }}>
                  Expira: {new Date(expiresAt).toLocaleString('es-CO')}
                </span>
              )}
            </div>

            {/* Nueva contraseña */}
            <div style={styles.field}>
              <label style={styles.label}>Nueva contraseña *</label>
              <div style={styles.passWrap}>
                <input
                  style={{ ...styles.input, ...(errors.newPassword ? styles.inputError : {}) }}
                  type={show.newPass ? 'text' : 'password'}
                  placeholder="Ingrese su nueva contraseña"
                  {...register('newPassword', {
                    required: 'Campo requerido',
                    validate: v => rules.every(r => r.test(v)) || 'No cumple los requisitos de seguridad',
                  })}
                />
                <button type="button" style={styles.eyeBtn}
                  onClick={() => setShow(s => ({ ...s, newPass: !s.newPass }))}>
                  {show.newPass ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.newPassword && <span style={styles.error}>{errors.newPassword.message}</span>}

              {/* Indicador de requisitos en tiempo real */}
              <div style={styles.rulesBox}>
                {rules.map((r, i) => (
                  <div key={i} style={{ ...styles.rule, color: r.test(watchNew) ? '#2e7d32' : '#999' }}>
                    <span style={{ fontWeight: 700, width: 14, display: 'inline-block' }}>
                      {r.test(watchNew) ? '✓' : '○'}
                    </span>
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmar */}
            <div style={styles.field}>
              <label style={styles.label}>Confirmar contraseña *</label>
              <div style={styles.passWrap}>
                <input
                  style={{ ...styles.input, ...(errors.confirmPassword ? styles.inputError : {}) }}
                  type={show.confirm ? 'text' : 'password'}
                  placeholder="Repita la nueva contraseña"
                  {...register('confirmPassword', { required: 'Campo requerido' })}
                />
                <button type="button" style={styles.eyeBtn}
                  onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}>
                  {show.confirm ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.confirmPassword && <span style={styles.error}>{errors.confirmPassword.message}</span>}
            </div>

            <button
              type="submit"
              style={{ ...styles.btn, width: '100%', opacity: loading ? 0.7 : 1 }}
              disabled={loading}>
              {loading ? 'Actualizando contraseña…' : '🔐 Establecer nueva contraseña'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Link to="/login" style={styles.linkSmall}>← Volver al inicio de sesión</Link>
            </div>
          </form>
        )}

        {/* ── ÉXITO ── */}
        {screen === SCREEN.SUCCESS && (
          <div style={styles.body}>
            <div style={styles.centered}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
              <h3 style={{ color: C.navy, margin: '0 0 10px', fontSize: 20 }}>¡Contraseña actualizada!</h3>
              <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
                Su contraseña ha sido restablecida correctamente. Ya puede iniciar sesión con sus nuevas credenciales.
              </p>
              <Link to="/login" style={styles.btn}>Ir al inicio de sesión</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #003366 0%, #005599 50%, #0077cc 100%)',
    fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 16,
  },
  card: {
    background: C.white, borderRadius: 12, width: '100%', maxWidth: 460,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #003366, #005599)',
    padding: '28px 40px 22px', textAlign: 'center',
  },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 },
  logoSigep: { fontSize: 28, fontWeight: 900, color: C.white, letterSpacing: 2 },
  logoII: { fontSize: 22, fontWeight: 900, color: C.gold, background: 'rgba(200,168,75,0.15)', borderRadius: 5, padding: '1px 7px' },
  headerSub: { color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 13 },
  body: { padding: '28px 36px 32px' },
  centered: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  infoBanner: {
    background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, color: '#1565C0', marginBottom: 20, lineHeight: 1.5,
  },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 40px 10px 12px', border: '1.5px solid #ddd',
    borderRadius: 8, fontSize: 14, color: '#333', outline: 'none', boxSizing: 'border-box',
  },
  inputError: { borderColor: '#e53935' },
  error: { display: 'block', fontSize: 12, color: '#e53935', marginTop: 4 },
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4,
  },
  rulesBox: { marginTop: 8, padding: '10px 12px', background: '#F8F9FA', borderRadius: 6 },
  rule: { fontSize: 12, display: 'flex', gap: 6, marginBottom: 4, transition: 'color 0.2s', alignItems: 'center' },
  btn: {
    display: 'inline-block', padding: '12px 28px',
    background: 'linear-gradient(135deg, #003366, #005599)',
    color: C.white, borderRadius: 8, fontSize: 14, fontWeight: 700,
    cursor: 'pointer', border: 'none', textDecoration: 'none',
    fontFamily: 'inherit', textAlign: 'center',
  },
  linkSmall: { color: C.blue, fontSize: 13, textDecoration: 'none' },
  spinner: {
    width: 40, height: 40, border: '4px solid #E0E8F4',
    borderTop: `4px solid ${C.navy}`, borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};