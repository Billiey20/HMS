import React, { useState, useEffect, useCallback } from 'react';
import { Search, Add, FilterList, Person, Phone, Badge, Refresh, LocalHospital } from '@mui/icons-material';
import { patientService, opdService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PatientRegistrationModal from '../../components/modals/PatientRegistrationModal';
import PatientHistoryModal from '../../components/modals/PatientHistoryModal';
import { supabase } from '../../lib/supabase';


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
  const { user, role } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [queueing, setQueueing] = useState(null); 
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState(null);

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

  const sendToQueue = async (patient) => {
    if (!window.confirm(`Send ${patient.first_name} ${patient.last_name} to the Doctor's Queue?`)) return;
    setQueueing(patient.id);
    try {
      await opdService.createVisit({
        patient_id: patient.id,
        triage_priority: 'normal',
        status: 'waiting',
        visit_type: 'Walk-In',
      });
      alert('Patient sent to OPD queue successfully!');
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
          <h1 className="text-2xl font-black text-slate-800">Patient Center</h1>
          <p className="text-sm text-slate-500">{patients.length} registered patients</p>
        </div>
        {role !== 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            <Add sx={{ fontSize: 18 }} /> Register Patient
          </button>
        )}
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
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => setSelectedHistoryPatient(p)}
                         className="btn-secondary text-xs py-1.5 px-4 font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all shadow-sm ring-1 ring-slate-200">
                         View History
                       </button>
                      {role !== 'admin' && p.status === 'active' && (
                        <button 
                          onClick={() => sendToQueue(p)} 
                          disabled={queueing === p.id}
                          className="bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50">
                          {queueing === p.id ? 'Sending...' : <><LocalHospital sx={{ fontSize: 14 }} /> To OPD</>}
                        </button>
                      )}
                    </div>
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
      
      {/* History Modal */}
      {selectedHistoryPatient && (
        <PatientHistoryModal 
          patient={selectedHistoryPatient} 
          onClose={() => setSelectedHistoryPatient(null)} 
        />
      )}
    </div>
  );
}
