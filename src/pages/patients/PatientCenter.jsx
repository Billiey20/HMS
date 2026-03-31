import React, { useState, useEffect, useCallback } from 'react';
import { Search, Add, FilterList, Person, Phone, Badge, Refresh, LocalHospital } from '@mui/icons-material';
import { patientService, opdService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PatientRegistrationModal from '../../components/modals/PatientRegistrationModal';
import PatientHistoryModal from '../../components/modals/PatientHistoryModal';
import { supabase } from '../../lib/supabase';
import { Close } from '@mui/icons-material';


function StatusBadge({ status }) {
  const map = {
    active:    'text-emerald-600',
    admitted:  'text-blue-600',
    discharged:'text-slate-500',
    deceased:  'text-rose-600',
  };
  return <span className={`text-xs font-black uppercase tracking-wider ${map[status] || 'text-slate-500'} capitalize`}>{status}</span>;
}

export default function PatientCenter() {
  const { user, role } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [queueing, setQueueing] = useState(false); 
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState(null);
  const [encounterPatient, setEncounterPatient] = useState(null);

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

  const createEncounter = async (type) => {
    if (!encounterPatient) return;
    setQueueing(true);
    try {
      await opdService.createVisit({
        patient_id: encounterPatient.id,
        triage_priority: type === 'Emergency' ? 'emergency' : 'normal',
        status: type === 'Follow-Up' ? 'in_consultation' : 'waiting', // Follow-up bypasses triage directly to opd queue? Or still wait? Lets just default:
        visit_type: type,
      });
      alert(`Encounter created: ${type}`);
      setEncounterPatient(null);
    } catch (e) {
      alert('Failed to create encounter: ' + e.message);
    } finally {
      setQueueing(false);
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

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID or phone…"
            className="input pl-9 bg-transparent border-slate-200 focus:bg-white"
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
                          onClick={() => setEncounterPatient(p)} 
                          className="bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors flex items-center gap-1">
                          <LocalHospital sx={{ fontSize: 14 }} /> New Encounter
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
      
      {selectedHistoryPatient && (
        <PatientHistoryModal 
          patient={selectedHistoryPatient} 
          onClose={() => setSelectedHistoryPatient(null)} 
        />
      )}

      {/* Encounter Modal */}
      {encounterPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
             <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <h3 className="font-black text-slate-800">New Encounter</h3>
                <button onClick={() => setEncounterPatient(null)}><Close className="text-slate-400"/></button>
             </div>
             <div className="p-6">
                <p className="text-sm font-bold text-slate-500 mb-4 tracking-widest uppercase">Patient</p>
                <p className="text-lg font-black text-slate-800 mb-6">{encounterPatient.first_name} {encounterPatient.last_name}</p>

                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Select Encounter Type</p>
                <div className="space-y-2">
                   {['Walk-In', 'Follow-Up', 'Emergency', 'Routine Clinic'].map(type => (
                      <button key={type} onClick={() => createEncounter(type)} disabled={queueing}
                        className="w-full text-left px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                        {type}
                      </button>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
