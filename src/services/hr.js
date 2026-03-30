import { supabase } from '../lib/supabase';

export const hrService = {
  async list({ search = '' } = {}) {
    let q = supabase
      .from('users')
      .select('*, departments(name), user_roles(roles(name))')
      .order('first_name');
    if (search) {
      q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,employee_no.ilike.%${search}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async updateProfile(userId, payload) {
    const { data, error } = await supabase.from('users').update(payload).eq('id', userId);
    if (error) throw error;
    return data;
  },

  async getDepartments() {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) throw error;
    return data;
  },

  async getRoles() {
    const { data, error } = await supabase.from('roles').select('*').order('name');
    if (error) throw error;
    return data;
  },

  async createUser(payload) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${API_URL}/hr/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to create user');
    return result;
  },
};
