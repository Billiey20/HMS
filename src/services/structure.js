import { supabase } from '../lib/supabase';

function generateShortName(name) {
  // E.g., 'General Ward' -> 'GW', 'Male Surgical Ward' -> 'MSW'
  return name.split(' ').map(word => word[0].toUpperCase()).join('');
}

export const structureService = {
  // ---- DEPARTMENTS ----
  async getDepartments() {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  // ---- WORKING DESKS ----
  async getDesks(departmentId = null) {
    let q = supabase.from('working_desks').select('*, departments(name)').order('name');
    if (departmentId) q = q.eq('department_id', departmentId);
    const { data, error } = await q;
    if (error && error.code !== '42P01') throw error;
    return data || [];
  },

  async addDesk(departmentId, name) {
    const short_name = generateShortName(name);
    const { data, error } = await supabase.from('working_desks').insert([{
      department_id: departmentId,
      name,
      short_name
    }]);
    if (error) throw error;
    return data;
  },

  async deleteDesk(id) {
    const { error } = await supabase.from('working_desks').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- WARDS & BEDS ----
  async getWards() {
    const { data, error } = await supabase.from('wards').select('*, departments(name)').order('name');
    if (error) throw error;
    return data || [];
  },

  async getBeds(wardId) {
    let q = supabase.from('beds').select('*').order('bed_no');
    if (wardId) q = q.eq('ward_id', wardId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  async createWardWithBeds({ name, department_id, ward_type, total_beds }) {
    const short_name = generateShortName(name);

    // 1. Create the ward
    const { data: wardData, error: wardError } = await supabase
      .from('wards')
      .insert([{ name, department_id, ward_type, total_beds, short_name }])
      .select()
      .single();

    if (wardError) throw wardError;

    // 2. Generate bed objects based on total_beds
    const bedsToInsert = [];
    for (let i = 1; i <= total_beds; i++) {
      bedsToInsert.push({
        ward_id: wardData.id,
        bed_no: `${short_name} B${i}`,  // e.g. "GW B1"
        status: 'available'
      });
    }

    // 3. Insert beds in batch
    if (bedsToInsert.length > 0) {
      const { error: bedError } = await supabase.from('beds').insert(bedsToInsert);
      if (bedError) {
        // Technically should transact, but JS client doesn't support RPC transactions natively without a custom Postgres func.
        // If bed generation fails, throw it so admin is aware.
        throw bedError;
      }
    }

    return wardData;
  },

  async deleteWard(id) {
    // ON DELETE CASCADE isn't strictly default on beds in base schema, but let's delete beds first then the ward explicitly
    await supabase.from('beds').delete().eq('ward_id', id);
    const { error } = await supabase.from('wards').delete().eq('id', id);
    if (error) throw error;
  }
};
