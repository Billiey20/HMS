import React, { useState, useEffect, useRef } from 'react';
import {
   Close, Person, History, LocalHospital, Science,
   Medication, Description, ArrowDropDown, ArrowRight,
   TrendingFlat, Thermostat, Receipt, EventNote, Visibility
} from '@mui/icons-material';
import { patientService } from '../../services/patients';
import LabReportPreview from './LabReportPreview';

/**
 * WindowsStylePopup: A themed modal that opens relative to a target element.
 */
function WindowsStylePopup({ data, onClose, position }) {
   if (!data) return null;

   return (
      <div
         className="fixed z-[100] bg-[#f8f9fa] border border-slate-300 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.2),0_10px_15px_-6px_rgba(0,0,0,0.1)] min-w-[340px] max-w-[500px] rounded-xl overflow-hidden animate-in fade-in zoom-in duration-150"
         style={{
            top: Math.min(position.y + 10, window.innerHeight - 550),
            left: Math.min(position.x + 10, window.innerWidth - 380),
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
         }}
      >
         {/* Modern Header Style */}
         <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100/80">
            <div className="flex items-center gap-2.5">
               <div className="w-2.5 h-2.5 bg-primary-600 rounded-full" />
               <span className="text-xs font-bold text-slate-800 tracking-tight">{data.title}</span>
            </div>
            <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600">
               <Close sx={{ fontSize: 16 }} />
            </button>
         </div>

         {/* Content Area - Increased Max Height */}
         <div className="p-6 bg-white max-h-[650px] md:max-h-[70vh] overflow-y-auto custom-scrollbar">
            {data.content}
         </div>

         {/* Footer / Status Bar */}
         <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 font-bold flex justify-between tracking-widest">
            <span className="flex items-center gap-1.5 capitalize">
               <Person sx={{ fontSize: 12 }} />
               By {data.staff || 'System'}
            </span>
            <span>{data.displayTime}</span>
         </div>
      </div>
   );
}

