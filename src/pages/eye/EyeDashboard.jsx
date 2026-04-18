import React, { useState, useEffect } from 'react';
import { RemoveRedEye, Search, Visibility } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { alliedHealthService } from '../../services/allied_health';
import { toast } from 'react-toastify';

export default function EyeDashboard() {
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
    setSelectedPatient(patient);
    setSearch('');
    setPatients([]);
    setLoading(true);
    try {
       const res = await alliedHealthService.getEyeRecords(patient.id);
       setRecords(res);
    } catch (err) {
       toast.error('Failed to load optometry records');
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center">
              <RemoveRedEye fontSize="medium" className="text-sky-600" />
            </div>
            Eye Clinic
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Snellen Visual Acuity, Tonometry & Refraction</p>
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
              <p className="text-sm text-slate-500 mt-2">Search for a patient to open their optometry/ophthalmology chart.</p>
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
                     className="w-full px-5 py-4 hover:bg-sky-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
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
           <div className="card p-6 bg-gradient-to-br from-sky-600 to-indigo-800 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg">
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shadow-lg">
                 {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
               </div>
               <div>
                 <h2 className="text-2xl font-black">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                 <div className="flex items-center gap-3 mt-1.5 text-sky-100 text-sm font-semibold">
                   <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{selectedPatient.patient_no}</span>
                   <span>Age: {selectedPatient.age}</span>
                 </div>
               </div>
             </div>
             <div className="flex gap-3">
               <button onClick={() => setSelectedPatient(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20">
                 Close Chart
               </button>
             </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
             <div className="space-y-6">
               <div className="card bg-white p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                     <div>
                       <h3 className="text-lg font-black text-slate-800">Visual Acuity & Tonometry</h3>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Snellen fractions & IOP</p>
                     </div>
                     <button className="btn-primary py-2 px-4 shadow-sky-200 bg-sky-600 hover:bg-sky-700 text-sm">Add Results</button>
                  </div>
                  
                  {loading ? (
                    <div className="py-12 text-center text-slate-400 font-bold animate-pulse">Loading assessments...</div>
                  ) : records.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Visibility sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                      <p className="font-bold text-sm">No eye exams on record</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {records.map(r => (
                         <div key={r.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                            <p className="text-xs font-bold text-slate-500 mb-3">{new Date(r.visit_date).toLocaleDateString()}</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-3">
                                  <h4 className="text-[10px] uppercase font-black text-sky-600 tracking-widest">Right Eye (OD)</h4>
                                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                                     <div className="flex justify-between"><span className="text-slate-400 font-bold">Distance</span><span className="font-black text-slate-700">{r.va_distance_od || '-'}</span></div>
                                     <div className="flex justify-between"><span className="text-slate-400 font-bold">IOP</span><span className="font-black text-rose-500">{r.iop_od || '-'} mmHg</span></div>
                                  </div>
                               </div>
                               <div className="space-y-3">
                                  <h4 className="text-[10px] uppercase font-black text-indigo-600 tracking-widest">Left Eye (OS)</h4>
                                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                                     <div className="flex justify-between"><span className="text-slate-400 font-bold">Distance</span><span className="font-black text-slate-700">{r.va_distance_os || '-'}</span></div>
                                     <div className="flex justify-between"><span className="text-slate-400 font-bold">IOP</span><span className="font-black text-rose-500">{r.iop_os || '-'} mmHg</span></div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      ))}
                    </div>
                  )}
               </div>
             </div>

             <div className="space-y-6">
                <div className="card bg-white p-6">
                   <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                     <div>
                       <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">Autorefractor & Script</h3>
                     </div>
                     <button className="btn-secondary py-2 px-3 shadow-slate-200 text-sm">Update Script</button>
                  </div>
                  
                  {records.length > 0 && (records[0].refraction_od || records[0].refraction_os) ? (
                     <div className="bg-slate-800 text-white rounded-2xl p-5 font-mono text-sm overflow-hidden border border-slate-700">
                        <table className="w-full">
                           <thead>
                              <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-700">
                                 <th className="py-2 text-left">Eye</th>
                                 <th className="py-2 text-center">Sphere</th>
                                 <th className="py-2 text-center">Cyl</th>
                                 <th className="py-2 text-center">Axis</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-700/50">
                              <tr>
                                 <td className="py-3 text-sky-400 font-black">OD</td>
                                 <td className="py-3 text-center">{records[0].refraction_od?.sphere || '0.00'}</td>
                                 <td className="py-3 text-center">{records[0].refraction_od?.cylinder || '0.00'}</td>
                                 <td className="py-3 text-center">{records[0].refraction_od?.axis || '000'}</td>
                              </tr>
                              <tr>
                                 <td className="py-3 text-indigo-400 font-black">OS</td>
                                 <td className="py-3 text-center">{records[0].refraction_os?.sphere || '0.00'}</td>
                                 <td className="py-3 text-center">{records[0].refraction_os?.cylinder || '0.00'}</td>
                                 <td className="py-3 text-center">{records[0].refraction_os?.axis || '000'}</td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                  ) : (
                     <div className="text-center py-8">
                        <p className="text-slate-400 font-bold text-sm">No subjective refraction found</p>
                     </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
