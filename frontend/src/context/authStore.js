import { create } from 'zustand';
import { authService } from '../services/authService';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  mustChangePassword: false,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { set({ loading: false }); return; }
    try {
      const { data } = await authService.me();
      set({ user: data.data, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ loading: false });
    }
  },

  login: async (credentials) => {
    const { data } = await authService.login(credentials);
    const { accessToken, refreshToken, user, mustChangePassword } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true, mustChangePassword });
    return { mustChangePassword };
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await authService.logout(refreshToken);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, mustChangePassword: false });
    }
  },

  setMustChangePassword: (val) => set({ mustChangePassword: val }),
  hasRole: (role) => get().user?.roles?.includes(role) ?? false,
}));

export default useAuthStore;