/**
 * Hospital Configuration — Single Source of Truth
 * ==================================================
 * All facility-specific branding, identity and settings live here.
 * On a new installation:
 *   1. Update VITE_HOSPITAL_* variables in .env
 *   2. Restart the dev server — every component picks up the change automatically.
 *
 * No other files need to be touched during client onboarding.
 */

const env = (key, fallback = '') => import.meta.env[key] ?? fallback;

const hospital = {
  // ── Identity ──────────────────────────────────────────────────────────────
  /** Short name shown in the sidebar, header, and browser tab */
  name:       env('VITE_HOSPITAL_NAME',     'Hospital HMS'),

  /** One-line descriptor shown below the name (e.g. facility type or tagline) */
  tagline:    env('VITE_HOSPITAL_TAGLINE',  'Hospital Management System'),

  /** Full legal / registered name for billing, receipts and documents */
  legalName:  env('VITE_HOSPITAL_LEGAL_NAME', env('VITE_HOSPITAL_NAME', 'Hospital HMS')),

  // ── Facility Classification ───────────────────────────────────────────────
  /** Kenya MFL level: 2=Dispensary, 3=Health Centre, 4=Sub-County, 5=County, 6=National */
  mflLevel:   parseInt(env('VITE_HOSPITAL_MFL_LEVEL', '3'), 10),

  /** MFL code assigned by KMHFL */
  mflCode:    env('VITE_HOSPITAL_MFL_CODE', ''),

  // ── Contact ────────────────────────────────────────────────────────────────
  phone:      env('VITE_HOSPITAL_PHONE',    ''),
  email:      env('VITE_HOSPITAL_EMAIL',    ''),
  address:    env('VITE_HOSPITAL_ADDRESS',  ''),
  county:     env('VITE_HOSPITAL_COUNTY',   ''),

  // ── Branding ──────────────────────────────────────────────────────────────
  /** 
   * Primary brand colour (hex). This drives the CSS --color-primary-* tokens.
   * The default is the blue used throughout the system.
   */
  primaryColor: env('VITE_PRIMARY_COLOR', '#3b82f6'),

  /**
   * System version label shown on the login page footer.
   * Update this per release.
   */
  version:    env('VITE_HMS_VERSION', 'v2.0'),

  // ── Computed helpers (use in components) ──────────────────────────────────
  /** "Name · Tagline" — safe for window.document.title */
  get pageTitle() { return `${this.name} · ${this.tagline}`; },

  /** Short facility-level label, e.g. "Level 4 Hospital" */
  get levelLabel() {
    const labels = {
      2: 'Level 2 Dispensary',
      3: 'Level 3 Health Centre',
      4: 'Level 4 Sub-County Hospital',
      5: 'Level 5 County Referral Hospital',
      6: 'Level 6 National / Teaching Hospital',
    };
    return labels[this.mflLevel] || `Level ${this.mflLevel} Facility`;
  },

  /** Copyright line used on the login / print footer */
  get copyright() {
    return `© ${new Date().getFullYear()} ${this.legalName} · ${this.levelLabel} · HMS ${this.version}`;
  },
};

export default hospital;
