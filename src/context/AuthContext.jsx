import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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

  // Track the currently loaded user ID via a ref so the auth listener callback
  // can read the latest value without a stale closure.
  const loadedUserIdRef = useRef(cached?.user?.id || null);

  useEffect(() => {
    // Verify the session once on mount but don't show spinner if we have cache
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user, false); // silent — already have cached state
      } else {
        setUser(null); setRole(null); setProfile(null);
        clearCache();
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // ─────────────────────────────────────────────────────────────────────
      // TOKEN_REFRESHED fires every time the tab regains focus because
      // Supabase silently rotates the JWT in the background.  The user has
      // NOT changed — skip it entirely so the full-screen spinner never
      // appears just because the user switched apps or browser tabs.
      // ─────────────────────────────────────────────────────────────────────
      if (event === 'TOKEN_REFRESHED') return;

      if (session?.user) {
        // Only show the loading spinner for genuine first-time sign-ins or
        // when a *different* user logs in (e.g. shared device scenario).
        const isActuallyNewUser = session.user.id !== loadedUserIdRef.current;
        loadUserData(session.user, isActuallyNewUser);
      } else {
        // SIGNED_OUT or session expired
        setUser(null); setRole(null); setProfile(null);
        loadedUserIdRef.current = null;
        clearCache();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserData = async (authUser, showSpinner = true) => {
    if (showSpinner) setLoading(true);

    setUser(authUser);
    loadedUserIdRef.current = authUser.id;

    try {
      const [profRes, roleRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        supabase.from('user_roles').select('roles(name)').eq('user_id', authUser.id).single(),
      ]);
      const prof     = profRes.data  || null;
      const roleName = roleRes.data?.roles?.name || null;

      setProfile(prof);
      setRole(roleName);

      // Persist so the next full page load is instant
      writeCache({ user: authUser, profile: prof, role: roleName });
    } catch (e) {
      console.error('Failed to load user data', e);
    }

    if (showSpinner) setLoading(false);
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
