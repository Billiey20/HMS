import React, { useState } from 'react';
import {
  Inventory2, Search, Add, Warning, FileDownload,
  TrendingDown, CheckCircle, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  'All', 'PPE', 'Blood Collection', 'Urinalysis', 'Wound Care',
  'Staining & Slides', 'IV & Cannulas', 'Diagnostic Kits', 'Surgical',
  'Stationery & Packaging', 'Other'
];

// ── Stock items ───────────────────────────────────────────────────────────────
const INITIAL_STOCK = [
  { id: 'i01',  name: 'Examination Gloves (S)',          category: 'PPE',                unit: 'pairs', qty: 280,  reorder: 100, expiry: '2027-06', cost: 5 },
  { id: 'i02',  name: 'Examination Gloves (M)',          category: 'PPE',                unit: 'pairs', qty: 450,  reorder: 200, expiry: '2027-06', cost: 5 },
  { id: 'i03',  name: 'Examination Gloves (L)',          category: 'PPE',                unit: 'pairs', qty: 80,   reorder: 100, expiry: '2027-06', cost: 5 },
  { id: 'i04',  name: 'Surgical Masks (Type IIR)',       category: 'PPE',                unit: 'pcs',   qty: 600,  reorder: 200, expiry: '2027-12', cost: 12 },
  { id: 'i05',  name: 'EDTA Vacutainer Tubes (Purple)',  category: 'Blood Collection',   unit: 'tubes', qty: 320,  reorder: 150, expiry: '2026-09', cost: 18 },
  { id: 'i06',  name: 'SST Vacutainer Tubes (Gold)',     category: 'Blood Collection',   unit: 'tubes', qty: 95,   reorder: 150, expiry: '2026-08', cost: 22 },
  { id: 'i07',  name: 'Syringes 5ml + Needles',         category: 'Blood Collection',   unit: 'pcs',   qty: 420,  reorder: 200, expiry: '2028-01', cost: 8 },
  { id: 'i08',  name: 'Urine Containers (30ml)',         category: 'Urinalysis',         unit: 'pcs',   qty: 180,  reorder: 100, expiry: '2028-03', cost: 6 },
  { id: 'i09',  name: 'HVS Swab Tubes',                 category: 'Urinalysis',         unit: 'pcs',   qty: 55,   reorder: 50,  expiry: '2027-01', cost: 25 },
  { id: 'i10',  name: 'Uristrips 10-Parameter',         category: 'Urinalysis',         unit: 'strips',qty: 240,  reorder: 100, expiry: '2026-06', cost: 15 },
  { id: 'i11',  name: 'Glass Slides (50-pack)',          category: 'Staining & Slides',  unit: 'packs', qty: 28,   reorder: 10,  expiry: null,       cost: 180 },
  { id: 'i12',  name: 'Cover Slips (100-pack)',          category: 'Staining & Slides',  unit: 'packs', qty: 12,   reorder: 5,   expiry: null,       cost: 90 },
  { id: 'i13',  name: 'Leishman Stain 500ml',           category: 'Staining & Slides',  unit: 'bottles', qty: 3,  reorder: 5,   expiry: '2026-10', cost: 1200 },
  { id: 'i14',  name: 'Malaria RDT Kit (SD Bioline)',   category: 'Diagnostic Kits',    unit: 'kits',  qty: 75,   reorder: 50,  expiry: '2026-11', cost: 280 },
  { id: 'i15',  name: 'HIV RDT Kit (Determine)',        category: 'Diagnostic Kits',    unit: 'kits',  qty: 48,   reorder: 50,  expiry: '2026-09', cost: 320 },
  { id: 'i16',  name: 'HBsAg RDT Kit',                 category: 'Diagnostic Kits',    unit: 'kits',  qty: 36,   reorder: 30,  expiry: '2026-12', cost: 250 },
  { id: 'i17',  name: 'Pregnancy Test (urine β-hCG)',   category: 'Diagnostic Kits',    unit: 'kits',  qty: 60,   reorder: 30,  expiry: '2027-02', cost: 120 },
  { id: 'i18',  name: 'RBS Strips (Accu-Chek)',         category: 'Diagnostic Kits',    unit: 'strips',qty: 120,  reorder: 100, expiry: '2026-07', cost: 35 },
  { id: 'i19',  name: 'IV Cannula 18G (Green)',         category: 'IV & Cannulas',      unit: 'pcs',   qty: 145,  reorder: 100, expiry: '2028-06', cost: 45 },
  { id: 'i20',  name: 'IV Cannula 22G (Blue)',          category: 'IV & Cannulas',      unit: 'pcs',   qty: 85,   reorder: 100, expiry: '2028-06', cost: 45 },
  { id: 'i21',  name: 'Surgical Gauze 10x10cm',        category: 'Wound Care',         unit: 'pcs',   qty: 600,  reorder: 300, expiry: null,       cost: 8 },
  { id: 'i22',  name: 'Adhesive Plasters (assorted)',   category: 'Wound Care',         unit: 'pcs',   qty: 340,  reorder: 200, expiry: null,       cost: 4 },
  { id: 'i23',  name: 'A4 Printing Paper (ream)',       category: 'Stationery & Packaging', unit: 'reams', qty: 8, reorder: 5, expiry: null,       cost: 550 },
  { id: 'i24',  name: 'Patient Envelopes (brown A5)',   category: 'Stationery & Packaging', unit: 'pcs',   qty: 210, reorder: 100, expiry: null,    cost: 5 },
  { id: 'i25',  name: 'Stool Containers (30ml)',        category: 'Urinalysis',         unit: 'pcs',   qty: 65,   reorder: 50,  expiry: '2028-01', cost: 8 },
];

