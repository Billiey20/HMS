import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { 
  LocalHospital, Dashboard, PersonAdd, Assignment, 
  Hotel, MedicalServices, Science, LocalPharmacy, 
  Inventory, ReceiptLong, Group, BarChart, 
  Settings, Logout, Menu, Close, 
  NotificationsNone, AccountCircle, AdminPanelSettings, 
  PriceCheck, MonitorHeart 
} from '@mui/icons-material';
import NotificationBell from './NotificationBell';

// ── Navigation structure (each item has a `section` key for RBAC) ─────────────
const NAV = [
  {
    group: 'CORE',
    items: [
      { to: '/',          label: 'Dashboard',     icon: Dashboard,           section: 'dashboard', exact: true },
    ],
  },
  {
    group: 'ADMIN',
    items: [
      { to: '/admin/prices',  label: 'Price List',     icon: PriceCheck,          section: 'prices' },
    ],
  },
  {
    group: 'RECEPTION',
    items: [
      { to: '/patients',  label: 'Patient Center', icon: PersonAdd,    section: 'patients' },
    ],
  },
  {
    group: 'OPD',
    items: [
      { to: '/opd/triage',       label: 'Triage Queue',    icon: MonitorHeart,    section: 'triage' },
      { to: '/opd/queue',        label: 'Doctor Queue',    icon: Assignment,      section: 'opd' },
      { to: '/opd/consultation', label: 'Consultation',    icon: Assignment,      section: 'opd' },
    ],
  },
  {
    group: 'INPATIENT',
    items: [
      { to: '/ipd/wards',      label: 'Ward & Bed Map',    icon: Hotel,           section: 'ward_map' },
      { to: '/ipd/admissions', label: 'Admissions (ADT)',  icon: Hotel,           section: 'ipd' },
      { to: '/ipd/nursing',    label: 'Ward Rounds (IPD)', icon: MedicalServices, section: 'ipd' },
    ],
  },
  {
    group: 'CLINICAL SUPPORT',
    items: [
      { to: '/lab',      label: 'Laboratory', icon: Science,        section: 'lab'      },
      { to: '/pharmacy', label: 'Pharmacy',   icon: LocalPharmacy,  section: 'pharmacy' },
    ],
  },
  {
    group: 'MANAGEMENT',
    items: [
      { to: '/inventory', label: 'Inventory', icon: Inventory,    section: 'inventory' },
      { to: '/billing',   label: 'Billing',   icon: ReceiptLong,  section: 'billing'   },
      { to: '/hr',        label: 'Staff / HR', icon: Group,       section: 'hr'        },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings, section: 'settings' },
    ],
  },
];

function NavItem({ to, label, icon: Icon, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
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
  const { hasAccess } = usePermissions();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : user?.email;

  const roleBadge = {
    admin:     { label: 'Administrator',  cls: 'bg-blue-100 text-blue-700'    },
    doctor:    { label: 'Clinician',      cls: 'bg-green-100 text-green-700'  },
    nurse:     { label: 'Nurse',          cls: 'bg-green-100 text-green-700'  },
    reception: { label: 'Reception',      cls: 'bg-slate-100 text-slate-700'  },
    pharmacy:  { label: 'Pharmacist',     cls: 'bg-amber-100 text-amber-700'  },
    lab_staff: { label: 'Lab Technician', cls: 'bg-blue-100 text-blue-700'    },
    billing:   { label: 'Billing',        cls: 'bg-amber-100 text-amber-700'  },
    hr:        { label: 'HR',             cls: 'bg-violet-100 text-violet-700' },
    triage:    { label: 'Triage',         cls: 'bg-emerald-100 text-emerald-700' },
  }[role] || { label: role || 'Staff', cls: 'bg-slate-100 text-slate-700' };

  // Filter nav: only show groups that have at least one accessible item
  const visibleNav = NAV
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasAccess(item.section)),
    }))
    .filter(group => group.items.length > 0);

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

      {/* Role badge */}
      <div className="px-5 py-2 border-b border-slate-100">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${roleBadge.cls}`}>
          {roleBadge.label}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {visibleNav.map(({ group, items }) => (
          <div key={group}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1.5">{group}</p>
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
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleSignOut} title="Sign out"
            className="text-slate-400 hover:text-red-500 transition-colors">
            <Logout sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </aside>
  );

  const showSidebar = ['admin', 'hr', 'doctor', 'nurse', 'triage', 'reception'].includes(role);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      {showSidebar && (
        <div className="hidden md:flex h-full flex-col">
          <Sidebar />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {showSidebar && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full"><Sidebar /></div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 left-[17rem] z-20 text-white">
            <Close />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top nav */}
        <header className="flex items-center justify-between px-4 md:px-6 h-14 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            {showSidebar && (
              <button className="md:hidden text-slate-500 hover:text-slate-800" onClick={() => setSidebarOpen(true)}>
                <Menu />
              </button>
            )}
            {!showSidebar && (
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                   <LocalHospital className="text-white" sx={{ fontSize: 18 }} />
                 </div>
                 <span className="font-bold text-slate-800 tracking-wide">Biopassion HMS</span>
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 ${roleBadge.cls}`}>
                   {roleBadge.label}
                 </span>
               </div>
            )}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="hidden sm:block text-xs text-slate-500 font-medium border-r border-slate-200 pr-4">
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            {!showSidebar && (
              <div className="flex items-center gap-3 pl-1">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-slate-800">{displayName}</p>
                </div>
                <button onClick={handleSignOut} title="Sign out" className="text-slate-400 hover:text-red-500 transition-colors">
                  <Logout sx={{ fontSize: 18 }} />
                </button>
              </div>
            )}
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
