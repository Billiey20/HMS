import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Person, LocalHospital,
  Lock, Palette, Notifications, Save, CheckCircle,
  Visibility, VisibilityOff, Badge, Phone, Email, Business
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { settingsService } from '../../services/api';

const TABS = [
  { key: 'hospital',  label: '🏥 Hospital Profile',  icon: LocalHospital },
  { key: 'profile',   label: '👤 My Profile',         icon: Person },
  { key: 'password',  label: '🔒 Change Password',    icon: Lock },
  { key: 'appearance',label: '🎨 Appearance',         icon: Palette },
];

function SavedBanner({ show }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-bounce-in font-bold text-sm">
      <CheckCircle sx={{ fontSize: 18 }} /> Settings saved!
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-5">
      <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest border-b border-slate-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export default function SystemSettings() {
  const { user, profile } = useAuth();
  const [tab, setTab]     = useState('hospital');
  const [saved, setSaved] = useState(false);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  // ── Hospital Profile (stored in localStorage) ──────────────────────
  const defaults = settingsService.load();
  const [hospital, setHospital] = useState({
    name:     defaults.hospitalName     || 'Biopassion Level 4 Hospital',
    tagline:  defaults.hospitalTagline  || 'Quality meets compassion',
    address:  defaults.hospitalAddress  || 'Nairobi, Kenya',
    phone:    defaults.hospitalPhone    || '+254 700 000 000',
    email:    defaults.hospitalEmail    || 'info@biopassion.com',
    license:  defaults.hospitalLicense  || 'MOH/KEN/2024/0001',
    website:  defaults.hospitalWebsite  || 'www.biopassion.com',
    currency: defaults.currency         || 'KES',
    timezone: defaults.timezone         || 'Africa/Nairobi',
    logo:     defaults.logo             || '',
  });

  const saveHospital = () => {
    settingsService.save({
      ...settingsService.load(),
      hospitalName:    hospital.name,
      hospitalTagline: hospital.tagline,
      hospitalAddress: hospital.address,
      hospitalPhone:   hospital.phone,
      hospitalEmail:   hospital.email,
      hospitalLicense: hospital.license,
      hospitalWebsite: hospital.website,
      currency:        hospital.currency,
      timezone:        hospital.timezone,
      logo:            hospital.logo,
    });
    showSaved();
  };

  // ── My Profile ────────────────────────────────────────────────────
  const [myProfile, setMyProfile] = useState({
    firstName:  profile?.first_name  || '',
    lastName:   profile?.last_name   || '',
    phone:      profile?.phone       || '',
    employeeNo: profile?.employee_no || '',
    email:      user?.email          || '',
  });

  const saveProfile = async () => {
    if (!user?.id) return;
    await supabase.from('users').update({
      first_name:  myProfile.firstName,
      last_name:   myProfile.lastName,
      phone:       myProfile.phone,
      employee_no: myProfile.employeeNo,
    }).eq('id', user.id);
    showSaved();
  };

  // ── Change Password ───────────────────────────────────────────────
  const [pwdForm, setPwdForm]   = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState({ current: false, newPwd: false, confirm: false });
  const [pwdError, setPwdError] = useState('');

  const changePassword = async () => {
    setPwdError('');
    if (pwdForm.newPwd.length < 8) { setPwdError('Password must be at least 8 characters.'); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdError('Passwords do not match.'); return; }
    const { error } = await supabase.auth.updateUser({ password: pwdForm.newPwd });
    if (error) { setPwdError(error.message); return; }
    setPwdForm({ current: '', newPwd: '', confirm: '' });
    showSaved();
  };

  // ── Appearance ────────────────────────────────────────────────────
  const [appearance, setAppearance] = useState({
    theme:          defaults.theme          || 'light',
    accentColor:    defaults.accentColor    || '#6366f1',
    sidebarCompact: defaults.sidebarCompact || false,
    denseMode:      defaults.denseMode      || false,
  });

  const saveAppearance = () => {
    settingsService.save({ ...settingsService.load(), ...appearance });
    showSaved();
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">System Settings</h1>
        <p className="text-sm text-slate-500">Configure hospital profile, security, and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="md:w-56 shrink-0">
          <div className="card p-2 space-y-1">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all
                  ${tab === key ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Account info card */}
          <div className="card p-4 mt-4 space-y-2 text-xs">
            <p className="font-bold text-slate-700">Logged in as</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-black text-xs">
                  {(profile?.first_name?.[0] || '?')}{(profile?.last_name?.[0] || '')}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="card p-6 space-y-6">

            {/* ── Hospital Profile ── */}
            {tab === 'hospital' && (
              <>
                <Section title="Hospital Information">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Hospital Name *">
                      <input className="input" value={hospital.name} onChange={e => setHospital(h => ({ ...h, name: e.target.value }))} />
                    </Field>
                    <Field label="Tagline / Slogan">
                      <input className="input" value={hospital.tagline} onChange={e => setHospital(h => ({ ...h, tagline: e.target.value }))} />
                    </Field>
                    <Field label="Physical Address">
                      <input className="input" value={hospital.address} onChange={e => setHospital(h => ({ ...h, address: e.target.value }))} />
                    </Field>
                    <Field label="Phone Number">
                      <input className="input" value={hospital.phone} onChange={e => setHospital(h => ({ ...h, phone: e.target.value }))} />
                    </Field>
                    <Field label="Email Address">
                      <input type="email" className="input" value={hospital.email} onChange={e => setHospital(h => ({ ...h, email: e.target.value }))} />
                    </Field>
                    <Field label="Website">
                      <input className="input" value={hospital.website} onChange={e => setHospital(h => ({ ...h, website: e.target.value }))} />
                    </Field>
                    <Field label="MOH License No.">
                      <input className="input" value={hospital.license} onChange={e => setHospital(h => ({ ...h, license: e.target.value }))} />
                    </Field>
                  </div>
                </Section>
                <Section title="System Preferences">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Default Currency">
                      <select className="input" value={hospital.currency} onChange={e => setHospital(h => ({ ...h, currency: e.target.value }))}>
                        <option>KES</option><option>USD</option><option>EUR</option><option>GBP</option><option>TZS</option><option>UGX</option>
                      </select>
                    </Field>
                    <Field label="Timezone">
                      <select className="input" value={hospital.timezone} onChange={e => setHospital(h => ({ ...h, timezone: e.target.value }))}>
                        <option>Africa/Nairobi</option>
                        <option>Africa/Lagos</option>
                        <option>Africa/Johannesburg</option>
                        <option>Africa/Cairo</option>
                        <option>UTC</option>
                      </select>
                    </Field>
                  </div>
                </Section>
                <div className="flex justify-end">
                  <button onClick={saveHospital} className="btn-primary">
                    <Save sx={{ fontSize: 16 }} /> Save Hospital Settings
                  </button>
                </div>
              </>
            )}

            {/* ── My Profile ── */}
            {tab === 'profile' && (
              <>
                <Section title="Personal Information">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="First Name *">
                      <input className="input" value={myProfile.firstName} onChange={e => setMyProfile(p => ({ ...p, firstName: e.target.value }))} />
                    </Field>
                    <Field label="Last Name *">
                      <input className="input" value={myProfile.lastName} onChange={e => setMyProfile(p => ({ ...p, lastName: e.target.value }))} />
                    </Field>
                    <Field label="Phone">
                      <input className="input" value={myProfile.phone} onChange={e => setMyProfile(p => ({ ...p, phone: e.target.value }))} />
                    </Field>
                    <Field label="Employee No.">
                      <input className="input" value={myProfile.employeeNo} onChange={e => setMyProfile(p => ({ ...p, employeeNo: e.target.value }))} placeholder="EMP-XXX" />
                    </Field>
                    <Field label="Email (login)">
                      <input className="input bg-slate-50 cursor-not-allowed" value={myProfile.email} readOnly />
                    </Field>
                  </div>
                </Section>
                <div className="flex justify-end">
                  <button onClick={saveProfile} className="btn-primary">
                    <Save sx={{ fontSize: 16 }} /> Save Profile
                  </button>
                </div>
              </>
            )}

            {/* ── Change Password ── */}
            {tab === 'password' && (
              <>
                <Section title="Change Password">
                  <div className="max-w-md space-y-4">
                    {['newPwd', 'confirm'].map((field) => {
                      const labels = { newPwd: 'New Password', confirm: 'Confirm New Password' };
                      return (
                        <Field key={field} label={labels[field]}>
                          <div className="relative">
                            <input
                              type={showPwd[field] ? 'text' : 'password'}
                              className="input pr-10"
                              value={pwdForm[field]}
                              onChange={e => setPwdForm(p => ({ ...p, [field]: e.target.value }))}
                              placeholder={field === 'newPwd' ? 'Min 8 characters' : 'Repeat password'}
                            />
                            <button type="button" onClick={() => setShowPwd(p => ({ ...p, [field]: !p[field] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                              {showPwd[field] ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                            </button>
                          </div>
                        </Field>
                      );
                    })}
                    {pwdError && (
                      <p className="text-sm text-red-600 font-semibold">{pwdError}</p>
                    )}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <strong>Password requirements:</strong> Minimum 8 characters. Use a mix of letters, numbers and symbols for a strong password.
                    </div>
                  </div>
                </Section>
                <div className="flex justify-end">
                  <button onClick={changePassword} className="btn-primary">
                    <Lock sx={{ fontSize: 16 }} /> Update Password
                  </button>
                </div>
              </>
            )}

            {/* ── Appearance ── */}
            {tab === 'appearance' && (
              <>
                <Section title="Theme & Display">
                  <div className="space-y-4">
                    <Field label="Color Theme">
                      <div className="flex gap-3">
                        {[
                          { val: 'light', label: '☀️ Light' },
                          { val: 'dark',  label: '🌙 Dark' },
                        ].map(({ val, label }) => (
                          <button key={val} onClick={() => setAppearance(a => ({ ...a, theme: val }))}
                            className={`px-5 py-3 rounded-xl border-2 font-bold text-sm transition-all
                              ${appearance.theme === val ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {appearance.theme === 'dark' && (
                        <p className="text-xs text-amber-600 mt-1">⚠️ Dark mode coming soon — currently in preview.</p>
                      )}
                    </Field>
                    <Field label="Accent Color">
                      <div className="flex items-center gap-3">
                        <input type="color" value={appearance.accentColor}
                          onChange={e => setAppearance(a => ({ ...a, accentColor: e.target.value }))}
                          className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer" />
                        <span className="font-mono text-sm text-slate-600">{appearance.accentColor}</span>
                      </div>
                    </Field>
                    <div className="flex flex-col gap-3">
                      {[
                        { key: 'sidebarCompact', label: 'Compact sidebar (icon-only)' },
                        { key: 'denseMode',      label: 'Dense/compact table rows' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer">
                          <div onClick={() => setAppearance(a => ({ ...a, [key]: !a[key] }))}
                            className={`w-11 h-6 rounded-full transition-colors relative ${appearance[key] ? 'bg-primary-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${appearance[key] ? 'translate-x-5' : ''}`} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </Section>
                <div className="flex justify-end">
                  <button onClick={saveAppearance} className="btn-primary">
                    <Save sx={{ fontSize: 16 }} /> Save Appearance
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <SavedBanner show={saved} />
    </div>
  );
}
