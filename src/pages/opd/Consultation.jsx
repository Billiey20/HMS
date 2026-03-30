import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Person, FavoriteBorder, Science, LocalPharmacy,
  Hotel, ArrowBack, Save, Add, Delete, CheckCircle,
  MedicalServices, Assignment, Send
} from '@mui/icons-material';

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['History', 'Examination', 'Diagnosis & Plan', 'Prescriptions', 'Lab Orders', 'Decision'];

// ── Mock patient vitals header data ──────────────────────────────────────────
const DEFAULT_VISIT = {
  patientNo: 'BP-00001', name: 'Alice Wanjiru Kamau', age: '34', gender: 'Female',
  priority: 'normal', complaint: 'Headache and fever for 2 days',
  temperature: '37.8', pulse: '84', bpSystolic: '118', bpDiastolic: '76',
  spo2: '98', weightKg: '65', heightCm: '160', checkIn: '08:15 AM',
};

// ── Reusable section header ───────────────────────────────────────────────────
function SectionHead({ title, subtitle }) {
  return (
    <div className="pb-3 mb-4 border-b border-slate-100">
      <h3 className="font-black text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input resize-none text-sm"
      />
    </div>
  );
}

// ── PRESCRIPTION ITEMS ────────────────────────────────────────────────────────
function PrescriptionBuilder({ items, setItems }) {
  const emptyItem = { drug: '', dose: '', frequency: '', duration: '', route: 'Oral', qty: '' };

  const add = () => setItems(prev => [...prev, { ...emptyItem, id: Date.now() }]);
  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const update = (id, field, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Drug Name *</label>
              <input className="input text-sm" value={item.drug} onChange={e => update(item.id, 'drug', e.target.value)}
                placeholder="e.g. Amoxicillin 500mg" />
            </div>
            <div>
              <label className="label">Dose</label>
              <input className="input text-sm" value={item.dose} onChange={e => update(item.id, 'dose', e.target.value)}
                placeholder="e.g. 500mg" />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select className="input text-sm" value={item.frequency} onChange={e => update(item.id, 'frequency', e.target.value)}>
                <option value="">Select…</option>
                {['OD (once daily)', 'BD (twice daily)', 'TDS (three times daily)', 'QID (four times daily)', 'PRN (as needed)', 'STAT (immediately)', 'Weekly', 'Monthly'].map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Duration</label>
              <input className="input text-sm" value={item.duration} onChange={e => update(item.id, 'duration', e.target.value)}
                placeholder="e.g. 5 days" />
            </div>
            <div>
              <label className="label">Route</label>
              <select className="input text-sm" value={item.route} onChange={e => update(item.id, 'route', e.target.value)}>
                {['Oral', 'IV', 'IM', 'SC', 'Topical', 'Sublingual', 'Rectal', 'Inhaled'].map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quantity / Units</label>
              <input type="number" className="input text-sm" value={item.qty}
                onChange={e => update(item.id, 'qty', e.target.value)} placeholder="e.g. 15" />
            </div>
          </div>
          <button onClick={() => remove(item.id)}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
            <Delete sx={{ fontSize: 14 }} /> Remove
          </button>
        </div>
      ))}
      <button onClick={add} className="btn-secondary w-full justify-center py-3">
        <Add sx={{ fontSize: 16 }} /> Add Medication
      </button>
    </div>
  );
}

// ── LAB ORDERS ────────────────────────────────────────────────────────────────
const COMMON_TESTS = [
  'Full Haemogram / CBC', 'Urinalysis (UA)', 'Random Blood Sugar (RBS)',
  'Urea, Electrolytes & Creatinine (UECs)', 'Liver Function Tests (LFTs)',
  'Malaria RDT', 'Blood Slide for Malaria Parasites (BS for MPs)',
  'HIV 1 & 2 Antibody Test', 'Stool Analysis',
  'Lipid Profile', 'Thyroid Function Tests (TFTs)',
  'HBsAg', 'HCV', 'VDRL / Syphilis', 'Widal Test',
  'Blood Culture & Sensitivity', 'Urine C&S', 'Semen Analysis',
  'CRP', 'Coagulation Profile', 'Haemoglobin Electrophoresis',
];

