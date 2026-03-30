import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PermissionsProvider } from './PermissionsContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserData(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserData(session.user);
      else {
        setUser(null); setRole(null); setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser) => {
    // Only set loading if it's a new or different user to avoid unmounting the app on token refresh
    if (!user || user.id !== authUser.id) {
      setLoading(true);
    }
    setUser(authUser);
    try {
      const { data: prof } = await supabase
        .from('users').select('*').eq('id', authUser.id).single();
      setProfile(prof);

      const { data: roleData } = await supabase
        .from('user_roles').select('roles(name)').eq('user_id', authUser.id).single();
      setRole(roleData?.roles?.name || null);
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

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, signIn, signOut }}>
      {/* Wrap with PermissionsProvider so all children get access checks */}
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
