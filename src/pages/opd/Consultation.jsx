import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Person, ArrowBack, Save, Add, Delete, CheckCircle,
  Send, HourglassEmpty
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { consultationService, labService, opdService } from '../../services';

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['Triage & Vitals', 'Clinical History', 'Examination', 'Lab & Imaging Orders', 'Diagnosis & Plan', 'Prescriptions', 'Clinical Decision'];

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

// ── SEARCHABLE ORDERS BUILDER (Labs & Imaging) ──────────────────────────────
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

const IMAGING_TESTS = [
  'Chest X-Ray', 'Abdominal Ultrasound', 'Pelvic Ultrasound',
  'Obstetric Ultrasound', 'CT Scan Head', 'CT Scan Abdomen',
  'MRI Brain', 'MRI Spine', 'Echocardiogram', 'ECG',
];

function SearchableOrdersBuilder({ title, options, orders, setOrders }) {
  const [search, setSearch] = useState('');
  
  const toggle = (test) => {
    setOrders(prev => prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]);
  };

  const addCustom = () => {
    if (search.trim() && !orders.includes(search.trim())) {
      setOrders(prev => [...prev, search.trim()]);
      setSearch('');
    }
  };

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <SectionHead title={title} subtitle="Search and select to add to the queue" />
      
      <div className="flex gap-2 relative">
        <input 
          className="input flex-1 text-sm bg-slate-50 border-slate-200" 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search or type custom ${title.toLowerCase()}...`} 
          onKeyDown={e => e.key === 'Enter' && addCustom()} 
        />
        <button onClick={addCustom} className="btn-secondary px-4 whitespace-nowrap">Add Note / Custom</button>
      </div>

      {search && filtered.length > 0 && (
         <div className="bg-white border text-sm border-slate-200 rounded-xl p-2 shadow-xl max-h-[200px] overflow-y-auto">
           {filtered.map(test => (
             <button key={test} onClick={() => toggle(test)}
               className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${orders.includes(test) ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-slate-50'}`}>
               {orders.includes(test) ? '✓ ' : ''}{test}
             </button>
           ))}
         </div>
      )}

      {orders.length > 0 && (
        <div className="p-4 bg-primary-50/50 border border-primary-100 rounded-xl mt-4 max-w-full">
          <p className="text-xs font-bold text-primary-700 mb-2">{title} Requirements ({orders.length}):</p>
          <div className="flex flex-wrap gap-2">
            {orders.map(t => (
              <span key={t} className="badge bg-white shadow-sm flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-primary-200 text-slate-700">
                {t}
                <button onClick={() => toggle(t)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full w-5 h-5 flex items-center justify-center transition-colors">×</button>
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
  const { user } = useAuth();
  
  // Dummy visit data in case of missing state
  const DEFAULT_VISIT = {
    patientNo: 'BP-00000', name: 'Unknown Patient', age: '', gender: '',
    priority: 'normal', complaint: '',
    temperature: '', pulse: '', bpSystolic: '', bpDiastolic: '',
  };
  
  const visit = location.state?.visit || DEFAULT_VISIT;

  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved]         = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);

  // 0. Triage & Vitals
  const vitals = {
    temperature: visit.temperature || '', pulse: visit.pulse || '',
    bpSystolic: visit.bpSystolic || '', bpDiastolic: visit.bpDiastolic || '',
    respRate: '', spo2: visit.spo2 || '', weight: visit.weightKg || '',
    height: visit.heightCm || '', bloodGlucose: visit.bloodGlucose || '',
    complaint: visit.complaint || '', priority: visit.priority || 'normal'
  };

  // 1. History
  const [historyPresenting,   setHistoryPresenting]   = useState('');
  const [historyPast,         setHistoryPast]         = useState('');
  const [historyFamily,       setHistoryFamily]       = useState('');
  const [historySocial,       setHistorySocial]       = useState('');
  const [historyMedications,  setHistoryMedications]  = useState('');
  const [historyAllergies,    setHistoryAllergies]    = useState('');

  // 2. Examination
  const [generalExam,    setGeneralExam]    = useState('');
  const [systemicExam,   setSystemicExam]   = useState('');
  const [findings,       setFindings]       = useState('');

  // 3. Lab & Imaging Orders
  const [labTests, setLabTests] = useState([]);
  const [imagingOrders, setImagingOrders] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [submittingTest, setSubmittingTest] = useState(false);

  // 4. Diagnosis
  const [primaryDx,      setPrimaryDx]      = useState('');
  const [secondaryDx,    setSecondaryDx]    = useState('');
  const [icd10,          setIcd10]          = useState('');
  const [plan,           setPlan]           = useState('');
  const [followUp,       setFollowUp]       = useState('');

  // 5. Prescriptions
  const [rxItems,  setRxItems]  = useState([]);

  // 6. Decision
  const [decision,         setDecision]         = useState('discharge');
  const [admissionWard,    setAdmissionWard]    = useState('');
  const [referralDetails,  setReferralDetails]  = useState('');
  const [reviewDate,       setReviewDate]       = useState('');
  const [reviewNotes,      setReviewNotes]      = useState('');

  useEffect(() => {
    if (!visit.visit_id) return;
    async function loadData() {
      try {
        const draft = await consultationService.getByVisit(visit.visit_id);
        if (draft) {
          setHistoryPresenting(draft.history_presenting || '');
          setHistoryPast(draft.history_past_medical || '');
          setHistoryFamily(draft.history_family || '');
          setHistorySocial(draft.history_social || '');
          setHistoryMedications(draft.history_medications || '');
          setHistoryAllergies(draft.history_allergies || '');

          if (draft.examination_findings) {
             const parsed = JSON.parse(draft.examination_findings);
             setGeneralExam(parsed.general || '');
             setSystemicExam(parsed.systemic || '');
             setFindings(parsed.other || '');
          }

          setPrimaryDx(draft.primary_diagnosis || '');
          setSecondaryDx(draft.secondary_diagnoses || '');
          setIcd10(draft.icd10_code || '');
          setPlan(draft.management_plan || '');
          setFollowUp(draft.follow_up_date || '');
          setDecision(draft.decision || 'discharge');
          setReferralDetails(draft.referral_details || '');
          setReviewNotes(draft.follow_up_notes || '');
        }

        // Fetch Previous Lab Orders to display results
        const labs = await labService.list();
        const patientLabs = labs.filter(l => l.visit_id === visit.visit_id);
        setLabResults(patientLabs);
      } catch (err) {
        console.error("Failed to load draft data:", err);
      } finally {
        setLoadingDraft(false);
      }
    }
    loadData();
  }, [visit.visit_id]);

  const handleSaveDraft = async () => {
    try {
      const payload = {
        visit_id: visit.visit_id,
        patient_id: visit.patient_id,
        doctor_id: user.id,
        history_presenting: historyPresenting,
        history_past_medical: historyPast,
        history_family: historyFamily,
        history_social: historySocial,
        history_medications: historyMedications,
        history_allergies: historyAllergies,
        examination_findings: JSON.stringify({ general: generalExam, systemic: systemicExam, other: findings }),
        primary_diagnosis: primaryDx,
        secondary_diagnoses: secondaryDx,
        icd10_code: icd10,
        management_plan: plan,
        follow_up_date: followUp || null,
        follow_up_notes: reviewNotes,
        decision,
        referral_details: referralDetails,
      };
      await consultationService.saveDraft(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (err) {
      console.error(err);
      alert('Failed to save draft');
      return false;
    }
  };

  const handleRequestTests = async () => {
    if (!labTests.length && !imagingOrders.length) {
       alert("No tests selected!"); return;
    }
    const yes = window.confirm("Request tests & pause this consultation?");
    if (!yes) return;
    setSubmittingTest(true);
    try {
      // 1. Save drafted notes
      const ok = await handleSaveDraft();
      if (!ok) return;
      
      // 2. Draft consultation ID is created by now, but lab orders just need visit/patient anyway.
      const testsToOrder = [...labTests, ...imagingOrders];
      await labService.create({
        visit_id: visit.visit_id,
        patient_id: visit.patient_id,
        ordered_by: user.id,
        status: 'pending'
      }, testsToOrder);

      // 3. Update visit status to 'waiting_lab'
      await opdService.updateStatus(visit.visit_id, 'waiting_lab');

      alert("Tests requested successfully. Consultation paused.");
      navigate('/opd/queue');
    } catch (err) {
      console.error(err);
      alert("Failed to request tests");
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleFinalise = async () => {
    const yes = window.confirm("Finalise this consultation? Modifications will be locked.");
    if (!yes) return;
    try {
      // Save draft (which acts as final state locally)
      const ok = await handleSaveDraft();
      if (!ok) return;
      
      // Fetch draft to get its ID reliably
      const draft = await consultationService.getByVisit(visit.visit_id);

      // Save prescriptions
      if (rxItems.length > 0) {
        await consultationService.createPrescription({
          consultation_id: draft.id,
          patient_id: visit.patient_id,
          prescribed_by: user.id
        }, rxItems.map(r => ({
           drug_name: r.drug, dose: r.dose, frequency: r.frequency, duration: r.duration, route: r.route, quantity: parseInt(r.qty) || 1
        })));
      }

      // Update visit status
      const exitStatus = decision === 'admit' ? 'awaiting_admission' : 'completed';
      await opdService.updateStatus(visit.visit_id, exitStatus);
      alert(`Consultation finalised successfully!`);
      navigate('/opd/queue');
    } catch (err) {
      console.error(err);
      alert("Failed to finalise consultation");
    }
  };

  const priorityColor = { emergency: 'bg-red-100 text-red-700 border-red-200', urgent: 'bg-amber-100 text-amber-700 border-amber-200', normal: 'bg-emerald-100 text-emerald-700 border-emerald-200' };

  if (loadingDraft) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading consultation details...</div>;

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
            <span className={`badge shrink-0 border ${priorityColor[vitals.priority] || 'badge-slate'} capitalize`}>{vitals.priority}</span>
          </div>

          {/* Save */}
          <button onClick={handleSaveDraft} className={`btn-secondary py-1.5 px-3 shrink-0 ${saved ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : ''}`}>
            {saved ? <><CheckCircle sx={{ fontSize: 16 }} /> Saved</> : <><Save sx={{ fontSize: 16 }} /> Save Draft</>}
          </button>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)}
                className={`shrink-0 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors
                  ${activeTab === i ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {tab}
                {i === 3 && (labTests.length > 0 || imagingOrders.length > 0) && <span className="ml-1 badge badge-amber">{labTests.length + imagingOrders.length}</span>}
                {i === 3 && labResults.length > 0 && <span className="ml-1 badge badge-blue flex items-center gap-1"><CheckCircle sx={{fontSize:12}}/>{labResults.length}</span>}
                {i === 5 && rxItems.length > 0 && <span className="ml-1 badge badge-blue">{rxItems.length}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6">
        <div className="card p-6 border border-slate-200">

          {/* 0. Triage & Vitals */}
          {activeTab === 0 && (
            <div className="space-y-4">
              <SectionHead title="Triage & Vitals (Read-Only)" subtitle="Vitals recorded by Triage Nurses" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Temp (°C)',   field: 'temperature' },
                  { label: 'Pulse (bpm)', field: 'pulse' },
                  { label: 'BP Systolic', field: 'bpSystolic' },
                  { label: 'BP Diastolic',field: 'bpDiastolic' },
                  { label: 'RR (/min)',   field: 'respRate' },
                  { label: 'SpO₂ (%)',    field: 'spo2' },
                  { label: 'Weight (kg)', field: 'weight' },
                  { label: 'RBS (mmol/L)',field: 'bloodGlucose' },
                ].map(({ label, field }) => (
                  <div key={field} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">{label}</p>
                    <p className="text-xl font-black text-slate-800">{vitals[field] || '—'}</p>
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Presenting Complaint / Reason for Visit</label>
                <div className="p-4 bg-white border border-slate-200 rounded-xl text-slate-700 min-h-[4rem] flex items-center shadow-sm">
                  {vitals.complaint || <span className="text-slate-400 italic">No complaint recorded</span>}
                </div>
              </div>
              <div>
                <label className="label">Clinical Priority</label>
                <div>
                  <span className={`badge border ${priorityColor[vitals.priority] || 'badge-slate'} px-4 py-2 text-sm capitalize shadow-sm`}>
                    {vitals.priority || 'Normal'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 1. History */}
          {activeTab === 1 && (
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

          {/* 2. Examination */}
          {activeTab === 2 && (
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

          {/* 3. Lab & Imaging Orders */}
          {activeTab === 3 && (
            <div className="space-y-8">
              <SearchableOrdersBuilder title="Laboratory Tests" options={COMMON_TESTS} orders={labTests} setOrders={setLabTests} />
              <hr className="border-slate-100" />
              <SearchableOrdersBuilder title="Imaging & Radiology" options={IMAGING_TESTS} orders={imagingOrders} setOrders={setImagingOrders} />
              
              {(labTests.length > 0 || imagingOrders.length > 0) && (
                <div className="mt-8 pt-4 border-t border-slate-100">
                  <button onClick={handleRequestTests} disabled={submittingTest} className="w-full btn-primary py-4 text-base justify-center shadow-lg font-bold">
                    {submittingTest ? 'Sending to Lab...' : 'Request Tests & Pause Consultation'}
                  </button>
                  <p className="text-xs text-center text-slate-400 mt-2">The patient will wait for lab results before continuing.</p>
                </div>
              )}

              {/* Display existing results inline if any */}
              {labResults.length > 0 && (
                <div className="mt-8 space-y-4">
                  <SectionHead title="Previous & Current Test Results" subtitle="Data sourced from the Laboratory module" />
                  {labResults.map(order => (
                    <div key={order.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Test Panel: {new Date(order.ordered_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </span>
                        <span className={`badge font-bold px-3 py-1 text-xs border ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {order.status === 'completed' ? 'Results Ready' : 'Pending Lab Work'}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {order.lab_order_items?.map(item => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                              <span className="font-bold text-sm text-slate-700">{item.test_name}</span>
                              <div className="text-sm mt-1 sm:mt-0">
                                {item.status === 'completed' ? (
                                  <span className="font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100/50 shadow-sm">{item.result || 'Negative / Normal'}</span>
                                ) : (
                                  <span className="text-amber-500 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                    <HourglassEmpty sx={{fontSize: 14}}/> Processing
                                  </span>
                                )}
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Diagnosis & Plan */}
          {activeTab === 4 && (
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
                placeholder="Treatment plan, counseling points, patient education…" />
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

          {/* 5. Prescriptions */}
          {activeTab === 5 && (
            <div>
              <SectionHead title="Prescriptions" subtitle="Add medications for this patient" />
              <PrescriptionBuilder items={rxItems} setItems={setRxItems} />
            </div>
          )}

          {/* 6. Decision */}
          {activeTab === 6 && (
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
                    className={`p-4 rounded-2xl border-2 text-left transition-all shadow-sm
                      ${decision === val ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600/20' : 'border-slate-200 bg-white hover:border-primary-300'}`}>
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
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consultation Summary</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span><strong>Diagnosis:</strong> {primaryDx || '—'}</span>
                  <span><strong>Prescriptions:</strong> {rxItems.length} item(s)</span>
                  <span><strong>Decision:</strong> <span className="font-bold text-primary-600 capitalize">{decision}</span></span>
                </div>
              </div>

              {/* Finalise */}
              <button onClick={handleFinalise}
                className="w-full btn-primary justify-center py-4 text-base rounded-2xl shadow-lg font-bold">
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
          <span className="text-xs font-bold text-slate-400 self-center tracking-widest uppercase">Step {activeTab + 1} of {TABS.length}</span>
          <button onClick={() => setActiveTab(t => Math.min(TABS.length - 1, t + 1))}
            disabled={activeTab === TABS.length - 1}
            className="btn-primary shadow-sm hover:shadow-md">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
