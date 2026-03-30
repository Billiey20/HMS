import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LocalHospital, Dashboard, PersonAdd, Assignment,
  Hotel, MedicalServices, Science, LocalPharmacy,
  Inventory, ReceiptLong, Group, BarChart,
  Settings, Logout, Menu, Close, ExpandMore,
  ChevronRight, NotificationsNone, AccountCircle
} from '@mui/icons-material';

// ── Navigation structure ─────────────────────────────────────────────────────
const NAV = [
  {
    section: 'CORE',
    items: [
      { to: '/', label: 'Dashboard', icon: Dashboard, exact: true },
    ]
  },
  {
    section: 'OPD',
    items: [
      { to: '/patients', label: 'Patient Center', icon: PersonAdd },
      { to: '/opd/triage', label: 'Triage / Vitals', icon: MedicalServices },
      { to: '/opd/queue', label: 'Doctor Queue', icon: Assignment },
      { to: '/opd/consultation', label: 'Consultation', icon: Assignment },
    ]
  },
  {
    section: 'INPATIENT',
    items: [
      { to: '/ipd/wards', label: 'Ward & Bed Map', icon: Hotel },
      { to: '/ipd/admissions', label: 'Admissions (ADT)', icon: Hotel },
      { to: '/ipd/nursing', label: 'Nursing Rounds', icon: MedicalServices },
    ]
  },
  {
    section: 'CLINICAL SUPPORT',
    items: [
      { to: '/lab', label: 'Laboratory', icon: Science },
      { to: '/pharmacy', label: 'Pharmacy', icon: LocalPharmacy },
    ]
  },
  {
    section: 'MANAGEMENT',
    items: [
      { to: '/inventory', label: 'Inventory', icon: Inventory },
      { to: '/billing', label: 'Billing', icon: ReceiptLong },
      { to: '/hr', label: 'Staff / HR', icon: Group },
      { to: '/reports', label: 'Reports', icon: BarChart },
    ]
  },
  {
    section: 'SYSTEM',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ]
  },
];

function NavItem({ to, label, icon: Icon, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
        ${isActive
          ? 'bg-primary-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
      }
    >
      <Icon sx={{ fontSize: 18 }} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email;

  const roleBadge = {
    admin:     { label: 'Administrator', cls: 'badge-blue' },
    doctor:    { label: 'Clinician',     cls: 'badge-green' },
    nurse:     { label: 'Nurse',         cls: 'badge-green' },
    reception: { label: 'Reception',     cls: 'badge-slate' },
    pharmacy:  { label: 'Pharmacist',    cls: 'badge-amber' },
    lab_staff: { label: 'Lab Tech',      cls: 'badge-blue' },
    billing:   { label: 'Billing',       cls: 'badge-amber' },
  }[role] || { label: role || 'Staff', cls: 'badge-slate' };

  const Sidebar = () => (
    <aside className="w-64 shrink-0 h-full flex flex-col bg-white border-r border-slate-200 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
          <LocalHospital className="text-white" sx={{ fontSize: 20 }} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary-600 tracking-widest uppercase leading-none">Biopassion HMS</p>
          <p className="text-xs font-black text-slate-800 leading-tight">Level 4 Hospital</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1.5">{section}</p>
            <div className="space-y-0.5">
              {items.map(item => <NavItem key={item.to} {...item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <AccountCircle className="text-primary-600" sx={{ fontSize: 20 }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
            <span className={`text-[10px] ${roleBadge.cls} px-1.5 py-0.5 rounded-full`}>{roleBadge.label}</span>
          </div>
          <button onClick={handleSignOut} title="Sign out"
            className="text-slate-400 hover:text-red-500 transition-colors">
            <Logout sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar />
          </div>
          <button onClick={() => setSidebarOpen(false)}
            className="absolute top-4 left-[17rem] z-20 text-white">
            <Close />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Nav */}
        <header className="flex items-center justify-between px-4 md:px-6 h-14 bg-white border-b border-slate-200 shrink-0">
          <button className="md:hidden text-slate-500 hover:text-slate-800" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative text-slate-500 hover:text-slate-800 transition-colors">
              <NotificationsNone sx={{ fontSize: 22 }} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {/* Today's date */}
            <span className="hidden sm:block text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
