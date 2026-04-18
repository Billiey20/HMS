import React, { useState, useEffect } from 'react';
import { FitnessCenter, Search, CompareArrows, Accessibility, RunCircle } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { alliedHealthService } from '../../services/allied_health';
import { toast } from 'react-toastify';

export default function PhysioDashboard() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (search.length < 2) return;
      const res = await patientService.list({ search });
      setPatients(res);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadDossier = async (patient) => {
    setSelectedPatient(patient);
    setSearch('');
    setPatients([]);
    setLoading(true);
    try {
       const data = await alliedHealthService.getPhysioAssessments(patient.id);
       setAssessments(data);
    } catch (err) {
       toast.error('Failed to load physiotherapy records');
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
              <FitnessCenter fontSize="medium" className="text-teal-600" />
            </div>
            Physiotherapy & Rehab
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Functional Scoring, Mobility & Therapy Sessions</p>
        </div>
      </div>

      {!selectedPatient ? (
        <div className="card p-8 md:p-16 text-center border border-slate-200">
           <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="text-slate-400" sx={{ fontSize: 32 }} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Locate Patient</h3>
              <p className="text-sm text-slate-500 mt-2">Search for a patient referred for physical therapy.</p>
            </div>
            <div className="relative">
              <input 
                autoFocus
                className="input pl-12 h-14 text-lg w-full shadow-sm"
                placeholder="Name, ID or Phone number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            
            {patients.length > 0 && (
               <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden mt-2 text-left absolute z-10 w-full max-w-md">
                 {patients.map(p => (
                   <button 
                     key={p.id}
                     onClick={() => loadDossier(p)}
                     className="w-full px-5 py-4 hover:bg-teal-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
                   >
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500">
                       {p.first_name[0]}{p.last_name[0]}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-bold text-slate-800 truncate">{p.first_name} {p.last_name}</p>
                       <p className="text-xs text-slate-500 font-mono mt-0.5">{p.patient_no}</p>
                     </div>
                   </button>
                 ))}
               </div>
             )}
           </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="card p-6 bg-gradient-to-br from-teal-600 to-cyan-800 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg shadow-teal-500/20">
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shadow-lg">
                 {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
               </div>
               <div>
                 <h2 className="text-2xl font-black">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                 <div className="flex items-center gap-3 mt-1.5 text-teal-100 text-sm font-semibold">
                   <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{selectedPatient.patient_no}</span>
                   <span>Rehabilitation Protocol</span>
                 </div>
               </div>
             </div>
             <div className="flex gap-3">
               <button onClick={() => setSelectedPatient(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20">
                 Close Chart
               </button>
             </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
               <div className="card bg-white p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                     <div>
                       <h3 className="text-lg font-black text-slate-800">Therapy Course & Assessment</h3>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Functional Scoring</p>
                     </div>
                     <button className="btn-primary py-2 px-4 shadow-teal-200 bg-teal-600 hover:bg-teal-700">New Assessment</button>
                  </div>
                  
                  {loading ? (
                    <div className="py-12 text-center text-slate-400 font-bold animate-pulse">Loading assessments...</div>
                  ) : assessments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Accessibility sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                      <p className="font-bold text-sm">No therapy course documented</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assessments.map(a => (
                         <div key={a.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                            <div className="flex justify-between items-center mb-3">
                               <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${a.status === 'Active' ? 'bg-teal-200 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>{a.status}</span>
                               <span className="text-xs text-slate-500 font-bold">{new Date(a.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                               <div className="bg-white p-3 rounded-lg border border-slate-100">
                                  <p className="text-[10px] text-slate-400 font-black uppercase">Initial Pain Scale</p>
                                  <p className="text-2xl font-black text-rose-500">{a.initial_pain_score || '-'}<span className="text-sm text-slate-400">/10</span></p>
                               </div>
                               <div className="bg-white p-3 rounded-lg border border-slate-100">
                                  <p className="text-[10px] text-slate-400 font-black uppercase">{a.functional_score_type || 'Functional Score'}</p>
                                  <p className="text-2xl font-black text-indigo-600">{a.functional_score_value || '-'}</p>
                               </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200">
                               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Goals of Therapy</p>
                               <p className="text-sm font-semibold text-slate-800">{a.goals_of_therapy}</p>
                            </div>
                         </div>
                      ))}
                    </div>
                  )}
               </div>
             </div>

             <div className="space-y-6">
                <div className="card bg-white p-6">
                   <h3 className="text-lg font-black text-slate-800 mb-2">Sessions Toolkit</h3>
                   <p className="text-xs text-slate-500 font-bold mb-4">Quick tools for the active therapy session.</p>
                   
                   <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-teal-500 hover:shadow-lg transition-all group">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Accessibility fontSize="small" /></div>
                           <span className="font-bold text-slate-700">Barthel Index Calculator</span>
                         </div>
                      </button>
                      <button className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-teal-500 hover:shadow-lg transition-all group">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors"><CompareArrows fontSize="small" /></div>
                           <span className="font-bold text-slate-700">Range of Motion (ROM)</span>
                         </div>
                      </button>
                      <button className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-teal-500 hover:shadow-lg transition-all group">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors"><RunCircle fontSize="small" /></div>
                           <span className="font-bold text-slate-700">Log Daily Session</span>
                         </div>
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
