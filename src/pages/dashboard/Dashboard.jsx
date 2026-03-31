import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/index';
import {
  MedicalServices, Hotel, Science, 
  ReceiptLong, TrendingUp, TrendingDown, People
} from '@mui/icons-material';

const DIAG_COLORS = ['bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500','bg-emerald-500','bg-teal-500','bg-slate-400'];

export default function Dashboard() {
  const { profile, role } = useAuth();
  const [data, setData] = useState({
    kpis: {},
    beds: [],
    depts: [],
    diagnoses: [],
    revenue: [],
    staff: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [kpis, beds, depts, diagnoses, staff] = await Promise.all([
          analyticsService.getKPIs(),
          analyticsService.getBedOccupancy(),
          analyticsService.getDepartmentActivity(),
          analyticsService.getTopDiagnoses(),
          analyticsService.getStaffOnDuty()
        ]);
        
        let revenue = [];
        // Only load revenue trend if admin or billing (or if user wants everyone, let's load it for everyone as per request 'remove dummy from everywhere and combine')
        revenue = await analyticsService.getRevenueTrend();

        setData({ kpis, beds, depts, diagnoses, revenue, staff });
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [role]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const METRIC_CARDS = [
    { label: 'Total Patients',    value: data.kpis.patients ?? '—',     sub: 'Registered',    icon: People,         color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
    { label: 'OPD (Today)',       value: data.kpis.todayOpd ?? '—',     sub: 'Visits',        icon: MedicalServices,color: 'bg-blue-50 border-blue-100 text-blue-700' },
    { label: 'Inpatients',        value: data.kpis.inpatients ?? '—',   sub: 'Admitted',      icon: Hotel,          color: 'bg-violet-50 border-violet-100 text-violet-700' },
    { label: 'Pending Lab',       value: data.kpis.pendingLab ?? '—',   sub: 'Tests queue',   icon: Science,        color: 'bg-amber-50 border-amber-100 text-amber-700' },
    { label: 'Today Revenue',     value: data.kpis.revenue ? `KES ${data.kpis.revenue.toLocaleString()}` : '—', sub: 'Collected', icon: ReceiptLong,     color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">
          {greeting()}, {profile?.first_name || 'User'} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's what's happening across the hospital today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {METRIC_CARDS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className={`card border p-4 space-y-2 ${color}`}>
            <div className="flex justify-between items-start">
              <Icon sx={{ fontSize: 22 }} />
            </div>
            <div>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs font-bold leading-tight">{label}</p>
              <p className="text-[11px] opacity-70 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics Columns */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* 1. Bed Occupancy */}
        <div className="card p-5">
          <h2 className="font-black text-slate-800 mb-4">Bed Occupancy</h2>
          {data.beds.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No wards configured.</p>
          ) : (
            <div className="space-y-3">
              {data.beds.map(w => {
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
          )}
        </div>

        {/* 2. Department Activity */}
        <div className="card p-5">
          <h2 className="font-black text-slate-800 mb-4">Department Activity Today</h2>
          <div className="space-y-3">
            {data.depts.map((d) => (
              <div key={d.dept}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">{d.dept}</span>
                  <span className="text-slate-500">{d.visits} actions</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Top Diagnoses */}
        <div className="card p-5">
          <h2 className="font-black text-slate-800 mb-4">Top Diagnoses (30 Days)</h2>
          {data.diagnoses.length === 0 ? (
             <p className="text-sm text-slate-400 text-center py-4">No diagnosis data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.diagnoses.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DIAG_COLORS[i % DIAG_COLORS.length]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-semibold text-slate-700 truncate">{d.name}</span>
                      <span className="text-slate-500 shrink-0 ml-1">{d.n} ({d.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${DIAG_COLORS[i % DIAG_COLORS.length]}`} style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card p-5">
          <h2 className="font-black text-slate-800 mb-4">Revenue Trend (Last 7 Days)</h2>
          <div className="flex items-end gap-3 h-40">
            {data.revenue.map((d) => {
              // Normalize height against the max value
              const maxVal = Math.max(...data.revenue.map(r => r.val), 1000);
              const pct = Math.round((d.val / maxVal) * 100);
              return (
                <div key={d.fullDate} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] font-bold text-slate-600">KES {(d.val / 1000).toFixed(0)}k</span>
                  <div className="w-full rounded-t-lg bg-emerald-500 transition-all hover:bg-emerald-600"
                    style={{ height: `${pct}%`, minHeight: '4px' }} />
                  <span className="text-[10px] text-slate-500 truncate text-center">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff on Duty */}
        <div className="card p-5">
          <h2 className="font-black text-slate-800 mb-4">System Users (Active)</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.staff.map((s, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${s.color}`}>
                  <span className="font-black text-sm uppercase">
                    {s.name.substring(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-xs truncate capitalize">{s.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
