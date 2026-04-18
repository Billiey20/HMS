import React, { useState, useEffect } from 'react';
import { Search, CleanHands, Healing, Assessment, AccessTime } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { alliedHealthService } from '../../services/allied_health';
import { toast } from 'react-toastify';

export default function DentalDashboard() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // FDI layout mapping
  const upperRight = [18,17,16,15,14,13,12,11];
  const upperLeft  = [21,22,23,24,25,26,27,28];
  const lowerRight = [48,47,46,45,44,43,42,41];
  const lowerLeft  = [31,32,33,34,35,36,37,38];

  const [toothData, setToothData] = useState({});
  const [selectedTooth, setSelectedTooth] = useState(null);

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
       const res = await alliedHealthService.getDentalRecords(patient.id);
       setRecords(res);
       if (res.length > 0 && res[0].fdi_32_array) {
          setToothData(res[0].fdi_32_array);
       } else {
          setToothData({});
       }
    } catch (err) {
       toast.error('Failed to load dental chart');
    } finally {
       setLoading(false);
    }
  };

  const handleToothClick = (tooth) => {
     setSelectedTooth(tooth);
  };

  // Utility to map a tooth status to a color for the visual chart
  const getToothColor = (tooth) => {
     const status = toothData[tooth];
     if (status === 'Decay') return 'bg-orange-500';
     if (status === 'Extracted') return 'bg-slate-800 text-white';
     if (status === 'Filled') return 'bg-cyan-500';
     if (status === 'Crown') return 'bg-purple-500';
     return 'bg-white border-slate-200';
  };

  const ToothRow = ({ label, teeth }) => (
     <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{label}</span>
        <div className="flex gap-1.5">
           {teeth.map(t => (
              <button 
                 key={t}
                 onClick={() => handleToothClick(t)}
                 className={`w-9 h-12 flex items-center justify-center rounded-md border-2 font-black transition-all ${getToothColor(t)} ${selectedTooth === t ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:border-slate-400'}`}
              >
                 {t}
              </button>
           ))}
        </div>
     </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">
              🦷
            </div>
            Dental Clinic
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Odontogram, Caries Assessment & Procedures</p>
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
              <p className="text-sm text-slate-500 mt-2">Search for a patient to open their dental odontogram.</p>
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
                     className="w-full px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
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
           <div className="card p-6 bg-slate-800 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg">
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center font-black text-2xl border border-white/20">
                 {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
               </div>
               <div>
                 <h2 className="text-2xl font-black">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                 <div className="flex items-center gap-3 mt-1.5 text-slate-300 text-sm font-semibold">
                   <span className="font-mono bg-black/30 px-2 py-0.5 rounded-md">{selectedPatient.patient_no}</span>
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

          <div className="grid lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
               <div className="card bg-white p-6 md:p-8 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-8">
                     <div>
                       <h3 className="text-xl font-black text-slate-800">Adult Odontogram (FDI Charting)</h3>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Interactive 32-Tooth array</p>
                     </div>
                     <button className="btn-primary py-2 px-4 shadow-slate-200">Save Chart Status</button>
                  </div>
                  
                  {loading ? (
                    <div className="py-12 text-center text-slate-400 font-bold animate-pulse">Loading charts...</div>
                  ) : (
                    <div className="space-y-8 overflow-x-auto pb-4">
                       {/* Upper Jaw */}
                       <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-4 w-max mx-auto">
                          <ToothRow label="Upper Right" teeth={upperRight} />
                          <div className="hidden md:block w-px bg-slate-200 h-16 mt-6"></div>
                          <ToothRow label="Upper Left" teeth={upperLeft} />
                       </div>
                       
                       <div className="h-px bg-slate-200 w-full max-w-2xl mx-auto"></div>
                       
                       {/* Lower Jaw */}
                       <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-4 w-max mx-auto">
                          <ToothRow label="Lower Right" teeth={lowerRight} />
                          <div className="hidden md:block w-px bg-slate-200 h-16 mt-6"></div>
                          <ToothRow label="Lower Left" teeth={lowerLeft} />
                       </div>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500">
                     <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-white border border-slate-300"></div> Healthy</span>
                     <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-orange-500"></div> Decay/Caries</span>
                     <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyan-500"></div> Filled/Restored</span>
                     <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-purple-500"></div> Crown</span>
                     <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-800"></div> Extracted/Missing</span>
                  </div>
               </div>
             </div>

             <div className="space-y-6">
                <div className="card bg-white p-6">
                   <h3 className="text-lg font-black text-slate-800 mb-2">Tooth Inspector</h3>
                   {!selectedTooth ? (
                      <div className="py-12 text-center">
                         <span className="text-6xl mb-4 block">🦷</span>
                         <p className="text-slate-400 font-bold">Select a tooth to view details</p>
                      </div>
                   ) : (
                      <div className="space-y-4 mt-4 text-center">
                         <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-800 mx-auto">
                           {selectedTooth}
                         </div>
                         <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Current Status</p>
                            <p className={`text-lg font-black mt-1 ${toothData[selectedTooth] ? 'text-slate-800' : 'text-slate-400'}`}>{toothData[selectedTooth] || 'Healthy'}</p>
                         </div>
                         <div className="grid grid-cols-2 gap-2 mt-4">
                            <button onClick={() => setToothData({...toothData, [selectedTooth]: 'Decay'})} className="p-2 border border-orange-200 bg-orange-50 text-orange-700 font-bold text-sm rounded-lg hover:border-orange-500">Mark Decay</button>
                            <button onClick={() => setToothData({...toothData, [selectedTooth]: 'Filled'})} className="p-2 border border-cyan-200 bg-cyan-50 text-cyan-700 font-bold text-sm rounded-lg hover:border-cyan-500">Mark Filled</button>
                            <button onClick={() => setToothData({...toothData, [selectedTooth]: 'Extracted'})} className="p-2 border border-slate-300 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-900">Extracted</button>
                            <button onClick={() => setToothData({...toothData, [selectedTooth]: null})} className="p-2 border border-slate-200 bg-white text-slate-500 font-bold text-sm rounded-lg hover:bg-slate-50">Clear Status</button>
                         </div>
                      </div>
                   )}
                </div>

                <div className="card bg-white p-6">
                   <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Healing fontSize="small" className="text-slate-400"/> Procedures</h3>
                   <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-slate-400 font-bold text-sm">No procedures billed today</p>
                      <button className="mt-3 text-indigo-600 font-bold text-sm hover:underline">+ Add CPT Procedure</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
