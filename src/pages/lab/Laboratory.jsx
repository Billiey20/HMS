import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Science, Refresh, Print, CheckCircle,
  Warning, HourglassEmpty, Search, Assignment,
  Send, Cancel, FactCheck, MedicalServices, ArrowForward
} from '@mui/icons-material';
import { labService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TEST_TEMPLATES, computeFlag, refInterval } from '../../utils/labConstants';
import LabReportPreview from '../../components/modals/LabReportPreview';
import { notify } from '../../utils/toast';
import LoadingDots from '../../components/common/LoadingDots';

// ── Helpers ───────────────────────────────────────────────────────────────────


function patientName(order) {
  const p = order?.patients;
  if (!p) return '—';
  return `${p.first_name} ${p.last_name}`;
}

function urgencyBadge(urgency) {
  const cfg = { routine: 'bg-slate-100 text-slate-600', urgent: 'bg-amber-100 text-amber-700', stat: 'bg-red-100 text-red-700 animate-pulse' };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg[urgency] || cfg.routine} capitalize tracking-wider`}>{urgency || 'Routine'}</span>;
}




// ── RESULT ENTRY MODAL ────────────────────────────────────────────────────────
function ResultEntryModal({ item, onClose, onSave }) {
  const testName = item.test_name;
  const template = TEST_TEMPLATES[testName] || [];
  let initial = {};
  try { initial = item.result ? JSON.parse(item.result) : {}; } catch { }
  const [results, setResults] = useState(initial);
  const [saving, setSaving] = useState(false);

  const setField = (name, val) => setResults(prev => ({ ...prev, [name]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.id, results);
      onClose();
    } catch (e) {
      notify.error('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 border border-slate-200">
        <div className="flex justify-between items-start px-6 py-4 bg-primary-600 rounded-t-2xl">
          <div>
            <h2 className="font-black text-white text-lg">Enter Results</h2>
            <p className="text-blue-200 text-xs">{testName} · {item.lab_id}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {template.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Parameter', 'Result', 'Unit', 'Flag', 'Reference'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-bold text-slate-500 capitalize tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {template.map(row => {
                  const val = results[row.name] || '';
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
                          <span className={`font-mono text-xs ${flag === 'H' || flag === 'L' ? 'badge font-bold' : 'font-normal text-slate-500'}`}>
                            {flag === 'H' ? <span className="badge-red">{flag}</span> : flag === 'L' ? <span className="badge-blue">{flag}</span> : flag}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-xs">{refInterval(row)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div>
              <p className="text-sm text-slate-500 mb-3">No structured template — enter free-text result:</p>
              <textarea rows={5} value={results.__freetext || ''}
                onChange={e => setField('__freetext', e.target.value)}
                placeholder="Enter result here…" className="input resize-none" />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Science sx={{ fontSize: 16 }} /> {saving ? 'Saving…' : 'Save Results'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── REJECT SAMPLE MODAL ───────────────────────────────────────────────────────
function RejectModal({ item, onClose, onReject }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const presets = ['Insufficient sample', 'Haemolysed sample', 'Wrong container', 'Clotted sample', 'Unlabelled specimen', 'Expired container'];

  const handleReject = async () => {
    if (!reason.trim()) { notify.warn('Please provide a rejection reason.'); return; }
    setSaving(true);
    try {
      await onReject(item.id, reason);
      onClose();
    } catch (e) {
      notify.error('Failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-red-200">
        <div className="flex justify-between items-center px-6 py-4 bg-red-600 rounded-t-2xl">
          <div>
            <h2 className="font-black text-white">Reject Sample</h2>
            <p className="text-red-200 text-xs">{item.test_name} · {item.lab_id}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Select a reason or type a custom one:</p>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button key={p} onClick={() => setReason(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                  ${reason === p ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white text-slate-600 border-slate-200 hover:border-red-200'}`}>
                {p}
              </button>
            ))}
          </div>
          <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Or type custom reason…" className="input resize-none text-sm" />
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleReject} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors">
            <Cancel sx={{ fontSize: 16 }} /> {saving ? 'Rejecting…' : 'Reject Sample'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TABLE HEADER ROW ──────────────────────────────────────────────────────────
function TH({ children, className = '' }) {
  return <th className={`px-4 py-3 text-[11px] font-bold text-slate-500 capitalize tracking-widest text-left whitespace-nowrap ${className}`}>{children}</th>;
}
function TD({ children, className = '' }) {
  return <td className={`px-4 py-4 ${className}`}>{children}</td>;
}

// ── MAIN LABORATORY PAGE ──────────────────────────────────────────────────────
const STAGES = [
  { key: 'requests', label: 'Lab Requests', icon: <Assignment sx={{ fontSize: 16 }} /> },
  { key: 'sample', label: 'Sample Collection', icon: <MedicalServices sx={{ fontSize: 16 }} /> },
  { key: 'results', label: 'Results', icon: <Science sx={{ fontSize: 16 }} /> },
  { key: 'validation', label: 'Validation', icon: <FactCheck sx={{ fontSize: 16 }} /> },
  { key: 'posted', label: 'Posted', icon: <Send sx={{ fontSize: 16 }} /> },
];

export default function Laboratory() {
  const { user } = useAuth();
  const [stage, setStage] = useState('requests');
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [submittingId, setSubmittingId] = useState(null); // Track which item is processing
  const [submittingOrder, setSubmittingOrder] = useState(null); // Track which order is processing
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modals
  const [enteringResult, setEnteringResult] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const loadAll = useCallback(async () => {
    setFetching(true); setError(null);
    try {
      const [ordersData, itemsData] = await Promise.all([
        labService.listOrders(),
        labService.listItems(),
      ]);
      setOrders(ordersData);
      setItems(itemsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Sync with global Refresh button in Layout
  useEffect(() => {
    const handleRefresh = () => loadAll();
    window.addEventListener('hms-refresh-lab', handleRefresh);
    return () => window.removeEventListener('hms-refresh-lab', handleRefresh);
  }, [loadAll]);

  // ── Derived data per stage ────────────────────────────────────────────────
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const sampleItems = items.filter(i => i.sample_status === 'pending' && i.lab_orders?.status === 'processing');
  const resultsItems = items.filter(i => i.sample_status === 'collected' && !i.result && i.status !== 'cancelled');
  const validationItems = items.filter(i => i.sample_status === 'collected' && i.result && i.status !== 'completed' && !i.posted_at);
  const postedItems = items.filter(i => i.posted_at);

  const counts = {
    requests: pendingOrders.length,
    sample: sampleItems.length,
    results: resultsItems.length,
    validation: validationItems.length,
    posted: postedItems.length,
  };

  // ── Search filter helpers ─────────────────────────────────────────────────
  const matchesSearch = (orderObj) => {
    if (!search) return true;
    const p = orderObj?.patients;
    const name = `${p?.first_name || ''} ${p?.last_name || ''}`.toLowerCase();
    const no = (p?.patient_no || '').toLowerCase();
    return name.includes(search.toLowerCase()) || no.includes(search.toLowerCase());
  };
  const matchesItemSearch = (item) => matchesSearch(item.lab_orders);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleReceive = async (orderId) => {
    setSubmittingOrder(orderId);
    try {
      await labService.receiveOrder(orderId);
      await loadAll();
      notify.success('Order received.');
    } catch (e) { notify.error('Error: ' + e.message); }
    finally { setSubmittingOrder(null); }
  };

  const handleAcceptSample = async (itemId) => {
    setSubmittingId(itemId);
    try {
      await labService.acceptSample(itemId);
      await loadAll();
      notify.success('Sample accepted.');
    } catch (e) { notify.error('Error: ' + e.message); }
    finally { setSubmittingId(null); }
  };

  const handleRejectSample = async (itemId, reason) => {
    setSubmittingId(itemId);
    try {
      await labService.rejectSample(itemId, reason);
      await loadAll();
      notify.success('Sample rejected.');
    } catch (e) { notify.error('Error: ' + e.message); }
    finally { setSubmittingId(null); }
  };

  const handleSaveResult = async (itemId, resultObj) => {
    // ResultEntryModal handles its own saving state internally, 
    // but we still refresh data here.
    try {
      await labService.saveItemResult(itemId, resultObj);
      await loadAll();
      notify.success('Results saved.');
    } catch (e) { notify.error('Error: ' + e.message); }
  };

  const handleValidate = async (itemId) => {
    setSubmittingId(itemId);
    try {
      await labService.validateItem(itemId, user.id);
      await loadAll();
      notify.success('Results validated.');
    } catch (e) { notify.error('Error: ' + e.message); }
    finally { setSubmittingId(null); }
  };

  const handlePost = async (orderId) => {
    setSubmittingOrder(orderId);
    try {
      await labService.postOrder(orderId);
      await loadAll();
      notify.success('Results posted. Patient has been returned to the Doctor\'s Queue.');
    } catch (e) { notify.error('Error: ' + e.message); }
    finally { setSubmittingOrder(null); }
  };

  // Group posted items by order
  const postedByOrder = postedItems.reduce((acc, item) => {
    const oid = item.lab_orders?.id || 'unknown';
    if (!acc[oid]) acc[oid] = { order: item.lab_orders, items: [] };
    acc[oid].items.push(item);
    return acc;
  }, {});

  const currentStageItems = { requests: pendingOrders, sample: sampleItems, results: resultsItems, validation: validationItems, posted: postedItems };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Pipeline Progress — Ultra-Slim Horizontal Stage Cards */}
      <div className="py-2 select-none">
        <div className="flex items-center justify-between gap-2 max-w-6xl mx-auto overflow-x-auto pt-3 pb-2 scrollbar-hide">
          {STAGES.map((s, idx) => (
            <React.Fragment key={s.key}>
              <button
                onClick={() => setStage(s.key)}
                className={`flex-1 min-w-[180px] flex items-center gap-3 px-4 py-1.5 rounded-xl transition-all border-2 group
                  ${stage === s.key
                    ? 'bg-white border-primary-600 shadow-md shadow-primary-50 -translate-y-0.5'
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>

                <div className={`shrink-0 transition-all ${stage === s.key ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {React.cloneElement(s.icon, { sx: { fontSize: 18 } })}
                </div>

                <span className={`text-[11px] font-black uppercase tracking-tight truncate flex-1 text-left ${stage === s.key ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.label}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-xs font-black ${stage === s.key ? 'text-primary-600' : counts[s.key] > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                    {counts[s.key]}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">tests</span>
                </div>
              </button>

              {idx < STAGES.length - 1 && (
                <div className="text-slate-200 shrink-0 px-1">
                  <ArrowForward sx={{ fontSize: 12 }} className={counts[STAGES[idx + 1].key] > 0 ? 'text-primary-100' : ''} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">⚠️ {error}</div>}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by patient name or ID…"
          className="input pl-9 bg-white border-slate-200 shadow-sm" />
      </div>

      {/* ── STAGE CONTENT ──────────────────────────────────────────────── */}
      <div className="card border border-slate-200 overflow-hidden">

        {/* Stage 1: Lab Requests */}
        {stage === 'requests' && (
          <div>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-700">Lab Requests <span className="text-slate-400 font-normal text-sm">— Awaiting acknowledgement</span></h2>
            </div>
            {fetching && <div className="p-12 text-center text-slate-400 animate-pulse">Loading requests…</div>}
            {!fetching && pendingOrders.filter(matchesSearch).length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <Assignment sx={{ fontSize: 48 }} className="mb-3 text-slate-200" />
                <p className="font-bold">No pending lab requests</p>
                <p className="text-sm mt-1">Orders created by doctors during consultation will appear here.</p>
              </div>
            )}
            {!fetching && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr><TH>Patient</TH><TH>Patient No.</TH><TH>Ordered tests</TH><TH>Priority</TH><TH>Requested</TH><TH className="text-right">Action</TH></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingOrders.filter(matchesSearch).map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <TD><span className="font-bold text-slate-800">{patientName(order)}</span></TD>
                        <TD><span className="font-mono text-xs text-slate-500">{order.patients?.patient_no}</span></TD>
                        <TD>
                          <div className="flex flex-wrap gap-1">
                            {(order.lab_order_items || []).map(i => (
                              <span key={i.id} className="px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-[11px] font-semibold">{i.test_name}</span>
                            ))}
                          </div>
                        </TD>
                        <TD>{urgencyBadge(order.urgency)}</TD>
                        <TD><span className="text-xs text-slate-500">{new Date(order.ordered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></TD>
                        <TD className="text-right">
                          <button onClick={() => handleReceive(order.id)} disabled={submittingOrder === order.id}
                            className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-sm min-w-[120px] flex items-center justify-center`}>
                            {submittingOrder === order.id ? <LoadingDots /> : 'Receive Request'}
                          </button>
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stage 2: Sample Collection */}
        {stage === 'sample' && (
          <div>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-700">Sample Collection <span className="text-slate-400 font-normal text-sm">— Accept or reject incoming samples</span></h2>
            </div>
            {fetching && <div className="p-12 text-center text-slate-400 animate-pulse">Loading…</div>}
            {!fetching && sampleItems.filter(matchesItemSearch).length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <MedicalServices sx={{ fontSize: 48 }} className="mb-3 text-slate-200" />
                <p className="font-bold">No samples awaiting collection</p>
                <p className="text-sm mt-1">Received orders will appear here, broken down by individual test.</p>
              </div>
            )}
            {!fetching && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr><TH>Lab ID</TH><TH>Test</TH><TH>Patient</TH><TH>Patient No.</TH><TH>Priority</TH><TH className="text-right">Actions</TH></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sampleItems.filter(matchesItemSearch).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <TD><span className="font-mono text-sm font-black text-primary-700">{item.lab_id || '—'}</span></TD>
                        <TD><span className="font-semibold text-slate-800">{item.test_name}</span></TD>
                        <TD><span className="font-medium">{patientName(item.lab_orders)}</span></TD>
                        <TD><span className="font-mono text-xs text-slate-500">{item.lab_orders?.patients?.patient_no}</span></TD>
                        <TD>{urgencyBadge(item.lab_orders?.urgency)}</TD>
                        <TD className="text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setRejectingItem(item)} disabled={submittingId === item.id}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1">
                              <Cancel sx={{ fontSize: 14 }} /> Reject
                            </button>
                            <button onClick={() => handleAcceptSample(item.id)} disabled={submittingId === item.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-sm min-w-[80px] justify-center">
                              {submittingId === item.id ? <LoadingDots /> : <><CheckCircle sx={{ fontSize: 14 }} /> Accept</>}
                            </button>
                          </div>
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stage 3: Results Entry */}
        {stage === 'results' && (
          <div>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-700">Results Entry <span className="text-slate-400 font-normal text-sm">— Enter test results for accepted samples</span></h2>
            </div>
            {fetching && <div className="p-12 text-center text-slate-400 animate-pulse">Loading…</div>}
            {!fetching && resultsItems.filter(matchesItemSearch).length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <Science sx={{ fontSize: 48 }} className="mb-3 text-slate-200" />
                <p className="font-bold">No samples awaiting results</p>
                <p className="text-sm mt-1">Accept samples in the Sample Collection stage first.</p>
              </div>
            )}
            {!fetching && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr><TH>Lab ID</TH><TH>Test</TH><TH>Patient</TH><TH>Patient No.</TH><TH>Status</TH><TH className="text-right">Action</TH></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {resultsItems.filter(matchesItemSearch).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <TD><span className="font-mono text-sm font-black text-primary-700">{item.lab_id || '—'}</span></TD>
                        <TD><span className="font-semibold text-slate-800">{item.test_name}</span></TD>
                        <TD><span className="font-medium">{patientName(item.lab_orders)}</span></TD>
                        <TD><span className="font-mono text-xs text-slate-500">{item.lab_orders?.patients?.patient_no}</span></TD>
                        <TD>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold">
                            <HourglassEmpty sx={{ fontSize: 12 }} /> Awaiting results
                          </span>
                        </TD>
                        <TD className="text-right">
                          <button onClick={() => setEnteringResult(item)}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-sm flex items-center gap-1.5 ml-auto">
                            <Science sx={{ fontSize: 14 }} /> Enter Results
                          </button>
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stage 4: Validation */}
        {stage === 'validation' && (
          <div>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-700">Validation <span className="text-slate-400 font-normal text-sm">— Review, preview, and validate results before posting</span></h2>
            </div>
            {fetching && <div className="p-12 text-center text-slate-400 animate-pulse">Loading…</div>}
            {!fetching && validationItems.filter(matchesItemSearch).length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <FactCheck sx={{ fontSize: 48 }} className="mb-3 text-slate-200" />
                <p className="font-bold">No results awaiting validation</p>
                <p className="text-sm mt-1">Enter results in the Results stage first.</p>
              </div>
            )}
            {!fetching && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr><TH>Lab ID</TH><TH>Test</TH><TH>Patient</TH><TH>Result Summary</TH><TH>Status</TH><TH className="text-right">Actions</TH></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {validationItems.filter(matchesItemSearch).map(item => {
                      let parsed = {};
                      try { parsed = item.result ? JSON.parse(item.result) : {}; } catch { }
                      const hasFreeText = parsed.__freetext;
                      const keys = Object.keys(parsed).filter(k => k !== '__freetext');
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <TD><span className="font-mono text-sm font-black text-primary-700">{item.lab_id || '—'}</span></TD>
                          <TD><span className="font-semibold text-slate-800">{item.test_name}</span></TD>
                          <TD><span className="font-medium">{patientName(item.lab_orders)}</span></TD>
                          <TD>
                            <div className="text-xs text-slate-500 max-w-[200px] truncate">
                              {hasFreeText ? parsed.__freetext :
                                keys.slice(0, 3).map(k => `${k}: ${parsed[k]}`).join('  ·  ')}
                              {keys.length > 3 && <span className="text-slate-400"> +{keys.length - 3} more</span>}
                            </div>
                          </TD>
                          <TD>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-bold">
                              Results entered
                            </span>
                          </TD>
                          <TD className="text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setPreviewItem(item)} disabled={submittingId === item.id}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1">
                                <Print sx={{ fontSize: 14 }} /> Preview
                              </button>
                              <button onClick={() => handleValidate(item.id)} disabled={submittingId === item.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-sm min-w-[90px] justify-center">
                                {submittingId === item.id ? <LoadingDots /> : <><FactCheck sx={{ fontSize: 14 }} /> Validate</>}
                              </button>
                            </div>
                          </TD>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Post panel — show if there are validated (completed) but not-yet-posted items */}
            {!fetching && (() => {
              const readyToPost = items.filter(i => i.status === 'completed' && !i.posted_at);
              if (readyToPost.length === 0) return null;
              const byOrder = readyToPost.reduce((acc, item) => {
                const oid = item.lab_orders?.id;
                if (!acc[oid]) acc[oid] = { order: item.lab_orders, items: [] };
                acc[oid].items.push(item);
                return acc;
              }, {});
              return (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  <p className="text-sm font-bold text-slate-500 px-2">Ready to Post ({readyToPost.length} validated test{readyToPost.length > 1 ? 's' : ''})</p>
                  {Object.values(byOrder).map(({ order, items: oi }) => (
                    <div key={order?.id} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{patientName(order)}</p>
                        <p className="text-xs text-slate-500">{oi.length} test{oi.length > 1 ? 's' : ''} validated · {order?.patients?.patient_no}</p>
                      </div>
                      <button onClick={() => handlePost(order?.id)} disabled={submittingOrder === order?.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm min-w-[150px] justify-center">
                        {submittingOrder === order?.id ? <LoadingDots /> : <><Send sx={{ fontSize: 14 }} /> Post Results to Doctor</>}
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Stage 5: Posted */}
        {stage === 'posted' && (
          <div>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-700">Posted Results <span className="text-slate-400 font-normal text-sm">— Published to doctors</span></h2>
            </div>
            {fetching && <div className="p-12 text-center text-slate-400 animate-pulse">Loading…</div>}
            {!fetching && Object.values(postedByOrder).filter(({ order }) => matchesSearch(order)).length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <Send sx={{ fontSize: 48 }} className="mb-3 text-slate-200" />
                <p className="font-bold">No results posted yet</p>
              </div>
            )}
            {!fetching && (
              <div className="p-4 space-y-4">
                {Object.values(postedByOrder).filter(({ order }) => matchesSearch(order)).map(({ order, items: oi }) => (
                  <div key={order?.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center px-5 py-3 bg-slate-50 border-b border-slate-100">
                      <div>
                        <p className="font-black text-slate-800">{patientName(order)}</p>
                        <p className="text-xs text-slate-500">{order?.patients?.patient_no} · Posted {new Date(oi[0]?.posted_at).toLocaleDateString()}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                        <CheckCircle sx={{ fontSize: 12 }} /> Posted
                      </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {oi.map(item => (
                        <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-primary-600">{item.lab_id}</span>
                            <span className="text-sm font-semibold text-slate-700">{item.test_name}</span>
                          </div>
                          <button onClick={() => setPreviewItem(item)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all">
                            <Print sx={{ fontSize: 13 }} /> Print
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {rejectingItem && <RejectModal item={rejectingItem} onClose={() => setRejectingItem(null)} onReject={handleRejectSample} />}
      {enteringResult && <ResultEntryModal item={enteringResult} onClose={() => setEnteringResult(null)} onSave={handleSaveResult} />}
      {previewItem && <LabReportPreview item={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
}
