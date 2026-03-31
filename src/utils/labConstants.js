// ── Test result templates ─────────────────────────────────────────────────────
export const TEST_TEMPLATES = {
  'Full Haemogram / CBC': [
    { name: 'WBC',         unit: '×10³/μL', refLow: 4.0,  refHigh: 11.0, type: 'number' },
    { name: 'RBC',         unit: '×10⁶/μL', refLow: 4.2,  refHigh: 5.4,  type: 'number' },
    { name: 'Haemoglobin', unit: 'g/dL',    refLow: 11.5, refHigh: 17.5, type: 'number' },
    { name: 'HCT',         unit: '%',        refLow: 37,   refHigh: 52,   type: 'number' },
    { name: 'MCV',         unit: 'fL',       refLow: 80,   refHigh: 100,  type: 'number' },
    { name: 'MCH',         unit: 'pg',       refLow: 27,   refHigh: 33,   type: 'number' },
    { name: 'MCHC',        unit: 'g/dL',     refLow: 32,   refHigh: 36,   type: 'number' },
    { name: 'Platelets',   unit: '×10³/μL',  refLow: 150,  refHigh: 400,  type: 'number' },
    { name: 'Neutrophils', unit: '%',        refLow: 45,   refHigh: 75,   type: 'number' },
    { name: 'Lymphocytes', unit: '%',        refLow: 20,   refHigh: 40,   type: 'number' },
  ],
  'Urinalysis (UA)': [
    { name: 'Colour',        unit: '', refText: 'Yellow',   type: 'select', options: ['Yellow','Pale yellow','Dark yellow','Amber','Orange','Red','Brown','Clear'] },
    { name: 'Appearance',    unit: '', refText: 'Clear',    type: 'select', options: ['Clear','Slightly turbid','Turbid','Cloudy'] },
    { name: 'pH',            unit: '', refLow: 4.5, refHigh: 8.0, type: 'number' },
    { name: 'Specific Gravity', unit: '', refLow: 1.005, refHigh: 1.030, type: 'number' },
    { name: 'Protein',       unit: '', refText: 'Negative', type: 'select', options: ['Negative','Trace','+1','+2','+3'] },
    { name: 'Glucose',       unit: '', refText: 'Negative', type: 'select', options: ['Negative','Trace','+1','+2','+3'] },
    { name: 'Nitrites',      unit: '', refText: 'Negative', type: 'select', options: ['Negative','Positive'] },
    { name: 'Leucocytes',    unit: '', refText: 'Negative', type: 'select', options: ['Negative','Trace','+1','+2','+3'] },
    { name: 'Blood',         unit: '', refText: 'Negative', type: 'select', options: ['Negative','Trace','+1','+2','+3'] },
    { name: 'Pus Cells',     unit: '/HPF', refText: '0-4', type: 'text' },
    { name: 'RBCs',          unit: '/HPF', refText: '0-2', type: 'text' },
  ],
  'Random Blood Sugar (RBS)': [
    { name: 'Blood Glucose (Random)', unit: 'mmol/L', refLow: 3.9, refHigh: 11.1, type: 'number' },
  ],
  'Malaria RDT': [
    { name: 'P. falciparum Ag (HRP-2)', unit: '', refText: 'Negative', type: 'select', options: ['Negative','Positive'] },
    { name: 'Pan-Malaria Ag (pLDH)',    unit: '', refText: 'Negative', type: 'select', options: ['Negative','Positive'] },
  ],
  'HIV 1 & 2 Antibody Test': [
    { name: 'HIV 1 & 2 Ab (Screen)', unit: '', refText: 'Non-reactive', type: 'select', options: ['Non-reactive','Reactive'] },
    { name: 'Final Result',           unit: '', refText: 'Negative',     type: 'select', options: ['Negative','Positive','Indeterminate'] },
  ],
  'Urea, Electrolytes & Creatinine (UECs)': [
    { name: 'Sodium (Na⁺)',   unit: 'mmol/L', refLow: 136, refHigh: 145, type: 'number' },
    { name: 'Potassium (K⁺)', unit: 'mmol/L', refLow: 3.5, refHigh: 5.1, type: 'number' },
    { name: 'Urea',           unit: 'mmol/L', refLow: 2.5, refHigh: 7.5, type: 'number' },
    { name: 'Creatinine',     unit: 'μmol/L', refLow: 62,  refHigh: 115, type: 'number' },
    { name: 'eGFR',           unit: 'mL/min/1.73m²', refLow: 60, refHigh: 120, type: 'number' },
  ],
  'Stool Analysis': [
    { name: 'Colour',      unit: '', refText: 'Brown',    type: 'select', options: ['Brown','Yellow','Green','Black','Red','White'] },
    { name: 'Consistency', unit: '', refText: 'Formed',   type: 'select', options: ['Formed','Soft','Loose','Watery'] },
    { name: 'Frank Blood', unit: '', refText: 'Absent',   type: 'select', options: ['Absent','Present'] },
    { name: 'Ova',         unit: '', refText: 'None seen', type: 'text' },
    { name: 'Cysts',       unit: '', refText: 'None seen', type: 'text' },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function computeFlag(value, row) {
  if (row.type !== 'number') return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  if (row.refHigh !== undefined && v > row.refHigh) return 'H';
  if (row.refLow  !== undefined && v < row.refLow)  return 'L';
  return 'N';
}

export function refInterval(row) {
  if (row.refText) return row.refText;
  if (row.refLow !== undefined && row.refHigh !== undefined) return `${row.refLow} – ${row.refHigh}`;
  return '—';
}
