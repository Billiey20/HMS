// ── Compatibility shim ────────────────────────────────────────────────────────
// This file is kept for backward compatibility.
// All services have been split into individual files under src/services/
// New imports should use: import { someService } from '../services/someService'
// or use the barrel: import { someService } from '../services/index'
// ─────────────────────────────────────────────────────────────────────────────

export { patientService }      from './patients.js';
export { opdService }          from './opd.js';
export { consultationService } from './consultations.js';
export { labService }          from './lab.js';
export { pharmacyService }     from './pharmacy.js';
export { inventoryService }    from './inventory.js';
export { ipdService }          from './ipd.js';
export { billingService }      from './billing.js';
export { hrService }           from './hr.js';
export { settingsService }     from './settings.js';
