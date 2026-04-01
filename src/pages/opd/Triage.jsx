import React, { useState, useEffect, useCallback } from 'react';
import {
  MonitorHeart, Search, Warning, CheckCircle, Refresh, AccessTime
} from '@mui/icons-material';
import { opdService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PRIORITY_CFG = {
  emergency: { label: 'Emergency', badge: 'badge-red', border: 'border-l-red-500', bg: 'bg-red-50' },
  urgent: { label: 'Urgent', badge: 'badge-amber', border: 'border-l-amber-400', bg: 'bg-amber-50' },
  normal: { label: 'Normal', badge: 'badge-green', border: 'border-l-slate-200', bg: '' },
};

const VITALS_DEFAULTS = {
  temperature: '', pulse: '', bpSystolic: '', bpDiastolic: '',
  respRate: '', spo2: '', weight: '', height: '', bloodGlucose: '',
  complaint: '', priority: 'normal',
};

export default function Triage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [selectedPat, setSelectedPat] = useState(null);
  const [vitals, setVitals] = useState(VITALS_DEFAULTS);

  const v = (field) => (e) => setVitals(p => ({ ...p, [field]: e.target.value }));

  // ── Load today's triage queue ────────────────────────────────────────────────
  const loadQueue = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await opdService.getQueue();
      // Only show patients waiting for triage
      setQueue((data || []).filter(q => q.status === 'waiting_triage'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // ── Submit triage ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedPat) return;
    setSaving(true);
    try {
      await opdService.updateVisit(selectedPat.visit_id, {
        presenting_complaint: vitals.complaint,
        triage_priority: vitals.priority,
        temperature: parseFloat(vitals.temperature) || null,
        pulse: parseInt(vitals.pulse) || null,
        bp_systolic: parseInt(vitals.bpSystolic) || null,
        bp_diastolic: parseInt(vitals.bpDiastolic) || null,
        respiratory_rate: parseInt(vitals.respRate) || null,
        spo2: parseFloat(vitals.spo2) || null,
        weight_kg: parseFloat(vitals.weight) || null,
        height_cm: parseFloat(vitals.height) || null,
        blood_glucose: parseFloat(vitals.bloodGlucose) || null,
        triaged_by: user?.id || null,
        status: 'waiting_doctor',
      });
      setVitals(VITALS_DEFAULTS);
      setSelectedPat(null);
      await loadQueue();
    } catch (e) {
      alert('Failed to save triage: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Emergency & Triage</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">Patient Assessment & Vital Records</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Main Grid: Queue on left, Form on right (if selected) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Side: Waiting List */}
        <div className={`flex-1 space-y-3 w-full ${selectedPat ? 'lg:max-w-md' : ''} transition-all duration-300`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="font-bold text-slate-700">Waiting for Triage</h2>
            <span className="badge badge-slate">{queue.length}</span>
          </div>

          {loading && <div className="card p-8 text-center text-slate-400">Loading queue…</div>}

          {!loading && queue.length === 0 && (
            <div className="card p-12 text-center text-slate-400">
              <CheckCircle sx={{ fontSize: 48 }} className="mb-3 text-emerald-300" />
              <p className="font-bold text-slate-600">Queue is clear!</p>
              <p className="text-sm mt-1">No patients waiting for triage.</p>
            </div>
          )}

          {!loading && queue.map(q => {
            const active = selectedPat?.visit_id === q.visit_id;
            return (
              <div key={q.visit_id}
                className={`card p-4 transition-all ${active ? 'ring-2 ring-primary-500 border-primary-500' : 'hover:border-primary-300 border-slate-200'} cursor-pointer`}
                onClick={() => { setSelectedPat(q); setVitals(VITALS_DEFAULTS); }}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="font-black text-slate-800">{q.patient_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {q.patient_no} · {q.age} yrs · {q.gender}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500"><AccessTime sx={{ fontSize: 12 }} /> Arrived</p>
                    <p className="text-xs font-bold text-slate-700">{new Date(q.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Triage Form */}
        {selectedPat && (
          <div className="flex-1 w-full bg-white card p-6 border-2 border-primary-200 sticky top-4">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-primary-100">
              <div>
                <h2 className="font-black text-primary-800 text-lg">Record Vitals</h2>
                <p className="font-bold text-slate-800">{selectedPat.patient_name}</p>
                <p className="text-xs text-slate-500">{selectedPat.patient_no} · {selectedPat.age} · {selectedPat.gender}</p>
              </div>
              <button onClick={() => setSelectedPat(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <div className="space-y-5">
              {/* Vitals grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Temp (°C)', field: 'temperature', placeholder: '36.5' },
                  { label: 'Pulse (bpm)', field: 'pulse', placeholder: '72' },
                  { label: 'BP Systolic', field: 'bpSystolic', placeholder: '120' },
                  { label: 'BP Diastolic', field: 'bpDiastolic', placeholder: '80' },
                  { label: 'RR (/min)', field: 'respRate', placeholder: '18' },
                  { label: 'SpO₂ (%)', field: 'spo2', placeholder: '98' },
                  { label: 'Weight (kg)', field: 'weight', placeholder: '70' },
                  { label: 'RBS (mmol/L)', field: 'bloodGlucose', placeholder: '5.5' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <input type="number" step="any" className="input text-sm px-2 py-1.5" value={vitals[field]} onChange={v(field)} placeholder={placeholder} />
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Presenting Complaint</label>
                <textarea className="input resize-none" rows={2} value={vitals.complaint} onChange={v('complaint')}
                  placeholder="Chief complaint at triage…" />
              </div>

              <div>
                <label className="label">Assign Triage Priority *</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {['emergency', 'urgent', 'normal'].map(pri => {
                    const cfg = PRIORITY_CFG[pri];
                    return (
                      <button key={pri} onClick={() => setVitals(p => ({ ...p, priority: pri }))}
                        className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm capitalize transition-all
                          ${vitals.priority === pri ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setSelectedPat(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary">
                  {saving ? 'Sending…' : <><MonitorHeart sx={{ fontSize: 16 }} /> Send to Doctor</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
