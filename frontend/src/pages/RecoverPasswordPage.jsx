import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export default function RecoverPasswordPage() {
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    authService.getDocumentTypes().then(r => setDocTypes(r.data.data));
  }, []);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await authService.recoverPassword({
        documentTypeId: parseInt(values.documentTypeId),
        documentNumber: values.documentNumber.trim(),
      });
      setSent(true);
    } catch {
      toast.error('Error al procesar la solicitud. Intente de nuevo.');
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
          <p style={styles.subtitle}>Recuperar contraseña</p>
        </div>

        <div style={styles.body}>
          {sent ? (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✉️</div>
              <h3 style={styles.successTitle}>Solicitud enviada</h3>
              <p style={styles.successText}>
                Si los datos ingresados corresponden a un usuario registrado, recibirá una contraseña
                temporal en el correo electrónico asociado a su cuenta.
              </p>
              <p style={styles.successNote}>Revise también la carpeta de spam.</p>
              <Link to="/login" style={styles.backBtn}>Volver al inicio de sesión</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <p style={styles.description}>
                Ingrese su tipo y número de documento para recibir una contraseña temporal en su correo registrado.
              </p>

              <div style={styles.field}>
                <label style={styles.label}>Tipo de documento *</label>
                <select style={{ ...styles.input, ...(errors.documentTypeId ? styles.inputError : {}) }}
                  {...register('documentTypeId', { required: 'Seleccione el tipo de documento' })}>
                  <option value="">Seleccione…</option>
                  {docTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                </select>
                {errors.documentTypeId && <span style={styles.error}>{errors.documentTypeId.message}</span>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Número de documento *</label>
                <input style={{ ...styles.input, ...(errors.documentNumber ? styles.inputError : {}) }}
                  type="text" placeholder="Ej: 1234567890"
                  {...register('documentNumber', { required: 'Número de documento requerido' })} />
                {errors.documentNumber && <span style={styles.error}>{errors.documentNumber.message}</span>}
              </div>

              <button type="submit" style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                {loading ? 'Procesando…' : 'Solicitar contraseña temporal'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link to="/login" style={styles.link}>← Volver al inicio de sesión</Link>
              </div>
            </form>
          )}
        </div>
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
    background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #003366, #005599)',
    padding: '28px 40px 20px', textAlign: 'center',
  },
  logoWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 },
  logoText: { fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: 2 },
  logoII: { fontSize: 24, fontWeight: 800, color: '#FFD700', background: 'rgba(255,215,0,0.15)', borderRadius: 6, padding: '0 6px' },
  subtitle: { color: '#a8c4e0', margin: '8px 0 0', fontSize: 14 },
  body: { padding: '32px 40px' },
  description: { color: '#555', fontSize: 14, lineHeight: 1.6, marginBottom: 24, marginTop: 0 },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8,
    fontSize: 14, color: '#333', outline: 'none', boxSizing: 'border-box',
  },
  inputError: { borderColor: '#e53935' },
  error: { display: 'block', fontSize: 12, color: '#e53935', marginTop: 4 },
  btn: {
    width: '100%', padding: 12, background: 'linear-gradient(135deg, #003366, #005599)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  link: { color: '#005599', fontSize: 13, textDecoration: 'none', fontWeight: 500 },
  successBox: { textAlign: 'center', padding: '8px 0' },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successTitle: { color: '#003366', fontSize: 20, fontWeight: 700, margin: '0 0 12px' },
  successText: { color: '#555', fontSize: 14, lineHeight: 1.6, marginBottom: 8 },
  successNote: { color: '#888', fontSize: 12, marginBottom: 24 },
  backBtn: {
    display: 'inline-block', padding: '10px 24px',
    background: 'linear-gradient(135deg, #003366, #005599)',
    color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600,
  },
};