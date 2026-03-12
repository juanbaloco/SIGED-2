import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import useAuthStore from '../context/authStore';

const rules = [
  { test: (v) => v.length >= 6,      label: 'Mínimo 6 caracteres' },
  { test: (v) => /[a-zA-Z]/.test(v), label: 'Al menos una letra' },
  { test: (v) => /\d/.test(v),        label: 'Al menos un número' },
  { test: (v) => /[@#$%&*!¡¿?.,-]/.test(v), label: 'Al menos un carácter especial (@#$%&*!)' },
];

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { setMustChangePassword, mustChangePassword } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPass, setNewPass] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const watchNew = watch('newPassword', '');

  const onSubmit = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Contraseña actualizada correctamente');
      setMustChangePassword(false);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoWrap}>
            <span style={styles.logoText}>SIGEP</span>
            <span style={styles.logoII}>II</span>
          </div>
          <p style={styles.subtitle}>
            {mustChangePassword ? '⚠️ Debe cambiar su contraseña para continuar' : 'Cambiar contraseña'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form} noValidate>
          {mustChangePassword && (
            <div style={styles.warningBanner}>
              Por seguridad, debe establecer una nueva contraseña antes de usar el sistema.
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Contraseña actual *</label>
            <div style={styles.passWrap}>
              <input style={styles.input} type={showCurrent ? 'text' : 'password'}
                placeholder="Ingrese la contraseña actual"
                {...register('currentPassword', { required: 'Contraseña actual requerida' })} />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowCurrent(s => !s)}>
                {showCurrent ? '👁️' : '👀'}
              </button>
            </div>
            {errors.currentPassword && <span style={styles.error}>{errors.currentPassword.message}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Nueva contraseña *</label>
            <div style={styles.passWrap}>
              <input style={styles.input} type={showNew ? 'text' : 'password'}
                placeholder="Ingrese la nueva contraseña"
                {...register('newPassword', {
                  required: 'Nueva contraseña requerida',
                  validate: (v) => rules.every(r => r.test(v)) || 'No cumple los requisitos',
                  onChange: (e) => setNewPass(e.target.value),
                })} />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowNew(s => !s)}>
                {showNew ? '👁️' : '👀'}
              </button>
            </div>
            {errors.newPassword && <span style={styles.error}>{errors.newPassword.message}</span>}

            {/* Indicador de requisitos */}
            <div style={styles.rulesBox}>
              {rules.map((r, i) => (
                <div key={i} style={{ ...styles.rule, color: r.test(watchNew) ? '#2e7d32' : '#888' }}>
                  <span>{r.test(watchNew) ? '✓' : '○'}</span> {r.label}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirmar nueva contraseña *</label>
            <div style={styles.passWrap}>
              <input style={styles.input} type={showConfirm ? 'text' : 'password'}
                placeholder="Repita la nueva contraseña"
                {...register('confirmPassword', { required: 'Confirme la contraseña' })} />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(s => !s)}>
                {showConfirm ? '👁️' : '👀'}
              </button>
            </div>
            {errors.confirmPassword && <span style={styles.error}>{errors.confirmPassword.message}</span>}
          </div>

          <button type="submit" style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </form>
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
    background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #003366, #005599)',
    padding: '28px 40px 20px', textAlign: 'center',
  },
  logoWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 },
  logoText: { fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: 2 },
  logoII: { fontSize: 24, fontWeight: 800, color: '#FFD700', background: 'rgba(255,215,0,0.15)', borderRadius: 6, padding: '0 6px' },
  subtitle: { color: '#a8c4e0', margin: '8px 0 0', fontSize: 13 },
  form: { padding: '28px 40px 32px' },
  warningBanner: {
    background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, color: '#856404', marginBottom: 20,
  },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 40px 10px 12px', border: '1.5px solid #ddd', borderRadius: 8,
    fontSize: 14, color: '#333', outline: 'none', boxSizing: 'border-box',
  },
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4,
  },
  error: { display: 'block', fontSize: 12, color: '#e53935', marginTop: 4 },
  rulesBox: { marginTop: 8, padding: '10px 12px', background: '#f8f9fa', borderRadius: 6 },
  rule: { fontSize: 12, display: 'flex', gap: 6, marginBottom: 3, transition: 'color 0.2s' },
  btn: {
    width: '100%', padding: 12, background: 'linear-gradient(135deg, #003366, #005599)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
};