function LabOrderBuilder({ orders, setOrders }) {
  const [custom, setCustom] = useState('');
  const toggle = (test) => {
    setOrders(prev =>
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };
  const addCustom = () => {
    if (custom.trim() && !orders.includes(custom.trim())) {
      setOrders(prev => [...prev, custom.trim()]);
      setCustom('');
    }
  };

  return (
    <div className="space-y-4">
      <SectionHead title="Select Tests" subtitle="Click to select / deselect" />
      <div className="flex flex-wrap gap-2">
        {COMMON_TESTS.map(test => (
          <button key={test}
            onClick={() => toggle(test)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
              ${orders.includes(test)
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>
            {orders.includes(test) && '✓ '}{test}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="input flex-1 text-sm" value={custom} onChange={e => setCustom(e.target.value)}
          placeholder="Add a custom test not listed above…"
          onKeyDown={e => e.key === 'Enter' && addCustom()} />
        <button onClick={addCustom} className="btn-secondary px-3">Add</button>
      </div>
      {orders.length > 0 && (
        <div className="p-3 bg-primary-50 border border-primary-100 rounded-xl">
          <p className="text-xs font-bold text-primary-700 mb-1">{orders.length} test{orders.length > 1 ? 's' : ''} ordered:</p>
          <div className="flex flex-wrap gap-1.5">
            {orders.map(t => (
              <span key={t} className="badge badge-blue">{t}
                <button onClick={() => toggle(t)} className="ml-1 text-blue-400 hover:text-blue-700">×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN CONSULTATION COMPONENT ───────────────────────────────────────────────
export default function Consultation() {
  const location = useLocation();
  const navigate = useNavigate();
  const visit = location.state?.visit || DEFAULT_VISIT;

  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved]         = useState(false);

  // History
  const [historyPresenting,   setHistoryPresenting]   = useState('');
  const [historyPast,         setHistoryPast]         = useState('');
  const [historyFamily,       setHistoryFamily]       = useState('');
  const [historySocial,       setHistorySocial]       = useState('');
  const [historyMedications,  setHistoryMedications]  = useState('');
  const [historyAllergies,    setHistoryAllergies]    = useState('');

  // Examination
  const [generalExam,    setGeneralExam]    = useState('');
  const [systemicExam,   setSystemicExam]   = useState('');
  const [findings,       setFindings]       = useState('');

  // Diagnosis
  const [primaryDx,      setPrimaryDx]      = useState('');
  const [secondaryDx,    setSecondaryDx]    = useState('');
  const [icd10,          setIcd10]          = useState('');
  const [plan,           setPlan]           = useState('');
  const [followUp,       setFollowUp]       = useState('');

  // Prescriptions & Lab orders
  const [rxItems,  setRxItems]  = useState([]);
  const [labTests, setLabTests] = useState([]);

  // Decision
  const [decision,         setDecision]         = useState('discharge');
  const [admissionWard,    setAdmissionWard]    = useState('');
  const [referralDetails,  setReferralDetails]  = useState('');
  const [reviewDate,       setReviewDate]       = useState('');
  const [reviewNotes,      setReviewNotes]      = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFinalise = () => {
    alert(`Consultation finalised!\nDecision: ${decision}\nPrescriptions: ${rxItems.length} item(s)\nLab orders: ${labTests.length} test(s)`);
    navigate('/opd/queue');
  };

  const priorityColor = { emergency: 'bg-red-100 text-red-700', urgent: 'bg-amber-100 text-amber-700', normal: 'bg-emerald-100 text-emerald-700' };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* Sticky Patient Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary py-1.5 px-3 shrink-0">
            <ArrowBack sx={{ fontSize: 16 }} /> Back
          </button>

          {/* Patient info strip */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <Person className="text-primary-600" sx={{ fontSize: 22 }} />
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-800 truncate">{visit.name}</p>
              <p className="text-xs text-slate-500">{visit.patientNo} · {visit.age} yrs · {visit.gender}</p>
            </div>
            <span className={`badge shrink-0 ${priorityColor[visit.priority] || 'badge-slate'} capitalize`}>{visit.priority}</span>
          </div>

          {/* Vitals strip */}
          <div className="flex gap-2 flex-wrap text-xs">
            {[
              { l: 'T', v: visit.temperature, u: '°C', flag: parseFloat(visit.temperature) > 37.5 },
              { l: 'P', v: visit.pulse, u: 'bpm', flag: parseInt(visit.pulse) > 100 },
              { l: 'BP', v: `${visit.bpSystolic}/${visit.bpDiastolic}`, u: '', flag: parseInt(visit.bpSystolic) >= 140 },
              { l: 'SpO₂', v: visit.spo2, u: '%', flag: parseFloat(visit.spo2) < 95 },
            ].map(({ l, v, u, flag }) => (
              <span key={l} className={`px-2 py-1 rounded-lg font-semibold border ${flag ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                {l}: {v}{u}
              </span>
            ))}
          </div>

          {/* Save */}
          <button onClick={handleSave} className={`btn-secondary py-1.5 px-3 shrink-0 ${saved ? 'text-emerald-600' : ''}`}>
            {saved ? <><CheckCircle sx={{ fontSize: 16 }} /> Saved</> : <><Save sx={{ fontSize: 16 }} /> Save</>}
          </button>
        </div>

        {/* Chief complaint */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-2">
          <p className="text-xs text-slate-500 italic">
            <span className="font-semibold text-slate-700">Complaint: </span>{visit.complaint}
          </p>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)}
                className={`shrink-0 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors
                  ${activeTab === i ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {i < 4 ? '' : ''}{tab}
                {i === 3 && rxItems.length > 0 && <span className="ml-1 badge badge-blue">{rxItems.length}</span>}
                {i === 4 && labTests.length > 0 && <span className="ml-1 badge badge-amber">{labTests.length}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6">
        <div className="card p-6">

          {/* 0 — History */}
          {activeTab === 0 && (
            <div className="space-y-4">
              <SectionHead title="Clinical History" subtitle="Document the patient's history" />
              <TextArea label="History of Presenting Complaint" value={historyPresenting} onChange={setHistoryPresenting}
                rows={4} placeholder="Onset, duration, progression, aggravating/relieving factors, associated symptoms…" />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextArea label="Past Medical History" value={historyPast} onChange={setHistoryPast}
                  placeholder="Previous illnesses, hospitalizations, surgeries…" />
                <TextArea label="Family History" value={historyFamily} onChange={setHistoryFamily}
                  placeholder="Relevant family conditions…" />
                <TextArea label="Social History" value={historySocial} onChange={setHistorySocial}
                  placeholder="Smoking, alcohol, occupation, travel history…" />
                <TextArea label="Current Medications" value={historyMedications} onChange={setHistoryMedications}
                  placeholder="Any regular medications or supplements…" />
              </div>
              <TextArea label="Known Allergies" value={historyAllergies} onChange={setHistoryAllergies}
                placeholder="Drug allergies, food allergies, environmental…" rows={2} />
            </div>
          )}

          {/* 1 — Examination */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <SectionHead title="Physical Examination" />
              <TextArea label="General Examination" value={generalExam} onChange={setGeneralExam} rows={3}
                placeholder="General appearance, level of consciousness, hydration, pallor, jaundice, cyanosis, clubbing, lymphadenopathy, oedema…" />
              <TextArea label="Systemic Examination" value={systemicExam} onChange={setSystemicExam} rows={4}
                placeholder="Cardiovascular, respiratory, gastrointestinal, neurological, musculoskeletal findings…" />
              <TextArea label="Other Findings / Special Examination" value={findings} onChange={setFindings} rows={3}
                placeholder="Any additional examination findings…" />
            </div>
          )}

          {/* 2 — Diagnosis & Plan */}
          {activeTab === 2 && (
            <div className="space-y-4">
              <SectionHead title="Diagnosis & Management Plan" />
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <TextArea label="Primary Diagnosis *" value={primaryDx} onChange={setPrimaryDx} rows={2}
                    placeholder="Main working diagnosis…" />
                </div>
                <div>
                  <label className="label">ICD-10 Code (optional)</label>
                  <input className="input text-sm" value={icd10} onChange={e => setIcd10(e.target.value)} placeholder="e.g. J06.9" />
                </div>
              </div>
              <TextArea label="Secondary / Differential Diagnoses" value={secondaryDx} onChange={setSecondaryDx} rows={2}
                placeholder="Other diagnoses to consider…" />
              <TextArea label="Management Plan" value={plan} onChange={setPlan} rows={4}
                placeholder="Treatment plan, investigations to order, monitoring parameters, patient education…" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Follow-up Date</label>
                  <input type="date" className="input text-sm" value={followUp} onChange={e => setFollowUp(e.target.value)} />
                </div>
                <TextArea label="Follow-up Notes" value={reviewNotes} onChange={setReviewNotes} rows={2}
                  placeholder="Instructions for next visit…" />
              </div>
            </div>
          )}

          {/* 3 — Prescriptions */}
          {activeTab === 3 && (
            <div>
              <SectionHead title="Prescriptions" subtitle="Add medications for this patient" />
              <PrescriptionBuilder items={rxItems} setItems={setRxItems} />
            </div>
          )}

          {/* 4 — Lab Orders */}
          {activeTab === 4 && (
            <LabOrderBuilder orders={labTests} setOrders={setLabTests} />
          )}

          {/* 5 — Decision */}
          {activeTab === 5 && (
            <div className="space-y-6">
              <SectionHead title="Clinical Decision" subtitle="What happens to this patient next?" />

              {/* Decision buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: 'discharge', label: 'Discharge',  icon: '🏠', desc: 'Patient goes home' },
                  { val: 'admit',     label: 'Admit',      icon: '🛏️', desc: 'Admit to ward' },
                  { val: 'refer',     label: 'Refer Out',  icon: '🚑', desc: 'Refer to another facility' },
                  { val: 'review',    label: 'Review',     icon: '🔄', desc: 'Come back for review' },
                ].map(({ val, label, icon, desc }) => (
                  <button key={val} onClick={() => setDecision(val)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all
                      ${decision === val ? 'border-primary-600 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <p className="text-2xl mb-1">{icon}</p>
                    <p className="font-bold text-sm text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </button>
                ))}
              </div>

              {/* Conditional fields */}
              {decision === 'admit' && (
                <div>
                  <label className="label">Ward to Admit To *</label>
                  <select className="input" value={admissionWard} onChange={e => setAdmissionWard(e.target.value)}>
                    <option value="">Select ward…</option>
                    {['General Ward', 'Maternity Ward', 'Surgical Ward', 'Paediatric Ward', 'ICU / HDU'].map(w => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                </div>
              )}
              {decision === 'refer' && (
                <TextArea label="Referral Details *" value={referralDetails} onChange={setReferralDetails} rows={3}
                  placeholder="Referring to which facility / specialist, reason for referral, referral notes…" />
              )}
              {decision === 'review' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Review Date *</label>
                    <input type="date" className="input" value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
                  </div>
                  <TextArea label="Review Instructions" value={reviewNotes} onChange={setReviewNotes} rows={2}
                    placeholder="What to monitor before next visit…" />
                </div>
              )}

              {/* Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consultation Summary</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span><strong>Diagnosis:</strong> {primaryDx || '—'}</span>
                  <span><strong>Prescriptions:</strong> {rxItems.length} item(s)</span>
                  <span><strong>Lab Orders:</strong> {labTests.length} test(s)</span>
                  <span><strong>Decision:</strong> <span className="font-bold text-primary-600 capitalize">{decision}</span></span>
                </div>
              </div>

              {/* Finalise */}
              <button onClick={handleFinalise}
                className="w-full btn-primary justify-center py-4 text-base rounded-2xl">
                <Send sx={{ fontSize: 18 }} /> Finalise & Submit Consultation
              </button>
            </div>
          )}
        </div>

        {/* Navigation between tabs */}
        <div className="flex justify-between mt-4">
          <button onClick={() => setActiveTab(t => Math.max(0, t - 1))}
            disabled={activeTab === 0}
            className="btn-secondary disabled:opacity-30">
            ← Previous
          </button>
          <span className="text-xs text-slate-400 self-center">{activeTab + 1} / {TABS.length}</span>
          <button onClick={() => setActiveTab(t => Math.min(TABS.length - 1, t + 1))}
            disabled={activeTab === TABS.length - 1}
            className="btn-primary">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
