import React, { useState, useEffect, useCallback } from 'react';
import {
  Group, Add, Search, Edit, Badge, Email, Phone, Refresh
} from '@mui/icons-material';
import { hrService } from '../../services/api';

const DEPARTMENTS = [
  'Outpatient (OPD)', 'Inpatient (IPD)', 'Laboratory', 'Pharmacy',
  'Maternity', 'Surgical', 'ICU / HDU', 'Administration', 'Finance & Billing', 'Human Resources'
];

const ROLES = ['admin', 'doctor', 'nurse', 'reception', 'pharmacy', 'lab_staff', 'billing', 'hr'];

const ROLE_BADGE = {
  admin:     'badge-blue',    doctor:    'badge-green',
  nurse:     'badge-green',   reception: 'badge-slate',
  pharmacy:  'badge-amber',   lab_staff: 'badge-blue',
  billing:   'badge-amber',   hr:        'badge-slate',
};

function AddStaffModal({ onClose, onSave }) {
  const emp = { firstName: '', lastName: '', email: '', phone: '', role: '', dept: '', empNo: '', status: 'active' };
  const [form, setForm] = useState(emp);
  const [saving, setSaving] = useState(false);
  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { alert('Failed: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-primary-600 rounded-t-2xl">
          <h2 className="font-black text-white text-lg">Add Staff Member</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">First Name *</label><input className="input" value={form.firstName} onChange={f('firstName')} /></div>
            <div><label className="label">Last Name *</label><input className="input" value={form.lastName} onChange={f('lastName')} /></div>
          </div>
          <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={f('email')} placeholder="staff@biopassion.com" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={f('phone')} placeholder="07XXXXXXXX" /></div>
            <div><label className="label">Employee No.</label><input className="input" value={form.empNo} onChange={f('empNo')} placeholder="EMP-XXX" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={f('role')}>
                <option value="">Select…</option>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department *</label>
              <select className="input" value={form.dept} onChange={f('dept')}>
                <option value="">Select…</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            ⚠️ Staff members must be invited via Supabase Auth to set their login password. Adding them here registers their profile.
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Group sx={{ fontSize: 16 }} /> {saving ? 'Adding…' : 'Add Staff'}
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
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setRole('all')}
          className={`badge cursor-pointer ${roleFilter === 'all' ? 'bg-primary-600 text-white border-transparent' : 'badge-slate'}`}>
          All ({staff.length})
        </button>
        {ROLES.map(r => roleCounts[r] > 0 && (
          <button key={r} onClick={() => setRole(roleFilter === r ? 'all' : r)}
            className={`badge cursor-pointer capitalize ${roleFilter === r ? 'bg-primary-600 text-white border-transparent' : ROLE_BADGE[r]}`}>
            {r.replace('_',' ')} ({roleCounts[r]})
          </button>
        ))}
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">⚠️ {error}</div>}

      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search staff by name, email or employee no…" className="input pl-9" />
        </div>
        <select value={deptFilter} onChange={e => setDept(e.target.value)} className="input sm:w-52">
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading && <div className="card p-8 text-center text-slate-400">Loading staff…</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && filtered.map(s => {
          const role = getRole(s);
          const dept = getDept(s);
          return (
            <div key={s.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="text-primary-700 font-black text-base">
                      {(s.first_name?.[0] || '?')}{(s.last_name?.[0] || '')}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{s.first_name} {s.last_name}</p>
                    <span className={`badge ${ROLE_BADGE[role] || 'badge-slate'} text-[10px] capitalize`}>
                      {role.replace('_',' ')}
                    </span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Edit sx={{ fontSize: 16 }} />
                </button>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Badge sx={{ fontSize: 13 }} className="text-slate-400" />
                  <span>{s.employee_no || '—'} · {dept}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Email sx={{ fontSize: 13 }} className="text-slate-400" />
                  <span className="truncate">{s.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone sx={{ fontSize: 13 }} className="text-slate-400" />
                  <span>{s.phone || '—'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                <span className="badge badge-green">active</span>
                <button className="btn-secondary text-xs py-1 px-3">View Profile</button>
              </div>
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="col-span-3 card p-12 text-center text-slate-400">
            <Group sx={{ fontSize: 48 }} className="mb-3 text-slate-200" />
            <p className="font-bold text-slate-500">
              {staff.length === 0
                ? 'No staff profiles found. Users must be registered in Supabase Auth first.'
                : 'No staff match your search or filter'}
            </p>
          </div>
        )}
      </div>

      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onSave={async (data) => {
        // Optimistic: add to local list since we can't create auth users from client
        setStaff(prev => [{ id: `local-${Date.now()}`, first_name: data.firstName, last_name: data.lastName, email: data.email, phone: data.phone, employee_no: data.empNo, departments: { name: data.dept }, user_roles: [{ roles: { name: data.role } }] }, ...prev]);
      }} />}
    </div>
  );
}
