import React, { useState } from 'react';
import {
  Person, Add, Save, FavoriteBorder, Thermostat, Air,
  CheckCircle, Cancel, Hotel, Notes, Medication
} from '@mui/icons-material';

// ── Mock inpatients ───────────────────────────────────────────────────────────
const INPATIENTS = [
  { id: 'adm001', name: 'James Mwangi Kariuki',  patientNo: 'BP-00002', ward: 'General Ward',   bed: 'G-01', diagnosis: 'Community-acquired Pneumonia',  admittedAt: '2026-03-27' },
  { id: 'adm002', name: 'Ruth Akinyi Otieno',    patientNo: 'BP-00007', ward: 'General Ward',   bed: 'G-02', diagnosis: 'Severe Malaria',                 admittedAt: '2026-03-28' },
  { id: 'adm003', name: 'Grace Wanjiku Kamau',   patientNo: 'BP-00010', ward: 'Maternity Ward', bed: 'M-01', diagnosis: 'Active Labour',                  admittedAt: '2026-03-29' },
  { id: 'adm004', name: 'David Mutua Mwangangi', patientNo: 'BP-00012', ward: 'Surgical Ward',  bed: 'S-01', diagnosis: 'Inguinal Hernia (pre-op)',        admittedAt: '2026-03-29' },
  { id: 'adm005', name: 'Samuel Odhiambo Ouma',  patientNo: 'BP-00014', ward: 'ICU / HDU',      bed: 'ICU-01', diagnosis: 'ARDS / Respiratory failure',   admittedAt: '2026-03-27' },
];

// ── Mock medications (MAR) ─────────────────────────────────────────────────────
const MOCK_MAR = [
  { id: 'm1', drug: 'Amoxicillin 1g IV',    freq: 'TDS',          times: ['06:00', '14:00', '22:00'], given: { '06:00': true, '14:00': false, '22:00': false } },
  { id: 'm2', drug: 'Paracetamol 1g IV',    freq: 'QID if fever', times: ['06:00', '12:00', '18:00', '00:00'], given: { '06:00': true, '12:00': true, '18:00': false, '00:00': false } },
  { id: 'm3', drug: 'Artesunate 120mg IV',  freq: 'OD',           times: ['08:00'], given: { '08:00': true } },
  { id: 'm4', drug: 'IV Fluids NS 500ml',   freq: '8-hourly',     times: ['06:00', '14:00', '22:00'], given: { '06:00': true, '14:00': false, '22:00': false } },
];

// ── Mock existing notes ───────────────────────────────────────────────────────
const MOCK_NOTES = [
  { id: 'n1', type: 'nursing', by: 'Nurse Wanja', time: '07:30', text: 'Patient seems comfortable. Breathing easier. Temperature down to 37.4°C. Took meds without difficulty. IV still patent.' },
  { id: 'n2', type: 'doctor',  by: 'Dr. Kimani',  time: '09:15', text: 'Patient review: Chest clearing. Sputum still productive but less. Continue antibiotics. Repeat CXR in 48hrs. Keep on IV fluids.' },
];

const NOTE_COLORS = {
  nursing: 'border-l-blue-400 bg-blue-50',
  doctor: 'border-l-violet-400 bg-violet-50',
};

