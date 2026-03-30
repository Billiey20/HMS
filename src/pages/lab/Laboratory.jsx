import React, { useState, useEffect, useCallback } from 'react';
import {
  Science, Search, Save, Print, Refresh, Warning
} from '@mui/icons-material';
import { labService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TEST_TEMPLATES = {
  'Full Haemogram / CBC': [
    { name: 'WBC',          unit: '×10³/μL', refLow: 4.0,  refHigh: 11.0, type: 'number' },
    { name: 'RBC',          unit: '×10⁶/μL', refLow: 4.2,  refHigh: 5.4,  type: 'number' },
    { name: 'Haemoglobin',  unit: 'g/dL',    refLow: 11.5, refHigh: 17.5, type: 'number' },
    { name: 'HCT',          unit: '%',        refLow: 37,   refHigh: 52,   type: 'number' },
    { name: 'MCV',          unit: 'fL',       refLow: 80,   refHigh: 100,  type: 'number' },
    { name: 'MCH',          unit: 'pg',       refLow: 27,   refHigh: 33,   type: 'number' },
    { name: 'MCHC',         unit: 'g/dL',     refLow: 32,   refHigh: 36,   type: 'number' },
    { name: 'Platelets',    unit: '×10³/μL',  refLow: 150,  refHigh: 400,  type: 'number' },
    { name: 'Neutrophils',  unit: '%',        refLow: 45,   refHigh: 75,   type: 'number' },
    { name: 'Lymphocytes',  unit: '%',        refLow: 20,   refHigh: 40,   type: 'number' },
  ],
  'Urinalysis (UA)': [
    { name: 'Colour',       unit: '',  refText: 'Yellow',  type: 'select', options: ['Yellow','Pale yellow','Dark yellow','Amber','Orange','Red','Brown','Clear'] },
    { name: 'Appearance',   unit: '',  refText: 'Clear',   type: 'select', options: ['Clear','Slightly turbid','Turbid','Cloudy'] },
    { name: 'pH',           unit: '',  refLow: 4.5, refHigh: 8.0, type: 'number' },
    { name: 'Specific Gravity',unit:'',refLow:1.005,refHigh:1.030,type:'number'},
    { name: 'Protein',      unit: '',  refText: 'Negative', type: 'select', options: ['Negative','Trace','+1','+2','+3'] },
    { name: 'Glucose',      unit: '',  refText: 'Negative', type: 'select', options: ['Negative','Trace','+1','+2','+3'] },
    { name: 'Nitrites',     unit: '',  refText: 'Negative', type: 'select', options: ['Negative','Positive'] },
    { name: 'Leucocytes',   unit: '',  refText: 'Negative', type: 'select', options: ['Negative','Trace','+1','+2','+3'] },
    { name: 'Blood',        unit: '',  refText: 'Negative', type: 'select', options: ['Negative','Trace','+1','+2','+3'] },
    { name: 'Pus Cells',    unit: '/HPF', refText: '0-4',  type: 'text' },
    { name: 'RBCs',         unit: '/HPF', refText: '0-2',  type: 'text' },
  ],
  'Random Blood Sugar (RBS)': [
    { name: 'Blood Glucose (Random)', unit: 'mmol/L', refLow: 3.9, refHigh: 11.1, type: 'number' },
  ],
  'Malaria RDT': [
    { name: 'P. falciparum Ag (HRP-2)', unit: '', refText: 'Negative', type: 'select', options: ['Negative','Positive'] },
    { name: 'Pan-Malaria Ag (pLDH)',    unit: '', refText: 'Negative', type: 'select', options: ['Negative','Positive'] },
  ],
  'HIV 1 & 2 Antibody Test': [
    { name: 'HIV 1 & 2 Ab (Screen)',  unit: '', refText: 'Non-reactive', type: 'select', options: ['Non-reactive','Reactive'] },
    { name: 'Final Result',           unit: '', refText: 'Negative',     type: 'select', options: ['Negative','Positive','Indeterminate'] },
  ],
  'Urea, Electrolytes & Creatinine (UECs)': [
    { name: 'Sodium (Na⁺)',   unit: 'mmol/L', refLow: 136, refHigh: 145, type: 'number' },
    { name: 'Potassium (K⁺)', unit: 'mmol/L', refLow: 3.5, refHigh: 5.1, type: 'number' },
    { name: 'Urea',           unit: 'mmol/L', refLow: 2.5, refHigh: 7.5, type: 'number' },
    { name: 'Creatinine',     unit: 'μmol/L', refLow: 62,  refHigh: 115, type: 'number' },
    { name: 'eGFR',           unit: 'mL/min/1.73m²', refLow: 60, refHigh:120, type: 'number' },
  ],
  'Stool Analysis': [
    { name: 'Colour',      unit: '', refText: 'Brown',  type: 'select', options: ['Brown','Yellow','Green','Black','Red','White'] },
    { name: 'Consistency', unit: '', refText: 'Formed', type: 'select', options: ['Formed','Soft','Loose','Watery'] },
    { name: 'Frank Blood', unit: '', refText: 'Absent', type: 'select', options: ['Absent','Present'] },
    { name: 'Ova',         unit: '', refText: 'None seen', type: 'text' },
    { name: 'Cysts',       unit: '', refText: 'None seen', type: 'text' },
  ],
};

const STATUS_CFG = {
  pending:    { badge: 'badge-amber',  label: 'Pending',    icon: '⏳' },
  processing: { badge: 'badge-blue',   label: 'Processing', icon: '🔬' },
  completed:  { badge: 'badge-green',  label: 'Completed',  icon: '✅' },
  cancelled:  { badge: 'badge-red',    label: 'Cancelled',  icon: '✕'  },
};

const URGENCY_CFG = {
  routine: { badge: 'badge-slate', label: 'Routine' },
  urgent:  { badge: 'badge-amber', label: 'Urgent'  },
  stat:    { badge: 'badge-red',   label: 'STAT'    },
};

function computeFlag(value, row) {
  if (row.type !== 'number') return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  if (row.refHigh !== undefined && v > row.refHigh) return 'H';
  if (row.refLow  !== undefined && v < row.refLow)  return 'L';
  return 'N';
}

function ResultEntryModal({ order, onClose, onSave }) {
  const tests = (order.lab_order_items || []).map(i => i.test_name);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [allResults, setAllResults] = useState({});
  const [saving, setSaving]         = useState(false);
  const testName = tests[activeIdx];
  const template = TEST_TEMPLATES[testName] || [];

  const results  = allResults[testName] || {};
  const setField = (name, val) =>
    setAllResults(prev => ({ ...prev, [testName]: { ...prev[testName], [name]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Map results text for each lab_order_item
      const itemUpdates = (order.lab_order_items || []).map(item => ({
        id:     item.id,
        result: JSON.stringify(allResults[item.test_name] || {}),
      }));
      await onSave(order.id, itemUpdates);
      onClose();
    } catch (e) {
      alert('Failed to save results: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const refInterval = (row) => {
    if (row.refText) return row.refText;
    if (row.refLow !== undefined && row.refHigh !== undefined) return `${row.refLow} – ${row.refHigh}`;
    return '—';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6 border border-slate-200">
        <div className="flex justify-between items-start px-6 py-4 bg-primary-600 rounded-t-2xl">
          <div>
            <h2 className="font-black text-white text-lg">Enter Results</h2>
            <p className="text-blue-200 text-xs">
              {order.patients?.first_name} {order.patients?.last_name} · {order.patients?.patient_no}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>

        <div className="flex border-b border-slate-200 px-6 gap-1 overflow-x-auto bg-slate-50">
          {tests.map((t, i) => (
            <button key={t} onClick={() => setActiveIdx(i)}
              className={`shrink-0 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap
                ${activeIdx === i ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[55vh]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Test Parameter', 'Result', 'Unit', 'Flag', 'Reference'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {template.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-sm">
                    No template. Enter free-text result below.
                  </td>
                </tr>
              )}
              {template.map(row => {
                const val  = results[row.name] || '';
                const flag = computeFlag(val, row);
                const isAbn = flag === 'H' || flag === 'L';
                return (
                  <tr key={row.name} className={isAbn ? 'bg-red-50' : ''}>
                    <td className={`px-3 py-2 font-semibold ${isAbn ? 'text-red-700' : 'text-slate-800'}`}>{row.name}</td>
                    <td className="px-3 py-2">
                      {row.type === 'select' ? (
                        <select className="input text-sm py-1.5" value={val} onChange={e => setField(row.name, e.target.value)}>
                          <option value="">—</option>
                          {row.options?.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={row.type === 'number' ? 'number' : 'text'} step="any"
                          className={`input text-sm py-1.5 ${isAbn ? 'border-red-300 bg-red-50' : ''}`}
                          value={val} onChange={e => setField(row.name, e.target.value)} placeholder="—" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{row.unit || '—'}</td>
                    <td className="px-3 py-2">
                      {val && flag && (
                        <span className={`badge font-mono ${flag === 'H' ? 'badge-red' : flag === 'L' ? 'badge-blue' : 'badge-green'}`}>{flag}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{refInterval(row)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {template.length === 0 && (
            <textarea rows={4} value={results['__freetext'] || ''}
              onChange={e => setField('__freetext', e.target.value)}
              placeholder="Enter result here…" className="input resize-none mt-4" />
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save sx={{ fontSize: 16 }} /> {saving ? 'Saving…' : 'Save & Submit Results'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Laboratory() {
  const { user } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [statusFilter, setStatus] = useState('all');
  const [search, setSearch]       = useState('');
  const [entering, setEntering]   = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await labService.list();
      setOrders(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleStartProcessing = async (orderId) => {
    await labService.updateStatus(orderId, 'processing');
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'processing' } : o));
  };

  const handleSaveResults = async (orderId, itemUpdates) => {
    await labService.saveResults(orderId, itemUpdates);
    await loadOrders();
  };

  const counts = {
    pending:    orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed:  orders.filter(o => o.status === 'completed').length,
  };

  const filtered = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => {
      const name = `${o.patients?.first_name || ''} ${o.patients?.last_name || ''}`.toLowerCase();
      const no   = o.patients?.patient_no?.toLowerCase() || '';
      return name.includes(search.toLowerCase()) || no.includes(search.toLowerCase());
    });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Laboratory</h1>
          <p className="text-sm text-slate-500">Test requests, results entry and validation</p>
        </div>
        <button onClick={loadOrders} className="btn-secondary shrink-0">
          <Refresh sx={{ fontSize: 16 }} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center border-amber-100 bg-amber-50">
          <p className="text-3xl font-black text-amber-700">{counts.pending}</p>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Awaiting Processing</p>
        </div>
        <div className="card p-4 text-center border-blue-100 bg-blue-50">
          <p className="text-3xl font-black text-blue-700">{counts.processing}</p>
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">In Progress</p>
        </div>
        <div className="card p-4 text-center border-emerald-100 bg-emerald-50">
          <p className="text-3xl font-black text-emerald-700">{counts.completed}</p>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Results Ready</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">⚠️ {error}</div>}

      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient…" className="input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all','pending','processing','completed'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all capitalize
                ${statusFilter === s ? 'bg-primary-600 text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              {s === 'all' ? `All (${orders.length})` : `${s} (${counts[s] ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading && <div className="card p-8 text-center text-slate-400">Loading lab orders…</div>}
        {!loading && filtered.map(order => {
          const sc = STATUS_CFG[order.status] || STATUS_CFG.pending;
          const uc = URGENCY_CFG[order.urgency] || URGENCY_CFG.routine;
          const tests = (order.lab_order_items || []).map(i => i.test_name);
          return (
            <div key={order.id}
              className={`card p-4 border-l-4 ${order.urgency === 'stat' ? 'border-l-red-500' : order.urgency === 'urgent' ? 'border-l-amber-400' : 'border-l-slate-200'}`}>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-black text-slate-800">
                      {order.patients?.first_name} {order.patients?.last_name}
                    </h3>
                    <span className={`badge ${sc.badge}`}>{sc.icon} {sc.label}</span>
                    <span className={`badge ${uc.badge}`}>{uc.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {order.patients?.patient_no} · {order.patients?.age} · {order.patients?.gender} ·{' '}
                    {new Date(order.ordered_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tests.map(t => <span key={t} className="badge badge-slate text-xs">{t}</span>)}
                    {tests.length === 0 && <span className="text-xs text-slate-400 italic">No tests attached</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {order.status === 'pending' && (
                    <button onClick={() => handleStartProcessing(order.id)} className="btn-secondary text-sm py-2">
                      Start Processing
                    </button>
                  )}
                  {(order.status === 'pending' || order.status === 'processing') && (
                    <button onClick={() => setEntering(order)} className="btn-primary text-sm py-2">
                      <Science sx={{ fontSize: 16 }} /> Enter Results
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <button className="btn-secondary text-sm py-2 text-emerald-600">
                      <Print sx={{ fontSize: 16 }} /> Print Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <Science sx={{ fontSize: 48 }} className="mb-3 text-slate-200" />
            <p className="font-bold text-slate-500">
              {orders.length === 0 ? 'No lab orders yet — orders are created by doctors during consultation' : 'No orders match your filter'}
            </p>
          </div>
        )}
      </div>

      {entering && (
        <ResultEntryModal order={entering} onClose={() => setEntering(null)} onSave={handleSaveResults} />
      )}
    </div>
  );
}
