import React, { useState } from 'react';
import {
  LocalPharmacy, Search, CheckCircle, Warning,
  Inventory2, FilterList, Add, Receipt, Close
} from '@mui/icons-material';

// ── Mock drug stock ─────────────────────────────────────────────────────────
const DRUG_STOCK = [
  { id: 'd1',  name: 'Amoxicillin 500mg Caps',     category: 'Antibiotics',    unit: 'caps',  qty: 850,  reorder: 200, price: 8,    expiry: '2027-06' },
  { id: 'd2',  name: 'Metronidazole 400mg Tabs',   category: 'Antibiotics',    unit: 'tabs',  qty: 120,  reorder: 150, price: 6,    expiry: '2026-09' },
  { id: 'd3',  name: 'Paracetamol 500mg Tabs',     category: 'Analgesics',     unit: 'tabs',  qty: 2400, reorder: 500, price: 2,    expiry: '2027-03' },
  { id: 'd4',  name: 'Ibuprofen 400mg Tabs',       category: 'Analgesics',     unit: 'tabs',  qty: 600,  reorder: 300, price: 4,    expiry: '2026-12' },
  { id: 'd5',  name: 'Amlodipine 5mg Tabs',        category: 'Cardiovascular', unit: 'tabs',  qty: 90,   reorder: 200, price: 15,   expiry: '2026-08' },
  { id: 'd6',  name: 'Metformin 500mg Tabs',       category: 'Diabetes',       unit: 'tabs',  qty: 320,  reorder: 200, price: 5,    expiry: '2027-01' },
  { id: 'd7',  name: 'Artesunate 100mg IV',        category: 'Antimalarials',  unit: 'vials', qty: 45,   reorder: 20,  price: 380,  expiry: '2026-11' },
  { id: 'd8',  name: 'Ceftriaxone 1g IV',          category: 'Antibiotics',    unit: 'vials', qty: 28,   reorder: 30,  price: 250,  expiry: '2026-07' },
  { id: 'd9',  name: 'NS 500ml IV Bag',            category: 'IV Fluids',      unit: 'bags',  qty: 180,  reorder: 100, price: 120,  expiry: '2027-05' },
  { id: 'd10', name: 'Dextrose 5% 500ml IV Bag',  category: 'IV Fluids',      unit: 'bags',  qty: 60,   reorder: 80,  price: 130,  expiry: '2027-04' },
  { id: 'd11', name: 'Omeprazole 20mg Caps',       category: 'Gastro',         unit: 'caps',  qty: 450,  reorder: 200, price: 12,   expiry: '2026-10' },
  { id: 'd12', name: 'Salbutamol Inhaler 200mcg',  category: 'Respiratory',    unit: 'inhalers', qty: 22, reorder: 15, price: 450,  expiry: '2026-06' },
];

// ── Mock pending prescriptions ──────────────────────────────────────────────
const MOCK_PRESCRIPTIONS = [
  {
    id: 'rx001', patientNo: 'BP-00001', patientName: 'Alice Wanjiru Kamau',
    ward: 'OPD', doctor: 'Dr. Kimani', time: '10:15 AM', status: 'pending',
    items: [
      { id: 'ri1', drug: 'Amoxicillin 500mg Caps',    dose: '500mg', freq: 'TDS', duration: '7 days', route: 'Oral', qty: 21, dispensed: 0 },
      { id: 'ri2', drug: 'Paracetamol 500mg Tabs',    dose: '500mg', freq: 'QID', duration: '5 days', route: 'Oral', qty: 20, dispensed: 0 },
      { id: 'ri3', drug: 'Omeprazole 20mg Caps',      dose: '20mg',  freq: 'OD',  duration: '7 days', route: 'Oral', qty: 7,  dispensed: 0 },
    ]
  },
  {
    id: 'rx002', patientNo: 'BP-00002', patientName: 'James Mwangi Kariuki',
    ward: 'General Ward · G-01', doctor: 'Dr. Kimani', time: '08:30 AM', status: 'pending',
    items: [
      { id: 'ri4', drug: 'Ceftriaxone 1g IV',        dose: '1g',   freq: 'OD',  duration: '7 days', route: 'IV',   qty: 7,  dispensed: 0 },
      { id: 'ri5', drug: 'NS 500ml IV Bag',           dose: '500ml',freq: 'TDS', duration: '3 days', route: 'IV',   qty: 9,  dispensed: 0 },
    ]
  },
  {
    id: 'rx003', patientNo: 'BP-00007', patientName: 'Ruth Akinyi Otieno',
    ward: 'General Ward · G-02', doctor: 'Dr. Musyoka', time: '09:00 AM', status: 'partial',
    items: [
      { id: 'ri6', drug: 'Artesunate 100mg IV',      dose: '120mg',freq: 'OD',  duration: '3 days', route: 'IV',   qty: 3,  dispensed: 1 },
      { id: 'ri7', drug: 'Paracetamol 500mg Tabs',   dose: '1g',   freq: 'QID if fever', duration: '3 days', route: 'Oral', qty: 12, dispensed: 12 },
    ]
  },
];

