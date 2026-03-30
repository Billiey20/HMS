import React, { useState, useEffect, useCallback } from 'react';
import {
  MonitorHeart, Search, Add, Warning, CheckCircle, Refresh
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { patientService, opdService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PRIORITY_CFG = {
  emergency: { label: 'Emergency', badge: 'badge-red',   border: 'border-l-red-500',   bg: 'bg-red-50'    },
  urgent:    { label: 'Urgent',    badge: 'badge-amber',  border: 'border-l-amber-400', bg: 'bg-amber-50'  },
  normal:    { label: 'Normal',    badge: 'badge-green',  border: 'border-l-slate-200', bg: ''             },
};

const VITALS_DEFAULTS = {
  temperature: '', pulse: '', bpSystolic: '', bpDiastolic: '',
  respRate: '', spo2: '', weight: '', height: '', bloodGlucose: '',
  complaint: '', priority: 'normal',
};

function flagTemp(v)   { const n = parseFloat(v); return n < 35.5 || n > 38 ? 'text-red-600' : 'text-slate-800'; }
function flagPulse(v)  { const n = parseInt(v);   return n < 60   || n > 100 ? 'text-red-600' : 'text-slate-800'; }
function flagSpo2(v)   { const n = parseFloat(v); return n < 95           ? 'text-red-600' : 'text-slate-800'; }

export default function Triage() {
  const { user } = useAuth();
  const [queue, setQueue]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [showForm, setShowForm]   = useState(false);

  // Patient search state
  const [patSearch, setPatSearch]     = useState('');
  const [patResults, setPatResults]   = useState([]);
  const [selectedPat, setSelectedPat] = useState(null);

  const [vitals, setVitals] = useState(VITALS_DEFAULTS);
  const v = (field) => (e) => setVitals(p => ({ ...p, [field]: e.target.value }));

  // ── Load today's queue ───────────────────────────────────────────────────────
  const loadQueue = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await opdService.getQueue();
      setQueue(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // ── Patient search ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!patSearch || patSearch.length < 2) { setPatResults([]); return; }
    const t = setTimeout(async () => {
      const data = await patientService.list({ search: patSearch });
      setPatResults((data || []).slice(0, 6));
    }, 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  // ── Submit triage ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedPat) { alert('Select a patient first.'); return; }
    setSaving(true);
    try {
      await opdService.createVisit({
        patient_id:           selectedPat.id,
        presenting_complaint: vitals.complaint,
        triage_priority:      vitals.priority,
        temperature:          parseFloat(vitals.temperature) || null,
        pulse:                parseInt(vitals.pulse)         || null,
        bp_systolic:          parseInt(vitals.bpSystolic)    || null,
        bp_diastolic:         parseInt(vitals.bpDiastolic)   || null,
        respiratory_rate:     parseInt(vitals.respRate)       || null,
        spo2:                 parseFloat(vitals.spo2)         || null,
        weight_kg:            parseFloat(vitals.weight)       || null,
        height_cm:            parseFloat(vitals.height)       || null,
        blood_glucose:        parseFloat(vitals.bloodGlucose) || null,
        triaged_by:           user?.id || null,
        status:               'waiting',
        visit_type:           'Walk-In',
      });
      setVitals(VITALS_DEFAULTS);
      setSelectedPat(null);
      setPatSearch('');
      setShowForm(false);
      await loadQueue();
    } catch (e) {
      alert('Failed to save triage: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    emergency: queue.filter(q => q.triage_priority === 'emergency').length,
    urgent:    queue.filter(q => q.triage_priority === 'urgent').length,
    waiting:   queue.filter(q => q.status === 'waiting').length,
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">OPD Triage</h1>
          <p className="text-sm text-slate-500">Live queue · {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadQueue} className="btn-secondary"><Refresh sx={{ fontSize: 16 }} /> Refresh</button>
          <button onClick={() => setShowForm(s => !s)} className="btn-primary">
            <Add sx={{ fontSize: 18 }} /> New Triage
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center border-red-100 bg-red-50">
          <p className="text-3xl font-black text-red-700">{counts.emergency}</p>
          <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Emergency</p>
        </div>
        <div className="card p-4 text-center border-amber-100 bg-amber-50">
          <p className="text-3xl font-black text-amber-700">{counts.urgent}</p>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Urgent</p>
        </div>
        <div className="card p-4 text-center border-slate-100">
          <p className="text-3xl font-black text-slate-700">{counts.waiting}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Waiting</p>
        </div>
      </div>

      {/* Triage form */}
      {showForm && (
        <div className="card p-6 border-2 border-primary-200 space-y-5">
          <h2 className="font-black text-slate-800 text-base">Record Triage</h2>

          {/* Patient search */}
          <div>
            <label className="label">Patient *</label>
            {selectedPat ? (
              <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl">
                <div>
                  <p className="font-bold text-primary-800">{selectedPat.first_name} {selectedPat.last_name}</p>
                  <p className="text-xs text-primary-600">{selectedPat.patient_no} · {selectedPat.age} · {selectedPat.gender}</p>
                </div>
                <button onClick={() => { setSelectedPat(null); setPatSearch(''); }} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
                <input className="input pl-9" value={patSearch} onChange={e => setPatSearch(e.target.value)}
                  placeholder="Search patient by name or ID…" />
                {patResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl mt-1 z-30 overflow-hidden">
                    {patResults.map(p => (
                      <button key={p.id} onClick={() => { setSelectedPat(p); setPatSearch(''); setPatResults([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                        <p className="font-bold text-slate-800 text-sm">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-slate-500">{p.patient_no} · {p.age} · {p.gender}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vitals grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Temp (°C)',   field: 'temperature', placeholder: '36.5' },
              { label: 'Pulse (bpm)', field: 'pulse',       placeholder: '72'   },
              { label: 'BP Systolic', field: 'bpSystolic',  placeholder: '120'  },
              { label: 'BP Diastolic',field: 'bpDiastolic', placeholder: '80'   },
              { label: 'RR (/min)',   field: 'respRate',     placeholder: '18'   },
              { label: 'SpO₂ (%)',   field: 'spo2',         placeholder: '98'   },
              { label: 'Weight (kg)',  field: 'weight',      placeholder: '70'   },
              { label: 'RBS (mmol/L)',field: 'bloodGlucose', placeholder: '5.5'  },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input type="number" step="any" className="input" value={vitals[field]} onChange={v(field)} placeholder={placeholder} />
              </div>
            ))}
          </div>

          <div>
            <label className="label">Presenting Complaint</label>
            <textarea className="input resize-none" rows={2} value={vitals.complaint} onChange={v('complaint')}
              placeholder="Chief complaint…" />
          </div>

          <div>
            <label className="label">Triage Priority *</label>
            <div className="flex gap-3">
              {['emergency','urgent','normal'].map(pri => {
                const cfg = PRIORITY_CFG[pri];
                return (
                  <button key={pri} onClick={() => setVitals(p => ({ ...p, priority: pri }))}
                    className={`px-5 py-2.5 rounded-xl border-2 font-bold text-sm capitalize transition-all
                      ${vitals.priority === pri ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : <><MonitorHeart sx={{ fontSize: 16 }} /> Submit Triage</>}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Queue */}
      <div className="space-y-3">
        {loading && <div className="card p-8 text-center text-slate-400">Loading queue…</div>}
        {!loading && queue.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <MonitorHeart sx={{ fontSize: 48 }} className="mb-3 text-slate-200" />
            <p className="font-bold text-slate-500">No patients in queue today</p>
            <p className="text-sm mt-1">Use "New Triage" to add the first patient</p>
          </div>
        )}
        {!loading && queue.map(q => {
          const cfg = PRIORITY_CFG[q.triage_priority] || PRIORITY_CFG.normal;
          return (
            <div key={q.visit_id}
              className={`card p-4 border-l-4 ${cfg.border} ${cfg.bg}`}>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {q.queue_no && <span className="badge badge-slate font-mono">#{q.queue_no}</span>}
                    <h3 className="font-black text-slate-800">{q.patient_name}</h3>
                    <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    <span className="badge badge-slate">{q.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {q.patient_no} · {q.age} · {q.gender}
                    {q.presenting_complaint && ` · ${q.presenting_complaint}`}
                    {q.assigned_doctor && ` · Dr. ${q.assigned_doctor}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn-secondary text-xs py-1.5 px-3">View</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
