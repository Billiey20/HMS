import React, { useState, useEffect, useCallback } from 'react';
import { Search, Add, FilterList, Person, Phone, Badge, Refresh, LocalHospital, HealthAndSafety, CreditCard } from '@mui/icons-material';
import { patientService, opdService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PatientRegistrationModal from '../../components/modals/PatientRegistrationModal';
import PatientHistoryModal from '../../components/modals/PatientHistoryModal';
import AppointmentBookingModal from '../../components/modals/AppointmentBookingModal';
import { supabase } from '../../lib/supabase';
import { Close } from '@mui/icons-material';


function StatusBadge({ status }) {
  const map = {
    active: 'text-emerald-600',
    admitted: 'text-blue-600',
    discharged: 'text-slate-500',
    deceased: 'text-rose-600',
  };
  return <span className={`text-xs font-black capitalize tracking-widest ${map[status] || 'text-slate-500'}`}>{status}</span>;

}

export default function PatientCenter() {
  const { user, role } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeVisits, setActiveVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queueing, setQueueing] = useState(null);
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState(null);
  const [encounterPatient, setEncounterPatient] = useState(null);

  const loadPatients = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [pData, vData] = await Promise.all([
        patientService.list({ search }),
        opdService.getQueue()
      ]);
      setPatients(pData || []);
      setActiveVisits(vData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const sendToQueue = async (patient) => {
    if (!window.confirm(`Queue ${patient.first_name} for Triage?`)) return;
    setQueueing(patient.id);
    try {
      await opdService.createVisit({
        patient_id: patient.id,
        triage_priority: 'normal',
        status: 'waiting_triage',
        visit_type: 'Walk-In',
      });
      await loadPatients();
    } catch (e) {
      alert('Failed to send to queue: ' + e.message);
    } finally {
      setQueueing(null);
    }
  };



  // Debounce search
  useEffect(() => {
    const t = setTimeout(loadPatients, 300);
    return () => clearTimeout(t);
  }, [loadPatients]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Patient Records</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">{patients.length} Records</p>
        </div>
        <div className="flex items-center gap-4 pr-64"> {/* Increased padding to clear the wide floating date/notification module */}
          {role !== 'admin' && (
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 h-11 px-6 shadow-xl shadow-primary-500/10 transition-all active:scale-95">
              <Add sx={{ fontSize: 20 }} /> Register New Patient
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients by name, ID or phone…"
            className="input pl-9"
          />
        </div>
        <button onClick={loadPatients} className="btn-secondary whitespace-nowrap">
          <Refresh fontSize="small" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
          ⚠️ {error}
        </div>
      )}

      <div className="card overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Patient ID', 'Full Name', 'Age / Gender', 'Contact', 'Status', 'Reception Routing', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading tracking data…</td></tr>
              )}
              {!loading && patients.map(p => {
                const activeVisit = activeVisits.find(v => v.patient_id === p.id && !['completed', 'cancelled'].includes(v.status));

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-[10px] text-slate-500">{p.patient_no}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        {p.payment_mode === 'SHA' ? (
                          <HealthAndSafety className="text-emerald-500" sx={{ fontSize: 18 }} titleAccess="SHA Covered" />
                        ) : p.payment_mode === 'PHC' ? (
                          <HealthAndSafety className="text-blue-500" sx={{ fontSize: 18 }} titleAccess="PHC Covered" />
                        ) : (
                          <CreditCard className="text-slate-400" sx={{ fontSize: 18 }} titleAccess="Private / Cash" />
                        )}
                        <p className="font-black text-slate-800 leading-tight">{p.first_name} {p.middle_name || ''} {p.last_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-600">{p.age} · <span className="capitalize">{p.gender?.toLowerCase()}</span></td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-500">{p.phone || '—'}</td>
                    <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-4">
                      {(() => {
                        if (!activeVisit && p.status === 'active') {
                          return (
                            <button
                              onClick={() => sendToQueue(p)}
                              disabled={queueing === p.id}
                              className="bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white border border-primary-200 text-xs font-bold py-1.5 px-4 rounded-xl transition-all disabled:opacity-50">
                              {queueing === p.id ? 'Routing...' : 'Route to triage'}
                            </button>
                          );
                        }
                        if (activeVisit?.status === 'waiting_triage') {
                          return <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">In Triage Queue</span>;
                        }
                        if (activeVisit?.status === 'waiting_doctor') {
                          return <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">In OPD Queue</span>;
                        }
                        if (activeVisit) {
                          return <span className="text-[10px] font-black text-slate-400 capitalize tracking-widest">{activeVisit.status.replace('_', ' ')}</span>;
                        }
                        return <span className="text-[10px] font-bold text-slate-300">—</span>;
                      })()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedHistoryPatient(p)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
                          View history
                        </button>
                        {role !== 'admin' && p.status === 'active' && (
                          <button
                            onClick={() => setEncounterPatient(p)}
                            className="text-xs font-bold bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 shadow-sm shadow-primary-200 transition-all">
                            New visit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && patients.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-300">
                    <Person sx={{ fontSize: 48 }} className="mb-3 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xs">No Life Records Located</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Registration Modal */}
      {showForm && <PatientRegistrationModal userId={user?.id} onClose={() => setShowForm(false)} onSave={async (payload) => { await loadPatients(); setShowForm(false); }} />}

      {selectedHistoryPatient && (
        <PatientHistoryModal
          patient={selectedHistoryPatient}
          onClose={() => setSelectedHistoryPatient(null)}
        />
      )}

      {/* Appointment Booking Modal */}
      {encounterPatient && (
        <AppointmentBookingModal
          patient={encounterPatient}
          onClose={() => setEncounterPatient(null)}
          onSave={async () => {
            setEncounterPatient(null);
            await loadPatients();
          }}
        />
      )}
    </div>
  );
}
