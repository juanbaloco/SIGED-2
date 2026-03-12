import React, { useEffect, useState } from 'react';
import { useNavigate ,Link } from 'react-router-dom';
import { useForm} from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import { authService } from '../services/authService';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuthStore();
    const [ docTypes, setdocTypes ]= useState([]);
    const [ loading, setLoading ] = useState(false);
    const [ showPass, setShowPass ] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
        authService.getDocumentTypes().then(r => setdocTypes(r.data.data));
    }, [isAuthenticated, navigate]);

    const onSubmit = async (values) => {
        setLoading(true);
        try {
            const { mustChangePassword} = await login({
                documentTypeId: parseInt(values.documentTypeId),
                documentNumber: values.documentNumber.trim(),
                password: values.password,
        
            });
            toast.success('Bienvenido al sistema');
            navigate(mustChangePassword ? '/change-password' : '/dashboard', { replace: true });
        } catch (error) {
            const msg = error.response?.data?.message || 'Error al iniciar sesión';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrap}>
            <span style={styles.logoText}>SIGEP</span>
            <span style={styles.logoII}>II</span>
          </div>
          <p style={styles.subtitle}>Sistema de Gestión de Empleo Público</p>
          <p style={styles.entity}>Función Pública — Colombia</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={styles.form} noValidate>
          <h2 style={styles.formTitle}>Iniciar sesión</h2>

          <div style={styles.field}>
            <label style={styles.label}>Tipo de documento *</label>
            <select style={{ ...styles.input, ...(errors.documentTypeId ? styles.inputError : {}) }}
              {...register('documentTypeId', { required: 'Seleccione el tipo de documento' })}>
              <option value="">Seleccione…</option>
              {docTypes.map(dt => (
                <option key={dt.id} value={dt.id}>{dt.name}</option>
              ))}
            </select>
            {errors.documentTypeId && <span style={styles.error}>{errors.documentTypeId.message}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Número de documento *</label>
            <input style={{ ...styles.input, ...(errors.documentNumber ? styles.inputError : {}) }}
              type="text" placeholder="Ej: 1234567890"
              {...register('documentNumber', {
                required: 'Número de documento requerido',
                maxLength: { value: 20, message: 'Máximo 20 caracteres' },
              })} />
            {errors.documentNumber && <span style={styles.error}>{errors.documentNumber.message}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña *</label>
            <div style={styles.passWrap}>
              <input style={{ ...styles.input, paddingRight: 44, ...(errors.password ? styles.inputError : {}) }}
                type={showPass ? 'text' : 'password'}
                placeholder="Ingrese su contraseña"
                {...register('password', { required: 'Contraseña requerida' })} />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowPass(s => !s)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span style={styles.error}>{errors.password.message}</span>}
          </div>

          <div style={styles.forgotWrap}>
            <Link to="/recover-password" style={styles.link}>¿Olvidó su contraseña?</Link>
          </div>

          <button type="submit" style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Verificando…' : 'Ingresar al sistema'}
          </button>
        </form>

        <p style={styles.footer}>
          Departamento Administrativo de la Función Pública
        </p>
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
    padding: '32px 40px 24px', textAlign: 'center',
  },
  logoWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 },
  logoText: { fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: 2 },
  logoII: {
    fontSize: 28, fontWeight: 800, color: '#FFD700',
    background: 'rgba(255,215,0,0.15)', borderRadius: 6, padding: '0 6px',
  },
  subtitle: { color: '#a8c4e0', margin: '8px 0 4px', fontSize: 14 },
  entity: { color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 12 },
  form: { padding: '32px 40px' },
  formTitle: { fontSize: 20, fontWeight: 700, color: '#003366', margin: '0 0 24px' },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8,
    fontSize: 14, color: '#333', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  inputError: { borderColor: '#e53935' },
  error: { display: 'block', fontSize: 12, color: '#e53935', marginTop: 4 },
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4,
  },
  forgotWrap: { textAlign: 'right', marginBottom: 20, marginTop: -8 },
  link: { color: '#005599', fontSize: 13, textDecoration: 'none', fontWeight: 500 },
  btn: {
    width: '100%', padding: '12px', background: 'linear-gradient(135deg, #003366, #005599)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center', fontSize: 11, color: '#999', padding: '0 24px 20px',
    borderTop: '1px solid #f0f0f0', paddingTop: 16,
  },
};