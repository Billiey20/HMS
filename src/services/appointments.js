import { supabase } from '../lib/supabase';

export const CLINIC_ROUTES = [
  { value: 'OPD',           label: 'OPD (General Outpatient)',   color: 'bg-blue-100 text-blue-700',    icon: '🏥' },
  { value: 'ANC',           label: 'ANC (Antenatal Care)',        color: 'bg-pink-100 text-pink-700',    icon: '🤰' },
  { value: 'CCC',           label: 'CCC (Comprehensive Care)',    color: 'bg-violet-100 text-violet-700', icon: '❤️‍🩹' },
  { value: 'Dental',        label: 'Dental Clinic',              color: 'bg-cyan-100 text-cyan-700',    icon: '🦷' },
  { value: 'Eye',           label: 'Eye Clinic (Ophthalmology)',  color: 'bg-indigo-100 text-indigo-700', icon: '👁️' },
  { value: 'Physiotherapy', label: 'Physiotherapy',              color: 'bg-amber-100 text-amber-700',  icon: '🦾' },
];

export const appointmentService = {
  /** Create a new appointment */
  async create(payload) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        patient_id:         payload.patient_id,
        appointment_date:   payload.appointment_date,
        appointment_time:   payload.appointment_time || null,
        clinic:             payload.clinic,
        doctor_id:          payload.doctor_id || null,
        visit_type:         payload.visit_type,
        reason:             payload.reason || null,
        booked_by:          payload.booked_by,
        status:             'scheduled',
      }])
      .select('*, patients(first_name, last_name, patient_no, phone)')
      .single();
    if (error) throw error;
    return data;
  },

  /** List all upcoming/today appointments */
  async list({ includeAll = false } = {}) {
    let query = supabase
      .from('appointments')
      .select('*, patients(first_name, last_name, patient_no, phone, gender, age), booked_by_user:users!booked_by(first_name, last_name), doctor:users!doctor_id(first_name, last_name)')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (!includeAll) {
      const today = new Date().toISOString().slice(0, 10);
      query = query.gte('appointment_date', today);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /** Today's count */
  async todayCount() {
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today);
    return count || 0;
  },

  /** Cancel an appointment */
  async cancel(id) {
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
  },
};

export const followUpService = {
  /** Fetch upcoming follow-ups from consultations */
  async list({ includeAll = false } = {}) {
    let query = supabase
      .from('consultations')
      .select('*, patients(first_name, last_name, patient_no, phone, gender, age), doctor:users!doctor_id(first_name, last_name)')
      .not('follow_up_date', 'is', null)
      .order('follow_up_date', { ascending: true });

    if (!includeAll) {
      const today = new Date().toISOString().slice(0, 10);
      query = query.gte('follow_up_date', today);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /** Today's count */
  async todayCount() {
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('follow_up_date', today);
    return count || 0;
  },
};
