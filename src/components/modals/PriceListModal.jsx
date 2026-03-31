import React, { useState } from 'react';
import { Search } from '@mui/icons-material';

const SERVICE_CATEGORIES = {
  consultation: { label: 'Consultation',  color: 'text-blue-600'    },
  lab:          { label: 'Laboratory',    color: 'text-amber-600'  },
  pharmacy:     { label: 'Pharmacy',      color: 'text-emerald-600' },
  ward:         { label: 'Ward / Bed',    color: 'text-violet-600'  },
  procedure:    { label: 'Procedure',     color: 'text-rose-600'    },
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

export default function PriceListModal({ onClose }) {
  const [search, setSearch] = useState('');
  
  const filtered = PRICE_LIST.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    SERVICE_CATEGORIES[item.category]?.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="font-black text-slate-800 text-xl tracking-tight">Service Price List</h2>
            <p className="text-slate-400 text-xs mt-0.5 font-bold uppercase tracking-widest">Hospital Charges Catalog</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all text-slate-400 hover:text-slate-600 font-bold">×</button>
        </div>
        
        <div className="px-6 py-2 bg-white">
          <div className="relative border-b border-slate-100 flex items-center">
            <Search className="text-slate-300" fontSize="small" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search services or categories..." 
              className="w-full py-3 px-3 text-sm font-bold text-slate-700 placeholder:text-slate-300 bg-transparent focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          <div className="space-y-3">
            {filtered.length === 0 ? (
               <div className="text-center p-8 text-slate-400 font-bold">No services found matching "{search}"</div>
            ) : (
              filtered.map((item, idx) => {
                const cat = SERVICE_CATEGORIES[item.category];
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                      <span className={`inline-block mt-0.5 text-[11px] font-bold uppercase tracking-wider ${cat?.color || 'text-slate-400'}`}>
                        {cat?.label || item.category}
                      </span>
                    </div>
                    <div className="text-right">
                       <p className="font-mono font-black text-slate-800 text-base">
                          <span className="text-[10px] text-slate-400 font-normal mr-1">Ksh.</span>
                          {item.price.toLocaleString()}
                       </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
