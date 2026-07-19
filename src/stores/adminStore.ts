// src/stores/adminStore.ts
import { create } from 'zustand';

// Hardcoded credentials — replace with Firebase Auth when ready
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

interface AdminStore {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAdminStore = create<AdminStore>(set => ({
  isAuthenticated: false,
  login: (username, password) => {
    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false }),
}));
