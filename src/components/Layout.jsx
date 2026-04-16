import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import hospital from '../config/hospital';

import { 
  LocalHospital, Dashboard, PersonAdd, Assignment, 
  Hotel, MedicalServices, Science, LocalPharmacy, 
  Inventory, ReceiptLong, Group, BarChart, 
  Settings, Logout, Menu, Close, 
  NotificationsNone, AccountCircle, AdminPanelSettings, 
  PriceCheck, MonitorHeart, Refresh,
  Fullscreen, FullscreenExit
} from '@mui/icons-material';
import NotificationBell from './NotificationBell';
import { notify } from '../utils/toast';

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
      { to: '/admin/claims',  label: 'SHA Claims',     icon: ReceiptLong,         section: 'claims' },
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
  const location = useLocation();
  const isLegacyModule = ['/pharmacy', '/lab'].includes(location.pathname);
  
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_expanded');
    return saved === null ? true : JSON.parse(saved);
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_expanded', JSON.stringify(next));
      return next;
    });
  };

  // ── Fullscreen ────────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    // F11 shortcut (browser normally handles F11, so intercept it at app level too)
    const onKey = (e) => {
      if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onFSChange);
      window.removeEventListener('keydown', onKey);
    };
  }, [toggleFullscreen]);


  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : user?.email;

  const roleBadge = {
    admin:     { label: 'Administrator',  dept: 'System Admin',      icon: '🛡️', bar: 'bg-blue-500',    txt: 'text-blue-700',    bg: 'bg-blue-50'    },
    doctor:    { label: 'Clinician',      dept: 'OPD / Consultation', icon: '🩺', bar: 'bg-emerald-500', txt: 'text-emerald-700', bg: 'bg-emerald-50' },
    nurse:     { label: 'Nurse',          dept: 'Clinical Ward',      icon: '💊', bar: 'bg-emerald-500', txt: 'text-emerald-700', bg: 'bg-emerald-50' },
    reception: { label: 'Reception',      dept: 'Front Desk',         icon: '🏥', bar: 'bg-primary-500', txt: 'text-primary-700', bg: 'bg-primary-50' },
    pharmacy:  { label: 'Pharmacist',     dept: 'Pharmacy',           icon: '💊', bar: 'bg-amber-500',   txt: 'text-amber-700',   bg: 'bg-amber-50'   },
    lab_staff: { label: 'Lab Technician', dept: 'Laboratory',         icon: '🔬', bar: 'bg-blue-500',    txt: 'text-blue-700',    bg: 'bg-blue-50'    },
    billing:   { label: 'Billing',        dept: 'Finance',            icon: '💳', bar: 'bg-amber-500',   txt: 'text-amber-700',   bg: 'bg-amber-50'   },
    hr:        { label: 'HR Officer',     dept: 'Human Resources',    icon: '👥', bar: 'bg-violet-500',  txt: 'text-violet-700',  bg: 'bg-violet-50'  },
    triage:    { label: 'Triage Nurse',   dept: 'Triage & Vitals',    icon: '❤️‍🩹', bar: 'bg-rose-500',    txt: 'text-rose-700',    bg: 'bg-rose-50'    },
  }[role] || { label: role || 'Staff', dept: 'General', icon: '👤', bar: 'bg-slate-400', txt: 'text-slate-700', bg: 'bg-slate-50' };

  // Filter nav: only show groups that have at least one accessible item
  const visibleNav = NAV
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasAccess(item.section)),
    }))
    .filter(group => group.items.length > 0);

  const Sidebar = () => (
    <aside className={`h-full flex flex-col bg-white overflow-y-auto transition-all ${isSidebarExpanded ? 'w-64' : 'w-20'}`}>
      {/* Logo Component (condensed if needed, but here we just hide labels when closed) */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 min-h-[72px]">
        {isSidebarExpanded && (
          <div className="flex items-center gap-3 animate-in fade-in duration-300">
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <img src="/logo.png" alt="Biopassion Logo" className="w-full h-full object-cover" />
            </div>
            <div>
               <p className="text-[9px] font-black text-primary-600 tracking-widest uppercase leading-none">{hospital.name}</p>
               <p className="text-xs font-black text-slate-800 leading-tight">{hospital.tagline}</p>
            </div>
          </div>
        )}
        {/* Spacer for minimized mode to keep the top-border consistent */}
        {!isSidebarExpanded && <div className="h-2" />}
      </div>



      {/* Nav — flat list, no group headers */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {visibleNav.flatMap(({ items }) => items).map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
              ${isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`
            }
          >
            <item.icon sx={{ fontSize: 20 }} className={isSidebarExpanded ? '' : 'mx-auto'} />
            {isSidebarExpanded && <span className="text-sm font-bold truncate">{item.label}</span>}
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100">
        <div className={`flex items-center gap-3 p-2 rounded-2xl ${isSidebarExpanded ? 'bg-slate-50' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <AccountCircle className="text-primary-600" sx={{ fontSize: 20 }} />
          </div>
          {isSidebarExpanded && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-300">
              <p className="text-[11px] font-black text-slate-800 truncate">{profile?.first_name} {profile?.last_name || ''}</p>
              <p className={`text-[10px] font-bold truncate ${roleBadge.txt}`}>{roleBadge.label}</p>
            </div>
          )}
          {isSidebarExpanded && (
            <button onClick={handleSignOut} title="Sign out" className="text-slate-400 hover:text-red-500 transition-colors">
              <Logout sx={{ fontSize: 16 }} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  const showSidebar = !isLegacyModule && ['admin', 'hr', 'doctor', 'nurse', 'triage', 'reception'].includes(role);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Desktop sidebar */}
      {showSidebar && (
        <div className={`hidden md:flex h-full flex-col transition-all duration-300 ease-in-out border-r border-slate-100 ${isSidebarExpanded ? 'w-64' : 'w-20'}`}>
          <Sidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="fixed top-6 right-8 z-[100] flex items-center gap-3 animate-in slide-in-from-top-4 duration-700">
          <div className="hidden sm:flex flex-col items-end gap-0.5 pointer-events-none">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long' })}
            </p>
            <p className="text-xs font-black text-slate-800 leading-none">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />
          <NotificationBell />
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen (F11)' : 'Enter fullscreen (F11)'}
            className={`transition-colors hover:scale-110 active:scale-95 transition-transform
              ${isFullscreen ? 'text-primary-600' : 'text-slate-400 hover:text-slate-700'}`}
          >
            {isFullscreen
              ? <FullscreenExit sx={{ fontSize: 22 }} />
              : <Fullscreen sx={{ fontSize: 22 }} />}
          </button>
        </div>

        {/* Unified Toggle Button (Ghost Style) */}
        {showSidebar && (
          <button 
            onClick={toggleSidebar}
            className={`fixed top-6 z-50 w-10 h-10 text-slate-400 hover:text-slate-800 transition-all duration-300 ease-in-out hover:scale-110 active:scale-95
              ${isSidebarExpanded ? 'left-[14.5rem]' : 'left-5'}`}
          >
            {isSidebarExpanded ? <Close sx={{ fontSize: 24 }} /> : <Menu sx={{ fontSize: 24 }} />}
          </button>
        )}

        {/* Unified App Header for non-sidebar users (Legacy Modules) */}
        {!showSidebar && isLegacyModule && (
           <div className="absolute top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-50 flex items-center justify-between px-6 shadow-sm">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    <img src="/logo.png" alt="Biopassion Logo" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex flex-col">
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest leading-none">{hospital.name}</p>
                   <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                     {location.pathname === '/pharmacy' ? 'Pharmacy' : 'Laboratory'}
                   </p>
                 </div>
               </div>
             </div>

             <div className="flex items-center gap-6 pr-[240px]"> {/* Distanced from floating date/notif */}
               {/* Module Actions (e.g., Refresh for Lab) */}
               {location.pathname === '/lab' && (
                 <button 
                   onClick={() => window.dispatchEvent(new CustomEvent('hms-refresh-lab'))}
                   className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all border border-slate-200 group mr-4"
                 >
                   <Refresh sx={{ fontSize: 18 }} className="group-hover:rotate-180 transition-transform duration-500" />
                   Refresh
                 </button>
               )}

               {/* User Context & Logout */}
               <div className="flex items-center gap-4 border-l border-slate-200 pl-6 h-10">
                 <div className="text-right whitespace-nowrap">
                   <p className="text-xs font-black text-slate-800 leading-none">{displayName}</p>
                   <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">{roleBadge.label}</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 shadow-inner">
                   <AccountCircle sx={{ fontSize: 24 }} />
                 </div>
                 <button onClick={handleSignOut} title="Sign out" className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-200 flex items-center justify-center">
                   <Logout sx={{ fontSize: 20 }} />
                 </button>
               </div>
             </div>
           </div>
        )}

        {!showSidebar && !isLegacyModule && (
           <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
             <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img src="/logo.png" alt="Biopassion Logo" className="w-full h-full object-cover" />
             </div>
             <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{hospital.name}</p>
           </div>
        )}

        <button className="md:hidden absolute top-6 left-6 z-50 w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-lg" 
          onClick={() => setMobileMenuOpen(true)}>
          <Menu sx={{ fontSize: 20 }} />
        </button>

        {/* Main Page View */}
        <main className={`flex-1 min-w-0 max-w-full overflow-y-auto overflow-x-hidden ${isLegacyModule ? 'pt-16' : ''}`}>
          <div className="p-0 min-w-0 max-w-full">
             <Outlet />
          </div>
        </main>
      </div>

      {showSidebar && mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-10 w-64 h-full">
             <aside className="w-full h-full bg-white flex flex-col shadow-2xl">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                   <span className="font-black text-slate-800">Menu</span>
                   <button onClick={() => setMobileMenuOpen(false)}><Close /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                   {visibleNav.map(({ group, items }) => (
                     <div key={group}>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{group}</p>
                       <div className="space-y-1">
                          {items.map(item => (
                            <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                              className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${isActive ? 'bg-primary-600 text-white' : 'text-slate-600'}`}>
                               <item.icon sx={{ fontSize: 20 }} /> {item.label}
                            </NavLink>
                          ))}
                       </div>
                     </div>
                   ))}
                </div>
             </aside>
          </div>
        </div>
      )}
    </div>
  );
}
