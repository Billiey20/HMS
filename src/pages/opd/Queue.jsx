import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Assignment, AccessTime, Warning, CheckCircle,
  FiberManualRecord, Person, Refresh
} from '@mui/icons-material';

const MOCK_QUEUE = [
  {
    id: 'v001', queueNo: 1,
    patientNo: 'BP-00004', name: 'Peter Otieno Ochieng', age: '45', gender: 'Male',
    priority: 'emergency', complaint: 'Difficulty breathing, chest tightness',
    temperature: '38.2', pulse: '118', bpSystolic: '155', bpDiastolic: '95',
    spo2: '88', weightKg: '82', heightCm: '175',
    checkIn: '09:01 AM', waitMins: 4, status: 'waiting',
  },
  {
    id: 'v002', queueNo: 2,
    patientNo: 'BP-00003', name: 'Fatuma Ahmed Abdi', age: '28', gender: 'Female',
    priority: 'urgent', complaint: 'Chest pain radiating to left arm',
    temperature: '37.1', pulse: '98', bpSystolic: '140', bpDiastolic: '88',
    spo2: '96', weightKg: '58', heightCm: '162',
    checkIn: '08:42 AM', waitMins: 23, status: 'waiting',
  },
  {
    id: 'v003', queueNo: 3,
    patientNo: 'BP-00001', name: 'Alice Wanjiru Kamau', age: '34', gender: 'Female',
    priority: 'normal', complaint: 'Headache and fever for 2 days',
    temperature: '37.8', pulse: '84', bpSystolic: '118', bpDiastolic: '76',
    spo2: '98', weightKg: '65', heightCm: '160',
    checkIn: '08:15 AM', waitMins: 50, status: 'waiting',
  },
  {
    id: 'v004', queueNo: 4,
    patientNo: 'BP-00005', name: 'Joseph Kamau Njoroge', age: '62', gender: 'Male',
    priority: 'normal', complaint: 'Routine DM follow-up, medication refill',
    temperature: '36.8', pulse: '76', bpSystolic: '132', bpDiastolic: '80',
    spo2: '97', weightKg: '78', heightCm: '172',
    checkIn: '09:30 AM', waitMins: 0, status: 'waiting',
  },
];

const priorityStyle = {
  emergency: { dot: 'bg-red-500 animate-pulse', row: 'border-l-4 border-red-500 bg-red-50', badge: 'badge-red',   label: 'Emergency', icon: '🚨' },
  urgent:    { dot: 'bg-amber-500',              row: 'border-l-4 border-amber-400 bg-amber-50/50', badge: 'badge-amber',  label: 'Urgent',    icon: '⚠️' },
  normal:    { dot: 'bg-emerald-400',            row: '',                                badge: 'badge-green', label: 'Normal',    icon: '' },
};

function VitalChip({ label, value, unit, flag }) {
  return (
    <div className={`text-center px-2 py-1 rounded-lg border ${flag ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
      <p className={`text-xs font-bold ${flag ? 'text-red-600' : 'text-slate-700'}`}>{value}<span className="font-normal text-[10px] ml-0.5">{unit}</span></p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

export default function OPDQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [filter, setFilter] = useState('all');

  const sorted = [...queue]
    .filter(v => filter === 'all' || v.priority === filter)
    .sort((a, b) => {
      const o = { emergency: 0, urgent: 1, normal: 2 };
      return o[a.priority] - o[b.priority];
    });

  const counts = {
    all:       queue.length,
    emergency: queue.filter(q => q.priority === 'emergency').length,
    urgent:    queue.filter(q => q.priority === 'urgent').length,
    normal:    queue.filter(q => q.priority === 'normal').length,
  };

  const startConsultation = (visit) => {
    // Pass visit state to consultation page via navigation state
    navigate('/opd/consultation', { state: { visit } });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Doctor's Queue</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="btn-secondary shrink-0">
          <Refresh sx={{ fontSize: 16 }} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',       label: `All (${counts.all})`,             cls: 'bg-slate-800 text-white' },
          { key: 'emergency', label: `🚨 Emergency (${counts.emergency})`, cls: 'bg-red-600 text-white' },
          { key: 'urgent',    label: `⚠️ Urgent (${counts.urgent})`,      cls: 'bg-amber-500 text-white' },
          { key: 'normal',    label: `✅ Normal (${counts.normal})`,       cls: 'bg-emerald-600 text-white' },
        ].map(({ key, label, cls }) => (
          <button key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2
              ${filter === key ? `${cls} border-transparent` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Queue cards */}
      <div className="space-y-3">
        {sorted.map((v) => {
          const ps = priorityStyle[v.priority];
          return (
            <div key={v.id} className={`card overflow-hidden ${ps.row} transition-all hover:shadow-md`}>
              <div className="p-4 flex flex-col lg:flex-row gap-4">
                {/* Queue # + patient */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shrink-0
                      ${v.priority === 'emergency' ? 'bg-red-200 text-red-700' : v.priority === 'urgent' ? 'bg-amber-200 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                    {v.queueNo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-800">{v.name}</h3>
                      <span className={`badge ${ps.badge}`}>{ps.icon} {ps.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{v.patientNo} · {v.age} yrs · {v.gender}</p>
                    <p className="text-sm text-slate-700 mt-1 italic">"{v.complaint}"</p>
                  </div>
                </div>

                {/* Vitals */}
                <div className="flex flex-wrap gap-1.5 lg:justify-end">
                  <VitalChip label="Temp"  value={v.temperature} unit="°C"  flag={parseFloat(v.temperature) > 37.5} />
                  <VitalChip label="Pulse" value={v.pulse}       unit="bpm" flag={parseInt(v.pulse) > 100 || parseInt(v.pulse) < 60} />
                  <VitalChip label="BP"    value={`${v.bpSystolic}/${v.bpDiastolic}`} unit="mmHg" flag={parseInt(v.bpSystolic) >= 140} />
                  <VitalChip label="SpO₂"  value={v.spo2}        unit="%"   flag={parseFloat(v.spo2) < 95} />
                </div>

                {/* Wait time + action */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-slate-500">
                      <AccessTime sx={{ fontSize: 14 }} />
                      <span className="text-xs">{v.waitMins === 0 ? 'Just arrived' : `${v.waitMins} min wait`}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">In at {v.checkIn}</p>
                  </div>
                  <button
                    onClick={() => startConsultation(v)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm
                      ${v.priority === 'emergency' ? 'bg-red-600 hover:bg-red-700 text-white' :
                        v.priority === 'urgent' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                        'btn-primary'}`}>
                    Start →
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="card p-16 text-center text-slate-400">
            <CheckCircle sx={{ fontSize: 48 }} className="mb-3 text-emerald-300" />
            <p className="font-bold text-slate-600">Queue is clear!</p>
            <p className="text-sm mt-1">No patients waiting in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
