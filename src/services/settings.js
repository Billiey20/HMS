export const settingsService = {
  KEY: 'hms_settings',

  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || 'null') || {}; }
    catch { return {}; }
  },

  save(obj) {
    localStorage.setItem(this.KEY, JSON.stringify(obj));
  },
};
