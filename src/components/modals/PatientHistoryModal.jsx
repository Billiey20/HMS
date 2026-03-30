import React, { useState, useEffect } from 'react';
import { 
  Close, Person, History, LocalHospital, Science, 
  Medication, Description, Thermostat, Favorite, 
  Hotel, ArrowBack, TrendingUp 
} from '@mui/icons-material';
import { patientService } from '../../services/patients';

export default function PatientHistoryModal({ patient, onClose }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patient?.id) {
       patientService.getFullHistory(patient.id).then(data => {
         setHistory(data);
         setLoading(false);
       });
    }
  }, [patient]);

  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-slate-50 w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/20 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-slate-200 flex items-center justify-between shadow-sm relative">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-inner">
                 <Person className="text-primary-600" sx={{ fontSize: 32 }} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">{patient.first_name} {patient.last_name}</h2>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{patient.patient_no} · {patient.age}Y · {patient.gender}</p>
              </div>
           </div>
           <button onClick={onClose} className="w-12 h-12 rounded-2xl hover:bg-slate-100 flex items-center justify-center transition-all active:scale-90">
              <Close className="text-slate-400" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 relative no-scrollbar">
           {loading ? (
             <div className="h-full flex flex-col items-center justify-center opacity-30">
                <History className="animate-spin-slow mb-4" sx={{ fontSize: 48 }} />
                <p className="font-black uppercase tracking-widest text-xs">Aggregating Clinical Data...</p>
             </div>
           ) : (
             <div className="max-w-3xl mx-auto">
                <div className="relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-slate-200/50 before:rounded-full">
                   
                   {/* ── Registration ────────────────────────────────────── */}
                   <TimelineItem 
                     icon={Description} 
                     color="bg-emerald-500" 
                     date={patient.created_at} 
                     title="Patient Registration"
                     subtitle="System Initialization"
                   >
                     <p className="text-sm font-bold text-slate-600 italic">"Welcome to the HMS family. Demographic and contact data captured."</p>
                   </TimelineItem>

                   {/* ── Chronological Events ─────────────────────────────── */}
                   {getSortedTimeline(history).map((event, idx) => (
                     <TimelineEvent key={idx} event={event} />
                   ))}

                </div>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="bg-white px-8 py-5 border-t border-slate-200 text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <History sx={{ fontSize: 14 }} /> 
              Clinical records are secured and encrypted. End of history.
           </p>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ icon: Icon, color, date, title, subtitle, children }) {
  return (
    <div className="mb-12 relative pl-24 group">
       {/* Pin */}
       <div className={`absolute left-4 top-0 w-10 h-10 rounded-2xl ${color} flex items-center justify-center z-10 shadow-lg shadow-${color.split('-')[1]}-500/30 ring-4 ring-white transition-transform group-hover:scale-110`}>
          <Icon className="text-white" sx={{ fontSize: 20 }} />
       </div>

       {/* Bubble */}
       <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative transition-all group-hover:shadow-xl group-hover:ring-1 group-hover:ring-slate-200">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h4 className="font-black text-slate-800 tracking-tight leading-tight uppercase text-xs">{title}</h4>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">{subtitle}</p>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-lg">
                {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </p>
          </div>
          <div className="space-y-4">
             {children}
          </div>
       </div>
    </div>
  );
}

function TimelineEvent({ event }) {
   if (event.type === 'visit') {
      const v = event.data;
      return (
         <TimelineItem 
           icon={LocalHospital} 
           color="bg-primary-500" 
           date={v.created_at} 
           title={`OPD Consultation — ${v.visit_no}`}
           subtitle="Outpatient Department"
         >
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Diagnosis</p>
                 <p className="text-xs font-black text-slate-700">{v.consultations?.[0]?.diagnosis || 'No diagnosis recorded'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Clinic</p>
                 <p className="text-xs font-black text-slate-700">General OPD</p>
              </div>
           </div>
           
           {v.consultations?.[0]?.clinical_notes && (
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Clinician Notes</p>
                <div className="border-l-2 border-primary-200 pl-3">
                   <p className="text-xs font-semibold text-slate-600 italic">"{v.consultations[0].clinical_notes}"</p>
                </div>
             </div>
           )}

           {v.lab_orders?.length > 0 && (
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400">Investigations Ordered</p>
                <div className="flex flex-wrap gap-2">
                   {v.lab_orders.flatMap(o => o.lab_order_items).map((it, i) => (
                      <span key={i} className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-[10px] font-black uppercase border border-violet-100">
                         {it.laboratory_items?.name}
                      </span>
                   ))}
                </div>
             </div>
           )}
           
           {v.prescriptions?.length > 0 && (
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400">Medications Given</p>
                <div className="flex flex-wrap gap-2">
                   {v.prescriptions.flatMap(p => p.prescription_items).map((it, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase border border-amber-100">
                         {it.inventory_items?.name} · {it.dosage}
                      </span>
                   ))}
                </div>
             </div>
           )}
         </TimelineItem>
      );
   }

   if (event.type === 'admission') {
      const a = event.data;
      return (
         <TimelineItem 
           icon={Hotel} 
           color="bg-indigo-600" 
           date={a.admitted_at} 
           title={`Ward Admission — ADM-${a.id.slice(0,5)}`}
           subtitle={`${a.wards?.name} · BED ${a.bed_no}`}
         >
           <div className="bg-indigo-50/50 p-4 rounded-[2rem] border border-indigo-100">
              <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Admitting Diagnosis</p>
              <p className="text-sm font-black text-indigo-900 mb-4">{a.admitting_diagnosis}</p>
              
              {a.clinical_notes?.length > 0 && (
                <div className="space-y-3">
                   <p className="text-[10px] font-black uppercase text-indigo-400">Ward Progress Notes ({a.clinical_notes.length})</p>
                   {a.clinical_notes.slice(0, 3).map((n, i) => (
                      <div key={i} className="bg-white/80 p-3 rounded-2xl border border-indigo-50 shadow-sm relative">
                         <div className="flex justify-between mb-1">
                            <span className="text-[9px] font-black uppercase text-slate-400">{n.note_type}</span>
                            <span className="text-[9px] font-bold text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                         </div>
                         <p className="text-xs font-semibold text-slate-600 italic">"{n.note_text.slice(0, 100)}{n.note_text.length > 100 ? '...' : ''}"</p>
                      </div>
                   ))}
                </div>
              )}
           </div>
         </TimelineItem>
      );
   }

   if (event.type === 'vitals') {
      const vit = event.data;
      return (
         <TimelineItem 
           icon={TrendingUp} 
           color="bg-slate-800" 
           date={vit.recorded_at} 
           title="Vital Signs Recorded"
           subtitle="Triage / Nursing Round"
         >
           <div className="flex flex-wrap gap-3">
              <VitalPill icon={Thermostat} label="TEMP" value={`${vit.temperature}°C`} />
              <VitalPill icon={Favorite}   label="BP"   value={`${vit.bp_systolic}/${vit.bp_diastolic}`} />
              <VitalPill icon={ArrowBack}   label="SPO2" value={`${vit.oxygen_saturation}%`} />
              <VitalPill icon={Favorite}   label="PULSE" value={`${vit.pulse_rate} bpm`} />
           </div>
         </TimelineItem>
      );
   }

   return null;
}

function VitalPill({ icon: Icon, label, value }) {
   return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
         <Icon className="text-primary-500" sx={{ fontSize: 12 }} />
         <span className="text-[9px] font-black text-slate-400 tracking-widest">{label}</span>
         <span className="text-xs font-black text-slate-800">{value}</span>
      </div>
   );
}

function getSortedTimeline(history) {
   if (!history) return [];
   const items = [];
   
   history.visits?.forEach(v => items.push({ type: 'visit', date: v.created_at, data: v }));
   history.admissions?.forEach(a => items.push({ type: 'admission', date: a.admitted_at, data: a }));
   history.vitals?.forEach(vit => items.push({ type: 'vitals', date: vit.recorded_at, data: vit }));
   
   return items.sort((a,b) => new Date(b.date) - new Date(a.date));
}