const STATUS_BADGE = {
  pending:   'badge-amber',
  partial:   'badge-blue',
  dispensed: 'badge-green',
};

function StockLevel({ qty, reorder }) {
  const pct = Math.min(100, Math.round((qty / (reorder * 3)) * 100));
  const color = qty < reorder ? 'bg-red-500' : qty < reorder * 1.5 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold ${qty < reorder ? 'text-red-600' : 'text-slate-600'}`}>{qty}</span>
    </div>
  );
}

function DispenseModal({ rx, stockMap, onClose, onDispense }) {
  const [items, setItems] = useState(rx.items.map(i => ({ ...i, toDispense: i.qty - i.dispensed })));

  const update = (id, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, toDispense: parseInt(val) || 0 } : i));

  const inStock = (drugName) => (stockMap[drugName] || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl">
          <div>
            <h2 className="font-black text-white">Dispense Prescription</h2>
            <p className="text-blue-200 text-xs">{rx.patientName} · {rx.patientNo} · {rx.ward}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {items.map(item => {
            const stock = inStock(item.drug);
            const insufficient = item.toDispense > stock;
            const alreadyDone = item.dispensed >= item.qty;
            return (
              <div key={item.id} className={`border rounded-2xl p-4 ${insufficient ? 'border-red-200 bg-red-50' : alreadyDone ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{item.drug}</p>
                    <p className="text-xs text-slate-500">{item.dose} · {item.freq} · {item.duration} · {item.route}</p>
                  </div>
                  {alreadyDone && <span className="badge badge-green shrink-0">Dispensed ✓</span>}
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="label">Prescribed</p>
                    <p className="font-bold text-slate-800">{item.qty} {item.drug.includes('Bag') ? 'bags' : item.drug.includes('IV') ? 'vials' : 'units'}</p>
                  </div>
                  <div>
                    <p className="label">In Stock</p>
                    <p className={`font-bold ${insufficient ? 'text-red-600' : 'text-emerald-600'}`}>{stock}</p>
                  </div>
                  <div>
                    <p className="label">Qty to Dispense</p>
                    <input type="number" min={0} max={Math.min(item.qty - item.dispensed, stock)}
                      value={item.toDispense} onChange={e => update(item.id, e.target.value)}
                      disabled={alreadyDone}
                      className={`input text-sm font-bold ${insufficient ? 'border-red-300 focus:border-red-500' : ''}`} />
                  </div>
                </div>
                {insufficient && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                    <Warning sx={{ fontSize: 13 }} />
                    Insufficient stock — only {stock} available. Reduce quantity or request restock.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onDispense(rx.id, items); onClose(); }} className="btn-primary">
            <LocalPharmacy sx={{ fontSize: 16 }} /> Confirm Dispensing
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Pharmacy() {
  const [prescriptions, setPrescriptions] = useState(MOCK_PRESCRIPTIONS);
  const [drugStock]                        = useState(DRUG_STOCK);
  const [activeTab, setActiveTab]          = useState('queue');
  const [dispensing, setDispensing]        = useState(null);
  const [search, setSearch]                = useState('');
  const [stockSearch, setStockSearch]      = useState('');

  const stockMap = Object.fromEntries(drugStock.map(d => [d.name, d.qty]));

  const handleDispense = (rxId, items) => {
    setPrescriptions(prev => prev.map(rx => {
      if (rx.id !== rxId) return rx;
      const updated = rx.items.map(i => {
        const found = items.find(it => it.id === i.id);
        return found ? { ...i, dispensed: i.dispensed + found.toDispense } : i;
      });
      const allDone = updated.every(i => i.dispensed >= i.qty);
      return { ...rx, items: updated, status: allDone ? 'dispensed' : 'partial' };
    }));
  };

  const filteredRx = prescriptions.filter(rx =>
    rx.patientName.toLowerCase().includes(search.toLowerCase()) ||
    rx.patientNo.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = drugStock.filter(d => d.qty < d.reorder);
  const filteredStock = drugStock.filter(d =>
    d.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    d.category.toLowerCase().includes(stockSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">Pharmacy</h1>
        <p className="text-sm text-slate-500">Prescription dispensing & drug stock management</p>
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
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Dispensed Today</p>
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
                <span key={d.id} className="badge badge-red">{d.name} ({d.qty} left)</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[{ key: 'queue', label: '📋 Prescription Queue' }, { key: 'stock', label: '📦 Drug Stock' }].map(({ key, label }) => (
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
              placeholder="Search patient…" className="input pl-9" />
          </div>
          {filteredRx.map(rx => (
            <div key={rx.id} className={`card p-5 border-l-4 ${rx.status === 'dispensed' ? 'border-l-emerald-400' : rx.status === 'partial' ? 'border-l-blue-400' : 'border-l-amber-400'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800">{rx.patientName}</h3>
                    <span className={`badge ${STATUS_BADGE[rx.status]}`}>{rx.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{rx.patientNo} · {rx.ward} · {rx.doctor} · {rx.time}</p>
                </div>
                {rx.status !== 'dispensed' && (
                  <button onClick={() => setDispensing(rx)} className="btn-primary shrink-0">
                    <LocalPharmacy sx={{ fontSize: 16 }} /> Dispense
                  </button>
                )}
                {rx.status === 'dispensed' && (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm shrink-0">
                    <CheckCircle sx={{ fontSize: 16 }} /> Fully Dispensed
                  </span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {rx.items.map(item => (
                  <div key={item.id} className={`flex items-center gap-2 p-2.5 rounded-xl text-xs border
                    ${item.dispensed >= item.qty ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                    {item.dispensed >= item.qty
                      ? <CheckCircle sx={{ fontSize: 14 }} className="text-emerald-500 shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{item.drug}</p>
                      <p className="text-slate-500">{item.qty} × {item.dose} · {item.dispensed} dispensed</p>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
            <input value={stockSearch} onChange={e => setStockSearch(e.target.value)}
              placeholder="Search drug or category…" className="input pl-9" />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Drug Name', 'Category', 'Stock Level', 'Reorder Qty', 'Unit Price', 'Expiry', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStock.map(d => {
                    const isLow = d.qty < d.reorder;
                    const isWarning = d.qty < d.reorder * 1.5;
                    return (
                      <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3 font-bold text-slate-800">{d.name}</td>
                        <td className="px-4 py-3 text-slate-600"><span className="badge badge-slate">{d.category}</span></td>
                        <td className="px-4 py-3"><StockLevel qty={d.qty} reorder={d.reorder} /></td>
                        <td className="px-4 py-3 text-slate-500">{d.reorder}</td>
                        <td className="px-4 py-3 text-slate-700 font-mono">KES {d.price}</td>
                        <td className="px-4 py-3 text-slate-600">{d.expiry}</td>
                        <td className="px-4 py-3">
                          {isLow
                            ? <span className="badge badge-red">⚠ Low Stock</span>
                            : isWarning
                              ? <span className="badge badge-amber">Running Low</span>
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

      {dispensing && (
        <DispenseModal rx={dispensing} stockMap={stockMap} onClose={() => setDispensing(null)} onDispense={handleDispense} />
      )}
    </div>
  );
}
