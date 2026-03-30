import { supabase } from '../config/supabase.js';

export async function list(req, res, next) {
  try {
    const { search = '' } = req.query;
    let q = supabase.from('users').select('*, departments(name), user_roles(roles(name))').order('first_name');
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,employee_no.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function updateProfile(req, res, next) {
  try {
    const { data, error } = await supabase.from('users').update(req.body).eq('id', req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function getDepartments(_req, res, next) {
  try {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}

export async function createUser(req, res, next) {
  try {
    const { email, password, firstName, lastName, employeeNo, departmentId, roleId, dutyStation } = req.body;
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });
    if (authErr) throw authErr;

    const userId = authData.user.id;
    const { error: insertErr } = await supabase.from('users').upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      email,
      employee_no: employeeNo,
      department_id: departmentId || null,
      duty_station: dutyStation || null
    });
    if (insertErr) throw insertErr;

    if (roleId) {
      const { error: roleErr } = await supabase.from('user_roles').upsert({ user_id: userId, role_id: roleId });
      if (roleErr) throw roleErr;
    }

    res.status(201).json({ id: userId, email });
  } catch (err) { next(err); }
}

export async function assignRole(req, res, next) {
  try {
    const { roleId } = req.body;
    // Remove existing roles first for simplicity (one role per user)
    await supabase.from('user_roles').delete().eq('user_id', req.params.id);
    const { data, error } = await supabase.from('user_roles').insert([{ user_id: req.params.id, role_id: roleId }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
}
