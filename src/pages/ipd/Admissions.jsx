import React, { useState } from 'react';
import {
  Hotel, Add, Search, ArrowForward,
  CheckCircle, ExitToApp, SwapHoriz, Person
} from '@mui/icons-material';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_ADMISSIONS = [
  { id: 'adm001', admNo: 'ADM-001', patientNo: 'BP-00002', name: 'James Mwangi Kariuki',  age: '52', gender: 'Male',   ward: 'General Ward',   bed: 'G-01', diagnosis: 'Community-acquired Pneumonia',        admittedAt: '2026-03-27', admittedBy: 'Dr. Kimani', status: 'active', daysIn: 2 },
  { id: 'adm002', admNo: 'ADM-002', patientNo: 'BP-00007', name: 'Ruth Akinyi Otieno',    age: '43', gender: 'Female', ward: 'General Ward',   bed: 'G-02', diagnosis: 'Severe Malaria (P. falciparum)',       admittedAt: '2026-03-28', admittedBy: 'Dr. Musyoka', status: 'active', daysIn: 1 },
  { id: 'adm003', admNo: 'ADM-003', patientNo: 'BP-00010', name: 'Grace Wanjiku Kamau',   age: '26', gender: 'Female', ward: 'Maternity Ward', bed: 'M-01', diagnosis: 'Active Labour — G2P1',                 admittedAt: '2026-03-29', admittedBy: 'Dr. Njeri',   status: 'active', daysIn: 0 },
  { id: 'adm004', admNo: 'ADM-004', patientNo: 'BP-00012', name: 'David Mutua Mwangangi', age: '55', gender: 'Male',   ward: 'Surgical Ward',  bed: 'S-01', diagnosis: 'Inguinal Hernia (pre-op)',             admittedAt: '2026-03-29', admittedBy: 'Dr. Ochieng', status: 'active', daysIn: 0 },
  { id: 'adm005', admNo: 'ADM-005', patientNo: 'BP-00009', name: 'Tom Njoroge Waweru',    age: '38', gender: 'Male',   ward: 'General Ward',   bed: 'G-06', diagnosis: 'Post-operative appendectomy care',     admittedAt: '2026-03-29', admittedBy: 'Dr. Ochieng', status: 'active', daysIn: 0 },
  { id: 'adm006', admNo: 'ADM-006', patientNo: 'BP-00014', name: 'Samuel Odhiambo Ouma',  age: '67', gender: 'Male',   ward: 'ICU / HDU',      bed: 'ICU-01', diagnosis: 'ARDS — Acute Respiratory Distress', admittedAt: '2026-03-27', admittedBy: 'Dr. Kimani', status: 'active', daysIn: 2 },
];

const wardColors = {
  'General Ward':   'badge-blue',
  'Maternity Ward': 'badge-red',
  'Surgical Ward':  'badge-slate',
  'Paediatric Ward':'badge-amber',
  'ICU / HDU':      'badge-red',
};

function AdmitModal({ onClose, onSave }) {
  const empty = {
    patientSearch: '', ward: '', bed: '',
    diagnosis: '', admittedBy: '',
    condition: 'stable', notes: '',
  };
  const [form, setForm] = useState(empty);
  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const WARD_BEDS = {
    'General Ward':    ['G-03','G-04','G-07','G-08','G-10'],
    'Maternity Ward':  ['M-03','M-04','M-05'],
    'Surgical Ward':   ['S-02','S-03'],
    'Paediatric Ward': ['P-02','P-03'],
    'ICU / HDU':       ['ICU-02','ICU-03'],
  };

  const availableBeds = WARD_BEDS[form.ward] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl">
          <h2 className="font-black text-white text-lg">Admit Patient</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Patient *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
              <input className="input pl-9" value={form.patientSearch} onChange={f('patientSearch')}
                placeholder="Search patient by name or ID…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ward *</label>
              <select className="input" value={form.ward} onChange={f('ward')}>
                <option value="">Select ward…</option>
                {Object.keys(WARD_BEDS).map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Bed *</label>
              <select className="input" value={form.bed} onChange={f('bed')} disabled={!form.ward}>
                <option value="">Select bed…</option>
                {availableBeds.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Admitting Diagnosis *</label>
            <textarea className="input resize-none" rows={2} value={form.diagnosis} onChange={f('diagnosis')}
              placeholder="Working diagnosis on admission…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Admitting Doctor *</label>
              <input className="input" value={form.admittedBy} onChange={f('admittedBy')} placeholder="Dr. …" />
            </div>
            <div>
              <label className="label">Condition on Admission</label>
              <select className="input" value={form.condition} onChange={f('condition')}>
                <option value="stable">Stable</option>
                <option value="serious">Serious</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Admission Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={f('notes')}
              placeholder="Additional notes…" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} className="btn-primary">
            <Hotel sx={{ fontSize: 16 }} /> Confirm Admission
          </button>
        </div>
      </div>
    </div>
  );
}

