import React, { createContext, useContext } from 'react';

// ── Role → allowed route sections ─────────────────────────────────────────────
// Each entry is the set of route prefixes this role can access.
export const ROLE_PERMISSIONS = {
  admin: [
    'dashboard', 'admin', 'prices', 'claims',
    'patients',
    'opd', 'triage', 'ipd', 'ward_map',
    'lab', 'pharmacy',
    'inventory', 'billing',
    'hr', 'reports', 'settings',
  ],
  reception: ['patients', 'prices', 'inventory'],
  doctor:    ['patients', 'opd', 'ipd', 'ward_map'],
  triage:    ['triage'],
  nurse:     ['ipd', 'ward_map'],
  lab_staff: ['lab'],
  pharmacy:  ['pharmacy'],
  billing:   ['billing', 'patients'],
  hr:        ['hr'],
  store_keeper: ['inventory'],
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
