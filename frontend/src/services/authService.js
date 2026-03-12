import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  recoverPassword: (data) => api.post('/auth/recover-password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  getDocumentTypes: () => api.get('/auth/document-types'),

  // JTH
  createUser: (data) => api.post('/auth/users', data),
  disableRole: (userId, roleCode, endDate) =>
    api.put(`/auth/users/${userId}/roles/${roleCode}/disable`, { endDate }),
};