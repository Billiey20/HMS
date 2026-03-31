import React, { useState, useEffect } from 'react';
import {
  LocalPharmacy, Search, CheckCircle, Warning,
  Add, Close
} from '@mui/icons-material';
import { pharmacyService } from '../../services/index';
import { useAuth } from '../../context/AuthContext';

function DispenseModal({ rx, stockMap, onClose, onDispense }) {
  // rx.prescription_items
  const [items, setItems] = useState(rx.prescription_items?.map(i => ({ 
      ...i, 
      toDispense: i.quantity - (i.quantity_dispensed || 0) 
  })) || []);

  const update = (id, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, toDispense: parseInt(val) || 0 } : i));

  const inStock = (drugId) => (stockMap[drugId] || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl">
          <div>
            <h2 className="font-black text-white">Dispense Prescription</h2>
            <p className="text-blue-200 text-xs">{rx.patients?.first_name} {rx.patients?.last_name} · {rx.patients?.patient_no}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {items.map(item => {
            const stock = inStock(item.drug_id);
            const insufficient = item.toDispense > stock && item.drug_id; // If dummy text, don't check stock
            const alreadyDone = (item.quantity_dispensed || 0) >= item.quantity;
            return (
              <div key={item.id} className={`border rounded-2xl p-4 ${insufficient ? 'border-red-200 bg-red-50' : alreadyDone ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{item.drug_name}</p>
                    <p className="text-xs text-slate-500">{item.dosage} · {item.frequency} · {item.duration} · {item.route}</p>
                  </div>
                  {alreadyDone && <span className="badge badge-green shrink-0">Dispensed ✓</span>}
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="label">Prescribed</p>
                    <p className="font-bold text-slate-800">{item.quantity} units</p>
                  </div>
                  <div>
                    <p className="label">In Stock</p>
                    <p className={`font-bold ${insufficient ? 'text-red-600' : 'text-emerald-600'}`}>{item.drug_id ? stock : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="label">Qty to Dispense</p>
                    <input type="number" min={0} max={item.drug_id ? Math.min(item.quantity - (item.quantity_dispensed||0), stock) : item.quantity - (item.quantity_dispensed||0)}
                      value={item.toDispense} onChange={e => update(item.id, e.target.value)}
                      disabled={alreadyDone}
                      className={`input text-sm font-bold ${insufficient ? 'border-red-300 focus:border-red-500' : ''}`} />
                  </div>
                </div>
                {insufficient && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                    <Warning sx={{ fontSize: 13 }} />
                    Insufficient stock — only {stock} available.
                  </div>
                )}
                <div className="mt-2 text-xs text-slate-500">
                    <p>Notes: {item.instructions || 'None'}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onDispense(rx.id, items); onClose(); }} className="btn-primary">
            <LocalPharmacy sx={{ fontSize: 16 }} /> Confirm Dispensing
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiveStockModal({ drugs, onClose, onSave }) {
  const [form, setForm] = useState({ drugId: '', qty: '', batchNo: '', expiry: '', cost: '' });
  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-emerald-600 rounded-t-2xl">
          <h2 className="font-black text-white">Stock Intake (Pharmacy)</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Select Drug *</label>
            <select className="input" value={form.drugId} onChange={f('drugId')}>
              <option value="">Select drug…</option>
              {drugs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.current_qty} {d.form} in stock)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" className="input" value={form.qty} onChange={f('qty')} placeholder="e.g. 500" />
            </div>
            <div>
              <label className="label">Unit Cost (Ksh)</label>
              <input type="number" className="input" value={form.cost} onChange={f('cost')} placeholder="e.g. 10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Batch / Lot No.</label>
              <input className="input" value={form.batchNo} onChange={f('batchNo')} placeholder="e.g. B-992" />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input type="date" className="input" value={form.expiry} onChange={f('expiry')} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.drugId || !form.qty} className="btn-primary">
            <Add sx={{ fontSize: 16 }} /> Receive Stock
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterDrugModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', category: 'General', form: 'tablets', reorder: 20, price: 0 });
  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl text-white">
          <h2 className="font-black">Register New Medication</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Drug Name *</label>
            <input className="input" value={form.name} onChange={f('name')} placeholder="e.g. Amoxicillin 500mg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={f('category')}>
                <option value="General">General</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Analgesic">Analgesic</option>
                <option value="Vitamins">Vitamins</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Formulation</label>
              <input className="input" value={form.form} onChange={f('form')} placeholder="e.g. caps, ml" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Selling Price (Ksh)</label>
              <input type="number" className="input font-mono" value={form.price} onChange={f('price')} />
            </div>
            <div>
              <label className="label">Reorder Level</label>
              <input type="number" className="input" value={form.reorder} onChange={f('reorder')} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name} className="btn-primary">
            <Add sx={{ fontSize: 16 }} /> Register Drug
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Pharmacy() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [drugStock, setDrugStock]         = useState([]);
  const [activeTab, setActiveTab]         = useState('queue');
  const [dispensing, setDispensing]       = useState(null);
  const [receiving, setReceiving]         = useState(false);
  const [registering, setRegistering]     = useState(false);
  const [search, setSearch]               = useState('');
  const [stockSearch, setStockSearch]     = useState('');
  const [loading, setLoading]             = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const rx = await pharmacyService.listPrescriptions();
      const st = await pharmacyService.listDrugStock();
      setPrescriptions(rx || []);
      setDrugStock(st || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stockMap = Object.fromEntries(drugStock.map(d => [d.id, d.current_qty]));

  const handleDispense = async (rxId, items) => {
    try {
      const allDone = items.every(i => (i.quantity_dispensed || 0) + i.toDispense >= i.quantity);
      await pharmacyService.dispense(rxId, items, allDone);
      await loadData();
    } catch (e) {
      console.error("Dispense error:", e);
      alert("Error dispensing medication.");
    }
  };

  const handleRegisterDrug = async (form) => {
     try {
       await pharmacyService.createDrug({
         name: form.name,
         category: form.category,
         unit: form.form,
         reorder_level: parseInt(form.reorder),
         unit_cost: parseFloat(form.price) // Maps to selling_price in service
       });
       setRegistering(false);
       await loadData();
       alert("Drug registered successfully!");
     } catch (err) {
       console.error(err);
       alert("Failed to register drug");
     }
  };

  const handleReceiveStock = async (form) => {
     try {
       await pharmacyService.receiveStock(form.drugId, parseInt(form.qty), {
         batchNo: form.batchNo,
         expiry: form.expiry,
         cost: form.cost,
         userId: user?.id
       });
       setReceiving(false);
       await loadData();
       alert("Stock received successfully!");
     } catch (err) {
       console.error(err);
       alert("Failed to receive stock");
     }
  };

  const filteredRx = prescriptions.filter(rx =>
    (rx.patients?.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (rx.patients?.patient_no || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = drugStock.filter(d => d.current_qty < d.reorder_level);
  const filteredStock = drugStock.filter(d =>
    d.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    (d.category||'').toLowerCase().includes(stockSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  const STATUS_BADGE = {
    pending:   'badge-amber',
    partial:   'badge-blue',
    dispensed: 'badge-green',
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">Pharmacy Center</h1>
        <p className="text-sm text-slate-500">Live prescription dispensing & internal drug stock tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-amber-100 bg-amber-50">
          <p className="text-3xl font-black text-amber-700">{prescriptions.filter(r => r.status === 'pending').length}</p>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Pending</p>
        </div>
        <div className="card p-4 border-blue-100 bg-blue-50">
          <p className="text-3xl font-black text-blue-700">{prescriptions.filter(r => r.status === 'partial').length}</p>
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">Partial</p>
        </div>
        <div className="card p-4 border-emerald-100 bg-emerald-50">
          <p className="text-3xl font-black text-emerald-700">{prescriptions.filter(r => r.status === 'dispensed').length}</p>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Fully Dispensed</p>
        </div>
        <div className="card p-4 border-red-100 bg-red-50">
          <p className="text-3xl font-black text-red-700">{lowStock.length}</p>
          <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Low Stock Alerts</p>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStock.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <Warning className="text-red-500 shrink-0 mt-0.5" sx={{ fontSize: 18 }} />
          <div>
            <p className="text-sm font-bold text-red-800">Low Stock Alert</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {lowStock.map(d => (
                <span key={d.id} className="badge badge-red">{d.name} ({d.current_qty} left)</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[{ key: 'queue', label: '📋 Live Rx Queue' }, { key: 'stock', label: '📦 Drug Catalog' }].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors -mb-px
              ${activeTab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Prescription Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search incoming patient prescriptions…" className="input pl-9" />
          </div>
          {filteredRx.length === 0 ? (
             <div className="card p-8 text-center text-slate-400 font-bold">No pending prescriptions from OPD or Wards right now.</div>
          ) : filteredRx.map(rx => (
            <div key={rx.id} className={`card p-5 border-l-4 ${rx.status === 'dispensed' ? 'border-l-emerald-400' : rx.status === 'partial' ? 'border-l-blue-400' : 'border-l-amber-400'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800">{rx.patients?.first_name} {rx.patients?.last_name}</h3>
                    <span className={`badge ${STATUS_BADGE[rx.status]}`}>{rx.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{rx.patients?.patient_no} · Dr. {rx.prescribed_by_user?.first_name} {rx.prescribed_by_user?.last_name || ''} · {new Date(rx.prescribed_at).toLocaleString()}</p>
                </div>
                {rx.status !== 'dispensed' && (
                  <button onClick={() => setDispensing(rx)} className="btn-primary shrink-0">
                    <LocalPharmacy sx={{ fontSize: 16 }} /> Dispense Live
                  </button>
                )}
                {rx.status === 'dispensed' && (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm shrink-0">
                    <CheckCircle sx={{ fontSize: 16 }} /> Fully Filled
                  </span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {rx.prescription_items?.map(item => (
                  <div key={item.id} className={`flex items-center gap-2 p-2.5 rounded-xl text-xs border
                    ${(item.quantity_dispensed||0) >= item.quantity ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                    {(item.quantity_dispensed||0) >= item.quantity
                      ? <CheckCircle sx={{ fontSize: 14 }} className="text-emerald-500 shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{item.drug_name}</p>
                      <p className="text-slate-500">{item.quantity} × {item.dosage} · {(item.quantity_dispensed||0)} dispensed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drug Stock Tab */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
               <input value={stockSearch} onChange={e => setStockSearch(e.target.value)}
                 placeholder="Search drug catalog…" className="input pl-9" />
             </div>
             <div className="flex gap-2">
                <button onClick={() => setRegistering(true)} className="btn-secondary shrink-0">
                  <Add sx={{ fontSize: 18 }} /> Register New Drug
                </button>
                <button onClick={() => setReceiving(true)} className="btn-primary shrink-0">
                  <ArrowUpward sx={{ fontSize: 18 }} /> Stock Intake
                </button>
             </div>
          </div>
          <div className="card overflow-hidden">
            {filteredStock.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold">No drugs found in catalog. Reception must enter drugs into Inventory Catalog first.</div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Drug Name', 'Category', 'Est. Stock', 'Reorder Qty', 'Selling Price', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStock.map(d => {
                        const isLow = d.current_qty < d.reorder_level;
                        const pct = Math.min(100, Math.round((d.current_qty / Math.max(d.reorder_level * 3, 10)) * 100));
                        const color = isLow ? 'bg-red-500' : 'bg-emerald-500';
                        return (
                          <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-red-50/50' : ''}`}>
                            <td className="px-4 py-3 font-bold text-slate-800">{d.name}</td>
                            <td className="px-4 py-3"><span className="badge badge-slate">{d.category}</span></td>
                            <td className="px-4 py-3">
                               <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                     <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className={`text-xs font-bold ${isLow ? 'text-red-600' : 'text-slate-600'}`}>{d.current_qty} {d.form}</span>
                               </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{d.reorder_level}</td>
                            <td className="px-4 py-3 text-slate-700 font-mono text-xs">KES {d.selling_price}</td>
                            <td className="px-4 py-3">
                              {isLow ? <span className="badge badge-red">⚠ Low</span>: <span className="badge badge-green">OK</span>}
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

      {dispensing && (
        <DispenseModal rx={dispensing} stockMap={stockMap} onClose={() => setDispensing(null)} onDispense={handleDispense} />
      )}
      {receiving && (
        <ReceiveStockModal drugs={drugStock} onClose={() => setReceiving(false)} onSave={handleReceiveStock} />
      )}
      {registering && (
        <RegisterDrugModal onClose={() => setRegistering(false)} onSave={handleRegisterDrug} />
      )}
    </div>
  );
}
