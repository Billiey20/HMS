import React, { useState, useEffect } from 'react';
import { Close, EventNote, Person, MonitorHeart, Notes, ArrowBack } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { opdService, hrService } from '../../services/api';

export default function AppointmentBookingModal({ patient, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    visit_type: '',
    visit_date: new Date().toISOString().slice(0, 10),
    assigned_doctor_id: '',
    triage_priority: 'normal',
    presenting_complaint: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        const users = await hrService.list();
        const docs = users.filter(u => u.user_roles?.some(ur => ur.roles?.name === 'doctor'));
        setDoctors(docs);
      } catch (err) {
        toast.error("Failed to load doctors");
      } finally {
        setFetching(false);
      }
    };
    init();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectMode = (mode) => {
    setFormData(prev => ({ 
      ...prev, 
      visit_type: mode,
      triage_priority: mode === 'Emergency' ? 'emergency' : 'normal'
    }));
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let status = 'waiting_triage';
      if (formData.visit_type === 'Emergency') status = 'waiting_doctor';
      
      const payload = {
        patient_id: patient.id,
        visit_type: formData.visit_type,
        visit_date: formData.visit_date,
        triage_priority: formData.triage_priority,
        status: status,
      };

      if (formData.assigned_doctor_id) payload.assigned_doctor_id = formData.assigned_doctor_id;
      if (formData.presenting_complaint) payload.presenting_complaint = formData.presenting_complaint;

      await opdService.createVisit(payload);
      toast.success("Visit booked successfully!");
      if (onSave) onSave();
    } catch (err) {
      toast.error(err.message || "Failed to book visit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <ArrowBack fontSize="small" />
              </button>
            )}
            <div>
              <h3 className="font-black text-slate-800 tracking-tight">
                {step === 1 ? 'Select Visit Category' : `Book ${formData.visit_type} Visit`}
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                {patient?.first_name} {patient?.last_name} ({patient?.patient_no})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <Close className="text-slate-500" />
          </button>
        </div>

        {step === 1 ? (
          <div className="p-6 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">How is the patient registering today?</p>
            {['Walk-In', 'Scheduled', 'Referred', 'Emergency'].map(mode => (
              <button 
                key={mode} 
                onClick={() => handleSelectMode(mode)}
                className="w-full text-left px-5 py-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors group flex justify-between items-center"
              >
                {mode}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-500 text-xs tracking-widest uppercase">Select &rarr;</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <EventNote fontSize="small" /> Visit Date
                    </label>
                    <input
                      type="date"
                      name="visit_date"
                      required
                      value={formData.visit_date}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <Person fontSize="small" /> Assign Doctor
                    </label>
                    <select
                      name="assigned_doctor_id"
                      value={formData.assigned_doctor_id}
                      onChange={handleChange}
                      disabled={fetching}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
                    >
                      <option value="">Any Doctor</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <MonitorHeart fontSize="small" /> Triage Priority
                  </label>
                  <div className="flex gap-2">
                    {['normal', 'urgent', 'emergency'].map(pri => (
                      <label key={pri} className={`flex-1 cursor-pointer text-center px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                        formData.triage_priority === pri 
                          ? 'border-primary-500 bg-primary-50 text-primary-700' 
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                      }`}>
                        <input
                          type="radio"
                          name="triage_priority"
                          value={pri}
                          checked={formData.triage_priority === pri}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <span className="capitalize">{pri}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Notes fontSize="small" /> Notes / Complaint
                  </label>
                  <textarea
                    name="presenting_complaint"
                    rows="2"
                    value={formData.presenting_complaint}
                    onChange={handleChange}
                    placeholder="Reason for visit..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                  ></textarea>
                </div>
                
              </form>
            </div>

            <div className="p-4 border-t bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 px-4 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                form="booking-form"
                type="submit"
                disabled={loading}
                className="flex-[2] py-3.5 px-4 font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-200 transition-colors disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Book Visit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
