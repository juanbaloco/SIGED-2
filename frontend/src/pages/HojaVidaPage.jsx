import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { cvService, readFileAsBase64 } from '../services/cvService';

const SECTIONS = [
  { key: 'personal', label: '1. Datos personales' },
  { key: 'education', label: '2. Formación académica' },
  { key: 'work', label: '3. Experiencia laboral' },
  { key: 'management', label: '4. Gerencia Pública' },
];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg'];
const ACCEPTED_SUPPORT_FILES = 'application/pdf,image/jpeg,.jpg,.jpeg';

// HU-012: marcador visual de obligatorio
const Req = () => <span style={{ color: '#e53935', marginLeft: 2 }}>*</span>;

export default function HojaVidaPage() {
  const [tab, setTab] = useState('personal');
  const [docTypes, setDocTypes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [managementEnabled, setManagementEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);
  const [preview, setPreview] = useState({
    open: false,
    loading: false,
    url: '',
    mime: '',
    title: '',
    error: '',
  });
  const previewUrlRef = useRef(null);

  const refresh = async () => {
    const [{ data: dt }, { data: sm }] = await Promise.all([
      authService.getDocumentTypes(),
      cvService.getSummary(),
    ]);
    setDocTypes(dt.data);
    setSummary(sm.data);
    setManagementEnabled(!!sm.data?.managementEnabled);
    setLoading(false);
  };
  
  const onSaveExperience = async (data) => {
    const res = await cvService.saveWorkExperience(data);
    if (res.success) {
      toast.success("Experiencia guardada");
      await refresh(); // Esto volverá a llamar al summary y activará la sección 4 si aplica
    }
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (tab === 'management' && !managementEnabled) {
      setTab('personal');
    }
  }, [managementEnabled, tab]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const closePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview({ open: false, loading: false, url: '', mime: '', title: '', error: '' });
  };

  const openPreview = async ({ section, id, fileName }) => {
    try {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      setPreview({
        open: true,
        loading: true,
        url: '',
        mime: '',
        title: fileName || 'Documento adjunto',
        error: '',
      });

      const response = await cvService.getAttachmentPreview(section, id);
      const blobUrl = URL.createObjectURL(response.data);
      previewUrlRef.current = blobUrl;

      setPreview({
        open: true,
        loading: false,
        url: blobUrl,
        mime: response.data.type || response.headers?.['content-type'] || '',
        title: fileName || 'Documento adjunto',
        error: '',
      });
    } catch (err) {
      setPreview({
        open: true,
        loading: false,
        url: '',
        mime: '',
        title: fileName || 'Documento adjunto',
        error: err.response?.data?.message || 'No se pudo cargar el documento para previsualizar',
      });
    }
  };

  const getPdfExport = async () => {
    const response = await cvService.exportCvPdf();
    return response.data;
  };

  const handleDownloadCv = async () => {
    setExportingPdf(true);
    try {
      const blob = await getPdfExport();
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hoja_vida_${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Descarga iniciada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No fue posible descargar la hoja de vida');
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrintCv = async () => {
    setPrintingPdf(true);
    try {
      const blob = await getPdfExport();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        URL.revokeObjectURL(url);
        toast.error('Permita ventanas emergentes para imprimir la hoja de vida');
        return;
      }

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>Imprimir hoja de vida</title>
            <style>
              html, body { margin: 0; padding: 0; height: 100%; }
              iframe { border: 0; width: 100%; height: 100%; }
            </style>
          </head>
          <body>
            <iframe id="cv-pdf" src="${url}"></iframe>
            <script>
              const iframe = document.getElementById('cv-pdf');
              iframe.onload = () => {
                setTimeout(() => {
                  window.focus();
                  window.print();
                }, 250);
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();

      const cleanBlobUrl = () => URL.revokeObjectURL(url);
      printWindow.addEventListener('afterprint', cleanBlobUrl, { once: true });
      setTimeout(cleanBlobUrl, 120000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No fue posible abrir la impresión');
    } finally {
      setPrintingPdf(false);
    }
  };

  if (loading) return <div style={styles.loading}>Cargando…</div>;

  return (
    <div style={styles.page}>
      <div style={styles.pageHeading}>
        <h1 style={styles.pageTitle}>Hoja de Vida</h1>
        <div style={styles.exportActions}>
          <button type="button" style={styles.btnSecondary} onClick={handlePrintCv} disabled={printingPdf || exportingPdf}>
            {printingPdf ? 'Abriendo impresión…' : '🖨 Imprimir'}
          </button>
          <button type="button" style={styles.btn} onClick={handleDownloadCv} disabled={exportingPdf || printingPdf}>
            {exportingPdf ? 'Generando PDF…' : '⬇ Descargar PDF'}
          </button>
        </div>
      </div>
      <p style={styles.pageSubtitle}>
        Diligencie cada sección y guarde su avance. Puede adjuntar soportes en PDF o JPG (máx. 2 MB). Los campos marcados con <Req /> son obligatorios.
      </p>

      <div style={styles.tabs}>
        {SECTIONS.map(s => {
          if (s.key === 'management' && !managementEnabled) return null;
          return (
            <button key={s.key} onClick={() => setTab(s.key)}
              style={{ ...styles.tab, ...(tab === s.key ? styles.tabActive : {}) }}>
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={styles.tabContent}>
        {tab === 'personal' && <PersonalSection summary={summary} docTypes={docTypes} onSaved={refresh} onPreview={openPreview} />}
        {tab === 'education' && <EducationSection summary={summary} onSaved={refresh} onPreview={openPreview} />}
        {tab === 'work' && <WorkSection summary={summary} onSaved={refresh} onPreview={openPreview} />}
        {tab === 'management' && <ManagementSection summary={summary} onSaved={refresh} onPreview={openPreview} />}
      </div>

      <DocumentPreviewModal preview={preview} onClose={closePreview} />
    </div>
  );
}

// ─── HU-006 / HU-007 ────────────────────────────────────────────────────────
function PersonalSection({ summary, docTypes, onSaved, onPreview }) {
  const initial = summary?.personal || {};
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      firstName: initial.first_name || '',
      middleName: initial.middle_name || '',
      lastName: initial.last_name || '',
      secondLastName: initial.second_last_name || '',
      documentTypeId: initial.document_type_id || '',
      documentNumber: initial.document_number || '',
      birthDate: initial.birth_date || '',
      gender: initial.gender || '',
      phone: initial.phone || '',
      mobile: initial.mobile || '',
      email: initial.email || '',
      country: initial.country || 'Colombia',
      department: initial.department || '',
      city: initial.city || '',
      zoneType: initial.zone_type || 'URBANA',
      address: initial.address || '',
      addressComplement: initial.address_complement || '',
    },
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const zoneType = watch('zoneType');
  const isValidated = !!initial.validated;

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      let payload = {
        ...values,
        documentTypeId: parseInt(values.documentTypeId),
      };
      if (file) {
        const att = await readFileAsBase64(file, { allowedMime: ALLOWED_MIME });
        payload = { ...payload, fileBase64: att.base64, fileMime: att.mime, fileName: att.name };
      }
      await cvService.savePersonal(payload);
      toast.success('Datos personales guardados');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {isValidated && <ValidatedBanner />}
      <fieldset disabled={isValidated} style={styles.fieldset}>
        <SectionHeader title="Identificación" />
        <div style={styles.formGrid}>
          <Field label="Primer nombre" required error={errors.firstName?.message}>
            <input style={styles.input} {...register('firstName', { required: 'Requerido' })} />
          </Field>
          <Field label="Segundo nombre">
            <input style={styles.input} {...register('middleName')} />
          </Field>
          <Field label="Primer apellido" required error={errors.lastName?.message}>
            <input style={styles.input} {...register('lastName', { required: 'Requerido' })} />
          </Field>
          <Field label="Segundo apellido">
            <input style={styles.input} {...register('secondLastName')} />
          </Field>
          <Field label="Tipo de documento" required error={errors.documentTypeId?.message}>
            <select style={styles.input} {...register('documentTypeId', { required: 'Requerido' })}>
              <option value="">Seleccione…</option>
              {docTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
            </select>
          </Field>
          <Field label="Número de documento" required error={errors.documentNumber?.message}>
            <input style={styles.input} {...register('documentNumber', { required: 'Requerido', maxLength: 20 })} />
          </Field>
          <Field label="Fecha de nacimiento" required error={errors.birthDate?.message}>
            <input style={styles.input} type="date" {...register('birthDate', { required: 'Requerido' })} />
          </Field>
          <Field label="Género" required error={errors.gender?.message}>
            <select style={styles.input} {...register('gender', { required: 'Requerido' })}>
              <option value="">Seleccione…</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </Field>
        </div>

        <SectionHeader title="Contacto" />
        <div style={styles.formGrid}>
          <Field label="Teléfono fijo">
            <input style={styles.input} {...register('phone')} />
          </Field>
          <Field label="Celular" required error={errors.mobile?.message}>
            <input style={styles.input} {...register('mobile', { required: 'Requerido' })} />
          </Field>
          <Field label="Correo electrónico" required full error={errors.email?.message}>
            <input style={styles.input} type="email"
              {...register('email', {
                required: 'Requerido',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
              })} />
          </Field>
        </div>

        <SectionHeader title="Residencia" />
        <div style={styles.formGrid}>
          <Field label="País" required error={errors.country?.message}>
            <input style={styles.input} {...register('country', { required: 'Requerido' })} />
          </Field>
          <Field label="Departamento" required error={errors.department?.message}>
            <input style={styles.input} {...register('department', { required: 'Requerido' })} />
          </Field>
          <Field label="Ciudad/Municipio" required error={errors.city?.message}>
            <input style={styles.input} {...register('city', { required: 'Requerido' })} />
          </Field>
          <Field label="Tipo de zona" required>
            <select style={styles.input} {...register('zoneType', { required: 'Requerido' })}>
              <option value="URBANA">Urbana</option>
              <option value="RURAL">Rural</option>
            </select>
          </Field>
          {zoneType === 'URBANA' && (
            <Field label="Dirección" required full error={errors.address?.message}>
              <input style={styles.input} placeholder="Ej: Calle 10 # 20-30"
                {...register('address', { required: zoneType === 'URBANA' ? 'Dirección requerida' : false })} />
            </Field>
          )}
          {/* HU-007 */}
          {zoneType === 'RURAL' && (
            <Field label="Complemento o dirección especial (zona rural)" required full
              error={errors.addressComplement?.message}>
              <input style={styles.input} placeholder="Ej: Vereda El Carmen, Finca La Esperanza"
                {...register('addressComplement', { required: zoneType === 'RURAL' ? 'Requerido en zona rural' : false })} />
            </Field>
          )}
          {zoneType === 'URBANA' && (
            <Field label="Complemento (opcional)" full>
              <input style={styles.input} placeholder="Ej: Apto 502, Torre B" {...register('addressComplement')} />
            </Field>
          )}
          <Field label="Soporte de la sección (PDF o JPG, máx. 2 MB)" full>
            <input
              type="file"
              accept={ACCEPTED_SUPPORT_FILES}
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {initial.attachment_name && (
              <span style={styles.fileHint}>
                Archivo actual: {initial.attachment_name}
                <button
                  type="button"
                  style={styles.previewBtnInline}
                  onClick={() => onPreview({ section: 'personal', fileName: initial.attachment_name })}
                >
                  👁 Mostrar documento
                </button>
              </span>
            )}
          </Field>
        </div>
      </fieldset>

      {!isValidated && (
        <button type="submit" style={{ ...styles.btn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
          {saving ? 'Guardando…' : '💾 Guardar datos personales'}
        </button>
      )}
    </form>
  );
}

// ─── HU-008 ─────────────────────────────────────────────────────────────────
function EducationSection({ summary, onSaved, onPreview }) {
  const items = summary?.education || [];
  const [showForm, setShowForm] = useState(items.length === 0);

  return (
    <div>
      <SectionHeader title="Formación académica" subtitle="Pregrado, posgrado y tarjeta profesional" />

      {items.length > 0 && (
        <div style={styles.itemList}>
          {items.map(it => (
            <ItemRow key={it.id} title={`${it.title} — ${it.institution}`}
              meta={`${it.level}${it.start_date ? ` · ${it.start_date} — ${it.end_date || 'Actual'}` : ''}${it.attachment_name ? ` · 📎 ${it.attachment_name}` : ''}`}
              validated={!!it.validated}
              canPreview={!!it.attachment_name}
              onPreview={() => onPreview({ section: 'education', id: it.id, fileName: it.attachment_name })}
              onDelete={async () => {
                if (!window.confirm('¿Eliminar este registro?')) return;
                try { await cvService.deleteEducation(it.id); toast.success('Eliminado'); onSaved(); }
                catch (err) { toast.error(err.response?.data?.message || 'Error'); }
              }} />
          ))}
        </div>
      )}

      {!showForm
        ? <button type="button" style={styles.btnSecondary} onClick={() => setShowForm(true)}>+ Agregar formación</button>
        : <EducationForm onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); onSaved(); }} />
      }
    </div>
  );
}

function EducationForm({ onSaved, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      let payload = { ...values };
      if (file) {
        const att = await readFileAsBase64(file, { allowedMime: ALLOWED_MIME });
        payload = { ...payload, fileBase64: att.base64, fileMime: att.mime, fileName: att.name };
      }
      await cvService.createEducation(payload);
      toast.success('Formación agregada');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.subForm}>
      <div style={styles.formGrid}>
        <Field label="Nivel" required error={errors.level?.message}>
          <select style={styles.input} {...register('level', { required: 'Requerido' })}>
            <option value="">Seleccione…</option>
            <option value="PREGRADO">Pregrado</option>
            <option value="POSGRADO">Posgrado</option>
            <option value="TARJETA_PROFESIONAL">Tarjeta profesional</option>
          </select>
        </Field>
        <Field label="Institución" required error={errors.institution?.message}>
          <input style={styles.input} {...register('institution', { required: 'Requerido' })} />
        </Field>
        <Field label="Título" required full error={errors.title?.message}>
          <input style={styles.input} {...register('title', { required: 'Requerido' })} />
        </Field>
        <Field label="Fecha inicio">
          <input style={styles.input} type="date" {...register('startDate')} />
        </Field>
        <Field label="Fecha fin (o grado)">
          <input style={styles.input} type="date" {...register('endDate')} />
        </Field>
        <Field label="N° tarjeta profesional" full>
          <input style={styles.input} {...register('professionalCard')} />
        </Field>
        <Field label="Soporte (PDF o JPG, máx. 2 MB)" full>
          <input type="file" accept={ACCEPTED_SUPPORT_FILES}
            onChange={e => setFile(e.target.files?.[0] || null)} />
        </Field>
      </div>

      <div style={styles.formActions}>
        <button type="button" style={styles.btnGhost} onClick={onCancel}>Cancelar</button>
        <button type="submit" style={{ ...styles.btn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
          {saving ? 'Guardando…' : '💾 Guardar formación'}
        </button>
      </div>
    </form>
  );
}

// ─── HU-009 ─────────────────────────────────────────────────────────────────
function WorkSection({ summary, onSaved, onPreview }) {
  const items = summary?.work || [];
  const [showForm, setShowForm] = useState(items.length === 0);

  return (
    <div>
      <SectionHeader title="Experiencia laboral" subtitle="Incluye experiencia docente" />

      {items.length > 0 && (
        <div style={styles.itemList}>
          {items.map(it => (
            <ItemRow key={it.id} title={`${it.position} — ${it.employer}`}
              meta={`${it.experience_type} · ${it.start_date} — ${it.is_current ? 'Actual' : (it.end_date || '—')}${it.attachment_name ? ` · 📎 ${it.attachment_name}` : ''}`}
              validated={!!it.validated}
              canPreview={!!it.attachment_name}
              onPreview={() => onPreview({ section: 'work', id: it.id, fileName: it.attachment_name })}
              onDelete={async () => {
                if (!window.confirm('¿Eliminar este registro?')) return;
                try { await cvService.deleteWork(it.id); toast.success('Eliminado'); onSaved(); }
                catch (err) { toast.error(err.response?.data?.message || 'Error'); }
              }} />
          ))}
        </div>
      )}

      {!showForm
        ? <button type="button" style={styles.btnSecondary} onClick={() => setShowForm(true)}>+ Agregar experiencia</button>
        : <WorkForm onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); onSaved(); }} />
      }
    </div>
  );
}

function WorkForm({ onSaved, onCancel }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { isCurrent: false },
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const isCurrent = watch('isCurrent');

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      let payload = { ...values, isCurrent: !!values.isCurrent };
      if (file) {
        const att = await readFileAsBase64(file, { allowedMime: ALLOWED_MIME });
        payload = { ...payload, fileBase64: att.base64, fileMime: att.mime, fileName: att.name };
      }
      await cvService.createWork(payload);
      toast.success('Experiencia agregada');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.subForm}>
      <div style={styles.formGrid}>
        <Field label="Tipo" required error={errors.experienceType?.message}>
          <select style={styles.input} {...register('experienceType', { required: 'Requerido' })}>
            <option value="">Seleccione…</option>
            <option value="PUBLICA">Pública</option>
            <option value="PRIVADA">Privada</option>
            <option value="DOCENTE">Docente</option>
          </select>
        </Field>
        <Field label="Empleador / Entidad" required error={errors.employer?.message}>
          <input style={styles.input} {...register('employer', { required: 'Requerido' })} />
        </Field>
        <Field label="Cargo" required full error={errors.position?.message}>
          <input style={styles.input} {...register('position', { required: 'Requerido' })} />
        </Field>
        <Field label="Fecha inicio" required error={errors.startDate?.message}>
          <input style={styles.input} type="date" {...register('startDate', { required: 'Requerido' })} />
        </Field>
        <Field label="Fecha fin">
          <input style={styles.input} type="date" {...register('endDate')} disabled={isCurrent} />
        </Field>
        <Field label="" full>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#444' }}>
            <input type="checkbox" {...register('isCurrent')} /> Actualmente en este cargo
          </label>
        </Field>
        <Field label="Funciones / responsabilidades" full>
          <textarea style={{ ...styles.input, minHeight: 70 }} {...register('responsibilities')} />
        </Field>
        <Field label="Certificación (PDF o JPG, máx. 2 MB)" full>
          <input type="file" accept={ACCEPTED_SUPPORT_FILES}
            onChange={e => setFile(e.target.files?.[0] || null)} />
        </Field>
      </div>

      <div style={styles.formActions}>
        <button type="button" style={styles.btnGhost} onClick={onCancel}>Cancelar</button>
        <button type="submit" style={{ ...styles.btn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
          {saving ? 'Guardando…' : '💾 Guardar experiencia'}
        </button>
      </div>
    </form>
  );
}

// ─── HU-010 ─────────────────────────────────────────────────────────────────
function ManagementSection({ summary, onSaved, onPreview }) {
  const initial = summary?.management || {};
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      hierarchicalLevel: initial.hierarchical_level || '',
      positionName: initial.position_name || '',
      entityName: initial.entity_name || '',
      startDate: initial.start_date || '',
    },
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const isValidated = !!initial.validated;

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      let payload = { ...values };
      if (file) {
        const att = await readFileAsBase64(file, { allowedMime: ALLOWED_MIME });
        payload = { ...payload, fileBase64: att.base64, fileMime: att.mime, fileName: att.name };
      }
      await cvService.saveManagement(payload);
      toast.success('Sección Gerencia Pública guardada');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {isValidated && <ValidatedBanner />}
      <SectionHeader title="Gerencia Pública"
        subtitle="Sección habilitada por su cargo directivo" />
      <fieldset disabled={isValidated} style={styles.fieldset}>
        <div style={styles.formGrid}>
          <Field label="Nivel jerárquico" required error={errors.hierarchicalLevel?.message}>
            <select style={styles.input} {...register('hierarchicalLevel', { required: 'Requerido' })}>
              <option value="">Seleccione…</option>
              <option value="DIRECTIVO">Directivo</option>
              <option value="ASESOR">Asesor</option>
              <option value="EJECUTIVO">Ejecutivo</option>
            </select>
          </Field>
          <Field label="Nombre del cargo" required error={errors.positionName?.message}>
            <input style={styles.input} {...register('positionName', { required: 'Requerido' })} />
          </Field>
          <Field label="Entidad" required full error={errors.entityName?.message}>
            <input style={styles.input} {...register('entityName', { required: 'Requerido' })} />
          </Field>
          <Field label="Fecha de posesión" required error={errors.startDate?.message}>
            <input style={styles.input} type="date" {...register('startDate', { required: 'Requerido' })} />
          </Field>
          <Field label="Soporte de la sección (PDF o JPG, máx. 2 MB)" full>
            <input
              type="file"
              accept={ACCEPTED_SUPPORT_FILES}
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {initial.attachment_name && (
              <span style={styles.fileHint}>
                Archivo actual: {initial.attachment_name}
                <button
                  type="button"
                  style={styles.previewBtnInline}
                  onClick={() => onPreview({ section: 'management', fileName: initial.attachment_name })}
                >
                  👁 Mostrar documento
                </button>
              </span>
            )}
          </Field>
        </div>
      </fieldset>

      {!isValidated && (
        <button type="submit" style={{ ...styles.btn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
          {saving ? 'Guardando…' : '💾 Guardar Gerencia Pública'}
        </button>
      )}
    </form>
  );
}

// ─── Helpers UI ─────────────────────────────────────────────────────────────
const Field = ({ label, required, full, error, children }) => (
  <div style={{ ...styles.field, ...(full ? { gridColumn: '1 / -1' } : {}) }}>
    <label style={styles.label}>{label}{required && <Req />}</label>
    {children}
    {error && <span style={styles.error}>{error}</span>}
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ margin: '8px 0 14px' }}>
    <h3 style={styles.sectionTitle}>{title}</h3>
    {subtitle && <p style={styles.sectionSub}>{subtitle}</p>}
  </div>
);

const ValidatedBanner = () => (
  <div style={styles.validatedBox}>
    🔒 Esta sección está validada por Talento Humano. No se puede modificar hasta que se levante la validación.
  </div>
);

const ItemRow = ({ title, meta, validated, canPreview, onPreview, onDelete }) => (
  <div style={styles.itemRow}>
    <div style={{ flex: 1 }}>
      <p style={{ margin: 0, fontWeight: 600, color: '#003366' }}>{title}</p>
      <p style={{ margin: '4px 0 0', color: '#666', fontSize: 12 }}>{meta}</p>
    </div>
    <div style={styles.itemActions}>
      {canPreview && (
        <button type="button" style={styles.previewBtn} onClick={onPreview}>
          👁 Mostrar documento
        </button>
      )}
      {validated
        ? <span style={styles.validatedBadge}>✓ Validado</span>
        : <button type="button" style={styles.deleteBtn} onClick={onDelete}>Eliminar</button>}
    </div>
  </div>
);

const DocumentPreviewModal = ({ preview, onClose }) => {
  if (!preview.open) return null;

  const isPdf = preview.mime.includes('pdf');
  const isImage = preview.mime.includes('image/');

  return (
    <div style={styles.modalBackdrop} onClick={onClose} role="presentation">
      <div style={styles.modalCard} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Previsualización de documento">
        <div style={styles.modalHeader}>
          <div>
            <p style={styles.modalTitle}>Previsualización de documento</p>
            <p style={styles.modalSubTitle}>{preview.title}</p>
          </div>
          <button type="button" style={styles.btnGhost} onClick={onClose}>Cerrar</button>
        </div>

        <div style={styles.previewBody}>
          {preview.loading && <p style={styles.previewInfo}>Cargando documento…</p>}
          {!preview.loading && preview.error && <p style={{ ...styles.previewInfo, color: '#e53935' }}>{preview.error}</p>}

          {!preview.loading && !preview.error && preview.url && isPdf && (
            <iframe title="Previsualización PDF" src={preview.url} style={styles.previewFrame} />
          )}

          {!preview.loading && !preview.error && preview.url && isImage && (
            <img alt="Previsualización del documento" src={preview.url} style={styles.previewImage} />
          )}

          {!preview.loading && !preview.error && preview.url && !isPdf && !isImage && (
            <p style={styles.previewInfo}>No hay vista previa para este tipo de archivo.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  loading: { padding: 40, textAlign: 'center', color: '#666' },
  page: { maxWidth: 950, margin: '0 auto' },
  pageHeading: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    flexWrap: 'wrap',
  },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#003366', margin: '0 0 6px' },
  pageSubtitle: { color: '#666', fontSize: 14, margin: '0 0 24px' },
  exportActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tabs: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  tab: {
    padding: '10px 16px', background: '#e8edf4', border: 'none', borderRadius: '8px 8px 0 0',
    cursor: 'pointer', fontSize: 13, color: '#555', fontWeight: 500,
  },
  tabActive: { background: '#fff', color: '#003366', fontWeight: 700, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' },
  tabContent: { background: '#fff', borderRadius: '0 8px 8px 8px', padding: 28, boxShadow: '0 2px 12px rgba(0,0,51,0.08)' },
  fieldset: { border: 'none', padding: 0, margin: 0 },
  sectionTitle: { color: '#003366', fontSize: 16, fontWeight: 700, margin: 0 },
  sectionSub: { color: '#888', fontSize: 12, margin: '2px 0 0' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: {
    width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 8,
    fontSize: 14, color: '#333', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  error: { display: 'block', fontSize: 12, color: '#e53935', marginTop: 4 },
  fileHint: { display: 'block', marginTop: 6, color: '#666', fontSize: 12 },
  btn: {
    padding: '11px 24px', background: 'linear-gradient(135deg, #003366, #005599)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 18px', background: '#fff', color: '#003366',
    border: '1.5px dashed #003366', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnGhost: {
    padding: '10px 18px', background: 'transparent', color: '#666',
    border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer',
  },
  formActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 },
  subForm: { background: '#f8f9fa', borderRadius: 8, padding: 18, marginTop: 14, border: '1px solid #e0e0e0' },
  itemList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 },
  itemRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 8, padding: '12px 14px',
  },
  itemActions: { display: 'flex', gap: 8, alignItems: 'center' },
  previewBtnInline: {
    marginLeft: 10, background: 'transparent', color: '#003366', border: 'none',
    textDecoration: 'underline', cursor: 'pointer', fontSize: 12, padding: 0,
  },
  previewBtn: {
    background: '#eaf3ff', color: '#003366', border: '1px solid #bfd9ff',
    borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12,
  },
  deleteBtn: {
    background: 'transparent', color: '#e53935', border: '1px solid #e53935',
    borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12,
  },
  validatedBadge: {
    background: '#2e7d32', color: '#fff', borderRadius: 16, padding: '3px 10px', fontSize: 11, fontWeight: 600,
  },
  validatedBox: {
    background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, color: '#856404', marginBottom: 16,
  },
  modalBackdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.55)', zIndex: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14,
  },
  modalCard: {
    width: '100%', maxWidth: 980, background: '#fff', borderRadius: 10,
    boxShadow: '0 18px 50px rgba(0,0,0,0.32)', overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid #ececec', padding: '12px 16px',
  },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#003366' },
  modalSubTitle: {
    margin: '2px 0 0', fontSize: 12, color: '#666', maxWidth: 680,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  previewBody: {
    padding: 12, background: '#f4f7fb', minHeight: 450,
    maxHeight: 'calc(100vh - 150px)', overflow: 'auto',
  },
  previewFrame: {
    width: '100%', minHeight: 640, border: '1px solid #dbe3ef', borderRadius: 8, background: '#fff',
  },
  previewImage: {
    width: '100%', maxHeight: 'calc(100vh - 220px)', objectFit: 'contain',
    background: '#fff', border: '1px solid #dbe3ef', borderRadius: 8,
  },
  previewInfo: { fontSize: 14, color: '#445', margin: 0 },
};
