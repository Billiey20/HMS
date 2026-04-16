import React, { useState, useEffect, useCallback } from 'react';
import {
  Group, Add, Search, Edit, Badge, Email, Phone, Refresh
} from '@mui/icons-material';
import { hrService } from '../../services/api';

const DEPARTMENTS = [
  'Outpatient (OPD)', 'Inpatient (IPD)', 'Laboratory', 'Pharmacy',
  'Maternity', 'Surgical', 'ICU / HDU', 'Administration', 'Finance & Billing', 'Human Resources'
];

const ROLES = ['admin', 'doctor', 'nurse', 'triage', 'reception', 'pharmacy', 'lab_staff', 'billing', 'hr', 'store_keeper'];

const ROLE_TEXT_COLOR = {
  admin:        'text-blue-600',    doctor:       'text-emerald-600',
  nurse:        'text-emerald-600',   triage:       'text-teal-600',
  reception:    'text-slate-500',   pharmacy:     'text-amber-600',
  lab_staff:    'text-blue-600',    billing:      'text-amber-600',
  hr:           'text-slate-500',   store_keeper: 'text-amber-600',
};


function AddStaffModal({ onClose, onSave }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', roleId: '', deptId: '', empNo: '', dutyStation: '', hwrNumber: '', licenseBody: '' });
  const [depts, setDepts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  useEffect(() => {
    const load = async () => {
      try {
        const [d, r] = await Promise.all([hrService.getDepartments(), hrService.getRoles()]);
        setDepts(d || []);
        setRoles(r || []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.roleId) {
      return alert('Please fill in all required fields (*)');
    }
    setSaving(true);
    try {
      await hrService.createUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        employeeNo: form.empNo,
        departmentId: form.deptId || null,
        roleId: form.roleId,
        dutyStation: form.dutyStation,
        hwrNumber: form.hwrNumber || null,
        licenseBody: form.licenseBody || null,
      });
      onSave();
      onClose();
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl">
          <h2 className="font-black text-white text-lg">Add Staff Member</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading options…</div>
        ) : (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">First Name *</label><input className="input" value={form.firstName} onChange={f('firstName')} /></div>
              <div><label className="label">Last Name *</label><input className="input" value={form.lastName} onChange={f('lastName')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email Address *</label>
                <input type="email" className="input" value={form.email} onChange={f('email')} placeholder="staff@biopassion.com" />
              </div>
              <div>
                <label className="label">Login Password *</label>
                <input type="text" className="input" value={form.password} onChange={f('password')} placeholder="Set a secure password" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={f('phone')} /></div>
              <div><label className="label">Employee No.</label><input className="input" value={form.empNo} onChange={f('empNo')} placeholder="EMP-XXX" /></div>
            </div>
            
            <hr className="border-slate-100 my-2" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">System Role *</label>
                <select className="input" value={form.roleId} onChange={f('roleId')}>
                  <option value="">Select Role…</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name.replace('_',' ')}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Dictates what they can do & see in HMS.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label">Department (Optional)</label>
                  <select className="input" value={form.deptId} onChange={f('deptId')}>
                    <option value="">No General Department</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label flex justify-between">
                    <span>Duty Station / Desk</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <datalist id="duty-stations">
                    {roles.find(r => r.id === form.roleId)?.name === 'doctor' && (
                      <><option value="Room 1"/><option value="Room 2"/><option value="Room 3"/></>
                    )}
                    {roles.find(r => r.id === form.roleId)?.name === 'reception' && (
                      <><option value="Front Desk 1"/><option value="Front Desk 2"/><option value="OPD Registration"/></>
                    )}
                    {roles.find(r => r.id === form.roleId)?.name === 'nurse' && (
                      <><option value="General Ward"/><option value="Maternity Ward"/></>
                    )}
                    {roles.find(r => r.id === form.roleId)?.name === 'triage' && (
                      <><option value="Triage Desk 1"/><option value="OPD Triage"/></>
                    )}
                    {roles.find(r => r.id === form.roleId)?.name === 'pharmacy' && (
                      <><option value="Main Pharmacy"/><option value="Dispensary"/></>
                    )}
                    {roles.find(r => r.id === form.roleId)?.name === 'lab_staff' && (
                      <><option value="Main Lab"/><option value="Sample Collection"/></>
                    )}
                    {roles.find(r => r.id === form.roleId)?.name === 'billing' && (
                      <><option value="Cashier 1"/><option value="Cashier 2"/></>
                    )}
                    {roles.find(r => r.id === form.roleId)?.name === 'store_keeper' && (
                      <><option value="Main Store"/></>
                    )}
                  </datalist>
                  <input list="duty-stations" className="input" value={form.dutyStation} onChange={f('dutyStation')} placeholder="Select from list or type custom..." />
                </div>
              </div>
            </div>

            {/* HWR / Clinical Credentials */}
            <hr className="border-slate-100 my-1" />
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">SHA Claims — Clinical Credentials</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">HWR Number
                    <span className="ml-1 text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest">SHA Required</span>
                  </label>
                  <input className="input font-mono" value={form.hwrNumber} onChange={f('hwrNumber')} placeholder="HWR-XXXX / license no." />
                  <p className="text-[10px] text-slate-400 mt-1">Health Worker Registry number from DHA portal</p>
                </div>
                <div>
                  <label className="label">Licensing Body</label>
                  <select className="input" value={form.licenseBody} onChange={f('licenseBody')}>
                    <option value="">Select…</option>
                    <option>Kenya Medical Practitioners & Dentists Council (KMPDC)</option>
                    <option>Nursing Council of Kenya (NCK)</option>
                    <option>Pharmacy & Poisons Board (PPB)</option>
                    <option>Clinical Officers Council (COC)</option>
                    <option>Kenya Medical Laboratory Technicians & Technologists Board (KMLTTB)</option>
                    <option>Nutritionists & Dietitians Institute of Kenya</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving || loading} className="btn-primary">
            <Group sx={{ fontSize: 16 }} /> {saving ? 'Creating Account…' : 'Create Staff Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HR() {
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('all');
  const [deptFilter, setDept]   = useState('all');
  const [showAdd, setShowAdd]   = useState(false);
  const [depts, setDepts]       = useState([]);

  useEffect(() => {
    hrService.getDepartments().then(setDepts).catch(console.error);
  }, []);

  const loadStaff = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await hrService.list({ search });
      setStaff(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadStaff, 300);
    return () => clearTimeout(t);
  }, [loadStaff]);

  // Extract role name from nested user_roles → roles
  const getRole = (s) => s.user_roles?.[0]?.roles?.name || 'N/A';
  const getDept = (s) => s.departments?.name || 'N/A';

  const filtered = staff
    .filter(s => roleFilter === 'all' || getRole(s) === roleFilter)
    .filter(s => deptFilter === 'all' || getDept(s) === deptFilter);

  const roleCounts = ROLES.reduce((acc, r) => ({
    ...acc, [r]: staff.filter(s => getRole(s) === r).length
  }), {});

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Staff & HR</h1>
          <p className="text-sm text-slate-500">{staff.length} staff members in system</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStaff} className="btn-secondary shrink-0"><Refresh sx={{ fontSize: 16 }} /> Refresh</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary shrink-0">
            <Add sx={{ fontSize: 18 }} /> Add Staff
          </button>
        </div>
      </div>

      {/* Role summary */}
      <div className="flex flex-wrap gap-4 border-b border-slate-100 pb-2">
        <button key="all" onClick={() => setRole('all')}
          className={`pb-2 text-[11px] font-black uppercase tracking-wider transition-all
            ${roleFilter === 'all' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}>
          All ({staff.length})
        </button>
        {ROLES.map(r => roleCounts[r] > 0 && (
          <button key={r} onClick={() => setRole(roleFilter === r ? 'all' : r)}
            className={`pb-2 text-[11px] font-black capitalize tracking-wider transition-all
              ${roleFilter === r ? `${ROLE_TEXT_COLOR[r]} border-b-2 border-current` : 'text-slate-400 hover:text-slate-600'}`}>
            {r.replace('_',' ')} ({roleCounts[r]})
          </button>
        ))}
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">⚠️ {error}</div>}

      <div className="flex flex-col sm:flex-row gap-3 items-center py-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search staff by name, email or employee no…" 
            className="input pl-9 bg-transparent border-slate-200 focus:bg-white" />
        </div>
        <select value={deptFilter} onChange={e => setDept(e.target.value)} 
          className="input sm:w-52 bg-transparent border-slate-200 focus:bg-white cursor-pointer">
          <option value="all">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
      </div>

      {loading && <div className="card p-8 text-center text-slate-400">Loading staff…</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
             <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                   {['Staff Member', 'Role', 'Station / Dept', 'Contact Info', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                   ))}
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {loading && (
                   <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading staff directory…</td></tr>
                )}
                {!loading && filtered.map(s => {
                  const role = getRole(s);
                  const dept = getDept(s);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 border border-primary-200">
                                <span className="text-primary-700 font-black text-xs">
                                  {(s.first_name?.[0] || '?')}{(s.last_name?.[0] || '')}
                                </span>
                             </div>
                             <div>
                                <p className="font-bold text-slate-800 leading-tight">{s.first_name} {s.last_name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{s.employee_no || 'NO-ID'}</p>
                                {s.hwr_number && (
                                  <p className="text-[9px] font-mono text-blue-500 mt-0.5">HWR: {s.hwr_number}</p>
                                )}
                             </div>
                          </div>
                       </td>
                       <td className="px-4 py-3">
                          <span className={`text-[10px] font-black capitalize tracking-widest ${ROLE_TEXT_COLOR[role] || 'text-slate-400'}`}>
                             {role.replace('_',' ')}
                          </span>
                       </td>
                       <td className="px-4 py-3">
                          <div className="text-xs">
                             <p className="font-semibold text-slate-700">{s.duty_station || 'No Station'}</p>
                             <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{dept}</p>
                          </div>
                       </td>
                       <td className="px-4 py-3">
                          <div className="space-y-0.5">
                             <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                                <Email sx={{ fontSize: 13 }} className="text-slate-300" />
                                <span className="truncate max-w-[150px]">{s.email}</span>
                             </div>
                             <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                                <Phone sx={{ fontSize: 13 }} className="text-slate-300" />
                                <span>{s.phone || '—'}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-4 py-3">
                          <span className="text-[10px] font-black capitalize text-emerald-600 tracking-widest">Active</span>
                       </td>
                       <td className="px-4 py-3">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                                <Edit sx={{ fontSize: 16 }} />
                             </button>
                             <button className="btn-secondary text-[10px] py-1 px-3 font-bold uppercase tracking-wider">Profile</button>
                          </div>
                       </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                   <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400">
                         <Group sx={{ fontSize: 48 }} className="mb-3 opacity-20" />
                         <p className="font-bold text-slate-500">No staff members found.</p>
                      </td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onSave={loadStaff} />}
    </div>
  );
}
