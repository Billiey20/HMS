import React, { useState, useEffect, useCallback } from 'react';
import { EventRepeat, Search, Refresh, CalendarToday, Person } from '@mui/icons-material';
import { followUpService } from '../../services/appointments';
import { toast } from 'react-toastify';

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('upcoming'); // 'upcoming' | 'today' | 'all'

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await followUpService.list({ includeAll: dateFilter === 'all' });
      setFollowUps(data);
    } catch (e) {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = followUps.filter(fu => {
    const name = `${fu.patients?.first_name} ${fu.patients?.last_name}`.toLowerCase();
    const pNo  = (fu.patients?.patient_no || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || pNo.includes(search.toLowerCase());
    const matchDate   = dateFilter !== 'today' || fu.follow_up_date === today;
    return matchSearch && matchDate;
  });

  // Group by follow-up date
  const grouped = filtered.reduce((acc, fu) => {
    const d = fu.follow_up_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(fu);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  const formatDate = (d) => {
    const dt = new Date(d + 'T12:00:00');
    const isToday = d === today;
    const isTomorrow = d === new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return dt.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const daysUntil = (d) => {
    const ms = new Date(d + 'T12:00:00') - new Date(today + 'T12:00:00');
    const days = Math.round(ms / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return `${Math.abs(days)}d ago`;
    return `In ${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Follow-ups</h1>
          <p className="text-sm text-slate-500 mt-1">Doctor-scheduled patient follow-up appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-violet-50 border border-violet-200 rounded-xl">
            <p className="text-xs font-bold text-slate-500">Total shown</p>
            <p className="text-xl font-black text-violet-700">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name or ID..."
            className="input pl-9" />
        </div>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {[
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'today',    label: 'Today' },
            { key: 'all',      label: 'All' },
          ].map(o => (
            <button key={o.key} onClick={() => setDateFilter(o.key)}
              className={`px-4 py-2.5 text-xs font-bold transition-all ${dateFilter === o.key
                ? 'bg-violet-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-secondary">
          <Refresh fontSize="small" />
        </button>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl flex items-start gap-3">
        <EventRepeat className="text-violet-500 mt-0.5 shrink-0" sx={{ fontSize: 18 }} />
        <p className="text-xs font-semibold text-violet-700">
          Follow-ups are scheduled by doctors at the end of consultations. 
          They are shown here for reception awareness. To confirm an arrival, route the patient through patient directory → triage.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-16 text-center text-slate-400 animate-pulse">
          <p className="font-bold">Loading follow-ups...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <EventRepeat sx={{ fontSize: 56 }} className="text-slate-200 mb-4 mx-auto" />
          <p className="font-black text-slate-500">No follow-ups found</p>
          <p className="text-xs text-slate-400 mt-1">Follow-ups are scheduled by doctors after consultation</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-4 py-1.5 rounded-xl text-xs font-black ${date === today
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'bg-slate-100 text-slate-600'}`}>
                  <CalendarToday sx={{ fontSize: 12, mr: 0.5 }} />
                  {formatDate(date)}
                </div>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-bold">
                  {grouped[date].length} follow-up{grouped[date].length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              <div className="card overflow-hidden ring-1 ring-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 tracking-wider">
                      <tr>
                        {['Patient', 'ID', 'Age · Gender', 'Phone', 'Follow-up date', 'Days', 'Attending doctor', 'Diagnosis', 'Notes'].map(h => (
                          <th key={h} className="px-5 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {grouped[date].map(fu => (
                        <tr key={fu.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold text-slate-800 text-xs">
                              {fu.patients?.first_name} {fu.patients?.last_name}
                            </p>
                          </td>
                          <td className="px-5 py-3 font-mono text-[10px] text-slate-500">{fu.patients?.patient_no}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">
                            {fu.patients?.age} · {fu.patients?.gender}
                          </td>
                          <td className="px-5 py-3 font-mono text-[10px] text-slate-500">{fu.patients?.phone || '—'}</td>
                          <td className="px-5 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">
                            {new Date(fu.follow_up_date + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              fu.follow_up_date === today 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : fu.follow_up_date < today 
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-blue-100 text-blue-700'
                            }`}>
                              {daysUntil(fu.follow_up_date)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Person sx={{ fontSize: 12 }} className="text-slate-400" />
                              {fu.doctor
                                ? `Dr. ${fu.doctor.first_name} ${fu.doctor.last_name}`
                                : <span className="text-slate-300 italic">not assigned</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500 max-w-[140px] truncate">
                            {fu.final_diagnosis || fu.provisional_diagnosis || '—'}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-400 max-w-[160px] truncate">
                            {fu.follow_up_notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
