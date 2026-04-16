import React, { useState, useEffect, useCallback } from 'react';
import {
  Hotel, Add, Search, ArrowForward,
  CheckCircle, ExitToApp, SwapHoriz, Person
} from '@mui/icons-material';

const wardColors = {
  'General Ward': 'text-blue-600',
  'Maternity Ward': 'text-rose-600',
  'Surgical Ward': 'text-slate-600',
  'Paediatric Ward': 'text-amber-600',
  'ICU / HDU': 'text-red-600',
};

import { ipdService } from '../../services/ipd';
import { useAuth } from '../../context/AuthContext';

function AdmitModal({ visit, onClose, onSave }) {
  const { user } = useAuth();
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  const [form, setForm] = useState({
    patient_id: visit.patient_id,
    visit_id: visit.id,
    ward_id: '',
    bed_id: '',
    admitting_diagnosis: visit.provisional_diagnosis || '',
    admitted_by: user.id,
    notes: '',
  });

  useEffect(() => {
    ipdService.listWards().then(setWards);
  }, []);

  const handleWardChange = async (wardId) => {
    setForm(p => ({ ...p, ward_id: wardId, bed_id: '' }));
    if (!wardId) { setBeds([]); return; }
    setLoadingBeds(true);
    try {
      const allBeds = await ipdService.listBeds(wardId);
      setBeds(allBeds.filter(b => b.status === 'available'));
    } finally {
      setLoadingBeds(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600">
          <h2 className="font-black text-white text-lg">Admit Patient</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient</p>
            <p className="font-bold text-slate-800">{visit.patients?.first_name} {visit.patients?.last_name}</p>
            <p className="text-xs text-slate-500">{visit.patients?.patient_no} · {visit.patients?.age}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ward *</label>
              <select className="input" value={form.ward_id} onChange={e => handleWardChange(e.target.value)}>
                <option value="">Select ward…</option>
                {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Bed *</label>
              <select className="input" value={form.bed_id} onChange={e => setForm(p => ({ ...p, bed_id: e.target.value }))} disabled={!form.ward_id || loadingBeds}>
                <option value="">{loadingBeds ? 'Loading...' : 'Select bed…'}</option>
                {beds.map(b => <option key={b.id} value={b.id}>{b.bed_no}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Admitting Diagnosis *</label>
            <textarea className="input resize-none" rows={2} value={form.admitting_diagnosis} onChange={e => setForm(p => ({ ...p, admitting_diagnosis: e.target.value }))}
              placeholder="Working diagnosis on admission…" />
          </div>
          <div>
            <label className="label">Admission Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Additional clinical notes…" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            disabled={!form.ward_id || !form.bed_id || !form.admitting_diagnosis}
            onClick={() => onSave(form)}
            className="btn-primary disabled:opacity-50">
            <Hotel sx={{ fontSize: 16 }} /> Confirm Admission
          </button>
        </div>
      </div>
    </div>
  );
}

function DischargeModal({ admission, onClose, onDischarge }) {
  const [summary, setSummary] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-emerald-600">
          <h2 className="font-black text-white text-lg">Discharge Patient</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="font-bold text-emerald-800">{admission.name}</p>
            <p className="text-xs text-emerald-600">Diagnosis: {admission.diagnosis}</p>
          </div>
          <div>
            <label className="label">Discharge Summary *</label>
            <textarea className="input resize-none" rows={4} value={summary} onChange={e => setSummary(e.target.value)}
              placeholder="Outline patient condition on discharge, follow-up plan, and medications..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            disabled={!summary.trim()}
            onClick={() => onDischarge(admission.id, { summary })}
            className="bg-emerald-600 text-white font-black px-6 py-2 rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
            Confirm Discharge
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admissions() {
  const [activeTab, setActiveTab] = useState('inpatients'); // 'inpatients' or 'pending'
  const [admissions, setAdmissions] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [admittingPatient, setAdmittingPatient] = useState(null);
  const [discharging, setDischarging] = useState(null);
  const [wardFilter, setWardFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [activeData, pendingData] = await Promise.all([
        ipdService.listAdmissions(),
        ipdService.listPendingAdmissions()
      ]);
      setAdmissions(activeData || []);
      setPending(pendingData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredAdmissions = admissions
    .filter(a => wardFilter === 'all' || a.ward === wardFilter)
    .filter(a =>
      (a.patient_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (a.patient_no?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (a.admission_no?.toLowerCase() || '').includes(search.toLowerCase())
    );

  const filteredPending = pending
    .filter(p => {
      const name = p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : `Unknown Patient (${p.patient_id?.slice(0, 8)})`;
      const pNo = p.patients?.patient_no || '';
      return name.toLowerCase().includes(search.toLowerCase()) || pNo.toLowerCase().includes(search.toLowerCase());
    });

  const handleAdmit = async (payload) => {
    try {
      await ipdService.admit(payload);
      setAdmittingPatient(null);
      loadData();
    } catch (e) {
      alert('Failed to admit: ' + e.message);
    }
  };

  const handleDischarge = async (admissionId, data) => {
    try {
      await ipdService.discharge(admissionId, {
        discharge_summary: data.summary,
        // ... any other fields
      });
      loadData();
    } catch (e) {
      alert('Failed to discharge');
    }
  };

  const wards = [...new Set(admissions.map(a => a.ward))];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Inpatients</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { key: 'inpatients', label: 'Active Inpatients', count: admissions.length },
          { key: 'pending', label: 'Awaiting Admission', count: pending.length },
        ].map(({ key, label, count }) => (
          <button key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 px-1 text-sm font-black transition-all border-b-4
              ${activeTab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {label} <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">{count}</span>
          </button>
        ))}
      </div>

      {/* Main Table view */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID or admission no…" className="input pl-9" />
          </div>
          {activeTab === 'inpatients' && (
            <select value={wardFilter} onChange={e => setWardFilter(e.target.value)} className="input sm:w-48">
              <option value="all">All Wards</option>
              {wards.map(w => <option key={w}>{w}</option>)}
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-middle">
            {activeTab === 'inpatients' ? (
              <>
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Patient ID', 'Patient', 'Ward / Bed', 'Diagnosis', 'Admitted', 'Doctor', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-[11px] font-black text-slate-500 tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdmissions.map(adm => (
                    <tr key={adm.admission_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-slate-500 font-bold">{adm.patient_no}</td>
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-800 text-base leading-tight mb-1 capitalize">{adm.patient_name?.split(' ')[0]?.toLowerCase()}</p>
                        <p className="text-xs font-bold text-slate-500">{adm.age} · {adm.gender}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`font-black text-[11px] capitalize tracking-wider ${wardColors[adm.ward] || 'text-slate-500'}`}>{adm.ward?.toLowerCase()}</span>
                        <p className="text-[11px] font-bold text-slate-400 mt-1">bed {adm.bed_no}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700 max-w-[200px]">
                        <p className="truncate font-semibold text-xs">{adm.admitting_diagnosis}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs font-bold">
                        {new Date(adm.admitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs font-bold capitalize tracking-tight">{adm.admitted_by?.split(' ')[0]?.toLowerCase()}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setDischarging(adm)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] shadow-sm active:scale-95 transition-all">
                            <ExitToApp sx={{ fontSize: 14 }} /> Discharge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Patient Information', 'Triage & History', 'Decision Reason', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-[11px] font-black text-slate-500 tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPending.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-800 text-base leading-tight mb-1">
                          {p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : (
                            <span className="text-slate-400 italic">Unknown Patient ({p.patient_id?.slice(0, 8)})</span>
                          )}
                        </p>
                        <p className="text-xs font-bold text-slate-500">{p.patients?.patient_no} · {p.patients?.age} · {p.patients?.gender}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-slate-600 line-clamp-2 max-w-xs">{p.presenting_complaint}</p>
                      </td>
                      <td className="px-5 py-4 font-bold text-xs text-primary-700 italic">
                        Sent from Consultation
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setAdmittingPatient(p)}
                          className="btn-primary px-4 py-2 text-[11px] font-black shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
                          <Hotel sx={{ fontSize: 16 }} /> Admit Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>

          {(activeTab === 'inpatients' ? filteredAdmissions : filteredPending).length === 0 && !loading && (
            <div className="p-20 text-center text-slate-400 bg-white">
              <Hotel sx={{ fontSize: 56 }} className="mb-4 text-slate-200" />
              <p className="text-lg font-black text-slate-800">Queue is Clear</p>
              <p className="text-sm font-medium mt-1">
                {activeTab === 'inpatients'
                  ? "There are currently no active inpatients in the ward."
                  : "No patients are currently awaiting ward assignment. New referrals from clinicians will appear here."}
              </p>
            </div>
          )}

          {loading && (
            <div className="p-20 text-center text-slate-400 animate-pulse">
              <p className="text-lg font-black tracking-widest uppercase">Syncing Live Records...</p>
            </div>
          )}
        </div>
      </div>

      {admittingPatient && <AdmitModal visit={admittingPatient} onClose={() => setAdmittingPatient(null)} onSave={handleAdmit} />}
      {discharging && (
        <DischargeModal
          admission={{ name: discharging.patient_name, diagnosis: discharging.admitting_diagnosis, id: discharging.admission_id }}
          onClose={() => setDischarging(null)}
          onDischarge={handleDischarge}
        />
      )}
    </div>
  );
}
