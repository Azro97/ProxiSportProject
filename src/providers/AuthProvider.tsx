// src/providers/AuthProvider.tsx
// Restores the Supabase session on launch and keeps authStore in sync with
// token refreshes / sign-outs. Never blocks rendering — accounts are optional,
// so the rest of the app must render immediately regardless of auth state
// (contrast with the GPS intro gate in App.tsx, which does block).

import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import * as authService from '../services/authService';

type Props = { children: React.ReactNode };

export default function AuthProvider({ children }: Props) {
  const setSession = useAuthStore(s => s.setSession);

  useEffect(() => {
    authService.getSession().then(setSession);
    const unsubscribe = authService.onAuthStateChange(setSession);
    return unsubscribe;
  }, [setSession]);

  return <>{children}</>;
}