function DischargeModal({ admission, onClose, onDischarge }) {
  const [summary, setSummary]       = useState('');
  const [finalDx,  setFinalDx]      = useState(admission.diagnosis);
  const [condition, setCondition]   = useState('improved');
  const [followUp, setFollowUp]     = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-emerald-600 rounded-t-2xl">
          <h2 className="font-black text-white text-lg">Discharge — {admission.name}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Final Diagnosis</label>
            <input className="input" value={finalDx} onChange={e => setFinalDx(e.target.value)} />
          </div>
          <div>
            <label className="label">Condition at Discharge</label>
            <select className="input" value={condition} onChange={e => setCondition(e.target.value)}>
              <option value="improved">Improved / Well</option>
              <option value="recovered">Fully Recovered</option>
              <option value="transferred">Transferred</option>
              <option value="absconded">Absconded</option>
              <option value="deceased">Deceased (DAMA)</option>
            </select>
          </div>
          <div>
            <label className="label">Discharge Summary *</label>
            <textarea className="input resize-none" rows={4} value={summary} onChange={e => setSummary(e.target.value)}
              placeholder="Summary of hospital course, procedures performed, medications on discharge, instructions…" />
          </div>
          <div>
            <label className="label">Follow-Up Date</label>
            <input type="date" className="input" value={followUp} onChange={e => setFollowUp(e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onDischarge(admission.id, { finalDx, condition, summary, followUp }); onClose(); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all">
            <ExitToApp sx={{ fontSize: 16 }} /> Confirm Discharge
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admissions() {
  const [admissions, setAdmissions]   = useState(MOCK_ADMISSIONS);
  const [search, setSearch]           = useState('');
  const [showAdmit, setShowAdmit]     = useState(false);
  const [discharging, setDischarging] = useState(null);
  const [wardFilter, setWardFilter]   = useState('all');

  const filtered = admissions
    .filter(a => a.status === 'active')
    .filter(a => wardFilter === 'all' || a.ward === wardFilter)
    .filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.patientNo.toLowerCase().includes(search.toLowerCase()) ||
      a.admNo.toLowerCase().includes(search.toLowerCase())
    );

  const handleDischarge = (id, data) => {
    setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status: 'discharged', ...data } : a));
  };

  const wards = [...new Set(MOCK_ADMISSIONS.map(a => a.ward))];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Admissions — ADT</h1>
          <p className="text-sm text-slate-500">Admit · Discharge · Transfer</p>
        </div>
        <button onClick={() => setShowAdmit(true)} className="btn-primary shrink-0">
          <Add sx={{ fontSize: 18 }} /> New Admission
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center border-blue-100 bg-blue-50">
          <p className="text-3xl font-black text-blue-700">{admissions.filter(a => a.status === 'active').length}</p>
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">Current Inpatients</p>
        </div>
        <div className="card p-4 text-center border-emerald-100 bg-emerald-50">
          <p className="text-3xl font-black text-emerald-700">{admissions.filter(a => a.status === 'discharged').length}</p>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Discharged Today</p>
        </div>
        <div className="card p-4 text-center border-amber-100 bg-amber-50">
          <p className="text-3xl font-black text-amber-700">
            {admissions.filter(a => a.status === 'active').length > 0
              ? Math.round(admissions.filter(a => a.status === 'active').reduce((s, a) => s + a.daysIn, 0) / admissions.filter(a => a.status === 'active').length)
              : 0}d
          </p>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Avg. Length of Stay</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID or admission no…" className="input pl-9" />
        </div>
        <select value={wardFilter} onChange={e => setWardFilter(e.target.value)} className="input sm:w-48">
          <option value="all">All Wards</option>
          {wards.map(w => <option key={w}>{w}</option>)}
        </select>
      </div>

      {/* Admissions table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Adm #', 'Patient', 'Ward / Bed', 'Diagnosis', 'Admitted', 'Days In', 'Doctor', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(adm => (
                <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{adm.admNo}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{adm.name}</p>
                    <p className="text-xs text-slate-500">{adm.patientNo} · {adm.age} · {adm.gender}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${wardColors[adm.ward] || 'badge-slate'}`}>{adm.ward}</span>
                    <p className="text-xs text-slate-500 mt-1">Bed {adm.bed}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-[200px]">
                    <p className="truncate">{adm.diagnosis}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {new Date(adm.admittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${adm.daysIn >= 7 ? 'badge-red' : adm.daysIn >= 3 ? 'badge-amber' : 'badge-green'}`}>
                      {adm.daysIn}d
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{adm.admittedBy}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs py-1 px-2">
                        <Person sx={{ fontSize: 12 }} /> View
                      </button>
                      <button className="btn-secondary text-xs py-1 px-2 text-amber-600">
                        <SwapHoriz sx={{ fontSize: 12 }} /> Transfer
                      </button>
                      <button onClick={() => setDischarging(adm)}
                        className="btn-secondary text-xs py-1 px-2 text-emerald-600">
                        <ExitToApp sx={{ fontSize: 12 }} /> Discharge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Hotel sx={{ fontSize: 36 }} className="mb-2" />
                    <p>No active admissions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdmit && <AdmitModal onClose={() => setShowAdmit(false)} onSave={() => {}} />}
      {discharging && <DischargeModal admission={discharging} onClose={() => setDischarging(null)} onDischarge={handleDischarge} />}
    </div>
  );
}