function VitalInput({ label, icon: Icon, value, onChange, unit, placeholder }) {
  return (
    <div>
      <label className="flex items-center gap-1 label"><Icon sx={{ fontSize: 12 }} className="text-primary-500" />{label}</label>
      <div className="flex">
        <input type="number" step="any" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className="input rounded-r-none text-sm flex-1" />
        {unit && <span className="px-2 py-2 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

export default function NursingRounds() {
  const [selectedPatient, setSelectedPatient] = useState(INPATIENTS[0]);
  const [activeTab, setActiveTab]             = useState('vitals');
  const [notes, setNotes]                     = useState(MOCK_NOTES);
  const [mar, setMar]                         = useState(MOCK_MAR);

  // Vitals
  const [vitals, setVitals] = useState({ temperature: '', pulse: '', bpSys: '', bpDia: '', respRate: '', spo2: '', bg: '', weight: '' });
  const vf = (field) => (val) => setVitals(prev => ({ ...prev, [field]: val }));

  // New note
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('nursing');

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [...prev, {
      id: `n${Date.now()}`,
      type: noteType,
      by: noteType === 'nursing' ? 'Nurse (You)' : 'Doctor (You)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: newNote.trim(),
    }]);
    setNewNote('');
  };

  const toggleMAR = (medId, time) => {
    setMar(prev => prev.map(m => m.id === medId
      ? { ...m, given: { ...m.given, [time]: !m.given[time] } }
      : m
    ));
  };

  const wardColor = { 'General Ward': 'text-blue-600', 'Maternity Ward': 'text-pink-600', 'Surgical Ward': 'text-violet-600', 'ICU / HDU': 'text-red-600' };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Patient list sidebar */}
      <div className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="px-4 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-800 text-sm">Nursing Rounds</h2>
          <p className="text-xs text-slate-400">{INPATIENTS.length} inpatients</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {INPATIENTS.map(p => (
            <button key={p.id} onClick={() => setSelectedPatient(p)}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors
                ${selectedPatient?.id === p.id ? 'bg-primary-50 border-l-2 border-primary-500' : ''}`}>
              <p className="font-bold text-slate-800 text-sm truncate">{p.name.split(' ')[0]} {p.name.split(' ')[1]}</p>
              <p className={`text-xs font-semibold ${wardColor[p.ward] || 'text-slate-500'}`}>{p.ward} · {p.bed}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{p.diagnosis}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Patient header */}
        {selectedPatient && (
          <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <Person className="text-primary-600" sx={{ fontSize: 22 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-800">{selectedPatient.name}</p>
              <p className="text-xs text-slate-500">{selectedPatient.patientNo} · {selectedPatient.ward} · Bed {selectedPatient.bed}</p>
            </div>
            <span className="badge badge-blue hidden sm:inline-flex">{selectedPatient.diagnosis}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 flex">
          {[
            { key: 'vitals', label: '🩺 Vitals' },
            { key: 'notes',  label: '📝 Notes' },
            { key: 'mar',    label: '💊 Medications (MAR)' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors
                ${activeTab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">

          {/* ── VITALS TAB ─────────────────────────────────────── */}
          {activeTab === 'vitals' && (
            <div className="max-w-2xl space-y-5">
              <div className="card p-5">
                <h3 className="font-black text-slate-800 mb-4">Record Vitals</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <VitalInput label="Temperature" icon={Thermostat}    value={vitals.temperature} onChange={vf('temperature')} unit="°C"  placeholder="36.5" />
                  <VitalInput label="Pulse Rate"  icon={FavoriteBorder} value={vitals.pulse}       onChange={vf('pulse')}       unit="bpm" placeholder="72" />
                  <VitalInput label="SpO₂"        icon={Air}            value={vitals.spo2}         onChange={vf('spo2')}        unit="%"   placeholder="98" />
                  <div>
                    <label className="label">Blood Pressure</label>
                    <div className="flex gap-1 items-center">
                      <input type="number" value={vitals.bpSys} onChange={e => vf('bpSys')(e.target.value)}
                        placeholder="Sys" className="input text-sm text-center" />
                      <span className="text-slate-400 font-bold">/</span>
                      <input type="number" value={vitals.bpDia} onChange={e => vf('bpDia')(e.target.value)}
                        placeholder="Dia" className="input text-sm text-center" />
                    </div>
                  </div>
                  <VitalInput label="Resp. Rate"   icon={Air}   value={vitals.respRate} onChange={vf('respRate')} unit="/min" placeholder="16" />
                  <VitalInput label="Blood Glucose" icon={FavoriteBorder} value={vitals.bg} onChange={vf('bg')} unit="mmol/L" placeholder="5.5" />
                  <VitalInput label="Weight"        icon={FavoriteBorder} value={vitals.weight} onChange={vf('weight')} unit="kg" placeholder="70" />
                </div>
                <button className="btn-primary mt-4">
                  <Save sx={{ fontSize: 16 }} /> Save Vitals
                </button>
              </div>

              {/* Previous vitals mini-chart placeholder */}
              <div className="card p-5">
                <h3 className="font-black text-slate-800 mb-3">Today's Vitals History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[500px]">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                      <tr>
                        {['Time', 'Temp', 'Pulse', 'BP', 'SpO₂', 'Nurse'].map(h => (
                          <th key={h} className="px-3 py-2 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { time: '06:00', temp: '38.2', pulse: '92', bp: '130/84', spo2: '93%', nurse: 'N. Wanja', flags: [false, false, false, true] },
                        { time: '10:00', temp: '37.8', pulse: '86', bp: '126/80', spo2: '95%', nurse: 'N. Wanja', flags: [false, false, false, false] },
                        { time: '14:00', temp: '37.4', pulse: '80', bp: '120/78', spo2: '97%', nurse: 'N. Amina', flags: [false, false, false, false] },
                      ].map(row => (
                        <tr key={row.time} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-semibold text-slate-700">{row.time}</td>
                          <td className={`px-3 py-2 ${row.flags[0] ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{row.temp}°C</td>
                          <td className={`px-3 py-2 ${row.flags[1] ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{row.pulse}</td>
                          <td className={`px-3 py-2 ${row.flags[2] ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{row.bp}</td>
                          <td className={`px-3 py-2 ${row.flags[3] ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{row.spo2}</td>
                          <td className="px-3 py-2 text-slate-500">{row.nurse}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTES TAB ─────────────────────────────────────── */}
          {activeTab === 'notes' && (
            <div className="max-w-2xl space-y-4">
              {/* Add new note */}
              <div className="card p-5 space-y-3">
                <h3 className="font-black text-slate-800">Add Clinical Note</h3>
                <div className="flex gap-3">
                  {[{ val: 'nursing', label: '🩺 Nursing Note' }, { val: 'doctor', label: '👨‍⚕️ Doctor Note' }].map(({ val, label }) => (
                    <button key={val} onClick={() => setNoteType(val)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all
                        ${noteType === val ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <textarea rows={4} value={newNote} onChange={e => setNewNote(e.target.value)}
                  placeholder={`Write ${noteType} note here… (observations, interventions, patient response)`}
                  className="input resize-none text-sm" />
                <button onClick={addNote} className="btn-primary">
                  <Save sx={{ fontSize: 16 }} /> Post Note
                </button>
              </div>

              {/* Existing notes timeline */}
              <div className="space-y-3">
                {[...notes].reverse().map(note => (
                  <div key={note.id} className={`card p-4 border-l-4 ${NOTE_COLORS[note.type] || ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-slate-700">{note.by}</span>
                      <span className="text-xs text-slate-400">{note.time} · Today</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MAR TAB ─────────────────────────────────────── */}
          {activeTab === 'mar' && (
            <div className="max-w-3xl">
              <div className="card overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-black text-slate-800">Medication Administration Record</h3>
                  <p className="text-xs text-slate-400">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {mar.map(med => (
                    <div key={med.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-slate-800">{med.drug}</p>
                          <p className="text-xs text-slate-500">{med.freq}</p>
                        </div>
                        <span className="badge badge-slate text-xs">{med.times.length}x daily</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {med.times.map(time => {
                          const given = med.given[time];
                          return (
                            <button key={time}
                              onClick={() => toggleMAR(med.id, time)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all
                                ${given
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-primary-300 hover:bg-primary-50'}`}
                            >
                              {given ? <CheckCircle sx={{ fontSize: 13 }} /> : <Cancel sx={{ fontSize: 13 }} />}
                              {time} {given ? '✓' : '○'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">Click a time slot to toggle given / not given</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
