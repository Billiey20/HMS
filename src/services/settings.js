export const settingsService = {
  KEY: 'hms_settings',

  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || 'null') || {}; }
    catch { return {}; }
  },

  save(obj) {
    localStorage.setItem(this.KEY, JSON.stringify(obj));
  },

  // ── Facility / Payment Settings ────────────────────────────────────────────
  getFacilityLevel() {
    return parseInt(this.load().facilityMflLevel || '3', 10);
  },

  setFacilityLevel(level) {
    this.save({ ...this.load(), facilityMflLevel: String(level) });
  },

  getFacilityMflCode() {
    return this.load().facilityMflCode || '';
  },

  setFacilityMflCode(code) {
    this.save({ ...this.load(), facilityMflCode: code });
  },

  /** Returns true if facility is Level 2 or 3 (PHC applies to inactive SHA members) */
  isPHCFacility() {
    return this.getFacilityLevel() <= 3;
  },
};
