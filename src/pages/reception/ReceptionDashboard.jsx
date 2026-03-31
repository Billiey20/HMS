import React, { useState, useEffect, useCallback } from 'react';
import { Search, Add, Person, LocalHospital, Hotel, PriceCheck, FactCheck, Refresh } from '@mui/icons-material';
import { patientService, opdService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PatientRegistrationModal from '../../components/modals/PatientRegistrationModal';
import PriceListModal from '../../components/modals/PriceListModal';

function StatusBadge({ status }) {
  const map = {
    active:    'badge-green',
    admitted:  'badge-blue',
    discharged:'badge-slate',
    deceased:  'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-slate'} capitalize`}>{status}</span>;
}

export default function ReceptionDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [queueing, setQueueing] = useState(null);
  const [activeVisits, setActiveVisits] = useState([]);

  const loadPatients = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [patientsData, queueData] = await Promise.all([
        patientService.list({ search }),
        opdService.getQueue()
      ]);
      setPatients(patientsData || []);
      setActiveVisits(queueData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadPatients, 300);
    return () => clearTimeout(t);
  }, [loadPatients]);

  const sendToQueue = async (patient) => {
    if (!window.confirm(`Queue ${patient.first_name} for Triage?`)) return;
    setQueueing(patient.id);
    try {
      // Auto-assign room logic (mocking room choice for now)
      const rooms = ['Room 1', 'Room 2', 'Room 3'];
      const assignedRoom = rooms[Math.floor(Math.random() * rooms.length)];

      await opdService.createVisit({
        patient_id: patient.id,
        triage_priority: 'normal',
        status: 'waiting_triage',
        visit_type: 'Walk-In',
      });
      await loadPatients();
      alert(`Success! Patient queued for Triage.`);
    } catch (e) {
      alert('Failed to send to queue: ' + e.message);
    } finally {
      setQueueing(null);
    }
  };

  const quickActions = [
    { label: 'Register Patient', icon: Add, color: 'bg-primary-600', action: () => setShowForm(true) },
    { label: 'Check Prices', icon: PriceCheck, color: 'bg-emerald-600', action: () => setShowPrices(true) },
    { label: 'Room Queues', icon: FactCheck, color: 'bg-blue-600', action: () => alert('Viewing queues currently handled by OPD') },
    { label: 'Ward Bed Map', icon: Hotel, color: 'bg-violet-600', action: () => window.location.href = '/ipd/wards' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Dynamic Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800">Reception Desk</h1>
        <p className="text-sm text-slate-500 mt-1">Patient tracking, registration, and queue routing.</p>
      </div>

      {/* Reception Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map(({ label, icon: Icon, color, action }) => (
          <button key={label} onClick={action}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl gap-3 text-white transition-all hover:opacity-90 active:scale-95 shadow-sm ${color}`}>
            <Icon sx={{ fontSize: 32 }} />
            <span className="font-bold text-sm tracking-wide">{label}</span>
          </button>
        ))}
      </div>

      {/* Patient Tracking Grid */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Track patient by name, ID or phone..."
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

      <div className="card overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-700">Patient Directory</h2>
            <span className="badge badge-slate">{patients.length} Total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                {['ID', 'Patient Name', 'Demographics', 'Phone', 'Current Status', 'Routing Action'].map(h => (
                  <th key={h} className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading tracking data…</td></tr>
              )}
              {!loading && patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.patient_no}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{p.first_name} {p.middle_name} {p.last_name}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{p.age} • {p.gender}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 font-mono">{p.phone || '—'}</td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4">
                    {(() => {
                      const activeVisit = activeVisits.find(v => v.patient_id === p.id && !['completed', 'cancelled'].includes(v.status));
                      if (!activeVisit && p.status === 'active') {
                        return (
                          <button 
                            onClick={() => sendToQueue(p)} 
                            disabled={queueing === p.id}
                            className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50 flex items-center gap-2">
                            {queueing === p.id ? 'Routing...' : <><LocalHospital sx={{ fontSize: 14 }} /> To Triage</>}
                          </button>
                        );
                      }
                      if (activeVisit?.status === 'waiting_triage') {
                        return <span className="badge badge-amber text-[10px] px-2 py-1"><LocalHospital sx={{ fontSize: 12, mr: 0.5 }} /> In Triage Queue</span>;
                      }
                      if (activeVisit?.status === 'waiting_doctor') {
                        return <span className="badge badge-blue text-[10px] px-2 py-1"><Person sx={{ fontSize: 12, mr: 0.5 }} /> In OPD Queue</span>;
                      }
                      if (activeVisit) {
                         return <span className="badge badge-slate text-[10px] px-2 py-1 capitalize">{activeVisit.status.replace('_', ' ')}</span>;
                      }
                      return null;
                    })()}
                  </td>
                </tr>
              ))}
              {!loading && patients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Person sx={{ fontSize: 40 }} className="mb-3 opacity-20" />
                    <p className="font-bold text-slate-500">No patients located</p>
                    <p className="text-xs mt-1">Adjust search tracking or register a new walk-in.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <PatientRegistrationModal userId={user?.id} onClose={() => setShowForm(false)} onSave={async () => { await loadPatients(); setShowForm(false); }} />}
      {showPrices && <PriceListModal onClose={() => setShowPrices(false)} />}
    </div>
  );
}
