import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Person, Hotel, Science, LocalPharmacy,
  ReceiptLong, Inventory2, TrendingUp, TrendingDown,
  MedicalServices, Group
} from '@mui/icons-material';

const METRIC_CARDS = [
  { label: 'OPD Visits (Today)',    value: 47,   sub: '+12 vs yesterday', icon: MedicalServices, trend: 'up',   color: 'bg-blue-50 border-blue-100 text-blue-700' },
  { label: 'New Registrations',     value: 18,   sub: 'Patients today',   icon: Person,          trend: 'up',   color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
  { label: 'Inpatients (Active)',   value: 6,    sub: '6 beds occupied',  icon: Hotel,           trend: null,   color: 'bg-violet-50 border-violet-100 text-violet-700' },
  { label: 'Lab Tests Today',       value: 34,   sub: '5 pending',        icon: Science,         trend: 'up',   color: 'bg-amber-50 border-amber-100 text-amber-700' },
  { label: 'Prescriptions Today',   value: 28,   sub: '3 pending',        icon: LocalPharmacy,   trend: null,   color: 'bg-teal-50 border-teal-100 text-teal-700' },
  { label: 'Revenue (KES)',         value: '87,500', sub: 'Collected', icon: ReceiptLong,     trend: 'up',   color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
  { label: 'Pending Invoices (KES)',value: '38,908', sub: 'Unpaid',   icon: ReceiptLong,     trend: 'down', color: 'bg-amber-50 border-amber-100 text-amber-700' },
  { label: 'Low Stock Items',       value: 4,    sub: 'Need reorder',    icon: Inventory2,      trend: 'down', color: 'bg-red-50 border-red-100 text-red-700' },
];

const WARD_DATA = [
  { name: 'General Ward',   total: 10, occupied: 3 },
  { name: 'Maternity',      total: 5,  occupied: 2 },
  { name: 'Surgical',       total: 4,  occupied: 1 },
  { name: 'Paediatric',     total: 3,  occupied: 0 },
  { name: 'ICU / HDU',      total: 3,  occupied: 1 },
];

const DEPT_ACTIVITY = [
  { dept: 'OPD',       visits: 47, pct: 85 },
  { dept: 'Laboratory',visits: 34, pct: 62 },
  { dept: 'Pharmacy',  visits: 28, pct: 51 },
  { dept: 'Maternity', visits: 4,  pct: 7  },
  { dept: 'Emergency', visits: 6,  pct: 11 },
];

const DIAGNOSIS_DATA = [
  { name: 'Malaria',                n: 12, pct: 26 },
  { name: 'Respiratory Infections', n: 9,  pct: 19 },
  { name: 'Hypertension',           n: 7,  pct: 15 },
  { name: 'Diabetes Mellitus',      n: 6,  pct: 13 },
  { name: 'UTI',                    n: 5,  pct: 11 },
  { name: 'Gastroenteritis',        n: 4,  pct: 9 },
  { name: 'Other',                  n: 4,  pct: 9 },
];

const QUICK_LINKS = [
  { label: 'OPD Triage',      to: '/opd/triage',    icon: MedicalServices, color: 'bg-blue-600' },
  { label: 'Lab Orders',      to: '/lab',            icon: Science,         color: 'bg-amber-600' },
  { label: 'Pharmacy',        to: '/pharmacy',       icon: LocalPharmacy,   color: 'bg-emerald-600' },
  { label: 'Billing',         to: '/billing',        icon: ReceiptLong,     color: 'bg-primary-600' },
  { label: 'Inventory',       to: '/inventory',      icon: Inventory2,      color: 'bg-orange-600' },
  { label: 'Staff',           to: '/hr',             icon: Group,           color: 'bg-violet-600' },
];

const DIAG_COLORS = ['bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500','bg-emerald-500','bg-teal-500','bg-slate-400'];

export default function Reports() {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Reports & Analytics</h1>
        <p className="text-sm text-slate-500">
          Hospital performance dashboard · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRIC_CARDS.map(({ label, value, sub, icon: Icon, trend, color }) => (
          <div key={label} className={`card border p-4 space-y-2 ${color}`}>
            <div className="flex justify-between items-start">
              <Icon sx={{ fontSize: 22 }} />
              {trend && (
                trend === 'up'
                  ? <TrendingUp sx={{ fontSize: 18 }} className="text-emerald-500" />
                  : <TrendingDown sx={{ fontSize: 18 }} className="text-red-500" />
              )}
            </div>
            <div>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs font-bold leading-tight">{label}</p>
              <p className="text-[11px] opacity-70 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* Bed Occupancy */}
        <div className="card p-5">
          <h2 className="font-black text-slate-800 mb-4">Bed Occupancy</h2>
          <div className="space-y-3">
            {WARD_DATA.map(w => {
              const pct = w.total > 0 ? Math.round((w.occupied / w.total) * 100) : 0;
              const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-500';
              return (
                <div key={w.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{w.name}</span>
                    <span className="text-slate-500">{w.occupied}/{w.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Total beds: {WARD_DATA.reduce((s, w) => s + w.total, 0)}</span>
            <span>Occupied: {WARD_DATA.reduce((s, w) => s + w.occupied, 0)}</span>
            <span>Available: {WARD_DATA.reduce((s, w) => s + (w.total - w.occupied), 0)}</span>
          </div>
        </div>

        {/* Department Activity */}
        <div className="card p-5">
          <h2 className="font-black text-slate-800 mb-4">Department Activity Today</h2>
          <div className="space-y-3">
            {DEPT_ACTIVITY.map((d, i) => (
              <div key={d.dept}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">{d.dept}</span>
                  <span className="text-slate-500">{d.visits} interactions</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Diagnoses */}
        <div className="card p-5">
          <h2 className="font-black text-slate-800 mb-4">Top Diagnoses (Month)</h2>
          <div className="space-y-2.5">
            {DIAGNOSIS_DATA.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DIAG_COLORS[i]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-semibold text-slate-700 truncate">{d.name}</span>
                    <span className="text-slate-500 shrink-0 ml-1">{d.n} ({d.pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${DIAG_COLORS[i]}`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue chart placeholder */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-black text-slate-800">Revenue Trend (Last 7 Days)</h2>
          <span className="badge badge-green">KES 87,500 today</span>
        </div>
        {/* Simple bar chart using CSS */}
        <div className="flex items-end gap-3 h-40">
          {[
            { day: 'Mon', val: 52000 },
            { day: 'Tue', val: 68000 },
            { day: 'Wed', val: 45000 },
            { day: 'Thu', val: 78000 },
            { day: 'Fri', val: 61000 },
            { day: 'Sat', val: 34000 },
            { day: 'Sun (Today)', val: 87500 },
          ].map(({ day, val }) => {
            const pct = Math.round((val / 100000) * 100);
            return (
              <div key={day} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] font-bold text-slate-600">KES {(val / 1000).toFixed(0)}k</span>
                <div className="w-full rounded-t-lg bg-primary-600 transition-all hover:bg-primary-700"
                  style={{ height: `${pct}%` }} />
                <span className="text-[10px] text-slate-500 truncate text-center">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {QUICK_LINKS.map(({ label, to, icon: Icon, color }) => (
            <button key={label} onClick={() => navigate(to)}
              className={`${color} text-white rounded-2xl p-4 flex flex-col items-center gap-2 text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm`}>
              <Icon sx={{ fontSize: 24 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff on duty */}
      <div className="card p-5">
        <h2 className="font-black text-slate-800 mb-4">Staff on Duty Today</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: 'Dr. David Kimani',  dept: 'OPD',             role: 'Doctor',     shift: 'Morning' },
            { name: 'Dr. Grace Njeri',   dept: 'Maternity',        role: 'Doctor',     shift: 'Morning' },
            { name: 'Nurse Wanjiku K.',  dept: 'General Ward',     role: 'Nurse',      shift: 'Morning' },
            { name: 'Nurse Amina H.',    dept: 'Maternity',        role: 'Nurse',      shift: 'Morning' },
            { name: 'John Ochieng',      dept: 'Laboratory',       role: 'Lab Tech',   shift: 'Morning' },
            { name: 'James Mwangi',      dept: 'Pharmacy',         role: 'Pharmacist', shift: 'Morning' },
          ].map(s => (
            <div key={s.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-700 font-black text-sm">
                  {s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate">{s.name}</p>
                <p className="text-[10px] text-slate-500">{s.role} · {s.dept}</p>
              </div>
              <span className="badge badge-green text-[10px] shrink-0">{s.shift}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
