import React, { useState, useEffect } from 'react';
import {
  Inventory2, Search, Add, Warning,
  TrendingDown, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { inventoryService } from '../../services/index';

const CATEGORIES = [
  'All', 'PPE', 'Blood Collection', 'Urinalysis', 'Wound Care',
  'Staining & Slides', 'IV & Cannulas', 'Diagnostic Kits', 'Surgical',
  'Stationery & Packaging', 'Other'
];

function CreateItemModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', category: 'PPE', unit: 'pcs', reorder_level: ''
  });
  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  // Add the base item
  const handleSubmit = () => {
    onSave({
      name: form.name,
      category: form.category,
      unit: form.unit,
      reorder_level: parseInt(form.reorder_level) || 0,
      current_qty: 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-800 rounded-t-2xl">
          <h2 className="font-black text-white">Create New Catalog Item</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Item Name *</label>
            <input className="input" value={form.name} onChange={f('name')} placeholder="e.g. Paracetamol 500mg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={f('category')}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Base Unit</label>
              <input className="input" value={form.unit} onChange={f('unit')} placeholder="e.g. pcs, boxes" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="label">Reorder Level *</label>
              <input type="number" className="input" value={form.reorder_level} onChange={f('reorder_level')} placeholder="Min stock" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.name || !form.reorder_level} className="btn-primary flex items-center gap-2">
            <Add sx={{ fontSize: 16 }} /> Save Item
          </button>
        </div>
      </div>
    </div>
  );
}

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
              {items.map(i => <option key={i.id} value={i.id}>{i.name} (current: {i.current_qty} {i.unit})</option>)}
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
              <input type="date" className="input" value={form.expiry} onChange={f('expiry')} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} disabled={!form.itemId || !form.qty} className="btn-primary">
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
              {items.map(i => <option key={i.id} value={i.id}>{i.name} (in stock: {i.current_qty} {i.unit})</option>)}
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
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={f('notes')} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} disabled={!form.itemId || !form.qty || !form.dept} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2">
            <ArrowDownward sx={{ fontSize: 16 }} /> Issue Stock
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { user, profile, role } = useAuth();
  const [items, setItems] = useState([]);
  const [transactions, setTxn] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('stock');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showReceive, setShowReceive] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const liveItems = await inventoryService.list();
      const liveTxns = await inventoryService.transactions();
      setItems(liveItems || []);
      setTxn(liveTxns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    try {
      if(!payload.name) return;
      await inventoryService.createItem(payload);
      await loadData();
    } catch (error) {
       console.error("Failed to create item", error);
       alert("Failed to create catalog item");
    }
  };

  const handleReceive = async (form) => {
    try {
      await inventoryService.receive(form.itemId, parseInt(form.qty), {
        supplier: form.supplier,
        batchNo: form.batchNo,
        expiry: form.expiry,
        cost: form.cost,
        userId: user?.id,
      });
      await loadData();
    } catch (err) {
      console.error("Failed to receive stock", err);
      alert("Error receiving stock");
    }
  };

  const handleIssue = async (form) => {
    try {
      // Find actual item to check limit
      const i = items.find(it => it.id === form.itemId);
      if(!i || i.current_qty < parseInt(form.qty)) {
        alert("Cannot dispense more than what is in stock!");
        return;
      }

      await inventoryService.issue(form.itemId, parseInt(form.qty), {
        deptId: null, // Depending on if departments table exists
        notes: `To ${form.dept}: ${form.notes}`,
        userId: user?.id,
      });
      await loadData();
    } catch(err) {
      console.error("Failed to dispense stock", err);
      alert("Error dispensing stock");
    }
  };

  const lowStock = items.filter(i => i.current_qty < i.reorder_level);
  
  // Expiry check (needs to crawl transactions if items table doesn't have expiry, or we just rely on transactions joined!)
  // In a robust system, expiry is tracked per lot/batch. Here we are simplifying.

  const filtered = items
    .filter(i => category === 'All' || i.category === category)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.category || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) {
     return (
       <div className="p-8 flex items-center justify-center min-h-[50vh]">
         <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin" />
       </div>
     );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Inventory Catalog</h1>
            <p className="text-sm text-slate-500">Manage items and set reorder limits</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowCreate(true)} className="btn-primary shrink-0">
             <Add sx={{ fontSize: 18 }} /> Register New Item
           </button>
           <button onClick={() => setShowIssue(true)} className="btn-secondary shrink-0">
             <ArrowDownward sx={{ fontSize: 16 }} /> Issue
           </button>
           <button onClick={() => setShowReceive(true)} className="btn-primary shrink-0 transition-shadow">
             <ArrowUpward sx={{ fontSize: 16 }} /> Receive Stock
           </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 text-center border-slate-200">
          <p className="text-3xl font-black text-slate-800">{items.length}</p>
          <p className="text-xs font-bold text-slate-500 capitalize tracking-wide">Catalog items</p>
        </div>
        <div className="card p-4 text-center border-red-100 bg-red-50">
          <p className="text-3xl font-black text-red-700">{lowStock.length}</p>
          <p className="text-xs font-bold text-red-500 capitalize tracking-wide">Below reorder</p>
        </div>
        <div className="card p-4 text-center border-emerald-100 bg-emerald-50">
          <p className="text-3xl font-black text-emerald-700">{items.filter(i => i.current_qty >= i.reorder_level).length}</p>
          <p className="text-xs font-bold text-emerald-500 capitalize tracking-wide">Adequately stocked</p>
        </div>
        <div className="card p-4 text-center border-blue-100 bg-blue-50">
          <p className="text-3xl font-black text-blue-700">{transactions.length}</p>
          <p className="text-xs font-bold text-blue-500 capitalize tracking-wide">Recent txn</p>
        </div>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Warning className="text-red-500" sx={{ fontSize: 18 }} />
            <p className="text-sm font-bold text-red-800">Low Stock — {lowStock.length} items breached reorder level:</p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {lowStock.map(i => <span key={i.id} className="badge badge-red">{i.name} ({i.current_qty} {i.unit})</span>)}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[{ key: 'stock', label: '📦 Stock Ledger' }, { key: 'txn', label: '📄 Transaction History' }].map(({ key, label }) => (
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
                placeholder="Search live stock catalog…" className="input pl-9" />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input sm:w-52">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="card overflow-hidden">
            {filtered.length === 0 ? (
               <div className="p-10 text-center text-slate-400 font-bold">No catalog items found. Click "New Catalog Item" to build out your hospital inventory.</div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[750px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 capitalize tracking-wide">Item name</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 capitalize tracking-wide">Category</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 capitalize tracking-wide">Live stock</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 capitalize tracking-wide">Reorder level</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 capitalize tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map(item => {
                        const isLow = item.current_qty < item.reorder_level;
                        const isWarning = !isLow && item.current_qty < item.reorder_level * 1.5;
                        const denom = Math.max(item.reorder_level * 3, 10);
                        const pct = Math.min(100, Math.round((item.current_qty / denom) * 100));
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
                                <span className={`text-xs font-bold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>
                                   {item.current_qty} <span className="font-normal text-slate-400">{item.unit}</span>
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{item.reorder_level} {item.unit}</td>
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
            )}
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
                  {['Type', 'Item', 'Qty', 'Notes/Batch', 'Date', 'Cost (KSh.)'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 capitalize tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`badge ${txn.txn_type === 'receive' ? 'badge-green' : 'badge-amber'} capitalize`}>
                        {txn.txn_type === 'receive' ? '↑ ' : '↓ '}{txn.txn_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{txn.inventory_items?.name || 'Deleted Item'}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{txn.quantity}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-[200px] truncate">{txn.notes || txn.batch_no || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(txn.txn_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{txn.cost > 0 ? txn.cost.toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                   <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">No transaction history found.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && <CreateItemModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {showReceive && <ReceiveStockModal items={items} onClose={() => setShowReceive(false)} onSave={handleReceive} />}
      {showIssue   && <IssueStockModal  items={items} onClose={() => setShowIssue(false)} onSave={handleIssue} />}
    </div>
  );
}
