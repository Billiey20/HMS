import { supabase } from '../lib/supabase';

export const emergencyService = {
  // Get board of active / recently discharged cases
  async getBoard() {
    const { data, error } = await supabase
      .from('emergency_visits')
      .select('*, patient:patients!patient_id(first_name, last_name, patient_no, age, gender), doctor:users!attending_doctor_id(last_name)')
      .order('arrival_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getVisit(visitId) {
    const { data, error } = await supabase
      .from('emergency_visits')
      .select('*, patient:patients!patient_id(*)')
      .eq('id', visitId)
      .single();
    if (error) throw error;
    return data;
  },

  // Handover + Registration inline
  async createHandover(visitPayload, handoverPayload) {
    const { data: visit, error: vErr } = await supabase
      .from('emergency_visits')
      .insert([visitPayload])
      .select()
      .single();
    if (vErr) throw vErr;

    if (handoverPayload && visitPayload.arrival_mode === 'Ambulance') {
      const hPayload = { ...handoverPayload, visit_id: visit.id };
      await supabase.from('emergency_ambulance_handovers').insert([hPayload]);
    }
    return visit;
  },

  // Resus Grid
  async getResuscitationLogs(visitId) {
    const { data, error } = await supabase
      .from('emergency_resuscitation_logs')
      .select('*, user:users!recorded_by(last_name)')
      .eq('visit_id', visitId)
      .order('action_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  
  async addResuscitationLog(payload) {
    const { data, error } = await supabase.from('emergency_resuscitation_logs').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // Trauma forms
  async getTraumaAssessment(visitId) {
    const { data, error } = await supabase
      .from('emergency_trauma_assessments')
      .select('*')
      .eq('visit_id', visitId)
      .order('assessment_time', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data[0] || null;
  },
  
  async addTraumaAssessment(payload) {
    const { data, error } = await supabase.from('emergency_trauma_assessments').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },
  
  // Quick Pathways
  async fastTrackToTheatre(visitId, patientId, procedureName) {
    // 1. Enter into surgical_bookings
    const payload = {
      patient_id: patientId,
      procedure_name: procedureName,
      priority: 'Emergency',
      schedule_date: new Date().toISOString()
    };
    const { error: sErr } = await supabase.from('surgical_bookings').insert([payload]);
    if (sErr) throw sErr;

    // 2. Clear from A&E board
    const { error: vErr } = await supabase.from('emergency_visits').update({ discharge_disposition: 'Theatre', discharge_time: new Date().toISOString() }).eq('id', visitId);
    if (vErr) throw vErr;
    return true;
  },

  async fastTrackToICU(visitId, patientId) {
    // We could create an initial icu_vitals log here if required
    // 1. Clear from A&E board
    const { error: vErr } = await supabase.from('emergency_visits').update({ discharge_disposition: 'ICU', discharge_time: new Date().toISOString() }).eq('id', visitId);
    if (vErr) throw vErr;
    return true;
  },

  // Security Lock
  async flagMedicoLegal(visitId, flagType, obNumber) {
    const { error } = await supabase
       .from('emergency_visits')
       .update({ medico_legal_flag: flagType, police_ob_number: obNumber })
       .eq('id', visitId);
    if (error) throw error;
    return true;
  }
};
