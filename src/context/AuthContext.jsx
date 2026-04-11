import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PermissionsProvider } from './PermissionsContext';

const AuthContext = createContext(null);

const CACHE_KEY = 'hms_auth_cache';

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }
  catch { return null; }
}

function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); }
  catch {}
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function AuthProvider({ children }) {
  const cached = readCache();

  // Initialise from cache immediately — no loading flash for returning users
  const [user,    setUser]    = useState(cached?.user    || null);
  const [role,    setRole]    = useState(cached?.role    || null);
  const [profile, setProfile] = useState(cached?.profile || null);

  // Only show the full-screen loader when there is truly no cached session
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        // No active session — clear everything
        setUser(null); setRole(null); setProfile(null);
        clearCache();
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setUser(null); setRole(null); setProfile(null);
        clearCache();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser) => {
    // Silently update if we already have a cached session for this user
    const isNewUser = !user || user.id !== authUser.id;
    if (isNewUser) setLoading(true);

    setUser(authUser);

    try {
      // Run both DB queries in parallel instead of sequentially
      const [profRes, roleRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        supabase.from('user_roles').select('roles(name)').eq('user_id', authUser.id).single(),
      ]);
      const prof     = profRes.data  || null;
      const roleName = roleRes.data?.roles?.name || null;

      setProfile(prof);
      setRole(roleName);

      // Persist to cache so next page load is instant
      writeCache({ user: authUser, profile: prof, role: roleName });
    } catch (e) {
      console.error('Failed to load user data', e);
    }

    setLoading(false);
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    clearCache();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, signIn, signOut }}>
      <PermissionsProvider role={role}>
        {children}
      </PermissionsProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
