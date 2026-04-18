import React, { useState, useEffect } from 'react';
import { Close, EventNote, Search, CalendarToday } from '@mui/icons-material';
import { appointmentService, CLINIC_ROUTES } from '../../services/appointments';
import { patientService } from '../../services/patients';
import { hrService } from '../../services/hr';
import { notify } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';

export default function BookAppointmentModal({ onClose, onBooked }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Search logic
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Doctors
  const [doctors, setDoctors] = useState([]);

  // Form State
  const [form, setForm] = useState({
    clinic: CLINIC_ROUTES[0].value,
    doctor_id: '',
    appointment_date: new Date().toISOString().slice(0, 10),
    appointment_time: '09:00',
    visit_type: 'General Consultation',
    reason: ''
  });

  useEffect(() => {
    hrService.list().then(data => {
       // Filter rough approximation of clinicians
       const docs = data.filter(u => u.user_roles?.roles?.name?.toLowerCase().includes('doctor') || u.user_roles?.roles?.name?.toLowerCase().includes('clinical'));
       setDoctors(docs);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) { setPatients([]); return; }
      setSearching(true);
      try {
        const res = await patientService.list({ search: query });
        setPatients(res || []);
      } catch(e) {}
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setLoading(true);
    try {
      await appointmentService.create({
        ...form,
        patient_id: selectedPatient.id,
        booked_by: user.id
      });
      notify.success("Appointment booked successfully!");
      onBooked();
      onClose();
    } catch(e) {
      notify.error(e.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-slate-900/40 backdrop-blur-sm sm:p-6 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col min-h-screen sm:min-h-[auto]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <EventNote className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-none">Schedule Appointment</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">Book a clinic visit or doctor consultation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
            <Close sx={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 pb-24 sm:pb-6 relative space-y-6">
          
          {step === 1 && (
             <div className="space-y-4 fade-in">
               <h3 className="uppercase tracking-widest text-[10px] font-black text-slate-400">Step 1: Select Patient</h3>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small"/>
                  <input autoFocus className="input pl-10 h-12 text-sm bg-slate-50 border-transparent shadow-sm focus:bg-white" placeholder="Search registered patient by name, ID or phone..." value={query} onChange={e=>setQuery(e.target.value)} />
                  {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin" />}
               </div>
               
               <div className="bg-white border text-sm max-h-64 overflow-y-auto border-slate-100 rounded-xl divide-y divide-slate-50 shadow-inner">
                  {patients.length===0 && query.trim() && !searching && <div className="p-4 text-center text-slate-400 font-bold">No registered patient found.</div>}
                  {patients.length===0 && !query.trim() && <div className="p-4 text-center text-slate-400 font-bold">Type to load patients from registry...</div>}
                  {patients.map(p => (
                     <button key={p.id} onClick={() => { setSelectedPatient(p); setStep(2); }} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left group">
                        <div>
                           <p className="font-black text-slate-800 group-hover:text-primary-600 transition-colors">{p.first_name} {p.last_name}</p>
                           <p className="text-[10px] text-slate-500 font-bold">{p.age} yrs · {p.gender} · {p.phone}</p>
                        </div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{p.patient_no}</span>
                     </button>
                  ))}
               </div>
             </div>
          )}

          {step === 2 && selectedPatient && (
             <form id="bookingForm" onSubmit={handleBook} className="space-y-6 fade-in">
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                   <div>
                     <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Scheduling for</p>
                     <p className="font-black text-slate-800">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                   </div>
                   <button type="button" onClick={()=>setStep(1)} className="text-xs font-bold text-primary-600 hover:text-primary-800 underline underline-offset-2">Change</button>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                   <div>
                      <label className="label">Receiving Clinic *</label>
                      <select className="input" value={form.clinic} onChange={e=>setForm({...form, clinic: e.target.value})}>
                         {CLINIC_ROUTES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="label">Specific Doctor <span className="font-normal text-slate-400">(Optional)</span></label>
                      <select className="input" value={form.doctor_id} onChange={e=>setForm({...form, doctor_id: e.target.value})}>
                         <option value="">-- Any Available Doctor --</option>
                         {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="label">Appointment Date *</label>
                      <div className="relative">
                         <CalendarToday className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" sx={{fontSize:16}} />
                         <input type="date" required className="input pl-9" value={form.appointment_date} onChange={e=>setForm({...form, appointment_date: e.target.value})} min={new Date().toISOString().slice(0,10)} />
                      </div>
                   </div>
                   <div>
                      <label className="label">Appointment Time</label>
                      <input type="time" className="input" value={form.appointment_time} onChange={e=>setForm({...form, appointment_time: e.target.value})} />
                   </div>
                   <div className="sm:col-span-2">
                      <label className="label">Visit Type / Priority</label>
                      <select className="input" value={form.visit_type} onChange={e=>setForm({...form, visit_type: e.target.value})}>
                         <option>General Consultation</option>
                         <option>Specialist Review</option>
                         <option>Routine Checkup</option>
                         <option>Lab Results Review</option>
                         <option>Urgent</option>
                      </select>
                   </div>
                   <div className="sm:col-span-2">
                      <label className="label">Reason / Notes</label>
                      <textarea rows={2} className="input" value={form.reason} onChange={e=>setForm({...form, reason: e.target.value})} placeholder="Brief patient notes or chief complaint..." />
                   </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800 text-xs">
                   <span className="text-amber-500 font-bold">ⓘ</span>
                   <p>Booking logic validates against the HR Weekly Schedule. Reception will be notified if a doctor is technically off-shift, but the booking is still permitted.</p>
                </div>
             </form>
          )}

        </div>
        
        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 sm:rounded-b-3xl flex justify-end gap-3 fixed sm:relative bottom-0 left-0 right-0">
           <button onClick={onClose} type="button" className="btn-secondary w-full sm:w-auto justify-center">Cancel</button>
           {step === 2 && (
             <button form="bookingForm" type="submit" disabled={loading} className="btn-primary w-full sm:w-auto justify-center min-w-[140px]">
                {loading ? 'Booking...' : 'Confirm Booking'}
             </button>
           )}
        </div>

      </div>
    </div>
  );
}
