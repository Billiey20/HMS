import React, { useState, useEffect } from 'react';
import { Shield, Search, LocalPolice, ContactSupport, SecurityUpdateWarning, HealthAndSafety } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { isolationService } from '../../services/isolation';
import { toast } from 'react-toastify';

export default function IsolationDashboard() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [activeTab, setActiveTab] = useState('PROTOCOLS'); // 'PROTOCOLS', 'PPE', 'TRACING'
  const [isolations, setIsolations] = useState([]);
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
       const iso = await isolationService.getIsolations(patient.id);
       setIsolations(iso);
    } catch (err) {
       toast.error('Failed to load isolation records');
    } finally {
       setLoading(false);
    }
  };

  const currentIsolation = isolations[0] && !isolations[0].end_time ? isolations[0] : null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Shield fontSize="medium" className="text-orange-600" />
            </div>
            Isolation Ward
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Infection Control, Protocol Enforcement & Tracing</p>
        </div>
      </div>

      {!selectedPatient ? (
        <div className="card p-8 md:p-16 text-center border border-slate-200">
           <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="text-slate-400" sx={{ fontSize: 32 }} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Locate Patient in Isolation</h3>
              <p className="text-sm text-slate-500 mt-2">Search for a patient flagged for strict IPC management.</p>
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
                     className="w-full px-5 py-4 hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
                   >
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500">
                       {p.first_name[0]}{p.last_name[0]}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-bold text-slate-800 truncate">{p.first_name} {p.last_name}</p>
                       <p className="text-xs text-slate-500 font-mono mt-0.5">{p.patient_no} · {p.age} yrs</p>
                     </div>
                   </button>
                 ))}
               </div>
             )}
           </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Banner */}
          <div className={`card p-6 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg ${
             currentIsolation?.isolation_type === 'Strict' || currentIsolation?.isolation_type === 'Airborne' 
             ? 'bg-gradient-to-br from-red-600 to-rose-900 shadow-red-500/20' 
             : 'bg-gradient-to-br from-orange-600 to-amber-800 shadow-orange-500/20'
          }`}>
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                 <HealthAndSafety fontSize="large" className="text-white" />
               </div>
               <div>
                 <div className="flex items-center gap-3 mb-1">
                   {currentIsolation ? (
                     <span className="text-[10px] font-black bg-white text-rose-700 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 animate-pulse"><SecurityUpdateWarning fontSize="inherit"/> active IPC Protocol</span>
                   ) : (
                     <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">No Active Isolation</span>
                   )}
                 </div>
                 <h2 className="text-2xl font-black">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                 <div className="flex items-center gap-3 mt-1 text-white/80 text-sm font-semibold">
                   <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{selectedPatient.patient_no}</span>
                 </div>
               </div>
             </div>
             <div className="flex gap-3 text-right">
               {currentIsolation?.notifiable_disease && (
                 <div className="hidden md:block mr-6 text-left border-l border-white/20 pl-6">
                   <p className="text-[10px] uppercase tracking-widest text-white/70 font-black">Notifiable Condition</p>
                   <p className="font-black text-lg text-amber-200">{currentIsolation.notifiable_disease}</p>
                 </div>
               )}
               <button onClick={() => setSelectedPatient(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20 h-fit my-auto">
                 Close Chart
               </button>
             </div>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
             {[
               { id: 'PROTOCOLS', label: 'IPC Classification', icon: <LocalPolice fontSize="small" className="mr-1.5"/> },
               { id: 'PPE', label: 'PPE Access Logs', icon: <HealthAndSafety fontSize="small" className="mr-1.5"/> },
               { id: 'TRACING', label: 'Contact Tracing', icon: <ContactSupport fontSize="small" className="mr-1.5"/> }
             ].map(t => (
               <button 
                 key={t.id}
                 onClick={() => setActiveTab(t.id)}
                 className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                   activeTab === t.id 
                     ? 'bg-white text-orange-700 shadow-sm ring-1 ring-slate-200/50' 
                     : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                 }`}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>

          <div className="card bg-white p-6 md:p-8 min-h-[400px]">
             {loading ? (
               <div className="flex items-center justify-center h-40 text-slate-400 font-bold animate-pulse">Loading IPC records...</div>
             ) : (
               <>
                 {/* PROTOCOLS TAB */}
                 {activeTab === 'PROTOCOLS' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800">Infection Prevention & Control</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Barrier nursing directives</p>
                        </div>
                        {!currentIsolation && (
                          <button className="btn-primary bg-orange-600 hover:bg-orange-700 shadow-orange-200 py-2 px-4">
                            Flag for Isolation
                          </button>
                        )}
                      </div>

                      {isolations.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <Shield sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                          <p className="font-bold text-sm">No isolation history</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           {isolations.map(iso => (
                             <div key={iso.id} className={`p-6 rounded-2xl border-2 ${!iso.end_time ? 'border-orange-200 bg-orange-50' : 'border-slate-100 bg-slate-50'}`}>
                               <div className="flex justify-between items-start mb-4">
                                  <div>
                                     <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full text-white ${
                                       iso.isolation_type === 'Airborne' ? 'bg-indigo-500' :
                                       iso.isolation_type === 'Droplet' ? 'bg-sky-500' :
                                       iso.isolation_type === 'Contact' ? 'bg-amber-500' :
                                       'bg-rose-600'
                                     }`}>{iso.isolation_type} Isolation</span>
                                     <h4 className="text-lg font-black text-slate-800 mt-2">{iso.notifiable_disease || 'Suspected Pathogen'}</h4>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-black text-slate-400 tracking-widest uppercase">Ordered By</p>
                                    <p className="text-sm font-bold text-slate-700">Dr. {iso.doctor?.last_name || 'Unknown'}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-6 text-sm font-bold text-slate-600 border-t border-slate-200 pt-4 mt-4">
                                  <div>
                                    <span className="text-slate-400 block text-[10px] uppercase tracking-widest mb-0.5">Start</span>
                                    {new Date(iso.start_time).toLocaleString()}
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px] uppercase tracking-widest mb-0.5">End</span>
                                    {iso.end_time ? new Date(iso.end_time).toLocaleString() : <span className="text-orange-600 uppercase">Active</span>}
                                  </div>
                               </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                 )}

                 {/* PPE LOGS TAB */}
                 {activeTab === 'PPE' && (
                    <div className="text-center py-12 text-slate-400">
                      <HealthAndSafety sx={{fontSize: 56}} className="mb-4 opacity-20"/>
                      <p className="font-bold">Staff PPE Access Gate module Loading...</p>
                      <p className="text-sm mt-2 max-w-sm mx-auto">This module requires integration with ward proximity scanners to accurately log hazardous area entry.</p>
                    </div>
                 )}

                 {/* CONTACT TRACING TAB */}
                 {activeTab === 'TRACING' && (
                    <div className="text-center py-12 text-slate-400">
                      <ContactSupport sx={{fontSize: 56}} className="mb-4 opacity-20"/>
                      <p className="font-bold">Contact Listing module Loading...</p>
                    </div>
                 )}
               </>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
