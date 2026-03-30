import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import PatientCenter from './pages/patients/PatientCenter';
import Triage from './pages/opd/Triage';
import OPDQueue from './pages/opd/Queue';
import Consultation from './pages/opd/Consultation';
import WardMap from './pages/ipd/WardMap';
import Admissions from './pages/ipd/Admissions';
import NursingRounds from './pages/ipd/NursingRounds';
import Pharmacy from './pages/pharmacy/Pharmacy';
import Inventory from './pages/inventory/Inventory';
import Laboratory from './pages/lab/Laboratory';
import Billing from './pages/billing/Billing';
import HR from './pages/hr/HR';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';

// ── Route Guard ──────────────────────────────────────────────────────────────
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Patient Management */}
          <Route path="patients" element={<PatientCenter />} />
          <Route path="patients/register" element={<PatientCenter />} />

          {/* OPD */}
          <Route path="opd/triage"       element={<Triage />} />
          <Route path="opd/queue"        element={<OPDQueue />} />
          <Route path="opd/consultation" element={<Consultation />} />

          {/* Inpatient */}
          <Route path="ipd/wards"      element={<WardMap />} />
          <Route path="ipd/admissions" element={<Admissions />} />
          <Route path="ipd/nursing"    element={<NursingRounds />} />

          {/* Clinical Support */}
          <Route path="lab"      element={<Laboratory />} />
          <Route path="pharmacy" element={<Pharmacy />} />

          {/* Management */}
          <Route path="inventory"         element={<Inventory />} />
          <Route path="inventory/receive" element={<Inventory />} />
          <Route path="billing"           element={<Billing />} />
          <Route path="hr"                element={<HR />} />
          <Route path="reports"           element={<Reports />} />
          <Route path="settings" element={<Settings />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
