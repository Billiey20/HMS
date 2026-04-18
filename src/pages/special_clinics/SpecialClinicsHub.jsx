import React, { useState, useEffect } from 'react';
import { DomainAdd, Search, AccessibilityNew, Sick, ChildCare, Psychology, Restaurant, ShowChart } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { specialClinicsService } from '../../services/special_clinics';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function SpecialClinicsHub() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [activeTab, setActiveTab] = useState('CCC'); // 'CCC', 'TB', 'MCH', 'MENTAL', 'NUTRITION'
  const [dataPayload, setDataPayload] = useState({
    ccc: [], cccLabs: [], tb: [], mch: [], mental: [], nutrition: []
  });
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
       const [ccc, cccLabs, tb, mch, mental, nutrition] = await Promise.all([
         specialClinicsService.getCCCRecords(patient.id),
         specialClinicsService.getCCCLabs(patient.id),
         specialClinicsService.getTBRecords(patient.id),
         specialClinicsService.getImmunizations(patient.id),
         specialClinicsService.getMentalHealthRecords(patient.id),
         specialClinicsService.getNutritionRecords(patient.id)
       ]);
       setDataPayload({ ccc, cccLabs, tb, mch, mental, nutrition });
    } catch (err) {
       toast.error('Failed to load clinic records');
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
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <DomainAdd fontSize="medium" className="text-indigo-600" />
            </div>
            Special Vertical Clinics
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">CCC, TB DOTS, MCH, Mental Health & Nutrition Programs</p>
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
              <p className="text-sm text-slate-500 mt-2">Search for a patient to view their specialized program enrollments.</p>
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
                     className="w-full px-5 py-4 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
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
          <div className="card p-6 bg-gradient-to-br from-indigo-600 to-blue-800 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg shadow-indigo-500/20">
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shadow-lg">
                 {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
               </div>
               <div>
                 <h2 className="text-2xl font-black">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                 <div className="flex items-center gap-3 mt-1.5 text-indigo-100 text-sm font-semibold">
                   <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{selectedPatient.patient_no}</span>
                   <span>{selectedPatient.age} yrs</span>
                   <span>{selectedPatient.gender}</span>
                 </div>
               </div>
             </div>
             <div className="flex gap-3">
               <button onClick={() => setSelectedPatient(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20">
                 Switch Patient
               </button>
             </div>
          </div>

          {/* Module Tabs mapped to specialized clinics */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
             {[
               { id: 'CCC', label: 'CCC (ART/HIV)', icon: <AccessibilityNew fontSize="small" className="mr-1.5"/> },
               { id: 'TB', label: 'TB DOTS', icon: <Sick fontSize="small" className="mr-1.5"/> },
               { id: 'MCH', label: 'MCH & Immunizations', icon: <ChildCare fontSize="small" className="mr-1.5"/> },
               { id: 'MENTAL', label: 'Mental Health', icon: <Psychology fontSize="small" className="mr-1.5"/> },
               { id: 'NUTRITION', label: 'Nutrition', icon: <Restaurant fontSize="small" className="mr-1.5"/> }
             ].map(t => (
               <button 
                 key={t.id}
                 onClick={() => setActiveTab(t.id)}
                 className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-black transition-all whitespace-nowrap ${
                   activeTab === t.id 
                     ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' 
                     : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                 }`}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>

          <div className="card bg-white p-6 md:p-8 min-h-[400px]">
             {loading ? (
               <div className="flex items-center justify-center h-40 text-slate-400 font-bold animate-pulse">Loading clinic dossiers...</div>
             ) : (
               <>
                 {/* CCC TAB */}
                 {activeTab === 'CCC' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800">Comprehensive Care Clinic (CCC)</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">NASCOP 257 & Viral Load Tracking</p>
                        </div>
                        <button className="btn-primary py-2 px-4 shadow-indigo-200">Enroll in CCC</button>
                      </div>
                      
                      {dataPayload.ccc.length === 0 ? (
                         <div className="text-center py-12 text-slate-400">
                          <AccessibilityNew sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                          <p className="font-bold text-sm">Patient not enrolled in CCC</p>
                        </div>
                      ) : (
                         <div className="grid md:grid-cols-2 gap-6">
                            <div className="card p-5 bg-indigo-50 border-indigo-100 space-y-3">
                               <h4 className="font-black text-indigo-800 border-b border-indigo-200 pb-2">Enrollment Profile</h4>
                               <div className="flex justify-between"><span className="text-slate-500 font-bold">UPI</span><span className="font-black text-indigo-900">{dataPayload.ccc[0].nascop_upi || 'Pending'}</span></div>
                               <div className="flex justify-between"><span className="text-slate-500 font-bold">WHO Stage</span><span className="font-black text-indigo-900">{dataPayload.ccc[0].who_stage}</span></div>
                               <div className="flex justify-between"><span className="text-slate-500 font-bold">Regimen</span><span className="font-black text-indigo-900">{dataPayload.ccc[0].current_regimen}</span></div>
                               <div className="flex justify-between"><span className="text-slate-500 font-bold">Status</span>
                                 <span className={`font-black ${dataPayload.ccc[0].status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>{dataPayload.ccc[0].status}</span>
                               </div>
                            </div>
                            
                            <div className="card p-5 border-slate-200">
                               <h4 className="font-black text-slate-800 border-b border-slate-100 pb-2 flex justify-between items-center">
                                  Viral Load & CD4 History
                                  <ShowChart fontSize="small" className="text-indigo-500"/>
                               </h4>
                               <div className="mt-3 space-y-3">
                                  {dataPayload.cccLabs.length === 0 ? <p className="text-sm text-slate-500 italic">No lab histories found</p> : 
                                     dataPayload.cccLabs.map(lab => (
                                        <div key={lab.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                                           <span className="font-bold text-slate-600">{new Date(lab.record_date).toLocaleDateString()}</span>
                                           <span><span className="text-slate-400 font-bold">CD4</span> <span className="font-black text-slate-800">{lab.cd4_count}</span></span>
                                           <span><span className="text-slate-400 font-bold">VL</span> <span className="font-black text-slate-800">{lab.viral_load_copies} cp/ml</span></span>
                                        </div>
                                     ))
                                  }
                               </div>
                            </div>
                         </div>
                      )}
                    </div>
                 )}

                 {/* TB DOTS TAB */}
                 {activeTab === 'TB' && (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800">TB DOTS Clinic</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">MOH 400 Register & GeneXpert</p>
                        </div>
                      </div>
                      {dataPayload.tb.length === 0 ? (
                         <div className="text-center py-12 text-slate-400">
                          <Sick sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                          <p className="font-bold text-sm">No TB DOTS records</p>
                        </div>
                      ) : (
                         <div className="space-y-4">
                            {dataPayload.tb.map(rec => (
                               <div key={rec.id} className="p-5 border border-slate-200 rounded-2xl bg-amber-50">
                                  <div className="flex justify-between items-center mb-3">
                                     <span className="text-xs font-black px-3 py-1 bg-amber-200 text-amber-800 rounded-full">{rec.disease_classification} TB</span>
                                     <span className={`text-xs font-black ${rec.treatment_outcome === 'Cured' ? 'text-emerald-600' : 'text-slate-600'}`}>{rec.treatment_outcome || 'Under Treatment'}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex justify-between pr-4"><span className="text-amber-800/60 font-bold">Registration #</span><span className="font-black text-amber-900">{rec.tb_registration_number}</span></div>
                                    <div className="flex justify-between"><span className="text-amber-800/60 font-bold">Patient Type</span><span className="font-black text-amber-900">{rec.patient_type}</span></div>
                                    <div className="flex justify-between pr-4"><span className="text-amber-800/60 font-bold">Regimen</span><span className="font-black text-amber-900">{rec.treatment_regimen}</span></div>
                                    <div className="flex justify-between"><span className="text-amber-800/60 font-bold">GeneXpert</span><span className="font-black text-amber-900">{rec.genexpert_results}</span></div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      )}
                    </div>
                 )}

                 {/* MCH TAB */}
                 {activeTab === 'MCH' && (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800">Child Welfare & Immunizations</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Vaccine Register</p>
                        </div>
                        <button className="btn-secondary py-2 px-4 shadow-slate-200">Record Vaccine</button>
                      </div>
                      
                      {dataPayload.mch.length === 0 ? (
                         <div className="text-center py-12 text-slate-400">
                          <ChildCare sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                          <p className="font-bold text-sm">No immunizations recorded</p>
                        </div>
                      ) : (
                         <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase">
                                 <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Vaccine</th>
                                    <th className="px-4 py-3">Dose</th>
                                    <th className="px-4 py-3">Batch/VVM</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {dataPayload.mch.map(v => (
                                    <tr key={v.id} className="hover:bg-slate-50">
                                       <td className="px-4 py-3 font-semibold text-slate-600">{new Date(v.date_administered).toLocaleDateString()}</td>
                                       <td className="px-4 py-3 font-black text-indigo-700">{v.vaccine_name}</td>
                                       <td className="px-4 py-3 font-bold text-slate-700">Dose {v.dose_number}</td>
                                       <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.batch_number} [{v.vvm_status}]</td>
                                    </tr>
                                 ))}
                              </tbody>
                            </table>
                         </div>
                      )}
                    </div>
                 )}

                 {/* MENTAL HEALTH TAB */}
                 {activeTab === 'MENTAL' && (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between border-b border-rose-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-rose-800">Psychiatric / Mental Health</h3>
                          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-1">MOH 510 & ICD-11 Diagnosis</p>
                        </div>
                      </div>
                      
                      {user?.role === 'social_worker' || user?.role === 'admin' || user?.role === 'doctor' ? (
                         dataPayload.mental.length === 0 ? (
                           <div className="text-center py-12 text-slate-400">
                            <Psychology sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                            <p className="font-bold text-sm">No mental health records on file</p>
                          </div>
                         ) : (
                           <div className="space-y-4">
                              {dataPayload.mental.map(m => (
                                 <div key={m.id} className="p-5 border border-rose-200 rounded-2xl bg-rose-50">
                                    <div className="flex justify-between items-center mb-2">
                                       <span className="font-black text-rose-900 text-lg">{m.icd11_diagnosis_code}</span>
                                       <span className="text-xs font-bold text-rose-600">{new Date(m.visit_date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mt-2">{m.clinical_notes}</p>
                                    <div className="mt-3 bg-white p-3 rounded-xl border border-rose-100 flex gap-2">
                                       <span className="text-xs font-black text-slate-400 uppercase">Rx</span>
                                       <span className="text-sm font-bold text-indigo-700">{m.medication_prescription}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                         )
                      ) : (
                         <div className="card bg-red-50 border-red-200 p-8 text-center text-red-800 font-bold">
                            Restricted Access. Your current generic role cannot access psychiatric records.
                         </div>
                      )}
                    </div>
                 )}

                 {/* NUTRITION TAB */}
                 {activeTab === 'NUTRITION' && (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-emerald-800">Clinical Nutrition</h3>
                          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">MUAC Tracking & Supplementary Feeding</p>
                        </div>
                      </div>
                       {dataPayload.nutrition.length === 0 ? (
                           <div className="text-center py-12 text-slate-400">
                            <Restaurant sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                            <p className="font-bold text-sm">No nutritional assessments</p>
                          </div>
                       ) : (
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {dataPayload.nutrition.map(n => (
                              <div key={n.id} className="p-4 border border-emerald-200 bg-emerald-50 rounded-2xl">
                                 <div className="flex justify-between items-center mb-2">
                                   <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                                     n.malnutrition_status === 'SAM' ? 'bg-red-200 text-red-800' :
                                     n.malnutrition_status === 'MAM' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
                                   }`}>{n.malnutrition_status}</span>
                                   <span className="text-xs font-bold text-slate-500">{new Date(n.record_date).toLocaleDateString()}</span>
                                 </div>
                                 <div className="space-y-1 mt-3">
                                   <p className="flex justify-between text-sm"><span className="text-slate-500 font-bold">MUAC</span><span className="font-black text-emerald-900">{n.muac_cm} cm</span></p>
                                   <p className="flex justify-between text-sm"><span className="text-slate-500 font-bold">RUTF Dispensed</span><span className="font-black text-emerald-900">{n.rutf_dispensed_sachets || 0}</span></p>
                                 </div>
                              </div>
                           ))}
                         </div>
                       )}
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
