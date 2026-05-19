import api from './api';

export const cvService = {
  getSummary:        ()         => api.get('/cv/summary'),

  // HU-006 / HU-007
  getPersonal:       ()         => api.get('/cv/personal'),
  savePersonal:      (data)     => api.put('/cv/personal', data),

  // HU-008
  listEducation:     ()         => api.get('/cv/education'),
  createEducation:   (data)     => api.post('/cv/education', data),
  updateEducation:   (id, data) => api.put(`/cv/education/${id}`, data),
  deleteEducation:   (id)       => api.delete(`/cv/education/${id}`),

  // HU-009
  listWork:          ()         => api.get('/cv/work'),
  createWork:        (data)     => api.post('/cv/work', data),
  updateWork:        (id, data) => api.put(`/cv/work/${id}`, data),
  deleteWork:        (id)       => api.delete(`/cv/work/${id}`),

  // HU-010
  getManagement:     ()         => api.get('/cv/management'),
  saveManagement:    (data)     => api.put('/cv/management', data),

  // HU-014
  getAttachmentPreview: (section, id) => {
    const suffix = id ? `/${id}` : '';
    return api.get(`/cv/attachments/${section}${suffix}`, { responseType: 'blob' });
  },

  // HU-015
  exportCvPdf: () => api.get('/cv/export/pdf', { responseType: 'blob' }),
};

// Util: file → { base64, mime, name } con validación 2MB y formato
export const readFileAsBase64 = (file, { allowedMime, maxBytes = 2 * 1024 * 1024 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Sin archivo'));
    if (allowedMime && !allowedMime.includes(file.type))
      return reject(new Error('Formato no permitido. Solo PDF o JPG.'));
    if (file.size > maxBytes)
      return reject(new Error('El archivo supera el tamaño máximo de 2 MB.'));
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = String(result).split(',')[1];
      resolve({ base64, mime: file.type, name: file.name, size: file.size });
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
