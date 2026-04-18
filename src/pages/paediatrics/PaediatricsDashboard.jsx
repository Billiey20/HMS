import React, { useState, useEffect } from 'react';
import { ChildCare, Search, Scale, Medication, Assessment, Warning } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { paediatricService } from '../../services/paediatrics';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function PaediatricsDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [activeTab, setActiveTab] = useState('IMCI'); // 'IMCI', 'GROWTH', 'DOSING'
  const [imciRecords, setImciRecords] = useState([]);
  const [growthRecords, setGrowthRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dosing Calculator State
  const [drugDoseKg, setDrugDoseKg] = useState('');
  const [drugWeight, setDrugWeight] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      if (search.length < 2) return;
      // Fetch all patients for search, filter purely for under 15 years roughly if age is a string
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
    setDrugWeight(''); // reset local weight
    try {
       const [imci, grw] = await Promise.all([
         paediatricService.getIMCIAssessments(patient.id),
         paediatricService.getGrowthRecords(patient.id)
       ]);
       setImciRecords(imci);
       setGrowthRecords(grw);

       // Pre-fill dosing weight if we have a recent growth record
       if (grw.length > 0) {
         setDrugWeight(grw[grw.length - 1].weight_kg);
       }
    } catch (err) {
       toast.error('Failed to load paediatric records');
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
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <ChildCare fontSize="medium" className="text-blue-600" />
            </div>
            Paediatric Unit
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">IMCI Protocols, Growth Tracing & Safe Dosing</p>
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
              <p className="text-sm text-slate-500 mt-2">Search for a child patient to open their chart.</p>
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
                     className="w-full px-5 py-4 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
                   >
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500">
                       {p.first_name[0]}{p.last_name[0]}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-bold text-slate-800 truncate">{p.first_name} {p.last_name}</p>
                       <p className="text-xs text-slate-500 font-mono mt-0.5">{p.patient_no} · {p.age} yrs · {p.gender}</p>
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
          <div className="card p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg shadow-blue-500/20">
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shadow-lg">
                 {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
               </div>
               <div>
                 <h2 className="text-2xl font-black">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                 <div className="flex items-center gap-3 mt-1.5 text-blue-100 text-sm font-semibold">
                   <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{selectedPatient.patient_no}</span>
                   <span>{selectedPatient.age} yrs</span>
                   <span>{selectedPatient.gender}</span>
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
               { id: 'IMCI', label: 'IMCI Protocol', icon: <Assessment fontSize="small" className="mr-1.5"/> },
               { id: 'GROWTH', label: 'Growth Monitoring', icon: <Scale fontSize="small" className="mr-1.5"/> },
               { id: 'DOSING', label: 'Weight-Based Dosing', icon: <Medication fontSize="small" className="mr-1.5"/> }
             ].map(t => (
               <button 
                 key={t.id}
                 onClick={() => setActiveTab(t.id)}
                 className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                   activeTab === t.id 
                     ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50' 
                     : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                 }`}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>

          <div className="card bg-white p-6 md:p-8 min-h-[400px]">
             {loading ? (
               <div className="flex items-center justify-center h-40 text-slate-400 font-bold animate-pulse">Loading records...</div>
             ) : (
               <>
                 {/* IMCI TAB */}
                 {activeTab === 'IMCI' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800">Integrated Management of Childhood Illnesses</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Danger signs & classification</p>
                        </div>
                        <button className="btn-primary py-2 px-4 shadow-blue-200">
                          New IMCI Assessment
                        </button>
                      </div>

                      {imciRecords.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <Assessment sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                          <p className="font-bold text-sm">No IMCI assessments on file</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {imciRecords.map(rec => (
                             <div key={rec.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
                               <div className="flex items-center justify-between mb-4">
                                 <span className="text-xs font-black text-slate-500">{new Date(rec.created_at).toLocaleString()}</span>
                                 <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                   rec.classification === 'Red' ? 'bg-red-100 text-red-700' :
                                   rec.classification === 'Yellow' ? 'bg-amber-100 text-amber-700' :
                                   'bg-emerald-100 text-emerald-700'
                                 }`}>
                                   {rec.classification} Classification
                                 </span>
                               </div>
                               
                               <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1">
                                      <Warning fontSize="small" className="text-red-400"/> Danger Signs
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                       {(rec.danger_signs || []).length > 0 
                                        ? rec.danger_signs.map((ds, i) => <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">{ds}</span>) 
                                        : <span className="text-xs text-slate-400 italic">None present</span>}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Main Symptoms</h4>
                                    <div className="flex flex-wrap gap-2">
                                       {(rec.main_symptoms || []).length > 0 
                                        ? rec.main_symptoms.map((ms, i) => <span key={i} className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">{ms}</span>) 
                                        : <span className="text-xs text-slate-400 italic">None recorded</span>}
                                    </div>
                                  </div>
                               </div>
                               <div className="mt-4 pt-4 border-t border-slate-200">
                                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Treatment Plan</h4>
                                 <p className="text-sm font-semibold text-slate-700">{rec.treatment_plan || 'No specific plan documented'}</p>
                               </div>
                             </div>
                          ))}
                        </div>
                      )}
                    </div>
                 )}

                 {/* GROWTH TAB */}
                 {activeTab === 'GROWTH' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800">Growth & Nutrition</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Z-Scores & measurements</p>
                        </div>
                        <button className="btn-secondary py-2 px-4 shadow-slate-200">
                          Log Metrics
                        </button>
                      </div>

                      {growthRecords.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <Scale sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                          <p className="font-bold text-sm">No growth records</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Weight (kg)</th>
                                <th className="px-4 py-3">Height (cm)</th>
                                <th className="px-4 py-3">Head Circ. (cm)</th>
                                <th className="px-4 py-3">WFA Z-Score</th>
                                <th className="px-4 py-3">HFA Z-Score</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {growthRecords.map(g => (
                                <tr key={g.id} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-semibold text-slate-600">{new Date(g.record_date).toLocaleDateString()}</td>
                                  <td className="px-4 py-3 font-black text-slate-800">{g.weight_kg}</td>
                                  <td className="px-4 py-3 font-bold text-slate-700">{g.height_cm || '—'}</td>
                                  <td className="px-4 py-3 font-bold text-slate-700">{g.head_circumference_cm || '—'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      g.z_score_weight_age < -2 ? 'bg-red-100 text-red-700' :
                                      g.z_score_weight_age > 2  ? 'bg-amber-100 text-amber-700' :
                                      'bg-emerald-100 text-emerald-700'
                                    }`}>{g.z_score_weight_age || 'N/A'}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      g.z_score_height_age < -2 ? 'bg-red-100 text-red-700' :
                                      g.z_score_height_age > 2  ? 'bg-amber-100 text-amber-700' :
                                      'bg-emerald-100 text-emerald-700'
                                    }`}>{g.z_score_height_age || 'N/A'}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                 )}

                 {/* DOSING CALCULATOR TAB */}
                 {activeTab === 'DOSING' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800">Weight-Based Medication Dosing</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Paediatric pharmacology safety</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-8 items-center max-w-2xl mx-auto">
                        <div className="space-y-4 flex-1 w-full">
                           <div>
                             <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Patient Weight (kg)</label>
                             <input type="number" 
                                className="input text-xl font-black w-full"
                                value={drugWeight} 
                                onChange={e => setDrugWeight(e.target.value)} 
                                placeholder="E.g. 15.5" 
                             />
                           </div>
                           <div>
                             <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Prescribed Dose (mg per kg)</label>
                             <input type="number" 
                                className="input text-xl font-black w-full"
                                value={drugDoseKg} 
                                onChange={e => setDrugDoseKg(e.target.value)} 
                                placeholder="E.g. 10" 
                             />
                           </div>
                        </div>

                        <div className="w-full md:w-px md:h-32 bg-slate-200"></div>

                        <div className="flex-1 w-full text-center">
                           <p className="text-xs font-black text-slate-400 tracking-widest uppercase mb-2">Total Computed Dose</p>
                           <div className="text-5xl font-black text-blue-600 tracking-tighter">
                             {drugWeight && drugDoseKg ? paediatricService.calculateDose(drugWeight, drugDoseKg) : '—'}
                             <span className="text-lg text-slate-400 ml-1">mg</span>
                           </div>
                           {(drugWeight && drugDoseKg) ? (
                             <p className="text-[10px] font-bold text-emerald-600 mt-3 flex items-center justify-center gap-1">
                               <Medication fontSize="small" /> Checked for {drugWeight} kg
                             </p>
                           ) : null}
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
