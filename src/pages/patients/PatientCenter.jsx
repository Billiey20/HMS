import React, { useState, useEffect, useCallback } from 'react';
import { Search, Add, FilterList, Person, Phone, Badge, Refresh } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';


function StatusBadge({ status }) {
  const map = {
    active:    'badge-green',
    admitted:  'badge-blue',
    discharged:'badge-slate',
    deceased:  'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-slate'} capitalize`}>{status}</span>;
}

export default function PatientCenter() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const loadPatients = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await patientService.list({ search });
      setPatients(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(loadPatients, 300);
    return () => clearTimeout(t);
  }, [loadPatients]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Patient Center</h1>
          <p className="text-sm text-slate-500">{patients.length} registered patients</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
          <Add sx={{ fontSize: 18 }} /> Register Patient
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID or phone…"
            className="input pl-9"
          />
        </div>
        <button onClick={loadPatients} className="btn-secondary">
          <Refresh fontSize="small" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
          ⚠️ {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Patient ID', 'Full Name', 'Age / Gender', 'Phone', 'Status', 'Registered', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading patients…</td></tr>
              )}
              {!loading && patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.patient_no}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{p.first_name} {p.middle_name} {p.last_name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.age} · {p.gender}</td>
                  <td className="px-4 py-3 text-slate-600">{p.phone || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : '—'}</td>
                  <td className="px-4 py-3">
                    <button className="btn-secondary text-xs py-1 px-3">View</button>
                  </td>
                </tr>
              ))}
              {!loading && patients.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Person sx={{ fontSize: 36 }} className="mb-2" />
                    <p>No patients found. {search ? 'Try a different search.' : 'Register the first patient!'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showForm && <PatientRegistrationModal userId={user?.id} onClose={() => setShowForm(false)} onSave={async (payload) => { await loadPatients(); setShowForm(false); }} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  PATIENT REGISTRATION MODAL
// ──────────────────────────────────────────────────────────────────────────────
function PatientRegistrationModal({ userId, onClose, onSave }) {
  const empty = {
    firstName: '', middleName: '', lastName: '',
    age: 'Adult', gender: '',
    nationality: 'Kenyan', nationalId: '', phone: '', emailUser: '',
    race: 'African', religion: 'Christian', occupation: '',
    maritalStatus: '', location: '',
    referredBy: 'Walk-In', referralDetails: '',
    provisionalDiagnosis: '',
  };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim())  errs.lastName  = 'Required';
    if (!form.gender)           errs.gender    = 'Required';
    if (!form.age) {
      errs.age = 'Required';
    } else if (!['adult', 'child'].includes(form.age.toLowerCase()) && isNaN(Number(form.age))) {
      errs.age = 'Enter "Adult", "Child" or a number';
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const payload = {
        first_name:      form.firstName,
        middle_name:     form.middleName || null,
        last_name:       form.lastName,
        age:             form.age,
        gender:          form.gender,
        nationality:     form.nationality,
        national_id:     form.nationalId || null,
        phone:           form.phone || null,
        email:           form.emailUser ? `${form.emailUser}@gmail.com` : null,
        race:            form.race,
        religion:        form.religion,
        marital_status:  form.maritalStatus || null,
        occupation:      form.occupation || null,
        location:        form.location || null,
        status:          'active',
        registered_by:   userId || null,
      };
      await patientService.create(payload);
      onSave();
    } catch (e) {
      alert('Registration failed: ' + e.message);
    }
  };

  const Field = ({ label, required, error, children }) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 border border-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-primary-600 rounded-t-2xl">
          <h2 className="font-black text-white text-lg">Register New Patient</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors text-xl font-bold">×</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Identity */}
          <section>
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Personal Details</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Field label="First Name" required error={errors.firstName}>
                <input className="input" value={form.firstName} onChange={f('firstName')} placeholder="First name" />
              </Field>
              <Field label="Middle Name">
                <input className="input" value={form.middleName} onChange={f('middleName')} placeholder="(optional)" />
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <input className="input" value={form.lastName} onChange={f('lastName')} placeholder="Last name" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Age" required error={errors.age}>
                <input className="input" value={form.age} onChange={f('age')} placeholder="Adult / Child / number" />
              </Field>
              <Field label="Gender" required error={errors.gender}>
                <select className="input" value={form.gender} onChange={f('gender')}>
                  <option value="">Select…</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>
          </section>

          {/* Contacts */}
          <section>
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Contact Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Nationality">
                <select className="input" value={form.nationality} onChange={f('nationality')}>
                  <option>Kenyan</option>
                  <option>Tanzanian</option>
                  <option>Ugandan</option>
                  <option>Ethiopian</option>
                  <option>Somali</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label={form.nationality === 'Kenyan' ? 'National ID' : 'Passport No.'}>
                <input className="input" value={form.nationalId} onChange={f('nationalId')} placeholder="ID / Passport" />
              </Field>
              <Field label="Phone Number">
                <input className="input" type="tel" value={form.phone} onChange={f('phone')} placeholder="07XXXXXXXX" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Email Address">
                <div className="flex">
                  <input
                    className="input rounded-r-none border-r-0 flex-1"
                    value={form.emailUser}
                    onChange={f('emailUser')}
                    placeholder="username"
                  />
                  <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 border-l-0 rounded-r-xl text-sm text-slate-500 font-medium">@gmail.com</span>
                </div>
              </Field>
            </div>
          </section>

          {/* Other Details */}
          <section>
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Other Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Race">
                <select className="input" value={form.race} onChange={f('race')}>
                  <option>African</option>
                  <option>Asian</option>
                  <option>Caucasian</option>
                  <option>Middle Eastern</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Religion">
                <select className="input" value={form.religion} onChange={f('religion')}>
                  <option>Christian</option>
                  <option>Muslim</option>
                  <option>Hindu</option>
                  <option>Buddhist</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Marital Status">
                <select className="input" value={form.maritalStatus} onChange={f('maritalStatus')}>
                  <option value="">Select…</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Widowed</option>
                  <option>Divorced</option>
                </select>
              </Field>
              <Field label="Occupation">
                <input className="input" value={form.occupation} onChange={f('occupation')} placeholder="(optional)" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Location / Estate">
                <input className="input" value={form.location} onChange={f('location')} placeholder="Area / town (optional)" />
              </Field>
            </div>
          </section>

          {/* Referral */}
          <section>
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Referral Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Visit Type">
                <select className="input" value={form.referredBy} onChange={f('referredBy')}>
                  <option>Walk-In</option>
                  <option>Referred</option>
                </select>
              </Field>
              {form.referredBy === 'Referred' && (
                <Field label="Referred By">
                  <input className="input" value={form.referralDetails} onChange={f('referralDetails')} placeholder="Referring facility / doctor" />
                </Field>
              )}
            </div>
          </section>

          {/* Provisional Diagnosis */}
          <section>
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Clinical</h3>
            <Field label="Provisional Diagnosis">
              <textarea className="input resize-none" rows={2} value={form.provisionalDiagnosis} onChange={f('provisionalDiagnosis')} placeholder="Chief complaint / provisional diagnosis…" />
            </Field>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Register Patient</button>
        </div>
      </div>
    </div>
  );
}
