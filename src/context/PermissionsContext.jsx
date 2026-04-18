import React, { createContext, useContext } from 'react';

// ── Role → allowed route sections ─────────────────────────────────────────────
// Each entry is the set of route prefixes this role can access.
export const ROLE_PERMISSIONS = {
  admin: [
    'dashboard', 'admin', 'prices', 'claims',
    'patients', 'emergency',
    'opd', 'triage', 'ipd', 'ward_map',
    'maternity', 'paediatrics', 'surgery', 'icu', 'isolation',
    'special_clinics', 'physio', 'dental', 'eye', 'social_work',
    'lab', 'pharmacy',
    'inventory', 'billing',
    'hr', 'reports', 'settings',
    'appointments', 'followups',
  ],
  reception: ['patients', 'prices', 'inventory', 'appointments', 'followups'],
  doctor:    ['patients', 'emergency', 'opd', 'ipd', 'ward_map', 'appointments', 'followups', 'maternity', 'paediatrics', 'surgery', 'icu', 'isolation', 'special_clinics'],
  triage:    ['triage'],
  nurse:     ['emergency', 'ipd', 'ward_map', 'maternity', 'paediatrics', 'surgery', 'icu', 'isolation', 'special_clinics'],
  lab_staff: ['lab'],
  pharmacy:  ['pharmacy'],
  billing:   ['billing', 'patients', 'claims'],
  hr:        ['hr'],
  store_keeper: ['inventory'],
  // Allied Health & Specialists
  physiotherapist: ['physio', 'patients', 'appointments'],
  dentist:         ['dental', 'patients', 'appointments'],
  optometrist:     ['eye', 'patients', 'appointments'],
  social_worker:   ['social_work', 'patients', 'appointments'],
};

const PermissionsContext = createContext({ allowed: [], hasAccess: () => false });

export function PermissionsProvider({ role, children }) {
  const allowed = ROLE_PERMISSIONS[role] || [];

  const hasAccess = (section) => {
    if (!role) return false;
    if (role === 'admin') return true;
    return allowed.includes(section);
  };

  return (
    <PermissionsContext.Provider value={{ allowed, hasAccess, role }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionsContext);
