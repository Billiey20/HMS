import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuth } from './context/AuthContext';
import RoleGuard from './components/guards/RoleGuard';

import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import PatientCenter from './pages/patients/PatientCenter';
import EmergencyDashboard from './pages/emergency/EmergencyDashboard';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import Appointments from './pages/reception/Appointments';
import FollowUps from './pages/reception/FollowUps';
import Triage from './pages/opd/Triage';
import OPDQueue from './pages/opd/Queue';
import Consultation from './pages/opd/Consultation';
import WardMap from './pages/ipd/WardMap';
import Admissions from './pages/ipd/Admissions';
import NursingRounds from './pages/ipd/NursingRounds';
import MaternityDashboard from './pages/maternity/MaternityDashboard';
import PaediatricsDashboard from './pages/paediatrics/PaediatricsDashboard';
import SurgeryDashboard from './pages/surgery/SurgeryDashboard';
import ICUDashboard from './pages/icu/ICUDashboard';
import IsolationDashboard from './pages/isolation/IsolationDashboard';
import SpecialClinicsHub from './pages/special_clinics/SpecialClinicsHub';
import PhysioDashboard from './pages/physio/PhysioDashboard';
import DentalDashboard from './pages/dental/DentalDashboard';
import EyeDashboard from './pages/eye/EyeDashboard';
import SocialWorkDashboard from './pages/social_work/SocialWorkDashboard';
import Pharmacy from './pages/pharmacy/Pharmacy';
import Inventory from './pages/inventory/Inventory';
import Laboratory from './pages/lab/Laboratory';
import Billing from './pages/billing/Billing';
import ShaClaims from './pages/billing/ShaClaims';
import HR from './pages/hr/HR';
import Settings from './pages/settings/Settings';
import PriceList from './pages/admin/PriceList';
import Claims from './pages/admin/Claims';

// ── Route Guard (auth) ────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Loading session…</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

// ── Navigation Redirects ──────────────────────────────────────────────────────
function HomeRedirect() {
  const { user, role, loading } = useAuth();
  
  if (loading) return null;

  if (user && !role) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing Role...</p>
        </div>
      </div>
    );
  }

  if (role === 'triage')       return <Navigate to="/opd/triage" replace />;
  if (role === 'reception')    return <Navigate to="/patients" replace />;
  if (role === 'pharmacy')     return <Navigate to="/pharmacy" replace />;
  if (role === 'lab_staff')    return <Navigate to="/lab" replace />;
  if (role === 'doctor')       return <Navigate to="/opd/queue" replace />;
  if (role === 'nurse')        return <Navigate to="/ipd/wards" replace />;
  if (role === 'billing')      return <Navigate to="/billing" replace />;
  if (role === 'store_keeper') return <Navigate to="/inventory" replace />;
  if (role === 'hr')           return <Navigate to="/hr" replace />;
  if (role === 'admin')        return <Navigate to="/dashboard" replace />;
  
  // Final fallback if logged in but role is unknown or doesn't have a dashboard
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <>
      <ToastContainer />
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

          {/* Root Redirect */}
          <Route index element={<HomeRedirect />} />
          <Route path="dashboard" element={<RoleGuard section="dashboard"><Dashboard /></RoleGuard>} />

          {/* Admin */}
          <Route path="admin/prices" element={<RoleGuard section="prices"><PriceList /></RoleGuard>} />
          <Route path="admin/claims" element={<RoleGuard section="claims"><Claims /></RoleGuard>} />

          {/* Reception / Patients */}
          <Route path="reception" element={<RoleGuard section="patients"><ReceptionDashboard /></RoleGuard>} />
          <Route path="patients" element={<RoleGuard section="patients"><PatientCenter /></RoleGuard>} />
          <Route path="patients/register" element={<RoleGuard section="patients"><PatientCenter /></RoleGuard>} />
          <Route path="appointments" element={<RoleGuard section="appointments"><Appointments /></RoleGuard>} />
          <Route path="followups" element={<RoleGuard section="followups"><FollowUps /></RoleGuard>} />


          {/* Outpatient & Emergency */}
          <Route path="emergency" element={<RoleGuard section="emergency"><EmergencyDashboard /></RoleGuard>} />
          <Route path="opd/triage"       element={<RoleGuard section="triage"><Triage /></RoleGuard>} />
          <Route path="opd/queue"        element={<RoleGuard section="opd"><OPDQueue /></RoleGuard>} />
          <Route path="opd/consultation" element={<RoleGuard section="opd"><Consultation /></RoleGuard>} />

          {/* Inpatient */}
          <Route path="ipd/wards"      element={<RoleGuard section="ward_map"><WardMap /></RoleGuard>} />
          <Route path="ipd/admissions" element={<RoleGuard section="ipd"><Admissions /></RoleGuard>} />
          <Route path="ipd/nursing"    element={<RoleGuard section="ipd"><NursingRounds /></RoleGuard>} />

          {/* Specialized Wards */}
          <Route path="maternity"    element={<RoleGuard section="maternity"><MaternityDashboard /></RoleGuard>} />
          <Route path="paediatrics"  element={<RoleGuard section="paediatrics"><PaediatricsDashboard /></RoleGuard>} />
          <Route path="surgery"      element={<RoleGuard section="surgery"><SurgeryDashboard /></RoleGuard>} />
          <Route path="icu"          element={<RoleGuard section="icu"><ICUDashboard /></RoleGuard>} />
          <Route path="isolation"    element={<RoleGuard section="isolation"><IsolationDashboard /></RoleGuard>} />

          {/* Phase 2: Vertical Clinics & Allied Health */}
          <Route path="special-clinics" element={<RoleGuard section="special_clinics"><SpecialClinicsHub /></RoleGuard>} />
          <Route path="physio"          element={<RoleGuard section="physio"><PhysioDashboard /></RoleGuard>} />
          <Route path="dental"          element={<RoleGuard section="dental"><DentalDashboard /></RoleGuard>} />
          <Route path="eye"             element={<RoleGuard section="eye"><EyeDashboard /></RoleGuard>} />
          <Route path="social-work"     element={<RoleGuard section="social_work"><SocialWorkDashboard /></RoleGuard>} />

          {/* Clinical Support */}
          <Route path="lab"      element={<RoleGuard section="lab"><Laboratory /></RoleGuard>} />
          <Route path="pharmacy" element={<RoleGuard section="pharmacy"><Pharmacy /></RoleGuard>} />

          {/* Management */}
          <Route path="inventory"         element={<RoleGuard section="inventory"><Inventory /></RoleGuard>} />
          <Route path="inventory/receive" element={<RoleGuard section="inventory"><Inventory /></RoleGuard>} />
          <Route path="billing"                element={<RoleGuard section="billing"><Billing /></RoleGuard>} />
          <Route path="billing/sha-claims"     element={<RoleGuard section="billing"><ShaClaims /></RoleGuard>} />
          <Route path="hr"                element={<RoleGuard section="hr"><HR /></RoleGuard>} />
          <Route path="settings"          element={<RoleGuard section="settings"><Settings /></RoleGuard>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </>
  );
}
