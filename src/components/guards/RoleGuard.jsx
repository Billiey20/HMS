import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../context/PermissionsContext';
import { Lock } from '@mui/icons-material';

/**
 * RoleGuard — wraps a route with a section access check.
 * Usage: <RoleGuard section="billing"><Billing /></RoleGuard>
 *
 * If the user's role doesn't have access to `section`,
 * they see a styled 403 page or get redirected to the dashboard.
 */
export default function RoleGuard({ section, children, redirect = false }) {
  const { hasAccess, role } = usePermissions();

  if (hasAccess(section)) return children;

  if (redirect) return <Navigate to="/" replace />;

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="text-red-500" sx={{ fontSize: 32 }} />
        </div>
        <h2 className="text-xl font-black text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500">
          Your current role (<span className="font-bold text-slate-700">{role || 'unknown'}</span>) does
          not have permission to access this section. Please contact HR if you need access.
        </p>
        <a href="/" className="inline-block btn-primary text-sm">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
