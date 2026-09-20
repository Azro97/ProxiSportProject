// src/stores/authStore.ts
// Optional account state — unlike adminStore's synchronous fake login, these
// actions are real Supabase Auth calls and throw on failure; screens catch
// and show inline errors. Session restore + live updates are wired by
// AuthProvider (src/providers/AuthProvider.tsx), not this store itself.

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import * as authService from '../services/authService';

interface AuthStore {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>(set => ({
  session: null,
  user: null,
  initializing: true,

  setSession: session => set({ session, user: session?.user ?? null, initializing: false }),

  signIn: async (email, password) => {
    const { session } = await authService.signIn(email, password);
    set({ session, user: session?.user ?? null });
  },

  signUp: async (email, password) => {
    const { session } = await authService.signUp(email, password);
    set({ session, user: session?.user ?? null });
    return { needsEmailConfirmation: session === null };
  },

  signOut: async () => {
    await authService.signOut();
    set({ session: null, user: null });
  },

  resetPassword: email => authService.resetPassword(email),

  deleteAccount: async () => {
    await authService.deleteAccount();
    set({ session: null, user: null });
  },
}));
