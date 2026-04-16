import React, { useState, useEffect, useCallback } from 'react';
import { Hotel, Person, Add, Search, FilterList, Info } from '@mui/icons-material';
import { ipdService } from '../../services/ipd';

// ── Status config ─────────────────────────────────────────────────────────────
const BED_STATUS = {
  available: { label: 'Available', bg: 'bg-emerald-100 border-emerald-300 hover:bg-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  occupied: { label: 'Occupied', bg: 'bg-red-100 border-red-300 hover:bg-red-200', dot: 'bg-red-500', text: 'text-red-700' },
  maintenance: { label: 'Maintenance', bg: 'bg-slate-200 border-slate-300 cursor-not-allowed opacity-60', dot: 'bg-slate-400', text: 'text-slate-500' },
  reserved: { label: 'Reserved', bg: 'bg-amber-100 border-amber-300', dot: 'bg-amber-500', text: 'text-amber-700' },
};

const WARD_COLOR = {
  blue: { header: 'bg-blue-600', light: 'bg-blue-50 border-blue-100' },
  pink: { header: 'bg-pink-500', light: 'bg-pink-50 border-pink-100' },
  violet: { header: 'bg-violet-600', light: 'bg-violet-50 border-violet-100' },
  amber: { header: 'bg-amber-500', light: 'bg-amber-50 border-amber-100' },
  red: { header: 'bg-red-600', light: 'bg-red-50 border-red-100' },
};

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

export default function WardMap() {
  const [selected, setSelected] = useState(null);
  const [wardFilter, setWardFilter] = useState('all');
  const [wards, setWards] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wData, oData] = await Promise.all([
        ipdService.listWards(),
        ipdService.getBedOccupancy()
      ]);
      setWards(wData);
      setOccupancy(oData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Transform raw data into the UI structure
  const wardGrid = wards.map(w => {
    const wardBeds = occupancy.filter(o => o.ward_id === w.id);
    return {
      ...w,
      color: w.color || 'blue', // default if not in DB
      beds: wardBeds.map(b => ({
        no: b.bed_no,
        id: b.bed_id,
        status: b.status,
        patient: b.patient_name ? {
          name: b.patient_name,
          id: b.patient_no,
          age: b.age,
          gender: b.gender,
          diagnosis: b.diagnosis,
          admittedAt: b.admitted_at
        } : null
      }))
    };
  });

  const allBeds = wardGrid.flatMap(w => w.beds);
  const totalOccupied = allBeds.filter(b => b.status === 'occupied').length;
  const totalAvailable = allBeds.filter(b => b.status === 'available').length;
  const totalMaintenance = allBeds.filter(b => b.status === 'maintenance').length;
  const totalReserved = allBeds.filter(b => b.status === 'reserved').length;

  const displayedWards = wardFilter === 'all' ? wardGrid : wardGrid.filter(w => w.id === wardFilter);

  if (loading) return (
    <div className="p-20 text-center text-slate-400 animate-pulse">
      <Hotel sx={{ fontSize: 48 }} className="mb-4 opacity-20" />
      <p className="text-lg font-black tracking-widest uppercase">Fetching Live Bed Map...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ward & Bed Occupancy</h1>
        </div>
      </div>

      {/* Summary section - Standalone text */}
      <div className="flex flex-wrap gap-12 py-4 border-y border-slate-100">
        {[
          { label: 'Occupied', count: totalOccupied, color: 'text-red-600' },
          { label: 'Available', count: totalAvailable, color: 'text-emerald-600' },
          { label: 'Reserved', count: totalReserved, color: 'text-amber-600' },
          { label: 'Maintenance', count: totalMaintenance, color: 'text-slate-500' },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex flex-col min-w-[100px]">
            <span className="text-4xl font-black text-slate-900 leading-none tabular-nums">{count}</span>
            <span className={`text-xs font-bold ${color} mt-2`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Ward filter */}
      <div className="flex gap-4 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[10px] font-black text-slate-400 tracking-wider mr-2">Filter ward:</span>
          <button onClick={() => setWardFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${wardFilter === 'all' ? 'bg-slate-800 text-white border-transparent shadow-lg shadow-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            All Wards
          </button>
          {wards.map(w => (
            <button key={w.id} onClick={() => setWardFilter(w.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${wardFilter === w.id ? `${WARD_COLOR[w.color || 'blue'].header} text-white border-transparent shadow-lg shadow-primary-200` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              {w.name}
            </button>
          ))}
        </div>
        <button onClick={loadData} className="flex items-center gap-2 text-slate-400 hover:text-primary-600 transition-colors">
           <Hotel sx={{ fontSize: 18 }} />
           <span className="text-xs font-black tracking-wider">Refresh map</span>
        </button>
      </div>

      {/* Ward grids */}
      <div className="grid grid-cols-1 gap-6">
        {displayedWards.map(ward => {
          const cfg = WARD_COLOR[ward.color || 'blue'];
          const occupied = ward.beds.filter(b => b.status === 'occupied').length;
          return (
            <div key={ward.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${cfg.header}`} />
                  <div>
                    <h2 className="text-lg font-black text-slate-800 leading-none">{ward.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-tight">Active inpatient ward</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-black text-slate-800">{occupied}</span>
                    <span className="text-xs font-bold text-slate-400">/ {ward.beds.length} beds occupied</span>
                  </div>
                  <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${cfg.header} rounded-full transition-all duration-500`} style={{ width: `${(occupied / Math.max(1, ward.beds.length)) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-0 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {ward.beds.map(bed => {
                  const st = BED_STATUS[bed.status || 'available'];
                  return (
                    <button
                      key={bed.id}
                      onClick={() => bed.status !== 'maintenance' && setSelected({ ward, bed })}
                      className={`relative p-4 rounded-2xl border transition-all text-left group
                        ${bed.status === 'occupied' ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent'}
                        ${selected?.bed?.id === bed.id ? 'ring-2 ring-primary-600 scale-95' : 'hover:border-slate-300 hover:-translate-y-0.5'}
                        ${bed.status === 'maintenance' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-black text-slate-800">{bed.no}</span>
                        <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                      </div>

                      {bed.patient ? (
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-[#1a1a1a] leading-tight truncate text-[11px]">
                            {bed.patient.name.split(' ')[0]}
                          </p>
                          <p className="text-slate-400 text-[10px] font-bold">{daysSince(bed.patient.admittedAt)}d stayed</p>
                        </div>
                      ) : (
                        <p className={`font-bold text-[10px] ${st.text}`}>{st.label}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Detail Drawer */}
      {selected && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform animate-in slide-in-from-right">
          <div className={`${WARD_COLOR[selected.ward.color || 'blue'].header} px-5 py-4 flex justify-between items-center`}>
            <h3 className="font-black text-white tracking-wider text-sm">Bed {selected.bed.no} detail</h3>
            <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div>
              <p className="label">Location</p>
              <p className="font-black text-slate-800 text-lg uppercase">{selected.ward.name}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="label">Current Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-3 h-3 rounded-full ${BED_STATUS[selected.bed.status || 'available'].dot}`} />
                <span className={`font-black uppercase text-sm ${BED_STATUS[selected.bed.status || 'available'].text}`}>
                  {BED_STATUS[selected.bed.status || 'available'].label}
                </span>
              </div>
            </div>

            {selected.bed.patient ? (
              <div className="space-y-4">
                <hr className="border-slate-100" />
                <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100">
                  <p className="label text-primary-600">Active Inpatient</p>
                  <p className="font-black text-slate-800 text-xl leading-tight mt-1">{selected.bed.patient.name}</p>
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-1">
                    {selected.bed.patient.id} · {selected.bed.patient.age} yrs · {selected.bed.patient.gender}
                  </p>
                </div>
                <div>
                  <p className="label underline decoration-primary-200 underline-offset-4">Admitting Diagnosis</p>
                  <p className="text-slate-700 font-bold mt-2 text-sm italic">"{selected.bed.patient.diagnosis || 'No diagnosis recorded'}"</p>
                </div>
                <div>
                  <p className="label">Days Stayed</p>
                  <p className="text-slate-800 font-black text-lg">
                    {daysSince(selected.bed.patient.admittedAt)} <span className="text-xs text-slate-400 font-normal">days since admission</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    Admitted: {new Date(selected.bed.patient.admittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="grid gap-2 pt-4">
                  <button className="btn-primary w-full justify-center py-3 rounded-2xl shadow-xl shadow-primary-500/10">Clinical Charts</button>
                  <button className="btn-secondary w-full justify-center py-3 rounded-2xl text-red-600 border-red-100">Discharge Patient</button>
                </div>
              </div>
            ) : (
              <div className="pt-4 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100 border-dashed text-center">
                <Hotel className="text-emerald-200 mb-2" sx={{ fontSize: 40 }} />
                <p className="text-sm font-black text-emerald-800">Available for admission</p>
                <p className="text-xs text-emerald-600 mt-1 mb-4">This bed is ready for a new inpatient assignment.</p>
                {selected.bed.status === 'available' && (
                  <button className="btn-primary w-full justify-center py-3 rounded-2xl">
                    <Add sx={{ fontSize: 16 }} /> New Admission
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {selected && <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelected(null)} />}
    </div>
  );
}
