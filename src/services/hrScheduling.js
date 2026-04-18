import { supabase } from '../lib/supabase';

export const hrSchedulingService = {
  // --- Weekly Timetables ---
  async getWeeklySchedules(userId) {
    let q = supabase.from('staff_schedules').select('*');
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error && error.code !== '42P01') throw error;
    return data || [];
  },

  async saveWeeklySchedule(payload) {
    // payload: { user_id, day_of_week, start_time, end_time, duty_station }
    const { data, error } = await supabase.from('staff_schedules').insert([payload]);
    if (error) throw error;
    return data;
  },

  async deleteWeeklySchedule(id) {
    const { error } = await supabase.from('staff_schedules').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Locum / Date-specific Shifts ---
  async getShifts(userId, startDate, endDate) {
    let q = supabase.from('staff_shifts').select('*').order('shift_date');
    if (userId) q = q.eq('user_id', userId);
    if (startDate) q = q.gte('shift_date', startDate);
    if (endDate) q = q.lte('shift_date', endDate);
    
    const { data, error } = await q;
    if (error && error.code !== '42P01') throw error;
    return data || [];
  },

  async addShift(payload) {
    const { data, error } = await supabase.from('staff_shifts').insert([payload]);
    if (error) throw error;
    return data;
  },

  async deleteShift(id) {
    const { error } = await supabase.from('staff_shifts').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Leave / Time Off ---
  async getLeaves(userId) {
    let q = supabase.from('staff_leave').select('*').order('start_date', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error && error.code !== '42P01') throw error;
    return data || [];
  },

  async requestLeave(payload) {
    const { data, error } = await supabase.from('staff_leave').insert([payload]);
    if (error) throw error;
    return data;
  },

  async updateLeaveStatus(id, status, approvedBy) {
    const { error } = await supabase.from('staff_leave').update({ status, approved_by: approvedBy }).eq('id', id);
    if (error) throw error;
  },

  // --- Attendance / Clocking ---
  async getTodayAttendance(userId) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('record_date', today)
      .maybeSingle(); // maybeSingle returns null instead of 406 error if zero rows match
      
    if (error && error.code !== '42P01') throw error;
    return data || null;
  },

  async clockAction(userId, action) {
    // action: 'in', 'out', 'break_start', 'break_end'
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    
    // Check if record exists
    const record = await this.getTodayAttendance(userId);
    
    if (!record) {
       if (action !== 'in') throw new Error("You must clock in first.");
       const { error } = await supabase.from('staff_attendance').insert([{
         user_id: userId,
         record_date: today,
         clock_in: now
       }]);
       if (error) throw error;
       return;
    }
    
    // Update existing record
    let updateData = {};
    if (action === 'in') updateData.clock_in = now;
    if (action === 'out') updateData.clock_out = now;
    if (action === 'break_start') updateData.break_start = now;
    if (action === 'break_end') updateData.break_end = now;
    
    const { error } = await supabase.from('staff_attendance').update(updateData).eq('id', record.id);
    if (error) throw error;
  }
};
