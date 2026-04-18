import React, { useState } from 'react';
import { Close, EventNote, Notes, ArrowBack, AccessTime } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, CLINIC_ROUTES } from '../../services/appointments';

export default function AppointmentBookingModal({ patient, onClose, onSave }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1=pick clinic, 2=details
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    visit_type: 'Walk-in',
    appointment_date: new Date().toISOString().slice(0, 10),
    appointment_time: '',
    reason: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleClinicSelect = (clinic) => {
    setSelectedClinic(clinic);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.appointment_date) { toast.error('Please choose an appointment date.'); return; }
    setLoading(true);
    try {
      await appointmentService.create({
        patient_id:       patient.id,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time || null,
        clinic:           selectedClinic.value,
        visit_type:       form.visit_type,
        reason:           form.reason,
        booked_by:        user?.id,
      });
      toast.success(`Appointment booked at ${selectedClinic.label}!`);
      if (onSave) onSave();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button type="button" onClick={() => { setStep(1); setSelectedClinic(null); }}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors">
                <ArrowBack fontSize="small" />
              </button>
            )}
            <div>
              <h3 className="font-black text-white tracking-tight text-base">
                {step === 1 ? 'Book appointment' : `${selectedClinic?.icon} ${selectedClinic?.label}`}
              </h3>
              <p className="text-xs font-semibold text-white/70 mt-0.5">
                {patient?.first_name} {patient?.last_name} · {patient?.patient_no}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white">
            <Close />
          </button>
        </div>

        {/* Step 1 — Clinic Selection */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <p className="text-xs font-bold text-slate-500 mb-4">Select the clinic / department to route this patient to:</p>
            {CLINIC_ROUTES.map(clinic => (
              <button
                key={clinic.value}
                onClick={() => handleClinicSelect(clinic)}
                className="w-full text-left px-5 py-4 border border-slate-200 rounded-2xl font-bold text-slate-700
                  hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700
                  transition-all group flex items-center justify-between active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{clinic.icon}</span>
                  <div>
                    <p className="font-black text-sm">{clinic.label}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${clinic.color}`}>
                      {clinic.value}
                    </span>
                  </div>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-500 text-xs tracking-widest uppercase">
                  Select →
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Appointment Details */}
        {step === 2 && (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="appt-form" onSubmit={handleSubmit} className="space-y-5">

                {/* Clinic badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${selectedClinic?.color}`}>
                  <span>{selectedClinic?.icon}</span>
                  {selectedClinic?.label}
                </div>

                {/* Visit type */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                    Visit type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Walk-in', 'Referred'].map(vt => (
                      <label key={vt} className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all
                        ${form.visit_type === vt
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
                        <input type="radio" name="visit_type" value={vt} checked={form.visit_type === vt}
                          onChange={handleChange} className="hidden" />
                        {vt === 'Walk-in' ? '🚶' : '🔀'} {vt}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <EventNote fontSize="small" /> Date *
                    </label>
                    <input
                      type="date"
                      name="appointment_date"
                      required
                      value={form.appointment_date}
                      onChange={handleChange}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <AccessTime fontSize="small" /> Time
                    </label>
                    <input
                      type="time"
                      name="appointment_time"
                      value={form.appointment_time}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Notes fontSize="small" /> Reason / notes
                  </label>
                  <textarea
                    name="reason"
                    rows="2"
                    value={form.reason}
                    onChange={handleChange}
                    placeholder="Reason for appointment..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                  />
                </div>

              </form>
            </div>

            <div className="p-4 border-t bg-slate-50 flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-3.5 px-4 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button form="appt-form" type="submit" disabled={loading}
                className="flex-[2] py-3.5 px-4 font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-200 transition-colors disabled:opacity-50">
                {loading ? 'Booking...' : `Book at ${selectedClinic?.value}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