// ── Mock transactions ─────────────────────────────────────────────────────────
const MOCK_TXN = [
  { id: 't1', type: 'receive',  item: 'Examination Gloves (M)',       qty: 200, dept: '—',              date: '2026-03-29', by: 'Admin', cost: 1000 },
  { id: 't2', type: 'dispense', item: 'EDTA Vacutainer Tubes (Purple)',qty: 50,  dept: 'Laboratory',     date: '2026-03-29', by: 'Lab Tech Amina', cost: 0 },
  { id: 't3', type: 'dispense', item: 'Malaria RDT Kit (SD Bioline)', qty: 10,  dept: 'Laboratory',     date: '2026-03-29', by: 'Lab Tech John', cost: 0 },
  { id: 't4', type: 'receive',  item: 'IV Cannula 18G (Green)',       qty: 100, dept: '—',              date: '2026-03-28', by: 'Admin', cost: 4500 },
  { id: 't5', type: 'expired',  item: 'Leishman Stain 500ml',        qty: 2,   dept: '—',              date: '2026-03-27', by: 'Lab Tech John', cost: 0 },
];

function ReceiveStockModal({ items, onClose, onSave }) {
  const [form, setForm] = useState({
    itemId: '', qty: '', supplier: '', batchNo: '', expiry: '', cost: ''
  });
  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl">
          <h2 className="font-black text-white">Receive Stock</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Item *</label>
            <select className="input" value={form.itemId} onChange={f('itemId')}>
              <option value="">Select item…</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} (current: {i.qty} {i.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity Received *</label>
              <input type="number" className="input" value={form.qty} onChange={f('qty')} placeholder="e.g. 200" min={1} />
            </div>
            <div>
              <label className="label">Total Cost (KES)</label>
              <input type="number" className="input" value={form.cost} onChange={f('cost')} placeholder="e.g. 1500" />
            </div>
          </div>
          <div>
            <label className="label">Supplier</label>
            <input className="input" value={form.supplier} onChange={f('supplier')} placeholder="Supplier name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Batch / Lot No.</label>
              <input className="input" value={form.batchNo} onChange={f('batchNo')} placeholder="e.g. BT-2024-01" />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input type="month" className="input" value={form.expiry} onChange={f('expiry')} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} className="btn-primary">
            <Add sx={{ fontSize: 16 }} /> Receive Stock
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueStockModal({ items, onClose, onSave }) {
  const [form, setForm] = useState({ itemId: '', qty: '', dept: '', notes: '' });
  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));
  const DEPTS = ['Laboratory', 'Pharmacy', 'Outpatient (OPD)', 'General Ward', 'Maternity Ward', 'Surgical Ward', 'ICU / HDU', 'Emergency', 'Theatre'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-amber-600 rounded-t-2xl">
          <h2 className="font-black text-white">Issue / Dispense Stock</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Item *</label>
            <select className="input" value={form.itemId} onChange={f('itemId')}>
              <option value="">Select item…</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} (in stock: {i.qty} {i.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" className="input" value={form.qty} onChange={f('qty')} min={1} />
            </div>
            <div>
              <label className="label">Issuing To (Dept) *</label>
              <select className="input" value={form.dept} onChange={f('dept')}>
                <option value="">Select…</option>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={f('notes')} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2">
            <ArrowDownward sx={{ fontSize: 16 }} /> Issue Stock
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { user, role } = useAuth();
  const [items, setItems]           = useState(INITIAL_STOCK);
  const [transactions, setTxn]      = useState(MOCK_TXN);
  const [category, setCategory]     = useState('All');
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState('stock');
  const [showReceive, setShowReceive] = useState(false);
  const [showIssue, setShowIssue]   = useState(false);

  const lowStock  = items.filter(i => i.qty < i.reorder);
  const nearExpiry = items.filter(i => {
    if (!i.expiry) return false;
    const d = new Date(`${i.expiry}-01`);
    const diff = (d - new Date()) / (1000 * 60 * 60 * 24 * 30);
    return diff < 3 && diff > 0;
  });

  const filtered = items
    .filter(i => category === 'All' || i.category === category)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  const handleReceive = (form) => {
    const item = items.find(i => i.id === form.itemId);
    if (!item) return;
    setItems(prev => prev.map(i => i.id === form.itemId ? { ...i, qty: i.qty + parseInt(form.qty || 0) } : i));
    setTxn(prev => [{ id: `t${Date.now()}`, type: 'receive', item: item.name, qty: parseInt(form.qty), dept: '—', date: new Date().toISOString().slice(0, 10), by: user?.first_name || 'System', cost: form.cost }, ...prev]);
  };

  const handleIssue = (form) => {
    const item = items.find(i => i.id === form.itemId);
    if (!item) return;
    setItems(prev => prev.map(i => i.id === form.itemId ? { ...i, qty: Math.max(0, i.qty - parseInt(form.qty || 0)) } : i));
    setTxn(prev => [{ id: `t${Date.now()}`, type: 'dispense', item: item.name, qty: parseInt(form.qty), dept: form.dept, date: new Date().toISOString().slice(0, 10), by: user?.first_name || 'System', cost: 0 }, ...prev]);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Inventory Management</h1>
          <p className="text-sm text-slate-500">Medical supplies, consumables & reagents</p>
        </div>
        <div className="flex gap-2">
          {role !== 'admin' && (
            <>
              <button onClick={() => setShowIssue(true)} className="btn-secondary shrink-0">
                <ArrowDownward sx={{ fontSize: 16 }} /> Issue
              </button>
              <button onClick={() => setShowReceive(true)} className="btn-primary shrink-0">
                <ArrowUpward sx={{ fontSize: 16 }} /> Receive Stock
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center border-slate-200">
          <p className="text-3xl font-black text-slate-800">{items.length}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Items</p>
        </div>
        <div className="card p-4 text-center border-red-100 bg-red-50">
          <p className="text-3xl font-black text-red-700">{lowStock.length}</p>
          <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Below Reorder</p>
        </div>
        <div className="card p-4 text-center border-amber-100 bg-amber-50">
          <p className="text-3xl font-black text-amber-700">{nearExpiry.length}</p>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Expiring Soon</p>
        </div>
        <div className="card p-4 text-center border-emerald-100 bg-emerald-50">
          <p className="text-3xl font-black text-emerald-700">{items.filter(i => i.qty >= i.reorder).length}</p>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Adequately Stocked</p>
        </div>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Warning className="text-red-500" sx={{ fontSize: 18 }} />
            <p className="text-sm font-bold text-red-800">Low Stock — {lowStock.length} items below reorder level:</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lowStock.map(i => <span key={i.id} className="badge badge-red">{i.name} ({i.qty} {i.unit})</span>)}
          </div>
        </div>
      )}
      {nearExpiry.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Warning className="text-amber-500" sx={{ fontSize: 18 }} />
            <p className="text-sm font-bold text-amber-800">Expiring within 3 months:</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {nearExpiry.map(i => <span key={i.id} className="badge badge-amber">{i.name} (exp: {i.expiry})</span>)}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[{ key: 'stock', label: '📦 Stock List' }, { key: 'txn', label: '📄 Transactions' }].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors -mb-px
              ${activeTab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search item or category…" className="input pl-9" />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input sm:w-52">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[750px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Item Name', 'Category', 'In Stock', 'Reorder At', 'Unit Cost (KES)', 'Expiry', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => {
                    const isLow = item.qty < item.reorder;
                    const isWarning = !isLow && item.qty < item.reorder * 1.5;
                    const pct = Math.min(100, Math.round((item.qty / (item.reorder * 3)) * 100));
                    const barColor = isLow ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500';
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-red-50/40' : ''}`}>
                        <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                        <td className="px-4 py-3"><span className="badge badge-slate text-xs">{item.category}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>{item.qty} <span className="font-normal text-slate-400">{item.unit}</span></span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.reorder} {item.unit}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{item.cost}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{item.expiry || '—'}</td>
                        <td className="px-4 py-3">
                          {isLow
                            ? <span className="badge badge-red">⚠ Low</span>
                            : isWarning
                              ? <span className="badge badge-amber">Low Soon</span>
                              : <span className="badge badge-green">OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'txn' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Type', 'Item', 'Qty', 'Department', 'Date', 'By', 'Cost (KES)'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`badge ${txn.type === 'receive' ? 'badge-green' : txn.type === 'expired' ? 'badge-red' : 'badge-amber'} capitalize`}>
                        {txn.type === 'receive' ? '↑ ' : txn.type === 'expired' ? '✕ ' : '↓ '}{txn.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{txn.item}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{txn.qty}</td>
                    <td className="px-4 py-3 text-slate-600">{txn.dept || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{txn.date}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{txn.by}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{txn.cost > 0 ? txn.cost.toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showReceive && <ReceiveStockModal items={items} onClose={() => setShowReceive(false)} onSave={handleReceive} />}
      {showIssue   && <IssueStockModal  items={items} onClose={() => setShowIssue(false)}   onSave={handleIssue} />}
    </div>
  );
}