export default function PatientHistoryModal({ patient, onClose }) {
   const [loading, setLoading] = useState(true);
   const [visits, setVisits] = useState([]);
   const [apiError, setApiError] = useState('');

   // UI State
   const [expandedVisit, setExpandedVisit] = useState(null);
   const [expandedEvent, setExpandedEvent] = useState(null);
   const [popupData, setPopupData] = useState(null);
   const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
   const [labPreview, setLabPreview] = useState(null);

   useEffect(() => {
      if (patient?.id) {
         loadHistoryData();
      }
   }, [patient]);

   const formatStaffName = (staffObj, defaultVal = 'RECEPTION') => {
      if (!staffObj || !staffObj.first_name) return defaultVal;
      const name = staffObj.first_name;
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
   };

   const formatMinimalTime = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
   };

   const capitalizeFirst = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
   };

   const handleRecordClick = (e, record) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setPopupPos({ x: rect.left, y: rect.top + rect.height });
      setPopupData({
         ...record,
         displayTime: formatMinimalTime(record.time)
      });
   };

   const loadHistoryData = async () => {
      try {
         setApiError('');
         const data = await patientService.getFullHistory(patient.id);

         const builtVisits = [];
         const patientName = `${patient.first_name} ${patient.last_name}`;

         // 1. Process OPD Visits (Aggregated)
         (data.visits || []).forEach(v => {
            const events = [];

            // Registration Event (Associated with this visit)
            const regStaffName = formatStaffName(v.patients?.staff, 'STAFF');
            events.push({
               id: `reg-${v.id}`,
               type: 'registration',
               title: 'Registered at reception',
               time: v.patients?.created_at || v.created_at,
               staff: regStaffName,
               whats: [{
                  id: `what-reg-${v.id}`,
                  title: 'Primary identity records',
                  records: [{
                     id: `rec-reg-${v.id}`,
                     title: 'Patient Information',
                     time: v.patients?.created_at || v.created_at,
                     staff: regStaffName,
                     content: (
                        <div className="space-y-3.5 text-[11px] leading-relaxed text-slate-600 font-medium">
                           {/* 6-Line Structured Layout */}
                           <div className="flex items-center gap-6">
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Patient Name</p>
                                 <p className="font-bold text-slate-900 truncate">{patientName}</p>
                              </div>
                              <div className="w-16">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Age</p>
                                 <p className="font-bold text-slate-900">{patient.age}Y</p>
                              </div>
                              <div className="w-20">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Gender</p>
                                 <p className="font-bold text-slate-900">{patient.gender}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Nationality</p>
                                 <p className="font-bold text-slate-900">{patient.nationality || 'KENYAN'}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">ID Number</p>
                                 <p className="font-bold text-slate-900">{patient.national_id || patient.id_number || 'NOT SET'}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Telephone</p>
                                 <p className="font-bold text-slate-900">{patient.phone || 'NOT SET'}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Registration Mode</p>
                                 <span className={`inline-flex items-center px-1.5 py-0.5 rounded uppercase font-black text-[9px] ${patient.payment_mode === 'SHA' || patient.payment_mode === 'PHC' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {patient.payment_mode || 'Private'}
                                 </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">SHA Number</p>
                                 <p className="font-bold text-slate-900 font-mono tracking-tight text-xs">{patient.sha_number || 'N/A'}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">CR Number</p>
                                 <p className="font-bold text-slate-900 font-mono tracking-tight text-xs">{patient.cr_number || 'N/A'}</p>
                              </div>
                           </div>

                           <div className="pt-2 border-t border-slate-50">
                              <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Email Address</p>
                              <p className="font-bold text-slate-900">{patient.email || 'NOT SET'}</p>
                           </div>

                           <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
                              <div className="flex-1">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Race</p>
                                 <p className="font-bold text-slate-900">{patient.race || 'AFRICAN'}</p>
                              </div>
                              <div className="flex-1">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Religion</p>
                                 <p className="font-bold text-slate-900">{patient.religion || 'CHRISTIAN'}</p>
                              </div>
                              <div className="flex-1">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Marital Status</p>
                                 <p className="font-bold text-slate-900">{patient.marital_status || 'NOT SET'}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
                              <div className="flex-1">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Occupation</p>
                                 <p className="font-bold text-slate-900">{patient.occupation || 'NOT SET'}</p>
                              </div>
                              <div className="flex-1">
                                 <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Location</p>
                                 <p className="font-bold text-slate-900">{patient.location || 'NOT SET'}</p>
                              </div>
                           </div>

                           <div className="pt-2 border-t border-slate-50">
                              <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-tight">Visit Type</p>
                              <p className="font-bold text-primary-700">{v.visit_type || 'Walk-In'}</p>
                           </div>
                        </div>
                     )
                  }]
               }]
            });

            // Triage Event (Aggregated from opd_visits or matching vitals)
            const triageStaffName = formatStaffName(v.staff, 'NURSE');
            if (v.temperature || v.pulse || v.bp_systolic) {
               events.push({
                  id: `triage-${v.id}`,
                  type: 'triage',
                  title: 'Went to triage',
                  time: v.check_in_time || v.created_at,
                  staff: triageStaffName,
                  whats: [{
                     id: `what-triage-${v.id}`,
                     title: 'Vitals assessment',
                     records: [{
                        id: `rec-triage-${v.id}`,
                        title: 'Vital records',
                        time: v.check_in_time || v.created_at,
                        staff: triageStaffName,
                        content: (
                           <div className="grid grid-cols-2 gap-y-4 text-[11px] font-medium leading-tight">
                              <div><p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Temp</p><p className="font-bold text-slate-900">{v.temperature || '--'} °C</p></div>
                              <div><p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Pulse</p><p className="font-bold text-slate-900">{v.pulse || '--'} bpm</p></div>
                              <div><p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">BP</p><p className="font-bold text-slate-900">{v.bp_systolic || '--'}/{v.bp_diastolic || '--'} mmHg</p></div>
                              <div><p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Weight</p><p className="font-bold text-slate-900">{v.weight_kg || '--'} kg</p></div>
                              {v.presenting_complaint && <div className="col-span-2 pt-3 mt-1 border-t border-slate-100 italic text-slate-500 font-normal">"{v.presenting_complaint}"</div>}
                           </div>
                        )
                     }]
                  }]
               });
            }

            // Consultations group
            (v.consultations || []).forEach(c => {
               const docName = formatStaffName(c.staff, 'DOCTOR');
               let exam = {}; try { exam = c.examination_findings ? JSON.parse(c.examination_findings) : {}; } catch(e){}

               events.push({
                  id: `cons-${c.id}`,
                  type: 'consultation',
                  title: 'Clinical consultation',
                  time: c.created_at,
                  staff: docName,
                  whats: [
                     ...(exam.general || exam.systemic || exam.other ? [{
                        id: `what-exam-${c.id}`,
                        title: 'Physical examination',
                        records: [{
                           id: `rec-exam-${c.id}`,
                           title: 'Examination notes',
                           time: c.created_at,
                           staff: docName,
                           content: (
                              <div className="space-y-4 text-[11px] leading-relaxed">
                                 {exam.general && <div><p className="text-[9px] uppercase font-black text-primary-600 mb-0.5">General Examination</p><p className="font-medium text-slate-700 whitespace-pre-wrap">{exam.general}</p></div>}
                                 {exam.systemic && <div><p className="text-[9px] uppercase font-black text-primary-600 mb-0.5">Systemic Examination</p><p className="font-medium text-slate-700 whitespace-pre-wrap">{exam.systemic}</p></div>}
                                 {exam.other && <div><p className="text-[9px] uppercase font-black text-primary-600 mb-0.5">Other Findings</p><p className="font-medium text-slate-700 whitespace-pre-wrap">{exam.other}</p></div>}
                              </div>
                           )
                        }]
                     }] : (c.clinical_notes ? [{
                        id: `what-notes-${c.id}`,
                        title: 'Clinical notes',
                        records: [{
                           id: `rec-notes-${c.id}`,
                           title: 'Doctor notes',
                           time: c.created_at,
                           staff: docName,
                           content: <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-slate-700 font-medium">{c.clinical_notes}</p>
                        }]
                     }] : [])),
                     ...(c.diagnosis ? [{
                        id: `what-diag-${c.id}`,
                        title: 'Diagnosis',
                        records: [{
                           id: `rec-diag-${c.id}`,
                           title: 'Clinical impression',
                           time: c.created_at,
                           staff: docName,
                           content: <p className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100">{c.diagnosis}</p>
                        }]
                     }] : [])
                  ]
               });
            });

            // Labs group
            (v.lab_orders || []).forEach(lo => {
               const loStaff = formatStaffName(lo.staff, 'DOCTOR');
               events.push({
                  id: `lab-${lo.id}`,
                  type: 'lab',
                  title: 'Laboratory request',
                  time: lo.created_at,
                  staff: loStaff,
                  whats: [{
                     id: `what-lab-${lo.id}`,
                     title: 'Ordered tests',
                     records: (lo.lab_order_items || []).map(item => ({
                        id: `rec-lab-${item.id}`,
                        title: item.test_name,
                        time: item.completed_at || lo.created_at,
                        staff: loStaff,
                        content: (
                           <div className="text-[11px] font-medium space-y-4">
                              <p className="font-black text-violet-700 tracking-tight text-center text-sm border-b border-violet-100 pb-2">{item.test_name}</p>
                              <div className="flex justify-between items-center py-1">
                                 <span className="text-slate-400 font-bold uppercase text-[9px]">Status</span>
                                 <span className={`uppercase text-[9px] font-black px-2 py-0.5 rounded-md ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                              </div>
                              {item.status === 'completed' ? (
                                 <button onClick={() => setLabPreview({ ...item, lab_orders: { patients: v.patients, ordered_at: lo.created_at, ordered_by: lo.ordered_by, urgency: lo.urgency } })}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95">
                                    <Visibility sx={{ fontSize: 16 }} /> View Full Report
                                 </button>
                              ) : (
                                 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 italic">Processing results in laboratory…</div>
                              )}
                           </div>
                        )
                     }))
                  }]
               });
            });

            // Billing group (associated with visit)
            const vBills = (data.bills || []).filter(b => b.visit_id === v.id);
            vBills.forEach(b => {
               const billedBy = formatStaffName(b.staff, 'BILLING');
               events.push({
                  id: `bill-${b.id}`,
                  type: 'billing',
                  title: 'Billed / financial actions',
                  time: b.created_at,
                  staff: billedBy,
                  whats: [{
                     id: `what-bill-${b.id}`,
                     title: 'Invoice details',
                     records: [{
                        id: `rec-bill-${b.id}`,
                        title: `Invoice #${b.bill_no || b.id.slice(0, 8)}`,
                        time: b.created_at,
                        staff: billedBy,
                        content: (
                           <div className="text-[11px] font-medium space-y-4">
                              <div className="flex justify-between items-center">
                                 <p className="text-[9px] uppercase font-black text-slate-400 tracking-tight">Total Amount</p>
                                 <p className="font-black text-slate-900 text-sm">KES {b.total_amount}</p>
                              </div>
                              <div className="flex justify-between items-center py-2 border-y border-slate-50">
                                 <p className="text-[9px] uppercase font-black text-slate-400 tracking-tight">Status</p>
                                 <span className="uppercase text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">{b.status}</span>
                              </div>
                           </div>
                        )
                     }]
                  }]
               });
            });

            builtVisits.push({
               id: v.id,
               type: v.visit_type || 'Walk-In OPD',
               start_time: v.created_at,
               end_time: v.status === 'completed' ? v.updated_at : null,
               status: v.status,
               events: events.sort((a, b) => new Date(a.time) - new Date(b.time))
            });
         });

         // 2. Process IPD Admissions (Grouped)
         (data.admissions || []).forEach(a => {
            const events = [];
            const admStaff = formatStaffName(a.admitting_staff, 'DOCTOR');

            events.push({
               id: `adm-${a.id}`,
               type: 'admission',
               title: 'Patient admitted to ward',
               time: a.admitted_at,
               staff: admStaff,
               whats: [{
                  id: `what-adm-${a.id}`,
                  title: 'Ward placement',
                  records: [{
                     id: `rec-adm-${a.id}`,
                     title: 'Admission summary',
                     time: a.admitted_at,
                     staff: admStaff,
                     content: (
                        <div className="text-[11px] font-medium space-y-3.5">
                           <div className="grid grid-cols-2 gap-4">
                              <div><p className="text-[9px] uppercase font-black text-slate-400 mb-0.5 tracking-tight">Ward</p><p className="font-bold text-slate-900">{a.wards?.name}</p></div>
                              <div><p className="text-[9px] uppercase font-black text-slate-400 mb-0.5 tracking-tight">Diagnosis</p><p className="font-bold text-slate-900 truncate">{a.admitting_diagnosis}</p></div>
                           </div>
                        </div>
                     )
                  }]
               }]
            });

            // IPD Vitals
            (a.vitals_records || []).forEach(vit => {
               const nurse = formatStaffName(vit.staff, 'NURSE');
               events.push({
                  id: `vit-ipd-${vit.id}`,
                  type: 'triage',
                  title: 'Routine vitals recorded',
                  time: vit.recorded_at,
                  staff: nurse,
                  whats: [{
                     id: `what-vit-ipd-${vit.id}`,
                     title: 'Vitals chart',
                     records: [{
                        id: `rec-vit-ipd-${vit.id}`,
                        title: 'Vitals record',
                        time: vit.recorded_at,
                        staff: nurse,
                        content: <p className="text-[11px] font-medium">Temp: {vit.temperature} °C | Pulse: {vit.pulse} bpm | BP: {vit.bp_systolic}/{vit.bp_diastolic}</p>
                     }]
                  }]
               });
            });

            builtVisits.push({
               id: a.id,
               type: 'Inpatient (IPD)',
               start_time: a.admitted_at,
               end_time: a.status === 'discharged' ? a.discharged_at : null,
               status: a.status,
               events: events.sort((a, b) => new Date(a.time) - new Date(b.time))
            });
         });

         setVisits(builtVisits.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)));
         setLoading(false);
      } catch (e) {
         console.error(e);
         setApiError(e.message);
         setLoading(false);
      }
   };

   if (!patient) return null;

   return (
      <div className="fixed inset-0 z-50 flex flex-col items-center p-0 md:p-6 bg-slate-900/80 backdrop-blur-sm sm:justify-center overflow-hidden">
         <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:w-[95%] md:max-w-7xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

            {/* TOP BAR */}
            <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                     <Person className="text-slate-500" sx={{ fontSize: 18 }} />
                  </div>
                  <div>
                     <h2 className="text-sm font-bold text-slate-800 leading-none">{patient.first_name} {patient.last_name}</h2>
                     <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{patient.patient_no} · {patient.age}Y · {patient.gender}</p>
                  </div>
               </div>
               <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-all text-slate-400">
                  <Close sx={{ fontSize: 20 }} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#fafafa] p-4 md:p-8 no-scrollbar">
               {loading ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                     <History className="animate-spin-slow mb-4 text-primary-500" sx={{ fontSize: 48 }} />
                     <p className="font-black tracking-widest text-[10px] text-slate-400">Loading clinical history...</p>
                  </div>
               ) : (
                  <div className="w-full space-y-4">
                     {visits.map((visit) => {
                        const isExpandedV = expandedVisit === visit.id;
                        return (
                           <div key={visit.id} className="relative">
                              <div
                                 onClick={() => setExpandedVisit(isExpandedV ? null : visit.id)}
                                 className={`group border rounded-xl transition-all cursor-pointer ${isExpandedV ? 'bg-white border-slate-300 shadow-lg' : 'bg-transparent border-slate-200 hover:border-slate-300'}`}
                              >
                                 <div className="px-5 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className={`p-2 rounded-lg ${visit.type.includes('IPD') ? 'bg-violet-50 text-violet-600' : 'bg-primary-50 text-primary-600'}`}>
                                          <LocalHospital sx={{ fontSize: 18 }} />
                                       </div>
                                       <div>
                                          <h3 className="font-black text-slate-800 text-sm tracking-tight">{visit.type}</h3>
                                          <p className="text-[10px] font-bold text-slate-400">{capitalizeFirst(visit.status)}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                       <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 tracking-tight">
                                          <span>Start</span>
                                          <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                             {new Date(visit.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toLowerCase()} {formatMinimalTime(visit.start_time)}
                                          </span>
                                       </div>
                                       {visit.end_time && (
                                          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 tracking-tight">
                                             <span>Closed</span>
                                             <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{formatMinimalTime(visit.end_time)}</span>
                                          </div>
                                       )}
                                       <div className={`transition-transform duration-300 ${isExpandedV ? 'rotate-180' : ''}`}>
                                          <ArrowDropDown className="text-slate-300" />
                                       </div>
                                    </div>
                                 </div>

                                 {isExpandedV && (
                                    <div className="px-8 pb-8 pt-2 space-y-8">
                                       {visit.events.map((evt) => {
                                          const isExpandedE = expandedEvent === evt.id;
                                          return (
                                             <div key={evt.id} className="space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                                                   <div
                                                      onClick={(e) => { e.stopPropagation(); setExpandedEvent(isExpandedE ? null : evt.id); }}
                                                      className="flex items-center gap-3 cursor-pointer group/ev text-[13px] font-black text-slate-700 tracking-tight"
                                                   >
                                                      {isExpandedE ? <ArrowDropDown className="text-primary-600" /> : <ArrowRight className="text-slate-300" />}
                                                      <span>{evt.title}</span>
                                                   </div>
                                                   <div className="flex items-center gap-5 text-[10px] font-black text-slate-400 tracking-widest">
                                                      <span>{formatMinimalTime(evt.time)}</span>
                                                      <span className="flex items-center gap-1.5 font-bold">By {capitalizeFirst(evt.staff)}</span>
                                                   </div>
                                                </div>

                                                {isExpandedE && (
                                                   <div className="pl-8 space-y-6 animate-in slide-in-from-top-1 duration-200">
                                                      {evt.whats.map((what) => (
                                                         <div key={what.id} className="space-y-3">
                                                            <p className="text-[11px] font-black text-slate-400 tracking-widest">{what.title}</p>
                                                            <div className="flex flex-wrap gap-2.5">
                                                               {what.records.map((rec) => (
                                                                  <button
                                                                     key={rec.id}
                                                                     onClick={(e) => handleRecordClick(e, rec)}
                                                                     className="px-4 py-1.5 rounded-xl text-[10px] font-black border bg-white border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600 transistion-all"
                                                                  >
                                                                     {rec.title}
                                                                  </button>
                                                               ))}
                                                            </div>
                                                         </div>
                                                      ))}
                                                   </div>
                                                )}
                                             </div>
                                          );
                                       })}
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>

            {popupData && (
               <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setPopupData(null)} />
                  <WindowsStylePopup
                     data={popupData}
                     position={popupPos}
                     onClose={() => setPopupData(null)}
                  />
               </>
            )}
            {labPreview && <LabReportPreview item={labPreview} onClose={() => setLabPreview(null)} />}
         </div>
      </div>
   );
}
