import React, { useState, useEffect } from 'react';
import { MonitorHeart, Search, Favorite, Opacity, AssignmentTurnedIn, EditNote } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { icuService } from '../../services/icu';
import { toast } from 'react-toastify';

export default function ICUDashboard() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [activeTab, setActiveTab] = useState('VITALS'); // 'VITALS', 'SCORES', 'FLUIDS', 'MDT'
  const [vitals, setVitals] = useState([]);
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
       const vit = await icuService.getIcuVitals(patient.id);
       setVitals(vit);
    } catch (err) {
       toast.error('Failed to load ICU records');
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <MonitorHeart fontSize="medium" className="text-red-600" />
            </div>
            HDU / ICU Ward
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Continuous Vitals, Fluid Balance, & MDT Rounds</p>
        </div>
      </div>

      {!selectedPatient ? (
        <div className="card p-8 md:p-16 text-center border border-slate-200">
           <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="text-slate-400" sx={{ fontSize: 32 }} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Locate Critical Patient</h3>
              <p className="text-sm text-slate-500 mt-2">Search for an admitted patient in the ICU/HDU to open their charts.</p>
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
                     className="w-full px-5 py-4 hover:bg-red-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
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
          <div className="card p-6 bg-gradient-to-br from-red-600 to-rose-800 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg shadow-red-500/20">
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shadow-lg">
                 {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
               </div>
               <div>
                 <p className="text-xs font-black text-red-200 uppercase tracking-widest mb-1">Critical Care Level 3</p>
                 <h2 className="text-2xl font-black">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                 <div className="flex items-center gap-3 mt-1.5 text-red-100 text-sm font-semibold">
                   <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{selectedPatient.patient_no}</span>
                   <span>{selectedPatient.age} yrs</span>
                 </div>
               </div>
             </div>
             <div className="flex gap-3">
               <button onClick={() => setSelectedPatient(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20">
                 Close Chart
               </button>
             </div>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
             {[
               { id: 'VITALS', label: 'ICU Vitals', icon: <Favorite fontSize="small" className="mr-1.5"/> },
               { id: 'FLUIDS', label: 'Fluid Balance (I/O)', icon: <Opacity fontSize="small" className="mr-1.5"/> },
               { id: 'SCORES', label: 'Scoring (RASS/CPOT)', icon: <AssignmentTurnedIn fontSize="small" className="mr-1.5"/> },
               { id: 'MDT',    label: 'MDT Rounds', icon: <EditNote fontSize="small" className="mr-1.5"/> }
             ].map(t => (
               <button 
                 key={t.id}
                 onClick={() => setActiveTab(t.id)}
                 className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                   activeTab === t.id 
                     ? 'bg-white text-red-700 shadow-sm ring-1 ring-slate-200/50' 
                     : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                 }`}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>

          <div className="card bg-white p-6 md:p-8 min-h-[400px]">
             {loading ? (
               <div className="flex items-center justify-center h-40 text-slate-400 font-bold animate-pulse">Loading ICU telemetry...</div>
             ) : (
               <>
                 {/* VITALS GRID TAB */}
                 {activeTab === 'VITALS' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800">High-Frequency Vitals Chart</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Continuous monitoring data</p>
                        </div>
                        <button className="btn-primary py-2 px-4 shadow-red-200 bg-red-600 hover:bg-red-700">
                          Log Manual Reading
                        </button>
                      </div>

                      {vitals.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <Favorite sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                          <p className="font-bold text-sm">No recent vitals documented</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-800">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-900 border-b border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3 text-red-400">HR</th>
                                <th className="px-4 py-3 text-cyan-400">BP</th>
                                <th className="px-4 py-3 text-cyan-300">MAP</th>
                                <th className="px-4 py-3 text-blue-400">SpO2</th>
                                <th className="px-4 py-3">Temp</th>
                                <th className="px-4 py-3 text-purple-400">Vent Mode</th>
                                <th className="px-4 py-3 text-purple-400">FiO2</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50 text-white">
                              {vitals.map(v => (
                                <tr key={v.id} className="hover:bg-white/5 transition-colors font-mono">
                                  <td className="px-4 py-3 font-semibold text-slate-400 text-xs">{new Date(v.record_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                  <td className="px-4 py-3 text-red-400">{v.hr || '—'}</td>
                                  <td className="px-4 py-3 text-cyan-400">{v.bp_sys}/{v.bp_dia}</td>
                                  <td className="px-4 py-3 text-cyan-300 font-black">{v.map || '—'}</td>
                                  <td className="px-4 py-3 text-blue-400">{v.spo2}%</td>
                                  <td className="px-4 py-3">{v.temp}°C</td>
                                  <td className="px-4 py-3 text-purple-400 text-xs font-sans tracking-wide">{v.ventilator_mode || 'Room Air'}</td>
                                  <td className="px-4 py-3 text-purple-400">{v.fio2 ? `${v.fio2*100}%` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                 )}
                 
                 {/* FLUIDS TAB */}
                 {activeTab === 'FLUIDS' && (
                    <div className="text-center py-12 text-slate-400">
                      <Opacity sx={{fontSize: 56}} className="mb-4 opacity-20"/>
                      <p className="font-bold">Hourly Fluid Balance Module Loading...</p>
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
