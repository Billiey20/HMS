import React, { useState, useEffect, useCallback } from 'react';
import {
  Person, Add, Save, FavoriteBorder, Thermostat, Air,
  CheckCircle, Cancel, Hotel, Notes, Medication, Search
} from '@mui/icons-material';
import { ipdService } from '../../services/ipd';
import { useAuth } from '../../context/AuthContext';
import { labService } from '../../services/lab';
import { supabase } from '../../lib/supabase';

const wardColor = { 
  'General Ward': 'text-blue-600', 
  'Maternity Ward': 'text-pink-600', 
  'Surgical Ward': 'text-violet-600', 
  'ICU / HDU': 'text-red-600' 
};

const NOTE_COLORS = {
  nursing: 'border-l-blue-400 bg-blue-50',
  doctor: 'border-l-violet-400 bg-violet-50',
};

function VitalInput({ label, icon: Icon, value, onChange, unit, placeholder }) {
  return (
    <div>
      <label className="flex items-center gap-1 label"><Icon sx={{ fontSize: 12 }} className="text-primary-500" />{label}</label>
      <div className="flex">
        <input type="number" step="any" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className="input rounded-r-none text-sm flex-1" />
        {unit && <span className="px-2 py-2 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function InpatientActions({ admission }) {
   const [testSearch, setTestSearch] = useState('');
   const [selectedTests, setSelectedTests] = useState([]);
   const [allTests, setAllTests] = useState([]);
   const [saving, setSaving] = useState(false);

   useEffect(() => {
     labService.searchLaboratoryTests('').then(setAllTests);
   }, []);

   const handleRequest = async () => {
     if (selectedTests.length === 0) return;
     setSaving(true);
     try {
       await labService.createOrder({
         patient_id: admission.patient_id,
         visit_id: admission.visit_id,
         requested_by: 'Doctor', 
         items: selectedTests.map(t => ({
           lab_item_id: t.id,
           clinical_notes: 'Inpatient daily order'
         }))
       });
       setSelectedTests([]);
       setTestSearch('');
       alert('Lab tests ordered successfully!');
     } catch (e) {
       alert('Failed to order tests');
     } finally {
       setSaving(false);
     }
   };

   return (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-black text-slate-800 mb-2 uppercase tracking-widest text-xs flex items-center gap-2">
            <Medication className="text-primary-500" sx={{ fontSize: 18 }} />
            Request New Investigations
          </h3>
          <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase">Order Lab or Imaging tests for this inpatient</p>
          
          <div className="space-y-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" fontSize="small" />
                <input 
                  className="input pl-10 h-12" 
                  placeholder="Search lab tests..." 
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                />
                
                {testSearch && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {allTests.filter(t => t.name.toLowerCase().includes(testSearch.toLowerCase())).map(t => (
                      <button key={t.id} onClick={() => { setSelectedTests(p => [...p, t]); setTestSearch(''); }}
                        className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
             </div>

             <div className="flex flex-wrap gap-2">
                {selectedTests.map((t, idx) => (
                  <span key={idx} className="badge badge-blue flex items-center gap-2 pr-1 h-8">
                    {t.name}
                    <button onClick={() => setSelectedTests(p => p.filter((_, i) => i !== idx))} 
                      className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center hover:bg-blue-300 transition-colors">
                      ×
                    </button>
                  </span>
                ))}
             </div>

             <button 
               disabled={selectedTests.length === 0 || saving}
               onClick={handleRequest}
               className="btn-primary w-full py-4 font-black uppercase tracking-widest shadow-xl shadow-primary-500/10 transition-all active:scale-95 disabled:opacity-50">
               {saving ? 'Processing Order...' : 'Confirm Lab Order'}
             </button>
          </div>
        </div>

        <div className="card p-6 shadow-sm ring-1 ring-slate-200 bg-slate-50/50 border-dashed border-2">
           <h3 className="font-black text-slate-400 mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
            <Medication sx={{ fontSize: 18 }} />
            Ward Pharmacy Actions
           </h3>
           <div className="flex flex-col items-center justify-center p-10 text-center opacity-40">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Section Under Development</p>
              <p className="text-[10px] font-bold text-slate-400 mt-2 italic">Integrates with Pharmacy Stock & Inpatient Billing</p>
           </div>
        </div>
     </div>
   );
}

export default function NursingRounds() {
  const { user } = useAuth();
  const [inpatients, setInpatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab]             = useState('vitals');
  const [loading, setLoading]                 = useState(true);
  
  const [notes, setNotes]                     = useState([]);
  const [vitalsHistory, setVitalsHistory]     = useState([]);
  const [mar, setMar]                         = useState([]);

  const [vitals, setVitals] = useState({ temperature: '', pulse: '', bpSys: '', bpDia: '', respRate: '', spo2: '', bg: '', weight: '' });
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('nursing');
  const [saving, setSaving] = useState(false);

  const refreshPatientData = useCallback(async () => {
    if (!selectedPatient) return;
    try {
      const v = await ipdService.getVitals(selectedPatient.patient_id, selectedPatient.admission_id);
      setVitalsHistory(v || []);
      
      const { data: n } = await supabase.from('clinical_notes').select('*')
        .eq('admission_id', selectedPatient.admission_id)
        .order('created_at', { ascending: false });
      setNotes(n || []);
    } catch (e) {
      console.error(e);
    }
  }, [selectedPatient]);

  useEffect(() => {
    ipdService.listAdmissions().then(data => {
      setInpatients(data || []);
      if (data?.length > 0 && !selectedPatient) setSelectedPatient(data[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedPatient) refreshPatientData();
  }, [selectedPatient, refreshPatientData]);

  const vf = (field) => (val) => setVitals(prev => ({ ...prev, [field]: val }));

  const handleSaveVitals = async () => {
    if (!selectedPatient) return;
    setSaving(true);
    try {
      await ipdService.addVitals({
        patient_id: selectedPatient.patient_id,
        admission_id: selectedPatient.admission_id,
        recorded_by: user.id,
        temperature: parseFloat(vitals.temperature),
        pulse_rate: parseInt(vitals.pulse),
        bp_systolic: parseInt(vitals.bpSys),
        bp_diastolic: parseInt(vitals.bpDia),
        respiratory_rate: parseInt(vitals.respRate),
        oxygen_saturation: parseInt(vitals.spo2),
        blood_glucose: parseFloat(vitals.bg),
        weight: parseFloat(vitals.weight),
        recorded_at: new Date().toISOString()
      });
      setVitals({ temperature: '', pulse: '', bpSys: '', bpDia: '', respRate: '', spo2: '', bg: '', weight: '' });
      refreshPatientData();
    } catch (e) {
      alert('Failed to save vitals');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedPatient) return;
    setSaving(true);
    try {
      await ipdService.addNote({
        admission_id: selectedPatient.admission_id,
        patient_id: selectedPatient.patient_id,
        author_id: user.id,
        note_type: noteType,
        note_text: newNote.trim(),
        created_at: new Date().toISOString()
      });
      setNewNote('');
      refreshPatientData();
    } catch (e) {
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const toggleMAR = (medId, time) => {
    // MAR logic placeholder
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      <div className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="px-4 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-800 text-sm tracking-tight uppercase">Nursing Ward List</h2>
          <p className="text-[10px] font-bold text-slate-400">{inpatients.length} active inpatients</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
          {inpatients.map(p => (
            <button key={p.admission_id} onClick={() => setSelectedPatient(p)}
              className={`w-full text-left px-4 py-4 hover:bg-white transition-all relative group
                ${selectedPatient?.admission_id === p.admission_id ? 'bg-white shadow-sm ring-1 ring-slate-200' : ''}`}>
              {selectedPatient?.admission_id === p.admission_id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />
              )}
              <p className="font-black text-slate-800 text-sm mb-0.5">{p.patient_name}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${wardColor[p.ward] || 'text-slate-500'}`}>{p.ward}</span>
                <span className="text-[10px] font-bold text-slate-400">·</span>
                <span className="text-[10px] font-black text-slate-500">BED {p.bed_no}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 truncate line-clamp-1 italic group-hover:text-slate-600 transition-colors">"{p.admitting_diagnosis}"</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {selectedPatient && (
          <>
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shadow-sm relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                <Person className="text-indigo-600" sx={{ fontSize: 28 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-black text-xl text-slate-800 tracking-tight">{selectedPatient.patient_name}</p>
                  <span className="badge badge-slate text-[10px] font-black uppercase tracking-widest">{selectedPatient.patient_no}</span>
                </div>
                <p className="text-sm font-bold text-slate-500 mt-0.5 lowercase">
                  {selectedPatient.gender} · {selectedPatient.age} · Admitted {new Date(selectedPatient.admitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>

            <div className="bg-white border-b border-slate-200 flex px-6 overflow-x-auto no-scrollbar">
              {[
                { key: 'vitals', label: '🩺 Vitals' },
                { key: 'notes',  label: '📝 Progress Notes' },
                { key: 'actions', label: '⚡ Clinical Actions' },
                { key: 'mar',    label: '💊 MAR' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap
                    ${activeTab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'vitals' && (
                <div className="max-w-4xl space-y-6">
                  <div className="card p-6 shadow-sm ring-1 ring-slate-200 bg-white">
                    <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">New Vitals Entry</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <VitalInput label="Temperature" icon={Thermostat} value={vitals.temperature} onChange={vf('temperature')} unit="°C" placeholder="36.5" />
                      <VitalInput label="Pulse Rate" icon={FavoriteBorder} value={vitals.pulse} onChange={vf('pulse')} unit="bpm" placeholder="72" />
                      <VitalInput label="SpO₂" icon={Air} value={vitals.spo2} onChange={vf('spo2')} unit="%" placeholder="98" />
                      <div>
                        <label className="label">Blood Pressure</label>
                        <div className="flex gap-1 items-center">
                          <input type="number" value={vitals.bpSys} onChange={e => vf('bpSys')(e.target.value)} placeholder="Sys" className="input text-sm text-center px-1" />
                          <span className="text-slate-300 font-black">/</span>
                          <input type="number" value={vitals.bpDia} onChange={e => vf('bpDia')(e.target.value)} placeholder="Dia" className="input text-sm text-center px-1" />
                        </div>
                      </div>
                      <VitalInput label="Resp. Rate" icon={Air} value={vitals.respRate} onChange={vf('respRate')} unit="/min" placeholder="16" />
                      <VitalInput label="Blood Glucose" icon={FavoriteBorder} value={vitals.bg} onChange={vf('bg')} unit="mmol" placeholder="5.5" />
                      <VitalInput label="Weight" icon={FavoriteBorder} value={vitals.weight} onChange={vf('weight')} unit="kg" placeholder="70" />
                    </div>
                    <button onClick={handleSaveVitals} disabled={saving || !vitals.temperature} className="btn-primary mt-8 px-8 py-3 font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50">
                      {saving ? 'Saving...' : <><Save sx={{ fontSize: 16 }} /> Record Vitals</>}
                    </button>
                  </div>

                  <div className="card overflow-hidden ring-1 ring-slate-200 bg-white">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Vitals History (Recent)</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <tr>
                            {['Date/Time', 'Temp', 'Pulse', 'BP', 'SpO₂', 'BG', 'Nurse'].map(h => <th key={h} className="px-6 py-3">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 uppercase font-bold text-slate-600">
                          {vitalsHistory.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                {new Date(row.recorded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}<br/>
                                <span className="text-[10px] text-slate-400 font-medium">{new Date(row.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </td>
                              <td className="px-6 py-4">{row.temperature}°C</td>
                              <td className="px-6 py-4">{row.pulse_rate}</td>
                              <td className="px-6 py-4">{row.bp_systolic}/{row.bp_diastolic}</td>
                              <td className="px-6 py-4">{row.oxygen_saturation}%</td>
                              <td className="px-6 py-4">{row.blood_glucose}</td>
                              <td className="px-6 py-4 text-slate-400 font-medium">{row.recorded_by_name || 'Nurse'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="max-w-3xl space-y-6">
                  <div className="card p-6 shadow-sm ring-1 ring-slate-200 space-y-4 bg-white">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Add Daily Progress Note</h3>
                    <div className="flex gap-3">
                      {[{ val: 'nursing', label: '🩺 Nursing' }, { val: 'doctor', label: '👨‍⚕️ Clinical' }].map(({ val, label }) => (
                        <button key={val} onClick={() => setNoteType(val)}
                          className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all shadow-sm
                            ${noteType === val ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <textarea rows={4} value={newNote} onChange={e => setNewNote(e.target.value)}
                      placeholder={`Write your daily ${noteType} observations...`}
                      className="input px-4 py-3 resize-none text-sm font-medium border-slate-100 shadow-inner" />
                    <button onClick={handleAddNote} disabled={saving || !newNote.trim()} className="btn-primary px-8 py-3 font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50">
                      {saving ? 'Posting...' : <><Save sx={{ fontSize: 16 }} /> Post Progress Note</>}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {notes.map((note, idx) => (
                      <div key={idx} className={`card p-5 border-l-4 shadow-sm ring-1 ring-slate-100 bg-white ${NOTE_COLORS[note.note_type] || ''}`}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">{note.author_name || 'Staff Member'}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">
                            {new Date(note.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">"{note.note_text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="max-w-4xl">
                  <InpatientActions admission={selectedPatient} />
                </div>
              )}

              {activeTab === 'mar' && (
                <div className="max-w-3xl card p-10 text-center opacity-40 bg-white">
                  <Medication sx={{ fontSize: 48 }} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest">MAR Module Active</p>
                  <p className="text-xs font-bold mt-2 italic">Connects with prescribed medications</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
