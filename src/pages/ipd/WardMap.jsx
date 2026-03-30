import React, { useState } from 'react';
import { Hotel, Person, Add, Search, FilterList, Info } from '@mui/icons-material';

// ── Ward & Bed Data ───────────────────────────────────────────────────────────
const WARDS = [
  {
    id: 'w1', name: 'General Ward', type: 'general', color: 'blue',
    beds: [
      { no: 'G-01', status: 'occupied',    patient: { name: 'James Mwangi',    age: '52', gender: 'M', diagnosis: 'Pneumonia',           admittedAt: '2025-03-27', id: 'BP-00002' } },
      { no: 'G-02', status: 'occupied',    patient: { name: 'Ruth Akinyi',     age: '43', gender: 'F', diagnosis: 'Malaria (severe)',     admittedAt: '2025-03-28', id: 'BP-00007' } },
      { no: 'G-03', status: 'available',   patient: null },
      { no: 'G-04', status: 'available',   patient: null },
      { no: 'G-05', status: 'maintenance', patient: null },
      { no: 'G-06', status: 'occupied',    patient: { name: 'Tom Njoroge',     age: '38', gender: 'M', diagnosis: 'Post-op appendectomy', admittedAt: '2025-03-29', id: 'BP-00009' } },
      { no: 'G-07', status: 'available',   patient: null },
      { no: 'G-08', status: 'available',   patient: null },
      { no: 'G-09', status: 'reserved',    patient: null },
      { no: 'G-10', status: 'available',   patient: null },
    ],
  },
  {
    id: 'w2', name: 'Maternity Ward', type: 'maternity', color: 'pink',
    beds: [
      { no: 'M-01', status: 'occupied',  patient: { name: 'Grace Wanjiku', age: '26', gender: 'F', diagnosis: 'Active labour',      admittedAt: '2025-03-29', id: 'BP-00010' } },
      { no: 'M-02', status: 'occupied',  patient: { name: 'Mary Auma',    age: '31', gender: 'F', diagnosis: 'Post-natal care',    admittedAt: '2025-03-28', id: 'BP-00011' } },
      { no: 'M-03', status: 'available', patient: null },
      { no: 'M-04', status: 'available', patient: null },
      { no: 'M-05', status: 'available', patient: null },
    ],
  },
  {
    id: 'w3', name: 'Surgical Ward', type: 'surgical', color: 'violet',
    beds: [
      { no: 'S-01', status: 'occupied',  patient: { name: 'David Mutua', age: '55', gender: 'M', diagnosis: 'Pre-op hernia repair', admittedAt: '2025-03-29', id: 'BP-00012' } },
      { no: 'S-02', status: 'available', patient: null },
      { no: 'S-03', status: 'available', patient: null },
      { no: 'S-04', status: 'maintenance', patient: null },
    ],
  },
  {
    id: 'w4', name: 'Paediatric Ward', type: 'paediatric', color: 'amber',
    beds: [
      { no: 'P-01', status: 'occupied',  patient: { name: 'Baby Otieno (3y)', age: '3', gender: 'M', diagnosis: 'Febrile seizures', admittedAt: '2025-03-29', id: 'BP-00013' } },
      { no: 'P-02', status: 'available', patient: null },
      { no: 'P-03', status: 'available', patient: null },
    ],
  },
  {
    id: 'w5', name: 'ICU / HDU', type: 'icu', color: 'red',
    beds: [
      { no: 'ICU-01', status: 'occupied',  patient: { name: 'Samuel Odhiambo', age: '67', gender: 'M', diagnosis: 'ARDS / Respiratory failure', admittedAt: '2025-03-27', id: 'BP-00014' } },
      { no: 'ICU-02', status: 'available', patient: null },
      { no: 'ICU-03', status: 'available', patient: null },
    ],
  },
];

// ── Status config ─────────────────────────────────────────────────────────────
const BED_STATUS = {
  available:   { label: 'Available',   bg: 'bg-emerald-100 border-emerald-300 hover:bg-emerald-200',  dot: 'bg-emerald-500', text: 'text-emerald-700' },
  occupied:    { label: 'Occupied',    bg: 'bg-red-100 border-red-300 hover:bg-red-200',              dot: 'bg-red-500',     text: 'text-red-700' },
  maintenance: { label: 'Maintenance', bg: 'bg-slate-200 border-slate-300 cursor-not-allowed opacity-60', dot: 'bg-slate-400', text: 'text-slate-500' },
  reserved:    { label: 'Reserved',    bg: 'bg-amber-100 border-amber-300',                           dot: 'bg-amber-500',   text: 'text-amber-700' },
};

const WARD_COLOR = {
  blue:   { header: 'bg-blue-600',    light: 'bg-blue-50 border-blue-100' },
  pink:   { header: 'bg-pink-500',    light: 'bg-pink-50 border-pink-100' },
  violet: { header: 'bg-violet-600',  light: 'bg-violet-50 border-violet-100' },
  amber:  { header: 'bg-amber-500',   light: 'bg-amber-50 border-amber-100' },
  red:    { header: 'bg-red-600',     light: 'bg-red-50 border-red-100' },
};

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

