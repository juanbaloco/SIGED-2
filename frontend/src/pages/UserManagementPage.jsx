import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import api from '../services/api';

const ROLES = ['SERVIDOR', 'JTH'];

export default function UserManagementPage() {
  const [docTypes, setDocTypes] = useState([]);
  const [tab, setTab] = useState('create'); // 'create' | 'disable'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authService.getDocumentTypes().then(r => setDocTypes(r.data.data));
  }, []);

  // ── HU-004: Crear usuario ───────────────────────────────────────────────
  const CreateUserForm = () => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [saving, setSaving] = useState(false);

    const onSubmit = async (values) => {
      setSaving(true);
      try {
        const res = await authService.createUser({
          documentTypeId: parseInt(values.documentTypeId),
          documentNumber: values.documentNumber.trim(),
          email: values.email.trim(),
          roleCode: values.roleCode,
        });
        toast.success(`Usuario creado. Credenciales enviadas a ${res.data.data.email}`);
        reset();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error al crear usuario');
      } finally {
        setSaving(false);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Tipo de documento *</label>
            <select style={{ ...styles.input, ...(errors.documentTypeId ? styles.inputError : {}) }}
              {...register('documentTypeId', { required: 'Requerido' })}>
              <option value="">Seleccione…</option>
              {docTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
            </select>
            {errors.documentTypeId && <span style={styles.error}>{errors.documentTypeId.message}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Número de documento *</label>
            <input style={{ ...styles.input, ...(errors.documentNumber ? styles.inputError : {}) }}
              type="text" placeholder="Ej: 1234567890"
              {...register('documentNumber', { required: 'Requerido', maxLength: { value: 20, message: 'Máximo 20 caracteres' } })} />
            {errors.documentNumber && <span style={styles.error}>{errors.documentNumber.message}</span>}
          </div>

          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <label style={styles.label}>Correo electrónico *</label>
            <input style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
              type="email" placeholder="correo@entidad.gov.co"
              {...register('email', {
                required: 'Requerido',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
              })} />
            {errors.email && <span style={styles.error}>{errors.email.message}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Rol *</label>
            <select style={styles.input}
              {...register('roleCode', { required: 'Requerido' })}>
              {ROLES.map(r => <option key={r} value={r}>{r === 'SERVIDOR' ? 'Servidor Público' : 'Jefe de Talento Humano'}</option>)}
            </select>
          </div>
        </div>

        <div style={styles.infoBox}>
          ℹ️ Se enviará una contraseña temporal al correo electrónico registrado. El usuario deberá cambiarla en su primer ingreso.
        </div>

        <button type="submit" style={{ ...styles.btn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
          {saving ? 'Creando usuario…' : '+ Crear usuario y enviar credenciales'}
        </button>
      </form>
    );
  };

  // ── HU-005: Inhabilitar rol ─────────────────────────────────────────────
  const DisableRoleForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [saving, setSaving] = useState(false);
    const [searchDoc, setSearchDoc] = useState('');
    const [searchDocType, setSearchDocType] = useState('');
    const [foundUser, setFoundUser] = useState(null);
    const [searching, setSearching] = useState(false);

    const searchUser = async () => {
      if (!searchDocType || !searchDoc) { toast.error('Ingrese tipo y número de documento'); return; }
      setSearching(true);
      try {
        const res = await api.get(`/users/search?documentTypeId=${searchDocType}&documentNumber=${searchDoc}`);
        setFoundUser(res.data.data);
      } catch {
        toast.error('Usuario no encontrado');
        setFoundUser(null);
      } finally {
        setSearching(false);
      }
    };

    const onSubmit = async (values) => {
      if (!foundUser) { toast.error('Busque primero al usuario'); return; }
      setSaving(true);
      try {
        await authService.disableRole(foundUser.id, values.roleCode, values.endDate);
        toast.success('Rol inhabilitado correctamente');
        setFoundUser(null);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error al inhabilitar rol');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div>
        {/* Búsqueda */}
        <div style={styles.searchBox}>
          <h4 style={{ margin: '0 0 14px', color: '#003366', fontSize: 15 }}>Buscar servidor público</h4>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Tipo de documento</label>
              <select style={styles.input} value={searchDocType} onChange={e => setSearchDocType(e.target.value)}>
                <option value="">Seleccione…</option>
                {docTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Número de documento</label>
              <input style={styles.input} type="text" value={searchDoc}
                onChange={e => setSearchDoc(e.target.value)} placeholder="Ej: 1234567890" />
            </div>
          </div>
          <button type="button" style={styles.searchBtn} onClick={searchUser} disabled={searching}>
            {searching ? 'Buscando…' : '🔍 Buscar'}
          </button>
        </div>

        {foundUser && (
          <div style={styles.foundUser}>
            <div style={styles.foundBadge}>✓ Usuario encontrado</div>
            <p style={{ margin: '8px 0 4px', fontWeight: 600, color: '#003366' }}>{foundUser.email}</p>
            <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
              Roles activos: <strong>{foundUser.roles?.join(', ') || '—'}</strong>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ marginTop: 20 }}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Rol a inhabilitar *</label>
                  <select style={styles.input} {...register('roleCode', { required: 'Requerido' })}>
                    {(foundUser.roles || []).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.roleCode && <span style={styles.error}>{errors.roleCode.message}</span>}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Fecha de fin *</label>
                  <input style={styles.input} type="date"
                    {...register('endDate', { required: 'Requerido' })} />
                  {errors.endDate && <span style={styles.error}>{errors.endDate.message}</span>}
                </div>
              </div>

              <div style={styles.warningBox}>
                ⚠️ Al inhabilitar el último rol activo, la cuenta del usuario quedará desactivada.
              </div>

              <button type="submit" style={{ ...styles.dangerBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                {saving ? 'Inhabilitando…' : 'Inhabilitar rol'}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Gestión de Usuarios</h1>
      <p style={styles.pageSubtitle}>Administre los accesos de los servidores públicos</p>

      <div style={styles.tabs}>
        {[
          { key: 'create', label: '+ Crear usuario (HU-004)' },
          { key: 'disable', label: '🚫 Inhabilitar rol (HU-005)' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ ...styles.tab, ...(tab === t.key ? styles.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={styles.tabContent}>
        {tab === 'create' ? <CreateUserForm /> : <DisableRoleForm />}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 800, margin: '0 auto' },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#003366', margin: '0 0 6px' },
  pageSubtitle: { color: '#666', fontSize: 14, margin: '0 0 28px' },
  tabs: { display: 'flex', gap: 8, marginBottom: 0 },
  tab: {
    padding: '10px 20px', background: '#e8edf4', border: 'none', borderRadius: '8px 8px 0 0',
    cursor: 'pointer', fontSize: 14, color: '#555', fontWeight: 500,
  },
  tabActive: { background: '#fff', color: '#003366', fontWeight: 700, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' },
  tabContent: {
    background: '#fff', borderRadius: '0 8px 8px 8px',
    padding: 28, boxShadow: '0 2px 12px rgba(0,0,51,0.08)',
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8,
    fontSize: 14, color: '#333', outline: 'none', boxSizing: 'border-box',
  },
  inputError: { borderColor: '#e53935' },
  error: { display: 'block', fontSize: 12, color: '#e53935', marginTop: 4 },
  infoBox: {
    background: '#e8f4fd', border: '1px solid #b3d9f5', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, color: '#1a5276', marginBottom: 20,
  },
  warningBox: {
    background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, color: '#856404', marginBottom: 20,
  },
  btn: {
    padding: '11px 24px', background: 'linear-gradient(135deg, #003366, #005599)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  dangerBtn: {
    padding: '11px 24px', background: 'linear-gradient(135deg, #b71c1c, #e53935)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  searchBox: {
    background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20,
  },
  searchBtn: {
    padding: '9px 20px', background: '#003366', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
  foundUser: {
    background: '#f0fff4', border: '1px solid #a5d6a7', borderRadius: 8, padding: 20,
  },
  foundBadge: {
    display: 'inline-block', background: '#2e7d32', color: '#fff',
    borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600,
  },
};