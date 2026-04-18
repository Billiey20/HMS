import React, { useState, useEffect } from 'react';
import { LocalHospital, DirectionsCar, Warning, AccessTime, AddBox, Shield, ArrowForward, AccessibleForward, Healing } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { emergencyService } from '../../services/emergency';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function EmergencyDashboard() {
  const { user } = useAuth();
  const [boardType, setBoardType] = useState('ACTIVE'); // 'ACTIVE', 'ADD'
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [activeCases, setActiveCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  
  const [activeTab, setActiveTab] = useState('RESUS'); // 'RESUS', 'TRAUMA'
  const [resusLogs, setResusLogs] = useState([]);
  const [traumaData, setTraumaData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
     loadBoard();
  }, []);

  const loadBoard = async () => {
     setLoading(true);
     try {
       const res = await emergencyService.getBoard();
       setActiveCases(res.filter(v => v.discharge_disposition === 'Active' || !v.discharge_disposition));
     } catch(e) {
       toast.error('Failed to load A&E Active Board');
     } finally {
       setLoading(false);
     }
  };

  useEffect(() => {
    const t = setTimeout(async () => {
      if (search.length < 2) { setSearchResults([]); return; }
      const res = await patientService.list({ search });
      setSearchResults(res);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadCase = async (emergencyVisit) => {
     setSelectedCase(emergencyVisit);
     setActiveTab('RESUS');
     setLoading(true);
     try {
       const [r, t] = await Promise.all([
          emergencyService.getResuscitationLogs(emergencyVisit.id),
          emergencyService.getTraumaAssessment(emergencyVisit.id)
       ]);
       setResusLogs(r);
       setTraumaData(t);
     } catch(e) {
       toast.error('Failed to load trauma chart');
     } finally {
       setLoading(false);
     }
  };

  const startNewCase = async (patient) => {
     try {
        const fakePayload = {
           patient_id: patient.id,
           arrival_mode: 'Walk-in',
           acuity_level: 'Orange', // Default to Orange for fast triage in demo
           chief_complaint: 'Emergency Presentation',
           discharge_disposition: 'Active'
        };
        const res = await emergencyService.createHandover(fakePayload);
        toast.success('Patient Registered to Resus Bay');
        setBoardType('ACTIVE');
        loadBoard();
        loadCase({ ...res, patient });
     } catch (e) {
        toast.error('Failed to register patient in A&E');
     }
  };

  const getAcuityColor = (level) => {
     switch(level) {
        case 'Red': return 'bg-red-600 border-red-700 text-white shadow-red-500/30';
        case 'Orange': return 'bg-orange-500 border-orange-600 text-white shadow-orange-500/30';
        case 'Yellow': return 'bg-yellow-400 border-yellow-500 text-yellow-900 shadow-yellow-500/20';
        case 'Green': return 'bg-green-500 border-green-600 text-white shadow-green-500/20';
        case 'Blue': return 'bg-blue-500 border-blue-600 text-white shadow-blue-500/20';
        default: return 'bg-slate-200 border-slate-300 text-slate-700';
     }
  };

  const fastTrack = async (destination) => {
     if (selectedCase.medico_legal_flag && selectedCase.medico_legal_flag !== 'None' && !selectedCase.police_ob_number) {
        toast.error('CANNOT DISCHARGE: Missing Police OB Number for Medico-Legal Case!');
        return;
     }

     try {
        if (destination === 'Theatre') {
           await emergencyService.fastTrackToTheatre(selectedCase.id, selectedCase.patient_id, 'Emergency Open Case');
           toast.success('Patient fast-tracked to Surgical Theatre');
        } else if (destination === 'ICU') {
           await emergencyService.fastTrackToICU(selectedCase.id, selectedCase.patient_id);
           toast.success('Patient admitted directly to ICU');
        }
        setSelectedCase(null);
        loadBoard();
     } catch(e) {
        toast.error(`Failed to fast-track to ${destination}`);
     }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <LocalHospital fontSize="medium" className="text-red-700" />
            </div>
            Accident & Emergency
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">SATS Triage Board & Resuscitation Center</p>
        </div>
      </div>

      {!selectedCase ? (
        <div className="card bg-white p-6 md:p-8 border border-slate-200">
           <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 <DirectionsCar className="text-slate-400"/> A&E Active Board
              </h2>
              {boardType === 'ACTIVE' ? (
                <button onClick={() => setBoardType('ADD')} className="btn-primary bg-red-700 hover:bg-red-800 shadow-red-200 text-sm py-2 px-4 shadow-lg flex items-center gap-1">
                   <AddBox fontSize="small" /> Receive Ambulance / Walk-In
                </button>
              ) : (
                <button onClick={() => setBoardType('ACTIVE')} className="btn-secondary text-sm py-2 px-3">Back to Board</button>
              )}
           </div>

           {boardType === 'ACTIVE' ? (
              loading ? (
                <div className="py-20 text-center font-bold text-slate-400 animate-pulse">Loading Resus Board...</div>
              ) : activeCases.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                   <LocalHospital sx={{fontSize: 56}} className="opacity-20 mb-4" />
                   <p className="font-bold">No active casualties in the department</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {activeCases.map(c => (
                      <button key={c.id} onClick={() => loadCase(c)} className="text-left bg-slate-50 border border-slate-200 hover:border-red-400 rounded-2xl p-5 hover:shadow-xl hover:shadow-red-500/10 transition-all group overflow-hidden relative">
                         <div className={`absolute top-0 left-0 w-full h-1.5 ${getAcuityColor(c.acuity_level).split(' ')[0]}`}></div>
                         <div className="flex justify-between items-start mb-2 mt-1">
                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md shadow ${getAcuityColor(c.acuity_level)}`}>SATS: {c.acuity_level}</span>
                            <span className="text-xs font-bold text-slate-500">Wait: {Math.floor((new Date() - new Date(c.arrival_time)) / 60000)}m</span>
                         </div>
                         <h3 className="font-black text-lg text-slate-800">{c.patient?.first_name} {c.patient?.last_name}</h3>
                         <p className="text-xs font-bold text-slate-500">{c.patient?.patient_no} · {c.patient?.age}y · {c.arrival_mode}</p>
                         {(c.medico_legal_flag && c.medico_legal_flag !== 'None') && (
                            <div className="mt-3 bg-rose-100 text-rose-800 font-black text-[10px] uppercase tracking-widest px-2 py-1 flex items-center justify-center gap-1 rounded-md border border-rose-200">
                               <Warning fontSize="inherit" /> Police/Legal Alert
                            </div>
                         )}
                      </button>
                   ))}
                </div>
              )
           ) : (
              <div className="max-w-md mx-auto space-y-6 pt-10 pb-20">
                 <div className="text-center">
                    <h3 className="text-xl font-black text-slate-800">Identify Arriving Patient</h3>
                    <p className="text-sm font-bold text-slate-500">Search DB or create an emergency temp record</p>
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
                 {searchResults.length > 0 && (
                     <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden mt-2 text-left w-full absolute z-10 max-w-md">
                       {searchResults.map(p => (
                         <button 
                           key={p.id}
                           onClick={() => startNewCase(p)}
                           className="w-full px-5 py-4 hover:bg-red-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
                         >
                           <div className="flex-1 min-w-0">
                             <p className="font-bold text-slate-800 truncate">{p.first_name} {p.last_name}</p>
                             <p className="text-xs text-slate-500 font-mono mt-0.5">{p.patient_no} · {p.age}y</p>
                           </div>
                           <span className="text-xs font-black text-red-600 bg-red-100 px-3 py-1 rounded-full">+ Receive Default</span>
                         </button>
                       ))}
                     </div>
                 )}
              </div>
           )}
        </div>
      ) : (
        <div className="space-y-6">
           {/* Medico-Legal Warning Banner */}
           {(selectedCase.medico_legal_flag && selectedCase.medico_legal_flag !== 'None') && !selectedCase.police_ob_number && (
              <div className="card bg-rose-600 border border-rose-700 p-4 text-white flex items-center justify-center gap-4 shadow-xl animate-pulse">
                 <Warning fontSize="large" /> 
                 <div>
                    <h3 className="font-black text-lg uppercase tracking-widest">Medico-Legal Hold Active</h3>
                    <p className="text-sm font-bold opacity-80">This case involves suspected {selectedCase.medico_legal_flag}. Discharge is mechanically locked pending Police OB Number entry.</p>
                 </div>
              </div>
           )}

           <div className={`card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg ${getAcuityColor(selectedCase.acuity_level).replace('text-white', 'text-white border-none')}`}>
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-black/20 flex items-center justify-center font-black text-2xl border border-white/20">
                 {selectedCase.patient?.first_name[0]}{selectedCase.patient?.last_name[0]}
               </div>
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   {selectedCase.acuity_level === 'Red' && <Warning fontSize="small" className="text-white"/>}
                   <span className="text-[10px] uppercase font-black bg-black/30 px-2 py-0.5 rounded-md tracking-widest text-white shadow-inner">SATS: {selectedCase.acuity_level}</span>
                 </div>
                 <h2 className="text-2xl font-black text-white">{selectedCase.patient?.first_name} {selectedCase.patient?.last_name}</h2>
                 <div className="flex items-center gap-3 mt-1 text-white/80 text-sm font-semibold">
                   <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{selectedCase.patient?.patient_no}</span>
                   <span>Age: {selectedCase.patient?.age}</span>
                   <span className="flex items-center gap-1"><AccessTime fontSize="small"/> {new Date(selectedCase.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                 </div>
               </div>
             </div>
             <div className="flex gap-2flex-wrap mt-4 md:mt-0">
               <button onClick={() => fastTrack('Theatre')} className="px-4 py-2 bg-rose-700/60 hover:bg-rose-700 border border-white/20 rounded-xl text-xs font-black uppercase text-white shadow-lg transition-all flex items-center gap-1">
                 <ArrowForward fontSize="small"/> To Theatre
               </button>
               <button onClick={() => fastTrack('ICU')} className="px-4 py-2 bg-slate-900/40 hover:bg-black border border-white/20 rounded-xl text-xs font-black uppercase text-white shadow-lg transition-all flex items-center gap-1 ml-2">
                 <AccessibleForward fontSize="small"/> To ICU
               </button>
               <button onClick={() => setSelectedCase(null)} className="px-4 py-2 ml-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all text-white border border-white/30 hidden md:block">
                 Board
               </button>
             </div>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
             {[
               { id: 'RESUS', label: 'ABCDE Resus Grid', icon: <Healing fontSize="small" className="mr-1.5"/> },
               { id: 'TRAUMA', label: 'Trauma & FAST', icon: <AccessibilityNew fontSize="small" className="mr-1.5"/> },
             ].map(t => (
               <button 
                 key={t.id}
                 onClick={() => setActiveTab(t.id)}
                 className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                   activeTab === t.id 
                     ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50' 
                     : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                 }`}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>

          <div className="card bg-white p-6 md:p-8 min-h-[400px]">
             {loading ? (
               <div className="flex items-center justify-center h-40 text-slate-400 font-bold animate-pulse">Loading clinical workflows...</div>
             ) : (
               <>
                 {/* RESUS TAB */}
                 {activeTab === 'RESUS' && (
                    <div className="grid md:grid-cols-3 gap-8">
                       <div className="md:col-span-2 space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                             <div>
                               <h3 className="text-xl font-black text-slate-800">Time-stamped ABCDE Grid</h3>
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Rapid Intervention Protocol</p>
                             </div>
                          </div>
                          
                          {resusLogs.length === 0 ? (
                             <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                               <Healing sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                               <p className="font-bold text-sm">Resuscitation grid empty. Begin documenting sequence.</p>
                             </div>
                          ) : (
                             <div className="space-y-3">
                                {resusLogs.map(log => (
                                   <div key={log.id} className="flex gap-4 p-4 border border-slate-200 bg-slate-50 rounded-xl items-center">
                                      <div className="text-center min-w-16">
                                         <p className="text-xs font-black text-slate-800">{new Date(log.action_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</p>
                                      </div>
                                      <div className="px-3 border-l-2 border-red-200 w-full flex justify-between items-center">
                                         <div>
                                            <span className="text-[10px] font-black uppercase text-red-600 tracking-widest">{log.abcde_category}</span>
                                            <p className="font-bold text-slate-700 text-sm mt-0.5">{log.intervention_details}</p>
                                         </div>
                                         <span className="text-xs text-slate-400 font-bold border border-slate-200 bg-white px-2 py-1 rounded-md">Dr. {log.user?.last_name || 'System'}</span>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                       
                       <div className="space-y-4">
                          <h4 className="font-black text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
                             Quick Interventions <Healing fontSize="small" className="text-red-500"/>
                          </h4>
                          <button className="w-full text-left p-3 border border-red-200 bg-red-50 rounded-xl hover:border-red-500 transition-colors">
                             <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">A: Airway</p>
                             <p className="font-bold text-slate-700 text-sm">Perform Intubation</p>
                          </button>
                          <button className="w-full text-left p-3 border border-sky-200 bg-sky-50 rounded-xl hover:border-sky-500 transition-colors">
                             <p className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1">B: Breathing</p>
                             <p className="font-bold text-slate-700 text-sm">Apply O2 (15L Non-Rebreather)</p>
                          </button>
                          <button className="w-full text-left p-3 border border-emerald-200 bg-emerald-50 rounded-xl hover:border-emerald-500 transition-colors">
                             <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">C: Circulation</p>
                             <p className="font-bold text-slate-700 text-sm">Insert 2x Large Bore IVs</p>
                          </button>
                       </div>
                    </div>
                 )}

                 {/* TRAUMA TAB */}
                 {activeTab === 'TRAUMA' && (
                    <div className="grid lg:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <h3 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-3">Glasgow Coma Scale (GCS)</h3>
                          <div className="grid grid-cols-3 text-center gap-4">
                             <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Eye (E)</span>
                                <span className="text-4xl font-black text-indigo-900 border-b-2 border-indigo-200 pb-1">{traumaData?.gcs_eye || 4}</span>
                                <span className="block text-xs font-bold text-slate-500 mt-2">/ 4</span>
                             </div>
                             <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Verbal (V)</span>
                                <span className="text-4xl font-black text-indigo-900 border-b-2 border-indigo-200 pb-1">{traumaData?.gcs_verbal || 5}</span>
                                <span className="block text-xs font-bold text-slate-500 mt-2">/ 5</span>
                             </div>
                             <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Motor (M)</span>
                                <span className="text-4xl font-black text-indigo-900 border-b-2 border-indigo-200 pb-1">{traumaData?.gcs_motor || 6}</span>
                                <span className="block text-xs font-bold text-slate-500 mt-2">/ 6</span>
                             </div>
                          </div>
                          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                             <span className="font-bold text-indigo-800">Total GCS Score</span>
                             <span className="font-black text-2xl text-indigo-900">
                               {(traumaData?.gcs_eye || 4) + (traumaData?.gcs_verbal || 5) + (traumaData?.gcs_motor || 6)}/15
                             </span>
                          </div>
                       </div>

                       <div className="space-y-6">
                           <h3 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-3">FAST Exam & MOI</h3>
                           <div className="space-y-4">
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Mechanism of Injury (MOI)</span>
                                 <p className="font-bold text-slate-700">{traumaData?.mechanism_of_injury || 'Not Documented'}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ultrasound (FAST)</span>
                                 <span className={`text-sm font-black px-3 py-1 rounded-md ${traumaData?.fast_exam_result === 'Positive' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                                    {traumaData?.fast_exam_result || 'Not Performed'}
                                 </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                 <div className={`p-4 rounded-xl border text-center font-bold text-sm ${traumaData?.pelvic_binder_applied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                    Pelvic Binder
                                 </div>
                                 <div className={`p-4 rounded-xl border text-center font-bold text-sm ${traumaData?.tourniquet_applied ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                    Tourniquet Active
                                 </div>
                              </div>
                           </div>
                       </div>
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
