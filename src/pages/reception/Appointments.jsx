import React, { useState, useEffect, useCallback } from 'react';
import { EventNote, Search, Refresh, CalendarToday, Cancel } from '@mui/icons-material';
import { appointmentService, CLINIC_ROUTES } from '../../services/appointments';
import BookAppointmentModal from './BookAppointmentModal';
import { toast } from 'react-toastify';
import { Add } from '@mui/icons-material';

const CLINIC_MAP = Object.fromEntries(CLINIC_ROUTES.map(c => [c.value, c]));

function ClinicBadge({ clinic }) {
  const c = CLINIC_MAP[clinic] || { label: clinic, color: 'bg-slate-100 text-slate-600', icon: '🏥' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed:  'bg-emerald-100 text-emerald-700',
    cancelled:  'bg-slate-100 text-slate-500',
    missed:     'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black capitalize ${map[status] || 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clinicFilter, setClinicFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming'); // 'upcoming' | 'today' | 'all'
  const [cancelling, setCancelling] = useState(null);
  const [showBook, setShowBook] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentService.list({ includeAll: dateFilter === 'all' });
      setAppointments(data);
    } catch (e) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancelling(id);
    try {
      await appointmentService.cancel(id);
      toast.success('Appointment cancelled');
      load();
    } catch {
      toast.error('Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = appointments.filter(a => {
    const name = `${a.patients?.first_name} ${a.patients?.last_name}`.toLowerCase();
    const pNo  = (a.patients?.patient_no || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || pNo.includes(search.toLowerCase());
    const matchClinic = clinicFilter === 'all' || a.clinic === clinicFilter;
    const matchDate   = dateFilter !== 'today' || a.appointment_date === today;
    return matchSearch && matchClinic && matchDate;
  });

  // Group by date
  const grouped = filtered.reduce((acc, appt) => {
    const d = appt.appointment_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(appt);
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">Scheduled clinic visits and appointment registry</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-xl hidden sm:block">
            <p className="text-xs font-bold text-slate-500">Total shown</p>
            <p className="text-xl font-black text-primary-700">{filtered.length}</p>
          </div>
          <button onClick={() => setShowBook(true)} className="btn-primary shrink-0">
             <Add sx={{ fontSize: 18 }} /> Book Appointment
          </button>
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
        <select value={clinicFilter} onChange={e => setClinicFilter(e.target.value)} className="input sm:w-52">
          <option value="all">All clinics</option>
          {CLINIC_ROUTES.map(c => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {[
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'today',    label: 'Today' },
            { key: 'all',      label: 'All' },
          ].map(o => (
            <button key={o.key} onClick={() => setDateFilter(o.key)}
              className={`px-4 py-2.5 text-xs font-bold transition-all ${dateFilter === o.key
                ? 'bg-primary-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-secondary">
          <Refresh fontSize="small" />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-16 text-center text-slate-400 animate-pulse">
          <p className="font-bold">Loading appointments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <EventNote sx={{ fontSize: 56 }} className="text-slate-200 mb-4 mx-auto" />
          <p className="font-black text-slate-500">No appointments found</p>
          <p className="text-xs text-slate-400 mt-1">Book appointments from the patient directory</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-4 py-1.5 rounded-xl text-xs font-black ${date === today
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                  : 'bg-slate-100 text-slate-600'}`}>
                  <CalendarToday sx={{ fontSize: 12, mr: 0.5 }} />
                  {formatDate(date)}
                </div>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-bold">{grouped[date].length} appointment{grouped[date].length !== 1 ? 's' : ''}</span>
              </div>

              {/* Table for that date */}
              <div className="card overflow-hidden ring-1 ring-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 tracking-wider">
                      <tr>
                        {['Patient', 'ID', 'Clinic', 'Time', 'Visit type', 'Reason', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {grouped[date].map(appt => (
                        <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold text-slate-800 text-xs">
                              {appt.patients?.first_name} {appt.patients?.last_name}
                            </p>
                            <p className="text-[10px] text-slate-400">{appt.patients?.age} · {appt.patients?.gender}</p>
                          </td>
                          <td className="px-5 py-3 font-mono text-[10px] text-slate-500">{appt.patients?.patient_no}</td>
                          <td className="px-5 py-3"><ClinicBadge clinic={appt.clinic} /></td>
                          <td className="px-5 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">
                            {appt.appointment_time
                              ? appt.appointment_time.slice(0, 5)
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600">{appt.visit_type}</td>
                          <td className="px-5 py-3 text-xs text-slate-500 max-w-[160px] truncate">{appt.reason || '—'}</td>
                          <td className="px-5 py-3"><StatusBadge status={appt.status} /></td>
                          <td className="px-5 py-3">
                            {appt.status === 'scheduled' && (
                              <button
                                onClick={() => handleCancel(appt.id)}
                                disabled={cancelling === appt.id}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 border border-red-100 transition-all disabled:opacity-50">
                                <Cancel sx={{ fontSize: 12 }} />
                                {cancelling === appt.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            )}
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

      {showBook && (
         <BookAppointmentModal onClose={() => setShowBook(false)} onBooked={load} />
      )}
    </div>
  );
}
