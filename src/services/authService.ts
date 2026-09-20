// src/services/authService.ts
// Thin wrapper around supabase.auth.* — same shape as every other service
// file (throws on error). Auth is optional in this app: browsing never
// requires a session, only tournament registration and "Mes inscriptions"
// read from it. See CLAUDE.md's "Frontend conventions" section for the full
// list of files allowed to import supabase.ts.

import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { withTimeout } from './withTimeout';

export async function signUp(email: string, password: string): Promise<{ session: Session | null }> {
  const { data, error } = await withTimeout(supabase.auth.signUp({ email, password }));
  if (error) throw error;
  return { session: data.session };
}

export async function signIn(email: string, password: string): Promise<{ session: Session | null }> {
  const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
  if (error) throw error;
  return { session: data.session };
}

export async function signOut(): Promise<void> {
  const { error } = await withTimeout(supabase.auth.signOut());
  if (error) throw error;
}

/**
 * Permanently deletes the signed-in user's account (Edge Function, service-role
 * only — the client can never delete auth.users rows directly). Required for
 * App Store compliance: Apple Guideline 5.1.1(v). Past registrations survive
 * as guest-like rows (inscriptions.capitaine_uid is `on delete set null`).
 */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await withTimeout(supabase.functions.invoke('delete-account'));
  if (error) throw error;
  if (data && data.ok === false) throw new Error(data.error ?? 'Échec de la suppression du compte');
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await withTimeout(supabase.auth.resetPasswordForEmail(email));
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await withTimeout(supabase.auth.getSession());
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
