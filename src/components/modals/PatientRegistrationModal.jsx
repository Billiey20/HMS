import React, { useState, useEffect, useRef } from 'react';
import {
  VerifiedUser, Person, CreditCard, Search, CheckCircle,
  Warning, Info, PhoneAndroid, HealthAndSafety, LocalHospital,
  Edit, Lock, ArrowBack, ArrowForward, Close,
} from '@mui/icons-material';
import { patientService } from '../../services/patients';
import { shaService } from '../../services/sha';
import { notify } from '../../utils/toast';
import hospital from '../../config/hospital';


// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {hint && !error && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

function VerificationBadge({ type }) {
  const config = {
    sha_active: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'SHA Verified' },
    sha_phc:    { bg: 'bg-teal-50 border-teal-200',     text: 'text-teal-700',   dot: 'bg-teal-500',   label: 'PHC Fund Active' },
    sha_eccif:  { bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'SHA – ECCIF Emergency' },
    cr_synced:  { bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Private – Registry Synced' },
    manual:     { bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',  dot: 'bg-amber-400',  label: 'Pending Verification' },
  };
  const c = config[type] || config.manual;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function StepIndicator({ step, steps }) {
  return (
    <div className="flex items-center gap-1 px-8 pt-5 pb-4 border-b border-slate-100">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest hidden sm:block ${
              i === step ? 'text-primary-700' : 'text-slate-400'
            }`}>{label}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-emerald-300' : 'bg-slate-100'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 0 — FUNDING GATE
// ─────────────────────────────────────────────────────────────────────────────

function FundingGateStep({ onSHA, onPrivate }) {
  const [idType, setIdType] = useState('National ID');
  const [idNumber, setIdNumber] = useState('');
  const [visitType, setVisitType] = useState('Walk-In');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(null); // 'SHA' | 'Private'

  const handleSHAVerify = async () => {
    if (!idNumber.trim()) { setError('Please enter an ID number.'); return; }
    setError('');
    setVerifying(true);
    try {
      const result = await shaService.verifyEligibility({
        identification_type: idType,
        identification_number: idNumber.trim(),
        visit_type: visitType,
      });
      onSHA({ idType, idNumber: idNumber.trim(), visitType, verificationResult: result });
    } catch (e) {
      setError('Verification failed: ' + e.message);
    } finally {
      setVerifying(false);
    }
  };

  const handlePrivate = async () => {
    setMode('Private');
    setError('');
    setVerifying(true);
    try {
      let crResult = null;
      if (idNumber.trim()) {
        crResult = await shaService.lookupRegistry({
          identification_type: idType,
          identification_number: idNumber.trim(),
        });
      }
      onPrivate({ idType, idNumber: idNumber.trim(), crResult });
    } catch (e) {
      // CR lookup failing should not block private registration
      onPrivate({ idType, idNumber: idNumber.trim(), crResult: null });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-base font-black text-slate-800 mb-1">How will this visit be funded?</h3>
        <p className="text-xs text-slate-500">Select the patient's primary payment scheme to begin.</p>
      </div>

      {/* Funding Type Cards */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMode(mode === 'SHA' ? null : 'SHA')}
          className={`relative p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
            mode === 'SHA'
              ? 'border-primary-600 bg-primary-50 shadow-primary-100 shadow-lg'
              : 'border-slate-200 hover:border-primary-300'
          }`}
        >
          <HealthAndSafety className={`mb-3 ${mode === 'SHA' ? 'text-primary-600' : 'text-slate-300'}`} sx={{ fontSize: 36 }} />
          <p className="font-black text-slate-800 text-sm">SHA Member</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Patient has a Social Health Authority (SHA) number. Verify eligibility instantly.</p>
          {mode === 'SHA' && (
            <span className="absolute top-3 right-3 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-[8px] font-black">✓</span>
            </span>
          )}
        </button>

        <button
          onClick={() => setMode(mode === 'Private' ? null : 'Private')}
          className={`relative p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
            mode === 'Private'
              ? 'border-amber-500 bg-amber-50 shadow-amber-100 shadow-lg'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <CreditCard className={`mb-3 ${mode === 'Private' ? 'text-amber-600' : 'text-slate-300'}`} sx={{ fontSize: 36 }} />
          <p className="font-black text-slate-800 text-sm">Private / Cash Pay</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Patient is self-funding. We'll still search the national registry for existing records.</p>
          {mode === 'Private' && (
            <span className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[8px] font-black">✓</span>
            </span>
          )}
        </button>
      </div>

      {/* ID Entry (shown when a mode is selected) */}
      {mode && (
        <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="grid grid-cols-3 gap-3">
            <Field label="ID Type">
              <select className="input" value={idType} onChange={e => setIdType(e.target.value)}>
                <option>National ID</option>
                <option>Birth Certificate</option>
                <option>Passport</option>
                <option>Alien ID</option>
              </select>
            </Field>
            <div className="col-span-2">
              <Field label={idType === 'National ID' ? 'National ID Number' : idType === 'Birth Certificate' ? 'Birth Certificate No.' : 'Passport / ID Number'}
                     required={mode === 'SHA'} error={error}>
                <input
                  className="input"
                  value={idNumber}
                  onChange={e => { setIdNumber(e.target.value); setError(''); }}
                  placeholder={idType === 'National ID' ? '12345678' : idType === 'Birth Certificate' ? 'BIRTH/20XX/XXXXXX' : '...'}
                  onKeyDown={e => { if (e.key === 'Enter') mode === 'SHA' ? handleSHAVerify() : handlePrivate(); }}
                />
              </Field>
            </div>
          </div>

          {mode === 'SHA' && (
            <Field label="Visit Type">
              <select className="input" value={visitType} onChange={e => setVisitType(e.target.value)}>
                <option>Walk-In</option>
                <option>Emergency</option>
                <option>Follow-Up</option>
                <option>Referred</option>
                <option>Scheduled</option>
              </select>
            </Field>
          )}

          {mode === 'SHA' ? (
            <button
              onClick={handleSHAVerify}
              disabled={verifying}
              className="btn-primary w-full flex items-center justify-center gap-2 h-12 text-sm"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Contacting SHA…
                </>
              ) : (
                <>
                  <VerifiedUser sx={{ fontSize: 18 }} />
                  Fetch Identity &amp; Verify Eligibility
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handlePrivate}
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 h-12 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all disabled:opacity-60"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching Registry…
                </>
              ) : (
                <>
                  <Search sx={{ fontSize: 18 }} />
                  {idNumber.trim() ? 'Search Registry & Continue' : 'Continue Without ID Lookup'}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — SHA RESULT PANEL
// ─────────────────────────────────────────────────────────────────────────────

function SHAResultPanel({ result, idNumber, visitType, onContinue, onSwitchPrivate }) {
  const { decision, member_details: md, reason, possible_solution, facility_level } = result;
  const [stkPhone, setStkPhone] = useState(md?.phone || '');
  const [stkStatus, setStkStatus] = useState(null); // null | 'pending' | 'success' | 'failed'
  const [checkoutId, setCheckoutId] = useState(null);
  const [overrideEmergency, setOverrideEmergency] = useState(false);
  const pollRef = useRef(null);

  const startSTKPush = async () => {
    if (!stkPhone) { notify.error("Enter the patient's phone number for M-Pesa payment."); return; }
    setStkStatus('pending');
    try {
      const res = await shaService.initiateSTKPush({
        phone: stkPhone,
        amount: md?.arrears_amount || 2750,
        sha_number: md?.sha_number,
      });
      setCheckoutId(res.checkout_request_id);
      notify.info('STK Push sent! Ask the patient to approve on their phone.');

      // Start polling every 3 seconds
      pollRef.current = setInterval(async () => {
        try {
          const status = await shaService.pollSTKStatus(res.checkout_request_id);
          if (status.status === 'success') {
            clearInterval(pollRef.current);
            setStkStatus('success');
            notify.success('Payment confirmed! Re-verifying SHA status…');
            // Re-trigger verify to confirm new active status (simulate for mock)
            setTimeout(() => onContinue({ ...md, member_status: 'Active', payment_mode: 'SHA', decision: 'sha_active', mpesa_receipt: status.mpesa_receipt }), 1500);
          } else if (status.status === 'failed') {
            clearInterval(pollRef.current);
            setStkStatus('failed');
            notify.error('Payment failed or was cancelled. Try again.');
          }
        } catch {}
      }, 3000);

      // Stop polling after 3 minutes
      setTimeout(() => { if (pollRef.current) { clearInterval(pollRef.current); if (stkStatus === 'pending') setStkStatus('timeout'); } }, 180000);
    } catch (e) {
      setStkStatus('failed');
      notify.error('STK Push failed: ' + e.message);
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const decisionConfig = {
    sha_active: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: <CheckCircle className="text-emerald-600" sx={{ fontSize: 28 }} />,
      title: 'SHA Verified — Active Member',
      subtitle: `SHIF coverage is active. Registration will be pre-filled with government data.`,
      badge: 'sha_active',
    },
    sha_phc: {
      bg: 'bg-teal-50 border-teal-200',
      icon: <HealthAndSafety className="text-teal-600" sx={{ fontSize: 28 }} />,
      title: 'PHC Fund Active (Level 2/3 Facility)',
      subtitle: `Member status is inactive for SHIF, but your Level ${facility_level} facility is covered by the Primary Healthcare Fund. Care proceeds as SHA.`,
      badge: 'sha_phc',
    },
    sha_eccif: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <LocalHospital className="text-blue-600" sx={{ fontSize: 28 }} />,
      title: 'Emergency — ECCIF Fund Active',
      subtitle: 'Emergency stabilisation is covered for all Kenyans under the ECCIF fund, regardless of contribution status.',
      badge: 'sha_eccif',
    },
    sha_inactive_prompt: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <Warning className="text-amber-600" sx={{ fontSize: 28 }} />,
      title: 'SHA Member — Inactive (Arrears)',
      subtitle: reason,
      badge: 'manual',
    },
    not_sha_member: {
      bg: 'bg-slate-50 border-slate-200',
      icon: <Info className="text-slate-500" sx={{ fontSize: 28 }} />,
      title: 'Not an SHA Member',
      subtitle: reason || 'ID number not registered with SHA. Switching to Private/Cash registration.',
      badge: 'manual',
    },
  };

  const cfg = decisionConfig[decision] || decisionConfig.not_sha_member;

  // If not found or inactive at level 4+ with no emergency override, auto-suggest private
  useEffect(() => {
    if (decision === 'not_sha_member') {
      setTimeout(() => onSwitchPrivate(), 800);
    }
  }, [decision]);

  const canContinueSHA = decision === 'sha_active' || decision === 'sha_phc' || decision === 'sha_eccif';

  return (
    <div className="p-8 space-y-6">
      {/* Result Banner */}
      <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 ${cfg.bg}`}>
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-800 text-sm">{cfg.title}</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{cfg.subtitle}</p>
          {possible_solution && (
            <p className="text-xs text-amber-700 mt-2 font-semibold">💡 {possible_solution}</p>
          )}
        </div>
        <VerificationBadge type={cfg.badge} />
      </div>

      {/* Member Details Preview (for all SHA paths that returned data) */}
      {md && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identity Confirmed by SHA</span>
            <Lock sx={{ fontSize: 14 }} className="text-slate-300" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-100">
            {[
              { label: 'SHA No.', value: md.sha_number },
              { label: 'CR No.', value: md.cr_number },
              { label: 'Full Name', value: `${md.first_name} ${md.middle_name || ''} ${md.last_name}`.trim() },
              { label: 'Date of Birth', value: md.date_of_birth },
              { label: 'Gender', value: md.gender },
              { label: 'Status', value: md.member_status },
            ].map(({ label, value }) => value ? (
              <div key={label} className="bg-white px-4 py-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{value}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {canContinueSHA ? (
        <button
          onClick={() => onContinue({ ...md, payment_mode: result.payment_mode, decision, is_verified: true })}
          className="btn-primary w-full flex items-center justify-center gap-2 h-12"
        >
          <ArrowForward sx={{ fontSize: 18 }} />
          Continue with SHA Registration
        </button>
      ) : decision === 'sha_inactive_prompt' ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-600">Choose how to proceed:</p>

          {/* Option 1: Pay Arrears via M-Pesa */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-3">
            <p className="text-xs font-black text-amber-800">⚡ Option 1 — Clear Arrears via M-Pesa</p>
            {md?.arrears_amount > 0 && (
              <p className="text-xs text-amber-700">Amount owed: <strong>KES {md.arrears_amount?.toLocaleString()}</strong></p>
            )}
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="Patient phone (07XXXXXXXX)"
                value={stkPhone}
                onChange={e => setStkPhone(e.target.value)}
              />
              <button
                onClick={startSTKPush}
                disabled={stkStatus === 'pending' || stkStatus === 'success'}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {stkStatus === 'pending' ? (
                  <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Waiting…</>
                ) : stkStatus === 'success' ? (
                  <>✓ Paid</>
                ) : (
                  <><PhoneAndroid sx={{ fontSize: 14 }} /> Send STK Push</>
                )}
              </button>
            </div>
            {stkStatus === 'timeout' && <p className="text-xs text-red-600 font-medium">Timed out. Ask the patient to check their phone and try again.</p>}
          </div>

          {/* Option 2: Emergency Override */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 cursor-pointer">
            <input
              type="checkbox"
              checked={overrideEmergency}
              onChange={e => setOverrideEmergency(e.target.checked)}
              className="mt-0.5 accent-blue-600"
            />
            <div>
              <p className="text-xs font-black text-blue-800">🚨 Option 2 — Emergency Override (ECCIF)</p>
              <p className="text-[10px] text-blue-700 mt-0.5">Keep SHA active under the Emergency fund (ECCIF). Only for genuine emergency presentations.</p>
            </div>
          </label>
          {overrideEmergency && (
            <button
              onClick={() => onContinue({ ...md, payment_mode: 'SHA', decision: 'sha_eccif', is_verified: true })}
              className="w-full flex items-center justify-center gap-2 h-11 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
            >
              <LocalHospital sx={{ fontSize: 18 }} />
              Continue as Emergency (ECCIF)
            </button>
          )}

          {/* Option 3: Switch to Private */}
          <button
            onClick={onSwitchPrivate}
            className="w-full flex items-center justify-center gap-2 h-11 text-sm font-bold border-2 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-xl transition-all"
          >
            <CreditCard sx={{ fontSize: 18 }} />
            Option 3 — Continue as Private
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — PRIVATE / CR RESULT PANEL
// ─────────────────────────────────────────────────────────────────────────────

function CRResultPanel({ idNumber, idType, crResult, onContinue }) {
  if (!crResult) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-start gap-4 p-5 rounded-2xl border-2 bg-amber-50 border-amber-200">
          <Warning className="text-amber-600" sx={{ fontSize: 28 }} />
          <div>
            <p className="font-black text-slate-800 text-sm">Not in National Registry</p>
            <p className="text-xs text-slate-600 mt-1">No records found for this ID. You'll register manually — the system will create a registry entry on save.</p>
          </div>
          <VerificationBadge type="manual" />
        </div>
        <button onClick={() => onContinue({ found: false, id_number: idNumber })} className="btn-primary w-full h-12 flex items-center justify-center gap-2">
          <Edit sx={{ fontSize: 18 }} /> Continue with Manual Registration
        </button>
      </div>
    );
  }

  if (!crResult.found) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-start gap-4 p-5 rounded-2xl border-2 bg-amber-50 border-amber-200">
          <Warning className="text-amber-600" sx={{ fontSize: 28 }} />
          <div>
            <p className="font-black text-slate-800 text-sm">Not in National Registry</p>
            <p className="text-xs text-slate-600 mt-1">No records found. Complete the form manually — the system will auto-register this patient and return a CR number on save.</p>
          </div>
          <VerificationBadge type="manual" />
        </div>
        <button onClick={() => onContinue({ found: false, id_number: idNumber })} className="btn-primary w-full h-12 flex items-center justify-center gap-2">
          <Edit sx={{ fontSize: 18 }} /> Fill in Details Manually
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start gap-4 p-5 rounded-2xl border-2 bg-blue-50 border-blue-200">
        <VerifiedUser className="text-blue-600" sx={{ fontSize: 28 }} />
        <div className="flex-1">
          <p className="font-black text-slate-800 text-sm">Found in National Registry</p>
          <p className="text-xs text-slate-600 mt-1">Demographics pre-filled from the Kenya Client Registry. You may edit before saving.</p>
        </div>
        <VerificationBadge type="cr_synced" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registry Data</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-100">
          {[
            { label: 'CR Number', value: crResult.cr_number },
            { label: 'Full Name', value: `${crResult.first_name} ${crResult.middle_name || ''} ${crResult.last_name}`.trim() },
            { label: 'Date of Birth', value: crResult.date_of_birth },
            { label: 'Gender', value: crResult.gender },
            { label: 'Phone', value: crResult.phone },
            { label: 'Location', value: crResult.location },
          ].map(({ label, value }) => value ? (
            <div key={label} className="bg-white px-4 py-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{value}</p>
            </div>
          ) : null)}
        </div>
      </div>

      <button
        onClick={() => onContinue({ ...crResult, payment_mode: 'Private', decision: 'cr_synced', is_verified: true })}
        className="btn-primary w-full h-12 flex items-center justify-center gap-2"
      >
        <ArrowForward sx={{ fontSize: 18 }} /> Confirm & Fill Details
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — FORM (Review + Manual Fields)
// ─────────────────────────────────────────────────────────────────────────────

function PatientForm({ initial, onSave, onBack }) {
  const [form, setForm] = useState({
    firstName: initial.first_name || '',
    middleName: initial.middle_name || '',
    lastName: initial.last_name || '',
    dateOfBirth: initial.date_of_birth || '',
    age: initial.age || 'Adult',
    gender: initial.gender || '',
    nationality: initial.nationality || 'Kenyan',
    idNumber: initial.id_number || '',
    phone: initial.phone || '',
    email: '',
    race: 'African', religion: 'Christian',
    maritalStatus: initial.marital_status || '',
    occupation: '',
    location: initial.location || '',
    nextOfKinName: '', nextOfKinPhone: '', nextOfKinRel: '',
    bloodGroup: '', allergies: '', chronicConditions: '',
    insuranceProvider: '', insuranceNo: '',
    // SHA / payment fields (set by parent logic, not editable by user directly)
    shaNumber: initial.sha_number || '',
    crNumber: initial.cr_number || '',
    paymentMode: initial.payment_mode || 'Private',
    shaStatus: initial.member_status || '',
    decision: initial.decision || 'manual',
    isVerified: initial.is_verified || false,
  });
  const [privateCopay, setPrivateCopay] = useState(true);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const isAPIField = (field) => form.isVerified && ['firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'shaNumber', 'crNumber'].includes(field);

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.gender) errs.gender = 'Required';
    if (!form.age && !form.dateOfBirth) errs.age = 'Age or Date of Birth required';
    if (form.phone) {
      const ph = /^(?:254|\+254|0)?(7|1)(?:[0-9]{2})[0-9]{6}$/;
      if (!ph.test(form.phone.replace(/\s+/g, ''))) errs.phone = 'Invalid Kenyan phone number';
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        first_name: form.firstName,
        middle_name: form.middleName || null,
        last_name: form.lastName,
        date_of_birth: form.dateOfBirth || null,
        age: form.age || null,
        gender: form.gender,
        nationality: form.nationality,
        national_id: form.idNumber || null,
        id_number: form.idNumber || null,
        phone: form.phone || null,
        email: form.email || null,
        race: form.race,
        religion: form.religion,
        marital_status: form.maritalStatus || null,
        occupation: form.occupation || null,
        location: form.location || null,
        next_of_kin_name: form.nextOfKinName || null,
        next_of_kin_phone: form.nextOfKinPhone || null,
        next_of_kin_rel: form.nextOfKinRel || null,
        blood_group: form.bloodGroup || null,
        allergies: form.allergies || null,
        chronic_conditions: form.chronicConditions || null,
        insurance_provider: form.paymentMode !== 'Private' ? 'SHA' : (form.insuranceProvider || null),
        insurance_no: form.shaNumber || form.insuranceNo || null,
        sha_number: form.shaNumber || null,
        cr_number: form.crNumber || null,
        payment_mode: form.paymentMode,
        private_copay: privateCopay,
        sha_status: form.shaStatus || null,
        is_verified: form.isVerified,
        last_verified_at: form.isVerified ? new Date().toISOString() : null,
        status: 'active',
      };

      // If private & not in CR, register in registry first
      if (!form.crNumber && form.idNumber && form.paymentMode === 'Private') {
        try {
          const crRes = await shaService.registerInRegistry({
            identification_number: form.idNumber,
            identification_type: 'National ID',
            first_name: form.firstName,
            middle_name: form.middleName,
            last_name: form.lastName,
            date_of_birth: form.dateOfBirth,
            gender: form.gender,
            phone: form.phone,
            nationality: form.nationality,
          });
          payload.cr_number = crRes.cr_number;
        } catch {
          // CR registration failing should not block local HMS registration
        }
      }

      const saved = await patientService.create(payload);
      notify.success(`Patient ${form.firstName} ${form.lastName} registered successfully!`);
      onSave(saved);
    } catch (e) {
      notify.error('Registration failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const badgeType = form.decision === 'sha_active' ? 'sha_active'
    : form.decision === 'sha_phc' ? 'sha_phc'
    : form.decision === 'sha_eccif' ? 'sha_eccif'
    : form.decision === 'cr_synced' ? 'cr_synced'
    : 'manual';

  return (
    <div className="p-8 space-y-10 overflow-y-auto max-h-[65vh]">
      {/* Verification Status Banner */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-3">
          <VerificationBadge type={badgeType} />
          {form.shaNumber && <span className="font-mono text-[10px] text-slate-400">SHA: {form.shaNumber}</span>}
          {form.crNumber && <span className="font-mono text-[10px] text-slate-400">CR: {form.crNumber}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold">Primary:</span>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            form.paymentMode === 'SHA' ? 'bg-primary-100 text-primary-700'
            : form.paymentMode === 'PHC' ? 'bg-teal-100 text-teal-700'
            : 'bg-amber-100 text-amber-700'
          }`}>{form.paymentMode}</span>
          {privateCopay && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">+ Private</span>}
        </div>
      </div>

      {/* Personal Information */}
      <section>
        <div className="border-b border-slate-200 pb-2 mb-5">
          <h3 className="text-sm font-black text-slate-800">Personal information</h3>
        </div>
        <div className="pl-4 md:pl-8 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {['firstName', 'middleName', 'lastName'].map((field, i) => (
              <Field key={field} label={['First name', 'Middle name', 'Last name'][i]} required={i !== 1} error={errors[field]}>
                <div className="relative">
                  <input
                    className={`input ${isAPIField(field) ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}`}
                    value={form[field]} onChange={f(field)}
                    placeholder={i === 1 ? '(optional)' : ''}
                  />
                  {isAPIField(field) && <Lock className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400" sx={{ fontSize: 12 }} />}
                </div>
              </Field>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Date of Birth" error={errors.dateOfBirth}>
              <div className="relative">
                <input type="date" className={`input ${isAPIField('dateOfBirth') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}`}
                  value={form.dateOfBirth} onChange={f('dateOfBirth')} />
                {isAPIField('dateOfBirth') && <Lock className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400" sx={{ fontSize: 12 }} />}
              </div>
            </Field>
            <Field label="Age" error={errors.age} hint="Or enter 'Adult', 'Child', or a number">
              <input className="input" value={form.age} onChange={f('age')} placeholder="Adult / Child / 35" />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <div className="relative">
                <select className={`input ${isAPIField('gender') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}`}
                  value={form.gender} onChange={f('gender')} disabled={isAPIField('gender')}>
                  <option value="">Select…</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
                {isAPIField('gender') && <Lock className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400" sx={{ fontSize: 12 }} />}
              </div>
            </Field>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <div className="border-b border-slate-200 pb-2 mb-5">
          <h3 className="text-sm font-black text-slate-800">Contact information</h3>
        </div>
        <div className="pl-4 md:pl-8 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Nationality">
              <select className="input" value={form.nationality} onChange={f('nationality')}>
                <option>Kenyan</option><option>Tanzanian</option><option>Ugandan</option>
                <option>Ethiopian</option><option>Somali</option><option>Other</option>
              </select>
            </Field>
            <Field label={form.nationality === 'Kenyan' ? 'National ID' : 'Passport No.'}>
              <input className={`input ${form.isVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}`}
                value={form.idNumber} onChange={f('idNumber')} placeholder="ID / Passport" readOnly={form.isVerified} />
            </Field>
            <Field label="Phone number" error={errors.phone}>
              <input className="input" type="tel" value={form.phone} onChange={f('phone')} placeholder="07XXXXXXXX" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email address">
              <input className="input" type="email" value={form.email} onChange={f('email')} placeholder="email@example.com" />
            </Field>
            <Field label="Location / estate">
              <input className="input" value={form.location} onChange={f('location')} placeholder="Area / town" />
            </Field>
          </div>
        </div>
      </section>

      {/* Social */}
      <section>
        <div className="border-b border-slate-200 pb-2 mb-5">
          <h3 className="text-sm font-black text-slate-800">Other details</h3>
        </div>
        <div className="pl-4 md:pl-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Field label="Race">
              <select className="input" value={form.race} onChange={f('race')}>
                <option>African</option><option>Asian</option><option>Caucasian</option><option>Middle Eastern</option><option>Other</option>
              </select>
            </Field>
            <Field label="Religion">
              <select className="input" value={form.religion} onChange={f('religion')}>
                <option>Christian</option><option>Muslim</option><option>Hindu</option><option>Buddhist</option><option>Other</option>
              </select>
            </Field>
            <Field label="Marital status">
              <select className="input" value={form.maritalStatus} onChange={f('maritalStatus')}>
                <option value="">Select…</option><option>Single</option><option>Married</option><option>Widowed</option><option>Divorced</option>
              </select>
            </Field>
            <Field label="Occupation">
              <input className="input" value={form.occupation} onChange={f('occupation')} placeholder="(optional)" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Blood Group">
              <select className="input" value={form.bloodGroup} onChange={f('bloodGroup')}>
                <option value="">Unknown</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Known Allergies">
              <input className="input" value={form.allergies} onChange={f('allergies')} placeholder="e.g. Penicillin, Sulfa drugs" />
            </Field>
          </div>
        </div>
      </section>

      {/* Next of Kin */}
      <section>
        <div className="border-b border-slate-200 pb-2 mb-5">
          <h3 className="text-sm font-black text-slate-800">Next of kin</h3>
        </div>
        <div className="pl-4 md:pl-8">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Full name"><input className="input" value={form.nextOfKinName} onChange={f('nextOfKinName')} /></Field>
            <Field label="Phone"><input className="input" value={form.nextOfKinPhone} onChange={f('nextOfKinPhone')} /></Field>
            <Field label="Relationship"><input className="input" value={form.nextOfKinRel} onChange={f('nextOfKinRel')} placeholder="Mother, Spouse, etc." /></Field>
          </div>
        </div>
      </section>

      {/* Payment Mode */}
      <section>
        <div className="border-b border-slate-200 pb-2 mb-5">
          <h3 className="text-sm font-black text-slate-800">Payment configuration</h3>
        </div>
        <div className="pl-4 md:pl-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary payment mode">
              <select className="input" value={form.paymentMode} onChange={f('paymentMode')}>
                <option value="SHA">SHA (Active SHIF)</option>
                <option value="PHC">PHC (Primary Healthcare Fund)</option>
                <option value="Private">Private / Cash</option>
              </select>
            </Field>
            <Field label="Insurance / SHA No.">
              <input className="input font-mono" value={form.shaNumber || form.insuranceNo} onChange={e => {
                if (form.shaNumber) setForm(p => ({ ...p, shaNumber: e.target.value }));
                else setForm(p => ({ ...p, insuranceNo: e.target.value }));
              }} placeholder="SHA-XXXX-XXXX or policy no." />
            </Field>
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <div onClick={() => setPrivateCopay(!privateCopay)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${privateCopay ? 'bg-primary-600' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${privateCopay ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Enable Private Co-pay</p>
              <p className="text-[10px] text-slate-500">Some items (e.g. special drugs, private room) are not covered by SHA. Patient pays privately for those.</p>
            </div>
          </label>
        </div>
      </section>

      {/* Actions (sticky bottom handled by parent) */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowBack sx={{ fontSize: 16 }} /> Back
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 h-12 px-8">
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering…</>
          ) : (
            <><CheckCircle sx={{ fontSize: 18 }} /> Register Patient</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

export default function PatientRegistrationModal({ userId, onClose, onSave }) {
  const [step, setStep] = useState(0);
  const [flow, setFlow] = useState(null);          // 'SHA' | 'Private'
  const [verificationResult, setVerificationResult] = useState(null);
  const [crResult, setCrResult] = useState(null);
  const [formInitial, setFormInitial] = useState(null);
  const [idContext, setIdContext] = useState({ idType: 'National ID', idNumber: '', visitType: 'Walk-In' });

  const STEPS = ['Funding', 'Verify', 'Details'];

  const handleSHAPath = ({ idType, idNumber, visitType, verificationResult: result }) => {
    setIdContext({ idType, idNumber, visitType });
    setVerificationResult(result);
    setFlow('SHA');
    setStep(1);
  };

  const handlePrivatePath = ({ idType, idNumber, crResult: cr }) => {
    setIdContext({ idType, idNumber });
    setCrResult(cr);
    setFlow('Private');
    setStep(1);
  };

  const handleSHAContinue = (memberData) => {
    setFormInitial({ ...memberData, id_number: idContext.idNumber });
    setStep(2);
  };

  const handlePrivateCRContinue = (data) => {
    setFormInitial({ ...data, id_number: idContext.idNumber });
    setStep(2);
  };

  const handleSwitchToPrivate = async () => {
    setFlow('Private');
    // Try CR lookup with the existing ID
    let cr = null;
    if (idContext.idNumber) {
      try {
        cr = await shaService.lookupRegistry({
          identification_type: idContext.idType,
          identification_number: idContext.idNumber,
        });
      } catch {}
    }
    setCrResult(cr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 border border-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Person className="text-white" sx={{ fontSize: 22 }} />
            <div>
              <h2 className="font-black text-white text-base">Register New Patient</h2>
              <p className="text-white/70 text-[10px] font-semibold">{hospital.name} · SHA & CR Integrated</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors text-xl font-bold">×</button>
        </div>

        {/* Step Indicator */}
        <StepIndicator step={step} steps={STEPS} />

        {/* Step 0: Funding Gate */}
        {step === 0 && (
          <FundingGateStep onSHA={handleSHAPath} onPrivate={handlePrivatePath} />
        )}

        {/* Step 1: Verification Result */}
        {step === 1 && flow === 'SHA' && verificationResult && (
          <SHAResultPanel
            result={verificationResult}
            idNumber={idContext.idNumber}
            visitType={idContext.visitType}
            onContinue={handleSHAContinue}
            onSwitchPrivate={handleSwitchToPrivate}
          />
        )}

        {step === 1 && flow === 'Private' && (
          <CRResultPanel
            idNumber={idContext.idNumber}
            idType={idContext.idType}
            crResult={crResult}
            onContinue={handlePrivateCRContinue}
          />
        )}

        {/* Step 2: Full Form */}
        {step === 2 && formInitial && (
          <PatientForm
            initial={{ ...formInitial, registered_by: userId }}
            onSave={onSave}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}
