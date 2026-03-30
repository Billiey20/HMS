import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  PersonAdd, Hotel, MedicalServices, Science,
  LocalPharmacy, ReceiptLong, Inventory2, Group,
  TrendingUp, AccessTime, Warning
} from '@mui/icons-material';

const stats = [
  { label: 'OPD Today',        value: '—', sub: 'Patients seen',    icon: MedicalServices, color: 'bg-blue-50 text-blue-600',    border: 'border-blue-100' },
  { label: 'Inpatients',       value: '—', sub: 'Occupied beds',     icon: Hotel,           color: 'bg-violet-50 text-violet-600', border: 'border-violet-100' },
  { label: 'Lab Queue',        value: '—', sub: 'Pending tests',     icon: Science,         color: 'bg-amber-50 text-amber-600',  border: 'border-amber-100' },
  { label: 'Pharmacy',         value: '—', sub: 'Pending orders',    icon: LocalPharmacy,   color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
  { label: 'Total Billing',    value: '—', sub: 'Today KES',         icon: ReceiptLong,     color: 'bg-cyan-50 text-cyan-600',    border: 'border-cyan-100' },
  { label: 'Low Stock Alerts', value: '—', sub: 'Items below reorder', icon: Inventory2,    color: 'bg-red-50 text-red-600',      border: 'border-red-100' },
];

const quickActions = [
  { label: 'Register Patient', to: '/patients/register', icon: PersonAdd,     color: 'bg-primary-600 hover:bg-primary-700 text-white' },
  { label: 'Admit to Ward',    to: '/ipd/admissions',    icon: Hotel,          color: 'bg-violet-600 hover:bg-violet-700 text-white' },
  { label: 'Order Lab Test',   to: '/lab',               icon: Science,        color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  { label: 'Dispense Meds',    to: '/pharmacy',          icon: LocalPharmacy,  color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { label: 'New Invoice',      to: '/billing',           icon: ReceiptLong,    color: 'bg-cyan-600 hover:bg-cyan-700 text-white' },
  { label: 'Receive Stock',    to: '/inventory/receive', icon: Inventory2,     color: 'bg-orange-600 hover:bg-orange-700 text-white' },
];

export default function Dashboard() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">
          {greeting()}, {profile?.first_name || 'Doctor'} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's what's happening across the hospital today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, border }) => (
          <div key={label} className={`card p-4 border ${border} flex flex-col gap-2`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} shrink-0`}>
              <Icon sx={{ fontSize: 18 }} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">{value}</p>
              <p className="text-xs font-bold text-slate-700">{label}</p>
              <p className="text-[11px] text-slate-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Recent Registrations</h3>
            <button onClick={() => navigate('/patients')} className="text-xs text-primary-600 font-semibold hover:underline">View all</button>
          </div>
          <div className="text-center py-10 text-slate-400">
            <PersonAdd sx={{ fontSize: 36 }} className="mb-2" />
            <p className="text-sm">No patients yet today</p>
          </div>
        </div>

        {/* Bed Occupancy */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Bed Occupancy</h3>
            <button onClick={() => navigate('/ipd/wards')} className="text-xs text-primary-600 font-semibold hover:underline">View map</button>
          </div>
          <div className="space-y-3">
            {[
              { ward: 'General Ward', total: 30,  occupied: 0 },
              { ward: 'Maternity',    total: 15,  occupied: 0 },
              { ward: 'Surgical',     total: 20,  occupied: 0 },
              { ward: 'Pediatric',    total: 12,  occupied: 0 },
              { ward: 'ICU',          total:  8,  occupied: 0 },
            ].map(({ ward, total, occupied }) => {
              const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
              return (
                <div key={ward}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{ward}</span>
                    <span className="text-slate-500">{occupied}/{total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
