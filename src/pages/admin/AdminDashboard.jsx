import React, { useState, useEffect } from 'react';
import {
  AdminPanelSettings, People, LocalHospital, Science,
  ReceiptLong, Refresh, TrendingUp, Hotel, LocalPharmacy,
  PriceCheck, Settings,
} from '@mui/icons-material';
import { patientService, opdService, ipdService, labService, billingService } from '../../services/index';
import { useAuth } from '../../context/AuthContext';

function StatCard({ label, value, sub, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: { bg: 'bg-primary-50', border: 'border-primary-100', icon: 'text-primary-600', val: 'text-primary-700' },
    green:   { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-600', val: 'text-emerald-700' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   icon: 'text-amber-600',   val: 'text-amber-700'   },
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    icon: 'text-blue-600',    val: 'text-blue-700'    },
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-100',  icon: 'text-violet-600',  val: 'text-violet-700'  },
  }[color];

  return (
    <div className={`card p-5 border ${colors.border} ${colors.bg}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-black mt-1 ${colors.val}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
          <Icon className={colors.icon} sx={{ fontSize: 22 }} />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [patients, todayOpd, inpatients, pendingLab, revenue] = await Promise.all([
        patientService.count(),
        opdService.todayCount(),
        ipdService.activeCount(),
        labService.pendingCount(),
        billingService.todayRevenue(),
      ]);
      setStats({ patients, todayOpd, inpatients, pendingLab, revenue });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const quickLinks = [
    { label: 'Manage Price List',  href: '/admin/prices',  icon: PriceCheck,    color: 'bg-primary-600' },
    { label: 'Staff & HR',         href: '/hr',            icon: People,        color: 'bg-violet-600'  },
    { label: 'Reports',            href: '/reports',       icon: TrendingUp,    color: 'bg-emerald-600' },
    { label: 'Settings',           href: '/settings',      icon: Settings,      color: 'bg-slate-600'   },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AdminPanelSettings className="text-primary-600" sx={{ fontSize: 28 }} />
            <h1 className="text-2xl font-black text-slate-800">Admin Overview</h1>
          </div>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-bold text-slate-700">{profile?.first_name}</span>. Here's the system snapshot.
          </p>
        </div>
        <button onClick={loadStats} className="btn-secondary shrink-0">
          <Refresh sx={{ fontSize: 16 }} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Patients"   value={loading ? '…' : stats.patients?.toLocaleString()}  icon={People}        color="primary" />
        <StatCard label="OPD Today"        value={loading ? '…' : stats.todayOpd}                    icon={LocalHospital} color="blue"    />
        <StatCard label="Inpatients"       value={loading ? '…' : stats.inpatients}                  icon={Hotel}         color="violet"  />
        <StatCard label="Pending Lab"      value={loading ? '…' : stats.pendingLab}                  icon={Science}       color="amber"   />
        <StatCard
          label="Today's Revenue"
          value={loading ? '…' : `KES ${(stats.revenue || 0).toLocaleString()}`}
          icon={ReceiptLong}
          color="green"
        />
      </div>

      {/* System Modules Status */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">System Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Reception (Patient Registration)', status: 'Live',   href: '/patients',  icon: People        },
            { name: 'OPD — Triage, Queue & Consultation', status: 'Live', href: '/opd/triage', icon: LocalHospital },
            { name: 'Inpatient — Wards & Nursing',      status: 'Live',   href: '/ipd/wards', icon: Hotel         },
            { name: 'Laboratory',                        status: 'Live',   href: '/lab',       icon: Science       },
            { name: 'Pharmacy',                          status: 'Live',   href: '/pharmacy',  icon: LocalPharmacy },
            { name: 'Billing & Payments',                status: 'Live',   href: '/billing',   icon: ReceiptLong   },
            { name: 'Inventory Management',              status: 'Live',   href: '/inventory', icon: ReceiptLong   },
            { name: 'HR & Staff Management',             status: 'Live',   href: '/hr',        icon: People        },
          ].map(({ name, status, href, icon: Icon }) => (
            <a key={href} href={href}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="text-primary-600" sx={{ fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 group-hover:text-primary-700 transition-colors">{name}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{status}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
