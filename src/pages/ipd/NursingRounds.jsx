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

function InpatientActions({ admission, onDischarge }) {
   const { user } = useAuth();
   const [testSearch, setTestSearch] = useState('');
   const [selectedTests, setSelectedTests] = useState([]);
   const [allTests, setAllTests] = useState([]);
   const [saving, setSaving] = useState(false);
   const [discharging, setDischarging] = useState(false);
   const isDoctor = user?.user_roles?.some(ur => ur.roles?.name === 'doctor') || user?.roles?.[0] === 'doctor';

   useEffect(() => {
     labService.searchLaboratoryTests('').then(setAllTests).catch(console.error);
   }, []);

   const handleRequest = async () => {
     if (selectedTests.length === 0) return;
     setSaving(true);
     try {
       await labService.create({
         patient_id: admission.patient_id,
         visit_id: admission.visit_id,
         ordered_by: user.id
       }, selectedTests.map(t => t.name));
       
       // SYNC: Put patient back to Doctor's queue waiting for results
       await supabase.from('opd_visits').update({ status: 'waiting_lab' }).eq('id', admission.visit_id);

       setSelectedTests([]);
       setTestSearch('');
       alert('Lab tests ordered successfully! Patient returned to Doctor Queue.');
     } catch (e) {
       alert('Failed to order tests');
     } finally {
       setSaving(false);
     }
   };

   const handleDischarge = async () => {
     if (!window.confirm('Are you sure you want to discharge this patient?')) return;
     setDischarging(true);
     try {
       await ipdService.discharge(admission.admission_id, { discharge_by: user.id });
       alert('Patient discharged successfully!');
       if (onDischarge) onDischarge();
     } catch (e) {
       alert('Discharge failed: ' + e.message);
     } finally {
       setDischarging(false);
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

        <div className="card p-6 shadow-sm ring-1 ring-slate-200">
           <h3 className="font-black text-slate-800 mb-2 uppercase tracking-widest text-xs flex items-center gap-2">
            <CheckCircle className="text-emerald-500" sx={{ fontSize: 18 }} />
            Discharge Patient
           </h3>
           <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase">Clear patient from inpatient list</p>
           
           <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-sm font-semibold text-slate-600 mb-4 text-center">
                This will mark the patient as discharged, free up the bed, and move their final bill to pending.
              </p>
              <button onClick={handleDischarge} disabled={discharging || !isDoctor}
                className={`w-full py-4 font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50
                  ${isDoctor ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 'bg-slate-200 text-slate-400'}`}>
                {discharging ? 'Discharging...' : <><CheckCircle sx={{ fontSize: 18 }} className="mr-2" /> Discharge Patient</>}
              </button>
              {!isDoctor && <p className="text-[10px] text-red-400 font-bold mt-2">Only Doctors can discharge patients</p>}
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
  const [labSummary, setLabSummary]           = useState({ pending: 0, completed: 0, latestResultAt: null });
  const [visitedResults, setVisitedResults]   = useState(new Set());
  const [mar, setMar]                         = useState([]);

  const [vitals, setVitals] = useState({ temperature: '', pulse: '', bpSys: '', bpDia: '', respRate: '', spo2: '', bg: '', weight: '' });
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('nursing');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isDoctor = user?.user_roles?.some(ur => ur.roles?.name === 'doctor') || user?.roles?.[0] === 'doctor';
    if (isDoctor) setNoteType('doctor');
  }, [user]);

  const refreshPatientData = useCallback(async () => {
    if (!selectedPatient) return;
    try {
      const v = await ipdService.getVitals(selectedPatient.patient_id, selectedPatient.admission_id);
      setVitalsHistory(v || []);
      
      const { data: n } = await supabase.from('clinical_notes')
        .select(`*, users!written_by (first_name, last_name, user_roles(roles(name)))`)
        .eq('admission_id', selectedPatient.admission_id)
        .order('created_at', { ascending: false });
      setNotes(n || []);

      const { data: m } = await supabase.from('prescription_items')
        .select(`*, prescriptions!inner(patient_id, status)`)
        .eq('prescriptions.patient_id', selectedPatient.patient_id);
      
      // Filter in JS to be resilient against DB enum changes
      const activeMedications = (m || []).filter(item => 
        item.prescriptions?.status !== 'completed' && 
        item.prescriptions?.status !== 'void' &&
        item.prescriptions?.status !== 'cancelled'
      );
      setMar(activeMedications);

      // Lab Status check
      const { data: labs } = await supabase.from('lab_order_items')
        .select('*, lab_orders!inner(visit_id)')
        .eq('lab_orders.visit_id', selectedPatient.visit_id);
      
      const pending = labs?.filter(l => l.status !== 'completed' && l.status !== 'cancelled').length || 0;
      const completed = labs?.filter(l => l.status === 'completed').length || 0;
      const latest = labs?.filter(l => l.result_at).sort((a,b) => new Date(b.result_at) - new Date(a.result_at))[0];
      
      setLabSummary({ pending, completed, latestResultAt: latest?.result_at || null, raw: labs || [] });
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
        recorded_by: user?.id || 'SYSTEM',
        temperature: parseFloat(vitals.temperature) || null,
        pulse: parseInt(vitals.pulse) || null,
        bp_systolic: parseInt(vitals.bpSys) || null,
        bp_diastolic: parseInt(vitals.bpDia) || null,
        respiratory_rate: parseInt(vitals.respRate) || null,
        spo2: parseInt(vitals.spo2) || null,
        blood_glucose: parseFloat(vitals.bg) || null,
        weight: parseFloat(vitals.weight) || null,
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

  const toggleMAR = async (itemId) => {
    try {
      // Very basic MAR interaction: record administration as a clinical note.
      const item = mar.find(i => i.id === itemId);
      if (!item) return;
      await ipdService.addNote({
        admission_id: selectedPatient.admission_id,
        patient_id: selectedPatient.patient_id,
        author_id: user.id,
        note_type: 'nursing',
        note_text: `Administered Medication: ${item.drug_name} (${item.dose})`,
        created_at: new Date().toISOString()
      });
      alert('Medication administration recorded in progress notes.');
      refreshPatientData();
    } catch (e) {
      alert('Failed to record administration');
    }
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
                              <td className="px-6 py-4">{row.pulse}</td>
                              <td className="px-6 py-4">{row.bp_systolic}/{row.bp_diastolic}</td>
                              <td className="px-6 py-4">{row.spo2}%</td>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="card p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2 space-y-4 bg-white">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Add Daily Progress Note</h3>
                    
                    {labSummary.completed > 0 && Array.from(visitedResults).length < labSummary.raw.filter(l => l.status === 'completed').length && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center gap-3">
                         <span className="text-xl">⚠️</span>
                         <p className="text-xs font-black text-amber-800 uppercase leading-tight">
                           Recent lab results detected. Please review all results before adding a clinical note.
                         </p>
                      </div>
                    )}

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
                      disabled={noteType === 'doctor' && labSummary.raw?.some(l => l.status === 'completed' && !visitedResults.has(l.id))}
                      placeholder={noteType === 'doctor' && labSummary.raw?.some(l => l.status === 'completed' && !visitedResults.has(l.id)) ? "Please review results first..." : `Write your daily ${noteType} observations...`}
                      className="input px-4 py-3 resize-none text-sm font-medium border-slate-100 shadow-inner disabled:bg-slate-50 disabled:cursor-not-allowed" />
                    <button 
                      onClick={handleAddNote} 
                      disabled={saving || !newNote.trim() || (noteType === 'doctor' && labSummary.raw?.some(l => l.status === 'completed' && !visitedResults.has(l.id)))} 
                      className="btn-primary px-8 py-3 font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50">
                      {saving ? 'Posting...' : <><Save sx={{ fontSize: 16 }} /> Post Progress Note</>}
                    </button>
                  </div>

                  <div className="card p-6 shadow-sm ring-1 ring-slate-200 bg-white">
                     <h3 className="font-black text-slate-800 mb-4 uppercase tracking-widest text-xs flex items-center justify-between">
                       Lab & Imaging Progress
                       {labSummary.pending > 0 && <span className="badge badge-amber animate-pulse">Pending: {labSummary.pending}</span>}
                     </h3>
                     <div className="space-y-3">
                        {labSummary.raw?.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                             <div>
                               <p className="text-xs font-black text-slate-700">{item.test_name}</p>
                               <span className={`text-[10px] font-bold uppercase tracking-tighter ${item.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                 {item.status === 'completed' ? 'Result Ready' : 'In Lab'}
                               </span>
                             </div>
                             {item.status === 'completed' && (
                               <button 
                                 onClick={() => {
                                   setVisitedResults(p => new Set([...p, item.id]));
                                   // In a real app we'd call a service to mark as viewed in DB
                                   alert(`Report for ${item.test_name}: [NORMAL FINDINGS]`);
                                 }} 
                                 className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all
                                   ${visitedResults.has(item.id) ? 'bg-slate-100 text-slate-400' : 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'}`}>
                                 {visitedResults.has(item.id) ? 'Viewed' : 'View Result'}
                               </button>
                             )}
                          </div>
                        ))}
                        {labSummary.raw?.length === 0 && (
                          <div className="text-center py-8 opacity-40">
                             <p className="text-[10px] font-black uppercase tracking-widest">No Tests Requested</p>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="lg:col-span-3 space-y-4">
                    {notes.map((note, idx) => {
                      const role = note.users?.user_roles?.[0]?.roles?.name || note.note_type;
                      const authorName = note.users ? `${note.users.first_name} ${note.users.last_name} (${role})` : 'System';
                      return (
                        <div key={idx} className={`card p-5 border-l-4 shadow-sm ring-1 ring-slate-100 bg-white ${NOTE_COLORS[note.note_type] || ''}`}>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">{authorName}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">
                              {new Date(note.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">"{note.note}"</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="max-w-4xl">
                  <InpatientActions admission={selectedPatient} onDischarge={() => { setSelectedPatient(null); ipdService.listAdmissions().then(d => setInpatients(d||[])); }} />
                </div>
              )}

              {activeTab === 'mar' && (
                <div className="max-w-4xl space-y-6">
                  <div className="card p-6 shadow-sm ring-1 ring-slate-200 bg-white">
                    <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Medication Administration Record</h3>
                    {mar.length === 0 ? (
                      <div className="text-center p-8 opacity-40">
                         <Medication sx={{ fontSize: 48 }} className="mx-auto mb-4" />
                         <p className="font-black uppercase tracking-widest">No Active Medications</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mar.map(med => (
                          <div key={med.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div>
                               <p className="font-bold text-slate-800">{med.drug_name}</p>
                               <p className="text-xs text-slate-500">{med.dose} · {med.frequency} · {med.route}</p>
                            </div>
                            <button onClick={() => toggleMAR(med.id)} className="btn-secondary text-xs font-bold py-2 px-4 shadow-sm bg-white">
                              Sign Administered
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
