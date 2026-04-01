import React, { useState } from 'react';
import { PriceCheck, Add, Edit, Save, Close, Search } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// Initial price list — this will later be loaded from the database
const DEFAULT_PRICES = [
  { id: 1,  name: 'OPD Consultation (General)',    category: 'consultation', price: 500   },
  { id: 2,  name: 'OPD Consultation (Specialist)', category: 'consultation', price: 1500  },
  { id: 3,  name: 'Full Haemogram / CBC',          category: 'lab',         price: 1200  },
  { id: 4,  name: 'Urinalysis',                    category: 'lab',         price: 400   },
  { id: 5,  name: 'Random Blood Sugar',            category: 'lab',         price: 300   },
  { id: 6,  name: 'Malaria RDT',                   category: 'lab',         price: 500   },
  { id: 7,  name: 'HIV Test',                      category: 'lab',         price: 600   },
  { id: 8,  name: 'UECs',                          category: 'lab',         price: 2000  },
  { id: 9,  name: 'LFTs',                          category: 'lab',         price: 2500  },
  { id: 10, name: 'Ward Bed (General, per day)',    category: 'ward',        price: 1500  },
  { id: 11, name: 'Ward Bed (ICU, per day)',        category: 'ward',        price: 8000  },
  { id: 12, name: 'Ward Bed (Maternity, per day)', category: 'ward',        price: 2500  },
  { id: 13, name: 'Normal Delivery',               category: 'procedure',   price: 7500  },
  { id: 14, name: 'C-Section (Theatre)',            category: 'procedure',   price: 45000 },
  { id: 15, name: 'IV Cannulation',                category: 'procedure',   price: 300   },
  { id: 16, name: 'Amoxicillin 500mg (21 caps)',   category: 'pharmacy',    price: 168   },
  { id: 17, name: 'Paracetamol 500mg (20 tabs)',   category: 'pharmacy',    price: 40    },
  { id: 18, name: 'Ceftriaxone 1g IV',             category: 'pharmacy',    price: 250   },
  { id: 19, name: 'NS 500ml IV Bag',               category: 'pharmacy',    price: 120   },
];

const CATEGORY_COLORS = {
  consultation: 'text-blue-600',
  lab:          'text-amber-600',
  pharmacy:     'text-emerald-600',
  ward:         'text-violet-600',
  procedure:    'text-rose-600',
};

const CATEGORIES = ['consultation', 'lab', 'pharmacy', 'ward', 'procedure'];

function PriceRow({ item, onEdit }) {
  return (
    <tr className="hover:bg-slate-50 group">
      <td className="px-4 py-3 font-semibold text-slate-800 text-sm">{item.name}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-bold capitalize ${CATEGORY_COLORS[item.category] || 'text-slate-600'}`}>
          {item.category}
        </span>
      </td>
      <td className="px-4 py-3 font-mono font-bold text-slate-700 text-sm">
        <span className="text-[10px] text-slate-400 font-normal mr-1">Ksh.</span>
        {item.price.toLocaleString()}
      </td>
      <td className="px-4 py-3">
        {onEdit && (
          <button onClick={() => onEdit(item)}
            className="opacity-0 group-hover:opacity-100 transition-opacity btn-secondary text-xs py-1 px-2">
            <Edit sx={{ fontSize: 14 }} /> Edit
          </button>
        )}
      </td>
    </tr>
  );
}

function EditModal({ item, onClose, onSave }) {
  const [name, setName]       = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || 'consultation');
  const [price, setPrice]     = useState(item?.price || 0);

  const handleSave = () => {
    if (!name.trim()) return alert('Name is required');
    onSave({ ...item, name, category, price: parseFloat(price) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl">
          <h2 className="font-black text-white">{item?.id ? 'Edit Price' : 'Add Service'}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Service / Item Name *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CBC Full Haemogram" />
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price (Ksh) *</label>
            <input type="number" className="input" value={price} onChange={e => setPrice(e.target.value)} min={0} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">
            <Save sx={{ fontSize: 16 }} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PriceList() {
  const { role } = useAuth();
  const [prices, setPrices]     = useState(DEFAULT_PRICES);
  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('all');
  const [editing, setEditing]   = useState(null);
  const [adding, setAdding]     = useState(false);

  const filtered = prices
    .filter(p => catFilter === 'all' || p.category === catFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (updated) => {
    if (updated.id) {
      setPrices(prev => prev.map(p => p.id === updated.id ? updated : p));
    } else {
      setPrices(prev => [...prev, { ...updated, id: Date.now() }]);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PriceCheck className="text-primary-600" sx={{ fontSize: 28 }} />
          <div>
            <h1 className="text-2xl font-black text-slate-800">Price List</h1>
            <p className="text-sm text-slate-500">{prices.length} services configured</p>
          </div>
        </div>
        {role === 'admin' && (
          <button onClick={() => setAdding(true)} className="btn-primary shrink-0">
            <Add sx={{ fontSize: 18 }} /> Add Service
          </button>
        )}
      </div>

      {/* Filters (De-containerized) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services…" className="input pl-9 bg-transparent border-slate-200" />
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all capitalize
                ${catFilter === c ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-transparent border-b border-slate-200">
              <tr>
                {['Service / Item', 'Category', 'Price (Ksh)', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <PriceRow key={item.id} item={item} onEdit={role === 'admin' ? setEditing : null} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <PriceCheck sx={{ fontSize: 40 }} className="mb-2 text-slate-200" />
              <p className="font-semibold">No services match your filter</p>
            </div>
          )}
        </div>
      </div>

      {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
      {adding  && <EditModal item={{}} onClose={() => setAdding(false)} onSave={handleSave} />}
    </div>
  );
}