export default function WardMap() {
  const [selected, setSelected]         = useState(null); // selected bed
  const [wardFilter, setWardFilter]     = useState('all');

  const allBeds = WARDS.flatMap(w => w.beds);
  const totalOccupied    = allBeds.filter(b => b.status === 'occupied').length;
  const totalAvailable   = allBeds.filter(b => b.status === 'available').length;
  const totalMaintenance = allBeds.filter(b => b.status === 'maintenance').length;
  const totalReserved    = allBeds.filter(b => b.status === 'reserved').length;

  const displayedWards = wardFilter === 'all' ? WARDS : WARDS.filter(w => w.id === wardFilter);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">Ward & Bed Map</h1>
        <p className="text-sm text-slate-500">Live bed occupancy across all wards</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Occupied',    count: totalOccupied,    cls: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Available',   count: totalAvailable,   cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Reserved',    count: totalReserved,    cls: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Maintenance', count: totalMaintenance, cls: 'bg-slate-100 border-slate-200 text-slate-600' },
        ].map(({ label, count, cls }) => (
          <div key={label} className={`card border p-4 text-center ${cls}`}>
            <p className="text-3xl font-black">{count}</p>
            <p className="text-xs font-bold uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wide">Legend:</span>
        {Object.entries(BED_STATUS).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
            <span className="text-slate-600 font-medium">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Ward filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setWardFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${wardFilter === 'all' ? 'bg-slate-800 text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
          All Wards
        </button>
        {WARDS.map(w => (
          <button key={w.id} onClick={() => setWardFilter(w.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${wardFilter === w.id ? `${WARD_COLOR[w.color].header} text-white border-transparent` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            {w.name}
          </button>
        ))}
      </div>

      {/* Ward grids */}
      <div className="space-y-6">
        {displayedWards.map(ward => {
          const cfg = WARD_COLOR[ward.color];
          const occupied = ward.beds.filter(b => b.status === 'occupied').length;
          return (
            <div key={ward.id} className={`card overflow-hidden border ${cfg.light}`}>
              {/* Ward header */}
              <div className={`${cfg.header} px-5 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Hotel className="text-white" sx={{ fontSize: 18 }} />
                  <h2 className="font-black text-white">{ward.name}</h2>
                </div>
                <div className="flex items-center gap-3 text-white/80 text-xs font-semibold">
                  <span>{occupied}/{ward.beds.length} occupied</span>
                  <div className="w-24 h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${(occupied / ward.beds.length) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Beds grid */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {ward.beds.map(bed => {
                  const st = BED_STATUS[bed.status];
                  return (
                    <button
                      key={bed.no}
                      onClick={() => bed.status !== 'maintenance' && setSelected({ ward, bed })}
                      className={`relative p-3 rounded-2xl border-2 text-left transition-all text-xs ${st.bg}
                        ${selected?.bed?.no === bed.no ? 'ring-2 ring-offset-1 ring-primary-500' : ''}
                        ${bed.status === 'maintenance' ? '' : 'cursor-pointer'}`}
                    >
                      {/* Status dot */}
                      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${st.dot}`} />
                      <p className="font-black text-slate-700">{bed.no}</p>
                      {bed.patient ? (
                        <>
                          <p className={`font-semibold mt-1 leading-tight ${st.text} truncate`}>
                            {bed.patient.name.split(' ')[0]}
                          </p>
                          <p className="text-slate-500 mt-0.5">{daysSince(bed.patient.admittedAt)}d ago</p>
                        </>
                      ) : (
                        <p className={`mt-1 font-medium ${st.text}`}>{st.label}</p>
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
        <div className="fixed inset-y-0 right-0 z-40 w-80 bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          <div className={`${WARD_COLOR[selected.ward.color].header} px-5 py-4 flex justify-between items-center`}>
            <h3 className="font-black text-white">Bed {selected.bed.no}</h3>
            <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div>
              <p className="label">Ward</p>
              <p className="font-semibold text-slate-800">{selected.ward.name}</p>
            </div>
            <div>
              <p className="label">Status</p>
              <span className={`badge ${BED_STATUS[selected.bed.status].text} bg-opacity-10`}>
                {BED_STATUS[selected.bed.status].label}
              </span>
            </div>

            {selected.bed.patient ? (
              <>
                <hr className="border-slate-100" />
                <div>
                  <p className="label">Patient</p>
                  <p className="font-black text-slate-800 text-base">{selected.bed.patient.name}</p>
                  <p className="text-xs text-slate-500">{selected.bed.patient.id} · {selected.bed.patient.age} yrs · {selected.bed.patient.gender}</p>
                </div>
                <div>
                  <p className="label">Diagnosis</p>
                  <p className="text-slate-700 font-medium">{selected.bed.patient.diagnosis}</p>
                </div>
                <div>
                  <p className="label">Admitted</p>
                  <p className="text-slate-700">
                    {new Date(selected.bed.patient.admittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <span className="text-slate-400 ml-1">({daysSince(selected.bed.patient.admittedAt)} days)</span>
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <button className="w-full btn-primary justify-center">View Full Record</button>
                  <button className="w-full btn-secondary justify-center text-amber-600">Transfer Bed</button>
                  <button className="w-full btn-secondary justify-center text-red-600">Discharge</button>
                </div>
              </>
            ) : (
              <div className="pt-4">
                <p className="text-sm text-slate-500 mb-3">This bed is {BED_STATUS[selected.bed.status].label.toLowerCase()}.</p>
                {selected.bed.status === 'available' && (
                  <button className="w-full btn-primary justify-center">
                    <Add sx={{ fontSize: 16 }} /> Admit Patient Here
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {selected && <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setSelected(null)} />}
    </div>
  );
}
