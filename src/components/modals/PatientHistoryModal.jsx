import React, { useState, useEffect } from 'react';
import {
   Close, Person, History, LocalHospital, Science,
   Medication, Description, ArrowDropDown, ArrowRight,
   TrendingFlat, Thermostat, Receipt
} from '@mui/icons-material';
import { patientService } from '../../services/patients';

export default function PatientHistoryModal({ patient, onClose }) {
   const [loading, setLoading] = useState(true);
   const [encounters, setEncounters] = useState([]);
   const [apiError, setApiError] = useState('');

   // State for Accordion expansions
   const [expandedEncounter, setExpandedEncounter] = useState(null);
   const [expandedEvent, setExpandedEvent] = useState(null);

   useEffect(() => {
      if (patient?.id) {
         loadHistoryData();
      }
   }, [patient]);

   const loadHistoryData = async () => {
      try {
         setApiError('');
         const data = await patientService.getFullHistory(patient.id);

         const errs = data.errors;
         if (errs?.vErr || errs?.aErr || errs?.vitErr || errs?.bErr || errs?.rErr) {
            setApiError(JSON.stringify(errs, null, 2));
         }

         // We will map data.visits and data.admissions into a unified "Encounters" array.
         const builtEncounters = [];

         // 1. Process OPD Visits (Outpatient, FollowUp, Walk-in, etc)
         (data.visits || []).forEach(v => {
            const events = [];

            // Triage Vitals 
            // Notice: `vitals_records` might be independently queried if it doesn't have opd_visit_id, 
            // but let's map loosely by finding vitals close in time, OR we assume data.vitals is flat.
            // For accurate Encounter->Event mappings, we gather all matching foreign keys.
            const vVitals = (data.vitals || []).filter(vit => vit.opd_visit_id === v.id ||
               (new Date(vit.recorded_at) >= new Date(v.created_at) && (!v.closed_at || new Date(vit.recorded_at) <= new Date(v.closed_at))));

            vVitals.forEach(vit => {
               events.push({
                  id: vit.id, type: 'triage', time: vit.recorded_at, title: 'Triage / Vitals',
                  data: vit
               });
            });

            // Consultations
            (v.consultations || []).forEach(c => {
               events.push({
                  id: c.id, type: 'consultation', time: c.created_at, title: 'Consultation',
                  data: c
               });
            });

            // Prescriptions: Map to the visit level instead of nesting
            const vPrescriptions = (data.prescriptions || []).filter(rx => rx.visit_id === v.id);
            vPrescriptions.forEach(rx => {
               events.push({
                  id: rx.id, type: 'pharmacy', time: rx.prescribed_at || rx.created_at, title: 'Prescription Added',
                  data: rx
               });
            });

            // Lab Orders
            (v.lab_orders || []).forEach(lo => {
               events.push({
                  id: lo.id, type: 'lab', time: lo.created_at, title: 'Laboratory Request',
                  data: lo
               });
            });

            // Bills
            const vBills = (data.bills || []).filter(b => b.visit_id === v.id);
            vBills.forEach(b => {
               events.push({
                  id: b.id, type: 'billing', time: b.created_at, title: 'Billing Generation',
                  data: b
               });
            });

            // Admission Recommendation (Status based)
            if (v.status === 'awaiting_admission') {
               events.push({
                  id: `${v.id}-adm-req`,
                  type: 'admission',
                  time: v.updated_at || v.created_at,
                  title: 'Recommended for Admission',
                  data: { isRecommendation: true, info: v.presenting_complaint }
               });
            }

            builtEncounters.push({
               id: v.id,
               type: v.visit_type || 'Outpatient',
               summary: v.status === 'completed' ? 'Completed Visit' : 'Active Encounter',
               start_time: v.created_at,
               status: v.status,
               events: events.sort((a, b) => new Date(b.time) - new Date(a.time)) // newest event first
            });
         });

         // 2. Process Admissions (IPD)
         (data.admissions || []).forEach(a => {
            const events = [];

            // Admission Event
            events.push({
               id: `${a.id}-adm`, type: 'admission', time: a.admitted_at, title: 'Patient Admitted to Ward',
               data: a
            });

            // Nursing Notes (assume clinical_notes exists mapped)
            (a.clinical_notes || []).forEach(cn => {
               events.push({
                  id: cn.id, type: 'clinical_note', time: cn.created_at, title: 'Nursing / Doctor Note',
                  data: cn
               });
            });

            // Vitals from ward
            (a.vitals_records || []).forEach(vit => {
               events.push({
                  id: vit.id, type: 'triage', time: vit.recorded_at, title: 'Ward Vitals Round',
                  data: vit
               });
            });

            builtEncounters.push({
               id: a.id,
               type: 'Inpatient (IPD)',
               summary: `Admitted to ${a.wards?.name}`,
               start_time: a.admitted_at,
               status: a.status,
               events: events.sort((a, b) => new Date(b.time) - new Date(a.time))
            });
         });

         // Sort all encounters by date descending
         builtEncounters.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

         // Auto-expand the most recent encounter if it exists
         if (builtEncounters.length > 0) {
            setExpandedEncounter(builtEncounters[0].id);
         }

         setEncounters(builtEncounters);
         setLoading(false);
      } catch (e) {
         console.error(e);
         setLoading(false);
      }
   };

   const toggleEncounter = (encId) => {
      if (expandedEncounter === encId) setExpandedEncounter(null);
      else setExpandedEncounter(encId);
   };

   const toggleEvent = (eventId) => {
      if (expandedEvent === eventId) setExpandedEvent(null);
      else setExpandedEvent(eventId);
   };

   const renderEventDetails = (event) => {
      const { type, data } = event;

      if (type === 'triage') {
         return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-sm border border-slate-200">
               <div><p className="text-slate-500 text-xs uppercase font-bold">Temp</p><p className="font-semibold text-slate-800">{data.temperature || '—'} °C</p></div>
               <div><p className="text-slate-500 text-xs uppercase font-bold">Pulse</p><p className="font-semibold text-slate-800">{data.pulse || '—'} bpm</p></div>
               <div><p className="text-slate-500 text-xs uppercase font-bold">BP</p><p className="font-semibold text-slate-800">{data.bp_systolic}/{data.bp_diastolic} mmHg</p></div>
               <div><p className="text-slate-500 text-xs uppercase font-bold">Weight</p><p className="font-semibold text-slate-800">{data.weight || '—'} kg</p></div>
               {data.notes && <div className="col-span-full mt-2"><p className="text-slate-500 text-xs uppercase font-bold">Notes</p><p className="italic text-slate-700">{data.notes}</p></div>}
            </div>
         );
      }

      if (type === 'consultation') {
         return (
            <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl text-sm border border-blue-100">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <p className="text-blue-500 text-xs uppercase font-bold tracking-wider mb-1">Diagnosis</p>
                     <p className="font-black text-slate-800">{data.diagnosis || 'None specified'}</p>
                  </div>
               </div>
               <div>
                  <p className="text-blue-500 text-xs uppercase font-bold tracking-wider mb-1">Clinical Notes & Examination</p>
                  <p className="font-semibold text-slate-700 whitespace-pre-wrap">{data.clinical_notes || 'No notes available'}</p>
               </div>
            </div>
         );
      }

      if (type === 'lab') {
         return (
            <div className="bg-violet-50/50 p-4 rounded-xl text-sm border border-violet-100 space-y-3">
               <div className="flex justify-between items-center mb-2">
                  <p className="text-violet-500 text-xs uppercase font-bold tracking-wider">Ordered Tests</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${data.status === 'completed' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                     {data.status}
                  </span>
               </div>
               <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                  {data.lab_order_items?.map(item => (
                     <li key={item.id}>
                        {item.test_name || 'Unknown Test'}
                        {item.result && <span className="ml-2 font-black text-violet-700">➡ {item.result}</span>}
                     </li>
                  ))}
                  {(!data.lab_order_items || data.lab_order_items.length === 0) && <li>No tests found</li>}
               </ul>
               {data.results_summary && (
                  <div className="mt-2 pt-2 border-t border-violet-200">
                     <p className="text-violet-500 text-xs uppercase font-bold mb-1">Pathologist Summary</p>
                     <p className="italic text-slate-700">{data.results_summary}</p>
                  </div>
               )}
            </div>
         );
      }

      if (type === 'pharmacy') {
         return (
            <div className="bg-emerald-50/50 p-4 rounded-xl text-sm border border-emerald-100">
               <p className="text-emerald-500 text-xs uppercase font-bold tracking-wider mb-2">Prescribed Medication</p>
               <div className="space-y-2">
                  {data.prescription_items?.map(item => (
                     <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-emerald-100 shadow-sm">
                        <div>
                           <p className="font-bold text-slate-800">{item.drug_catalog?.name || item.drug_name}</p>
                           <p className="text-xs text-slate-500">{item.dosage} · {item.frequency} · {item.duration}</p>
                        </div>
                        <p className="font-black text-emerald-700">{item.quantity} units</p>
                     </div>
                  ))}
                  {(!data.prescription_items || data.prescription_items.length === 0) && <p className="text-slate-500">No items prescribed.</p>}
               </div>
            </div>
         );
      }

      if (type === 'admission') {
         if (data.isRecommendation) {
            return (
               <div className="bg-rose-50/50 p-4 rounded-xl text-sm border border-rose-100">
                  <p className="text-rose-500 text-xs uppercase font-bold tracking-wider mb-2">Admission Request</p>
                  <p className="font-bold text-slate-800">Status: Awaiting Bed Assignment</p>
                  {data.info && data.info.includes('[ADM REQ:') && (
                     <p className="mt-2 text-slate-600 italic">Target Ward: {data.info.split('[ADM REQ:')[1].replace(']', '').trim()}</p>
                  )}
               </div>
            );
         }
         return (
            <div className="bg-amber-50/50 p-4 rounded-xl text-sm border border-amber-100">
               <p className="text-amber-500 text-xs uppercase font-bold tracking-wider mb-2">Admission Details</p>
               <p className="font-bold text-slate-800">Ward: {data.wards?.name || 'N/A'}</p>
               <p className="text-slate-600">Bed: {data.bed_no || 'Pending'}</p>
               {data.discharge_date && <p className="mt-2 font-bold text-slate-700">Discharged: {new Date(data.discharge_date).toLocaleString()}</p>}
            </div>
         );
      }

      if (type === 'billing') {
         return (
            <div className="bg-slate-50 flex items-center gap-3 p-4 rounded-xl text-sm border border-slate-200">
               <Receipt className="text-slate-400" />
               <div>
                  <p className="font-bold text-slate-800">Bill Total: KES {data.total_amount}</p>
                  <p className="text-slate-500 text-xs">Status: <span className="uppercase">{data.status}</span></p>
               </div>
            </div>
         );
      }

      return <div className="p-4 bg-slate-50 rounded-xl text-sm italic text-slate-500">Details not available for this event type.</div>;
   };

   if (!patient) return null;

   return (
      <div className="fixed inset-0 z-50 flex flex-col items-center p-0 md:p-6 bg-slate-900/80 backdrop-blur-sm sm:justify-center overflow-hidden">
         <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

            {/* Core Header (Primary Theme) */}
            <div className="bg-primary-600 px-6 py-6 border-b border-primary-500 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                     <Person className="text-white" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-white tracking-tight">{patient.first_name} {patient.last_name}</h2>
                     <p className="text-xs font-bold text-primary-100 uppercase tracking-widest">{patient.patient_no} · {patient.age}Y · {patient.gender}</p>
                  </div>
               </div>
               <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center transition-all bg-white/10 border border-white/10 text-white">
                  <Close />
               </button>
            </div>

            {/* Timeline Content Engine */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 no-scrollbar relative">
               {loading ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                     <History className="animate-spin-slow mb-4" sx={{ fontSize: 48 }} />
                     <p className="font-black uppercase tracking-widest text-xs">Reconstructing Event History...</p>
                  </div>
               ) : apiError ? (
                  <div className="max-w-3xl mx-auto space-y-4">
                     <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                        <h3 className="text-red-800 font-bold mb-2">Database Schema Error Detected</h3>
                        <pre className="text-xs text-red-600 overflow-x-auto whitespace-pre-wrap font-mono uppercase tracking-widest">
                           {apiError}
                        </pre>
                     </div>
                  </div>
               ) : (
                  <div className="max-w-3xl mx-auto space-y-4">

                     {encounters.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                           <History sx={{ fontSize: 64 }} className="mb-4 opacity-20" />
                           <p className="font-bold">No visits from this patient yet.</p>
                        </div>
                     )}

                     {/* Level 1: Encounters List */}
                     {encounters.map((encounter) => {
                        const isExpandedEnc = expandedEncounter === encounter.id;

                        return (
                           <div key={encounter.id} className={`bg-white rounded-2xl border transition-shadow ${isExpandedEnc ? 'border-primary-300 shadow-md ring-1 ring-primary-100' : 'border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                              {/* Encounter Header (Clickable) */}
                              <div onClick={() => toggleEncounter(encounter.id)} className="px-6 py-4 cursor-pointer flex items-center justify-between group">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpandedEnc ? 'bg-primary-600' : 'bg-slate-100 group-hover:bg-primary-100'}`}>
                                       <LocalHospital className={isExpandedEnc ? 'text-white' : 'text-slate-500 group-hover:text-primary-600'} fontSize="small" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold tracking-widest text-slate-400 mb-0.5">Visit // {encounter.status}</p>
                                       <h4 className="text-lg font-black text-slate-800">{encounter.type}</h4>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4 text-right">
                                    <div className="hidden sm:block">
                                       <p className="font-bold text-slate-700">{new Date(encounter.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                       <p className="text-xs text-slate-400 font-semibold">{new Date(encounter.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <ArrowDropDown className={`text-slate-400 transition-transform ${isExpandedEnc ? 'rotate-180' : ''}`} />
                                 </div>
                              </div>

                              {/* Level 2: Events List (Revealed if Encounter expands) */}
                              {isExpandedEnc && (
                                 <div className="border-t border-slate-100 bg-slate-50/50 p-4 md:p-6 pb-8">
                                    {encounter.events.length === 0 ? (
                                       <p className="text-center text-sm text-slate-400 py-4 italic">No specific events recorded during this visit.</p>
                                    ) : (
                                       <div className="relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:bg-slate-200">
                                          <div className="space-y-6 relative">
                                             {encounter.events.map((evt) => {
                                                const isExpandedEvt = expandedEvent === evt.id;

                                                // Map icons and colors
                                                const EVENT_ICONS = {
                                                   triage: { icon: Thermostat, color: 'text-emerald-500', bg: 'bg-emerald-100' },
                                                   consultation: { icon: Person, color: 'text-blue-500', bg: 'bg-blue-100' },
                                                   lab: { icon: Science, color: 'text-violet-500', bg: 'bg-violet-100' },
                                                   pharmacy: { icon: Medication, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                                                   billing: { icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-100' },
                                                   admission: { icon: LocalHospital, color: 'text-rose-500', bg: 'bg-rose-100' },
                                                   clinical_note: { icon: Description, color: 'text-sky-500', bg: 'bg-sky-100' },
                                                };

                                                const style = EVENT_ICONS[evt.type] || { icon: Description, color: 'text-slate-500', bg: 'bg-slate-100' };
                                                const IconCmp = style.icon;

                                                return (
                                                   <div key={evt.id} className="relative flex items-start">

                                                      <div className="absolute left-0 mt-[1.2rem] w-10 h-10 rounded-full bg-white border-2 border-slate-200 z-10 flex items-center justify-center shadow-sm -ml-0.5">
                                                         <div className="w-4 h-4 rounded-full bg-slate-300" />
                                                      </div>

                                                      {/* Row Container (De-containerized) */}
                                                      <div className="ml-14 w-full group">
                                                         <div className="w-full bg-transparent hover:bg-slate-100/70 rounded-xl transition-all duration-300">

                                                            {/* Abstract Event Header (Row Style) */}
                                                            <div onClick={() => toggleEvent(evt.id)} className="p-4 cursor-pointer flex items-center gap-3">
                                                               <div className={`w-8 h-8 shrink-0 rounded-lg ${style.bg} flex items-center justify-center shadow-sm`}>
                                                                  <IconCmp className={style.color} sx={{ fontSize: 16 }} />
                                                               </div>
                                                               <div className="flex-1 flex items-center justify-between min-w-0 pr-2">
                                                                  <div>
                                                                     <h5 className="font-bold text-slate-800 text-sm truncate">{evt.title}</h5>
                                                                     <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                                                        {new Date(evt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                     </p>
                                                                  </div>
                                                                  <ArrowRight className={`text-slate-300 shrink-0 transition-transform ${isExpandedEvt ? 'rotate-90 text-primary-500' : 'group-hover:text-slate-400'}`} fontSize="small" />
                                                               </div>
                                                            </div>

                                                            {/* Level 3: Event Deep-Dive Details */}
                                                            {isExpandedEvt && (
                                                               <div className="px-4 pb-5 pt-1 animate-in slide-in-from-top-1 duration-200">
                                                                  {renderEventDetails(evt)}
                                                               </div>
                                                            )}

                                                         </div>
                                                      </div>
                                                   </div>
                                                );
                                             })}
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        );
                     })}

                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
