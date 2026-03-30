import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/lib/api';
import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/authStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getAuthToken(),
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      setAuthToken(response.token);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    clearAuthToken();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  loadUser: async () => {
    const token = getAuthToken();
    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      set({
        user: response.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      clearAuthToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));










