import React, { useState, useEffect, useCallback } from 'react';
import {
  ReceiptLong, Search, Add, Print, Payments, Refresh
} from '@mui/icons-material';
import { billingService, patientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SERVICE_CATEGORIES = {
  consultation: { label: 'Consultation',  color: 'bg-blue-100 text-blue-700'    },
  lab:          { label: 'Laboratory',    color: 'bg-amber-100 text-amber-700'  },
  pharmacy:     { label: 'Pharmacy',      color: 'bg-emerald-100 text-emerald-700' },
  ward:         { label: 'Ward / Bed',    color: 'bg-violet-100 text-violet-700'  },
  procedure:    { label: 'Procedure',     color: 'bg-rose-100 text-rose-700'    },
};

const PRICE_LIST = [
  { name: 'OPD Consultation (General)',  category: 'consultation', price: 500   },
  { name: 'OPD Consultation (Specialist)',category:'consultation', price: 1500  },
  { name: 'Full Haemogram / CBC',        category: 'lab',         price: 1200  },
  { name: 'Urinalysis',                  category: 'lab',         price: 400   },
  { name: 'Random Blood Sugar',          category: 'lab',         price: 300   },
  { name: 'Malaria RDT',                 category: 'lab',         price: 500   },
  { name: 'HIV Test',                    category: 'lab',         price: 600   },
  { name: 'UECs',                        category: 'lab',         price: 2000  },
  { name: 'LFTs',                        category: 'lab',         price: 2500  },
  { name: 'Ward Bed (General, per day)', category: 'ward',        price: 1500  },
  { name: 'Ward Bed (ICU, per day)',     category: 'ward',        price: 8000  },
  { name: 'Ward Bed (Maternity, per day)',category:'ward',        price: 2500  },
  { name: 'Normal Delivery',             category: 'procedure',   price: 7500  },
  { name: 'C-Section (Theatre)',         category: 'procedure',   price: 45000 },
  { name: 'IV Cannulation',              category: 'procedure',   price: 300   },
  { name: 'Amoxicillin 500mg (21 caps)', category: 'pharmacy',    price: 168   },
  { name: 'Paracetamol 500mg (20 tabs)', category: 'pharmacy',    price: 40    },
  { name: 'Ceftriaxone 1g IV',           category: 'pharmacy',    price: 250   },
  { name: 'NS 500ml IV Bag',             category: 'pharmacy',    price: 120   },
];

const STATUS_BADGE = { pending:'badge-amber', partial:'badge-blue', paid:'badge-green', waived:'badge-slate', insurance:'badge-violet' };

function BillItemsTable({ items }) {
  const billItems = items?.bill_items || [];
  const total = billItems.reduce((s, i) => s + parseFloat(i.total_price || 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[500px]">
        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
          <tr>
            {['Service / Item', 'Category', 'Qty', 'Unit Price', 'Total'].map(h => (
              <th key={h} className="px-3 py-2 text-left font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {billItems.map(item => {
            const cat = SERVICE_CATEGORIES[item.category];
            return (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-semibold text-slate-800">{item.description}</td>
                <td className="px-3 py-2"><span className={`badge text-xs ${cat?.color || 'badge-slate'}`}>{cat?.label || item.category}</span></td>
                <td className="px-3 py-2 text-slate-600">{item.quantity}</td>
                <td className="px-3 py-2 font-mono text-slate-700">KES {parseFloat(item.unit_price).toLocaleString()}</td>
                <td className="px-3 py-2 font-mono font-bold text-slate-800">KES {parseFloat(item.total_price).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t-2 border-slate-300">
          <tr className="bg-primary-50">
            <td colSpan={4} className="px-3 py-2 font-black text-primary-700 text-right">TOTAL</td>
            <td className="px-3 py-2 font-black text-primary-700 font-mono text-sm">KES {total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PaymentModal({ bill, onClose, onPay }) {
  const total = parseFloat(bill.total_amount || 0);
  const paid  = parseFloat(bill.paid_amount  || 0);
  const balance = total - paid;
  const [method, setMethod]   = useState('Cash');
  const [amount, setAmount]   = useState(balance);
  const [ref, setRef]         = useState('');
  const [saving, setSaving]   = useState(false);

  const handlePay = async () => {
    setSaving(true);
    try { await onPay(bill.id, amount, method, ref); onClose(); }
    catch (e) { alert('Payment failed: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-emerald-600 rounded-t-2xl">
          <div>
            <h2 className="font-black text-white">Record Payment</h2>
            <p className="text-emerald-100 text-xs">{bill.bill_no} · {bill.patients?.first_name} {bill.patients?.last_name}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <div className="flex justify-between text-sm"><span className="text-emerald-700">Total Bill</span><span className="font-black text-emerald-700">KES {total.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-600">Already Paid</span><span className="font-bold text-slate-700">KES {paid.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm border-t border-emerald-200 pt-1"><span className="font-bold text-emerald-800">Balance Due</span><span className="font-black text-emerald-800">KES {balance.toLocaleString()}</span></div>
          </div>
          <div>
            <label className="label">Payment Method *</label>
            <div className="grid grid-cols-2 gap-2">
              {['Cash','M-Pesa','Card (POS)','Insurance','Waiver'].map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-bold transition-all
                    ${method === m ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                  {m === 'M-Pesa' ? '📱 ' : m === 'Cash' ? '💵 ' : m === 'Card (POS)' ? '💳 ' : m === 'Insurance' ? '🏥 ' : '⬜ '}{m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Amount Paid (KES) *</label>
            <input type="number" className="input" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} />
          </div>
          {(method === 'M-Pesa' || method === 'Insurance' || method === 'Card (POS)') && (
            <div>
              <label className="label">{method === 'M-Pesa' ? 'M-Pesa Code' : method === 'Insurance' ? 'Claim / Policy No.' : 'POS Reference'}</label>
              <input className="input" value={ref} onChange={e => setRef(e.target.value)} placeholder="Reference number…" />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handlePay} disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all">
            <Payments sx={{ fontSize: 16 }} /> {saving ? 'Saving…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewBillModal({ onClose, onSave }) {
  const [patSearch, setPatSearch]   = useState('');
  const [patResults, setPatResults] = useState([]);
  const [selPat, setSelPat]         = useState(null);
  const [selectedItems, setItems]   = useState([]);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (!patSearch || patSearch.length < 2) { setPatResults([]); return; }
    const t = setTimeout(async () => {
      const data = await patientService.list({ search: patSearch });
      setPatResults((data || []).slice(0, 5));
    }, 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  const addService = (svc) => {
    setItems(prev => {
      const exists = prev.find(i => i.desc === svc.name);
      if (exists) return prev.map(i => i.desc === svc.name ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { desc: svc.name, cat: svc.category, qty: 1, unitPrice: svc.price }];
    });
  };

  const total = selectedItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  const handleSave = async () => {
    if (!selPat) { alert('Select a patient.'); return; }
    if (!selectedItems.length) { alert('Add at least one service.'); return; }
    setSaving(true);
    try { await onSave(selPat.id, selectedItems); onClose(); }
    catch (e) { alert('Failed: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl">
          <h2 className="font-black text-white text-lg">New Invoice</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Patient */}
          <div>
            <label className="label">Patient *</label>
            {selPat ? (
              <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl">
                <div>
                  <p className="font-bold text-primary-800">{selPat.first_name} {selPat.last_name}</p>
                  <p className="text-xs text-primary-600">{selPat.patient_no}</p>
                </div>
                <button onClick={() => setSelPat(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
                <input className="input pl-9" value={patSearch} onChange={e => setPatSearch(e.target.value)}
                  placeholder="Search patient…" />
                {patResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl mt-1 z-30 overflow-hidden">
                    {patResults.map(p => (
                      <button key={p.id} onClick={() => { setSelPat(p); setPatSearch(''); setPatResults([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-sm">
                        <span className="font-bold text-slate-800">{p.first_name} {p.last_name}</span>
                        <span className="text-slate-400 ml-2">{p.patient_no}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <label className="label">Add Services</label>
            <div className="space-y-3">
              {Object.entries(
                PRICE_LIST.reduce((acc, svc) => { if (!acc[svc.category]) acc[svc.category] = []; acc[svc.category].push(svc); return acc; }, {})
              ).map(([cat, svcs]) => {
                const catCfg = SERVICE_CATEGORIES[cat];
                return (
                  <div key={cat}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{catCfg?.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {svcs.map(svc => (
                        <button key={svc.name} onClick={() => addService(svc)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all
                            ${selectedItems.find(i => i.desc === svc.name) ? `${catCfg?.color} border-transparent` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                          {svc.name} <span className="font-mono opacity-70">KES {svc.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected items */}
          {selectedItems.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 text-sm">Selected Items</div>
              {selectedItems.map(item => (
                <div key={item.desc} className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-100">
                  <span className="flex-1 text-sm text-slate-800 font-semibold">{item.desc}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setItems(p => p.map(i => i.desc === item.desc ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}
                      className="w-6 h-6 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-sm font-bold">−</button>
                    <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => setItems(p => p.map(i => i.desc === item.desc ? { ...i, qty: i.qty + 1 } : i))}
                      className="w-6 h-6 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-sm font-bold">+</button>
                  </div>
                  <span className="font-mono text-sm text-slate-700 w-28 text-right">KES {(item.qty * item.unitPrice).toLocaleString()}</span>
                  <button onClick={() => setItems(p => p.filter(i => i.desc !== item.desc))} className="text-red-400 hover:text-red-600 font-bold">×</button>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-3 bg-primary-50 border-t border-primary-100">
                <span className="font-black text-primary-800">TOTAL</span>
                <span className="font-black text-primary-700 font-mono text-lg">KES {total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving || !selectedItems.length} className="btn-primary">
            <ReceiptLong sx={{ fontSize: 16 }} /> {saving ? 'Creating…' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const [bills, setBills]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [paying, setPaying]       = useState(null);
  const [creating, setCreating]   = useState(false);
  const [expanded, setExpanded]   = useState(null);

  const loadBills = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await billingService.list();
      setBills(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBills(); }, [loadBills]);

  const handlePay = async (billId, amount, method, ref) => {
    await billingService.recordPayment(billId, amount, method, ref, user?.id);
    await loadBills();
  };

  const handleCreate = async (patientId, items) => {
    await billingService.create(patientId, null, items, user?.id);
    await loadBills();
  };

  const filtered = bills
    .filter(b => statusFilter === 'all' || b.status === statusFilter)
    .filter(b => {
      const name = `${b.patients?.first_name || ''} ${b.patients?.last_name || ''}`.toLowerCase();
      const no   = (b.bill_no || '').toLowerCase();
      return name.includes(search.toLowerCase()) || no.includes(search.toLowerCase());
    });

  const totalRevenue  = bills.filter(b => b.status === 'paid')
    .reduce((s, b) => s + parseFloat(b.paid_amount || 0), 0);
  const totalPending  = bills.filter(b => b.status === 'pending')
    .reduce((s, b) => s + parseFloat(b.total_amount || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Billing</h1>
          <p className="text-sm text-slate-500">Invoicing, payments & revenue tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadBills} className="btn-secondary shrink-0"><Refresh sx={{ fontSize: 16 }} /> Refresh</button>
          <button onClick={() => setCreating(true)} className="btn-primary shrink-0">
            <Add sx={{ fontSize: 18 }} /> New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center border-emerald-100 bg-emerald-50 col-span-2">
          <p className="text-3xl font-black text-emerald-700">KES {totalRevenue.toLocaleString()}</p>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Revenue Collected</p>
        </div>
        <div className="card p-4 text-center border-amber-100 bg-amber-50">
          <p className="text-2xl font-black text-amber-700">KES {totalPending.toLocaleString()}</p>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Pending Payment</p>
        </div>
        <div className="card p-4 text-center border-blue-100 bg-blue-50">
          <p className="text-2xl font-black text-blue-700">{bills.length}</p>
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">Total Invoices</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">⚠️ {error}</div>}

      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient or invoice no…" className="input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all','pending','partial','paid','waived'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all capitalize
                ${statusFilter === s ? 'bg-primary-600 text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading && <div className="card p-8 text-center text-slate-400">Loading invoices…</div>}
        {!loading && filtered.map(bill => {
          const total   = parseFloat(bill.total_amount || 0);
          const isOpen  = expanded === bill.id;
          return (
            <div key={bill.id} className="card overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-400">{bill.bill_no}</span>
                    <h3 className="font-black text-slate-800">
                      {bill.patients?.first_name} {bill.patients?.last_name}
                    </h3>
                    <span className={`badge ${STATUS_BADGE[bill.status] || 'badge-slate'}`}>{bill.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {bill.patients?.patient_no} · {new Date(bill.created_at).toLocaleDateString('en-GB')} · {bill.bill_items?.length || 0} items
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-slate-800 font-mono">KES {total.toLocaleString()}</span>
                  <button onClick={() => setExpanded(isOpen ? null : bill.id)}
                    className="btn-secondary text-xs py-1.5 px-3">{isOpen ? 'Hide' : 'Details'}</button>
                  {bill.status !== 'paid' && bill.status !== 'waived' && (
                    <button onClick={() => setPaying(bill)} className="btn-primary text-xs py-1.5 px-3">
                      <Payments sx={{ fontSize: 14 }} /> Pay
                    </button>
                  )}
                  {bill.status === 'paid' && (
                    <button className="btn-secondary text-xs py-1.5 px-3 text-emerald-600">
                      <Print sx={{ fontSize: 14 }} /> Receipt
                    </button>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-2">
                  <BillItemsTable items={bill} />
                </div>
              )}
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <ReceiptLong sx={{ fontSize: 48 }} className="mb-3 text-slate-200" />
            <p className="font-bold text-slate-500">
              {bills.length === 0 ? 'No invoices yet — create one with "New Invoice"' : 'No invoices match your filter'}
            </p>
          </div>
        )}
      </div>

      {paying   && <PaymentModal bill={paying} onClose={() => setPaying(null)} onPay={handlePay} />}
      {creating && <NewBillModal onClose={() => setCreating(false)} onSave={handleCreate} />}
    </div>
  );
}
