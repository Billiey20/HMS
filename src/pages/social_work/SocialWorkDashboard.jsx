import React, { useState, useEffect } from 'react';
import { SupportAgent, Search, GppGood, Warning, DocumentScanner } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { alliedHealthService } from '../../services/allied_health';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function SocialWorkDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
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
    // SECURITY GATE: Only admin and social workers should even query this DB
    if (user?.role !== 'admin' && user?.role !== 'social_worker') {
      toast.error('ACCESS DENIED: Insufficient Security Clearance for Social Case Files');
      return;
    }
    
    setSelectedPatient(patient);
    setSearch('');
    setPatients([]);
    setLoading(true);
    try {
       const res = await alliedHealthService.getSocialWorkRecords(patient.id);
       setRecords(res);
    } catch (err) {
       toast.error('Failed to load social work records');
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-fuchsia-100 rounded-2xl flex items-center justify-center">
              <SupportAgent fontSize="medium" className="text-fuchsia-600" />
            </div>
            Social Work & GBV Unit
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">RESTRICTED: Post-Rape Care (PRC) & Psychosocial Assessments</p>
        </div>
      </div>

      {(user?.role !== 'admin' && user?.role !== 'social_worker') ? (
         <div className="card bg-red-50 border-red-200 p-16 text-center shadow-lg">
            <Warning sx={{fontSize: 56}} className="text-red-500 mb-4" />
            <h2 className="text-2xl font-black text-red-800 uppercase tracking-widest">Clearance Required</h2>
            <p className="text-red-600 font-bold mt-2 max-w-xl mx-auto">
               You are logged in as <strong className="uppercase">{user?.role}</strong>. This module contains highly sensitive Patient Case Files protected under strict Government Privacy Mandates. Only authorized Social Workers may enter.
            </p>
         </div>
      ) : !selectedPatient ? (
        <div className="card p-8 md:p-16 text-center border border-slate-200">
           <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="text-slate-400" sx={{ fontSize: 32 }} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Retrieve Confidential File</h3>
              <p className="text-sm text-slate-500 mt-2">Search for a registered client to manage their psychosocial interventions.</p>
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
                     className="w-full px-5 py-4 hover:bg-fuchsia-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
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
           {/* High Security Banner */}
           <div className="card p-6 bg-slate-900 border-2 border-fuchsia-500/50 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-2xl shadow-fuchsia-500/10">
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center font-black text-2xl border border-white/20">
                 {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
               </div>
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <GppGood fontSize="small" className="text-emerald-400"/>
                   <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest">Confidential Case File</span>
                 </div>
                 <h2 className="text-2xl font-black">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                 <div className="flex items-center gap-3 mt-1 text-slate-400 text-sm font-semibold">
                   <span className="font-mono bg-black px-2 py-0.5 rounded-md text-fuchsia-400">{selectedPatient.patient_no}</span>
                   <span>Age: {selectedPatient.age}</span>
                 </div>
               </div>
             </div>
             <div className="flex gap-3">
               <button onClick={() => setSelectedPatient(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20">
                 Close File
               </button>
             </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
               <div className="card bg-white p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                     <div>
                       <h3 className="text-lg font-black text-slate-800">Case Logs & Interventions</h3>
                     </div>
                     <button className="btn-primary py-2 px-4 shadow-fuchsia-200 bg-fuchsia-600 hover:bg-fuchsia-700 text-sm">Add New Case Note</button>
                  </div>
                  
                  {loading ? (
                    <div className="py-12 text-center text-slate-400 font-bold animate-pulse">Decrypting files...</div>
                  ) : records.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <DocumentScanner sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                      <p className="font-bold text-sm">No social cases on record</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {records.map(r => (
                         <div key={r.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 relative overflow-hidden">
                            {r.security_lock && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>}
                            <div className="flex justify-between items-center mb-3">
                               <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full ${r.case_type === 'GBV' ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-800'}`}>{r.case_type}</span>
                               <span className="text-xs font-bold text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <p className="text-sm font-semibold text-slate-700 mb-4">{r.assessment_notes}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border-t border-slate-200 pt-3">
                               {r.prc_form_1_completed && (
                                  <div className="bg-rose-50 text-rose-700 border border-rose-200 p-2 rounded-lg text-xs font-black uppercase flex items-center justify-center text-center">PRC Form 1 Complete</div>
                               )}
                               {r.police_ob_number && (
                                  <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 p-2 rounded-lg text-xs font-black uppercase text-center flex items-center justify-center">OB: {r.police_ob_number}</div>
                               )}
                               {r.community_linkage && (
                                  <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-2 rounded-lg text-xs flex justify-center text-center items-center font-black uppercase">{r.community_linkage}</div>
                               )}
                            </div>
                         </div>
                      ))}
                    </div>
                  )}
               </div>
             </div>

             <div className="space-y-6">
                <div className="card bg-slate-800 text-white p-6 border border-slate-700">
                   <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">Protocol Action Center</h3>
                   <p className="text-xs text-slate-400 font-bold mb-4 border-b border-slate-700 pb-4">Standardized screening and reporting workflows.</p>
                   
                   <div className="space-y-3">
                      <button className="w-full text-left p-3 border border-slate-600 rounded-xl hover:border-fuchsia-500 hover:bg-slate-700 transition-colors">
                         <p className="text-sm font-black text-rose-400 uppercase tracking-widest mb-1">MOH 365</p>
                         <p className="font-bold text-white">Initiate Post-Rape Care (PRC)</p>
                      </button>
                      
                      <button className="w-full text-left p-3 border border-slate-600 rounded-xl hover:border-fuchsia-500 hover:bg-slate-700 transition-colors">
                         <p className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-1">OVC Screening</p>
                         <p className="font-bold text-white">Child Protection Assesment</p>
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
