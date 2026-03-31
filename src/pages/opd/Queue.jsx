import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AccessTime, CheckCircle, Refresh
} from '@mui/icons-material';
import { opdService } from '../../services/api';

const priorityStyle = {
  emergency: { row: 'border-l-4 border-red-500 bg-red-50', badge: 'badge-red',   label: 'Emergency', icon: '🚨' },
  urgent:    { row: 'border-l-4 border-amber-400 bg-amber-50/50', badge: 'badge-amber',  label: 'Urgent',    icon: '⚠️' },
  normal:    { row: 'border-l-4 border-slate-200', badge: 'badge-green', label: 'Normal',    icon: '✅' },
};

// Removed VitalChip since we are using plain numbers now

export default function OPDQueue() {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('ready');
  const [followUps, setFollowUps] = useState([]);


  const loadQueue = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [queueData, followUpData] = await Promise.all([
        opdService.getQueue(),
        opdService.getFollowUps()
      ]);
      setQueue(queueData || []);
      setFollowUps(followUpData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const filteredQueue = queue.filter(q => {
    if (activeTab === 'ready') return q.status === 'waiting_doctor';
    if (activeTab === 'lab')   return q.status === 'waiting_lab';
    return false;
  });

  const sorted = [...filteredQueue]
    .filter(v => filter === 'all' || (v.triage_priority || 'normal') === filter)
    .sort((a, b) => {
      const pA = a.triage_priority || 'normal';
      const pB = b.triage_priority || 'normal';
      const o = { emergency: 0, urgent: 1, normal: 2 };
      return o[pA] - o[pB] || new Date(a.check_in_time) - new Date(b.check_in_time);
    });

  const counts = {
    ready: queue.filter(q => q.status === 'waiting_doctor').length,
    lab: queue.filter(q => q.status === 'waiting_lab').length,
    followups: followUps.length,
    all:       filteredQueue.length,
    emergency: filteredQueue.filter(q => (q.triage_priority || 'normal') === 'emergency').length,
    urgent:    filteredQueue.filter(q => (q.triage_priority || 'normal') === 'urgent').length,
    normal:    filteredQueue.filter(q => (q.triage_priority || 'normal') === 'normal').length,
  };

  const startConsultation = (visit) => {
    // Structure a clean visit object to pass forward
    const formattedVisit = {
      visit_id: visit.visit_id,
      patient_id: visit.patient_id,
      patientNo: visit.patient_no,
      name: visit.patient_name,
      age: visit.age,
      gender: visit.gender,
      priority: visit.triage_priority || 'normal',
      complaint: visit.presenting_complaint,
      temperature: visit.temperature,
      pulse: visit.pulse,
      bpSystolic: visit.bp_systolic,
      bpDiastolic: visit.bp_diastolic,
      spo2: visit.spo2,
      weightKg: visit.weight_kg,
      heightCm: visit.height_cm,
      bloodGlucose: visit.blood_glucose,
      checkIn: new Date(visit.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    navigate('/opd/consultation', { state: { visit: formattedVisit } });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Doctor's Queue</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={loadQueue} className="btn-secondary shrink-0 group">
          <Refresh sx={{ fontSize: 18 }} className="group-hover:rotate-180 transition-transform duration-500" /> Refresh List
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { key: 'ready', label: 'Waiting for Clinician', count: counts.ready },
          { key: 'lab',   label: 'Awaiting Results',      count: counts.lab },
          { key: 'followups', label: 'Scheduled Follow-ups', count: counts.followups },
        ].map(({ key, label, count }) => (
          <button key={key}
            onClick={() => { setActiveTab(key); setFilter('all'); }}
            className={`pb-3 px-1 text-sm font-black transition-all border-b-4
              ${activeTab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {label} <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Priority filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',       label: `All (${counts.all})`,             cls: 'bg-slate-800 text-white' },
          { key: 'emergency', label: `🚨 Emergency (${counts.emergency})`, cls: 'bg-red-600 text-white shadow-sm shadow-red-500/20' },
          { key: 'urgent',    label: `⚠️ Urgent (${counts.urgent})`,      cls: 'bg-amber-500 text-white shadow-sm shadow-amber-500/20' },
          { key: 'normal',    label: `✅ Normal (${counts.normal})`,       cls: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20' },
        ].map(({ key, label, cls }) => (
          <button key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-[11px] uppercase tracking-wider font-black transition-all border-2
              ${filter === key ? `${cls} border-transparent scale-105` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          {activeTab === 'followups' ? (
            <table className="w-full text-sm text-left align-middle min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Patient ID</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Patient Details</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Scheduled Date</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Follow-up Notes / Reason</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4 font-mono text-sm tracking-tight text-slate-500 font-semibold">{f.patients?.patient_no}</td>
                    <td className="px-5 py-4">
                      <div className="font-black text-base text-slate-800 mb-1 leading-tight">{f.patients?.first_name} {f.patients?.last_name}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-600">{new Date(f.follow_up_date).toLocaleDateString('en-GB')}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 italic">"{f.follow_up_notes || 'Routine checkup'}"</td>
                    <td className="px-5 py-4 text-right">
                      {role !== 'admin' && (
                        <button onClick={() => startConsultation({
                           visit_id: null, // New visit
                           patient_id: f.patient_id,
                           patient_no: f.patients?.patient_no,
                           patient_name: `${f.patients?.first_name} ${f.patients?.last_name}`,
                           age: f.patients?.age || 'Adult', // Guessing age from patient record
                           gender: f.patients?.gender,
                           triage_priority: 'normal',
                           presenting_complaint: f.follow_up_notes || 'Follow-up visit',
                           check_in_time: new Date().toISOString()
                        })} className="btn-primary text-xs py-2 px-4 whitespace-nowrap shadow-sm">
                           Start Visit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {followUps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-slate-400 bg-slate-50/50">
                      <CheckCircle sx={{ fontSize: 56 }} className="mb-4 text-emerald-400" />
                      <p className="font-black text-xl text-slate-700 tracking-tight">No upcoming follow-ups</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
          <table className="w-full text-sm text-left align-middle min-w-[1000px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap w-4">Rank</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Patient ID</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Patient Details</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Case Type</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Complaint</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap w-24">Status</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Temp (°C)</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Pulse</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">BP</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">SpO₂ (%)</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Wait Time</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-slate-400 font-bold animate-pulse">
                    Scanning live queue…
                  </td>
                </tr>
              )}

              {!loading && sorted.map((v, i) => {
                const priority = v.triage_priority || 'normal';
                const waitMins = Math.floor((new Date() - new Date(v.check_in_time)) / 60000);
                
                // Format age and gender
                const displayAge = v.age === 'Adult' ? 'A' : v.age;
                const displayGender = v.gender ? v.gender.charAt(0).toUpperCase() : '';

                // Format Time
                let displayTime = '';
                if (waitMins < 60) displayTime = waitMins === 0 ? '0 mins' : `${waitMins} mins`;
                else {
                  const hrs = Math.floor(waitMins / 60);
                  displayTime = `${hrs} hr${hrs > 1 ? 's' : ''}`;
                }

                return (
                  <tr key={v.visit_id} className="hover:bg-slate-50 transition-colors group">
                    {/* 1. Rank */}
                    <td className="px-5 py-4">
                      <span className="font-black text-xl text-slate-800">
                        {v.queue_no || (i + 1)}
                      </span>
                    </td>

                    {/* 2. Patient Id */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm tracking-tight text-slate-500 font-semibold whitespace-nowrap">
                        {v.patient_no}
                      </span>
                    </td>

                    {/* 3. Patient Details */}
                    <td className="px-5 py-4">
                      <div className="font-black text-base text-slate-800 mb-1 leading-tight whitespace-nowrap capitalize">
                        {v.patient_name?.split(' ')[0]?.toLowerCase()}
                      </div>
                      <div className="text-sm font-bold text-slate-500 flex items-center">
                        <span className="w-10">{displayAge}</span>
                        <span>{displayGender}</span>
                      </div>
                    </td>

                    {/* 3.5 Case Type (OPD/IPD) */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {v.admission ? (
                        <div className="flex items-center gap-2">
                           <span className="font-black text-slate-900 text-[11px] uppercase tracking-tighter">IPD</span>
                           <span className="font-bold text-primary-600 text-[10px] capitalize tracking-wider">{v.admission.ward?.toLowerCase()}</span>
                        </div>
                      ) : (
                        <span className="font-black text-slate-400 text-[11px] uppercase tracking-tighter">OPD</span>
                      )}
                    </td>

                    {/* 4. Complaint */}
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-600 font-medium truncate max-w-[150px]" title={v.presenting_complaint}>
                        {v.presenting_complaint || '—'}
                      </div>
                    </td>

                    {/* 5. Status */}
                    <td className="px-5 py-4">
                      {priority === 'normal' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-200 whitespace-nowrap">
                          <CheckCircle sx={{ fontSize: 14 }} /> Normal
                        </span>
                      ) : priority === 'urgent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-black border border-amber-200 shadow-sm whitespace-nowrap">
                          ⚠️ Urgent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-[11px] font-black border border-red-200 shadow-sm animate-pulse whitespace-nowrap">
                          🚨 Emergency
                        </span>
                      )}
                    </td>

                    {/* 6-9. Vitals */}
                    <td className={`px-4 py-4 font-bold text-sm ${v.temperature && (v.temperature > 37.5 || v.temperature < 36.0) ? 'text-red-600 bg-red-50/50 rounded-lg' : 'text-slate-700'}`}>
                      {v.temperature || '—'}
                    </td>
                    <td className={`px-4 py-4 font-bold text-sm ${v.pulse && (v.pulse > 100 || v.pulse < 60) ? 'text-red-600 bg-red-50/50 rounded-lg' : 'text-slate-700'}`}>
                      {v.pulse || '—'}
                    </td>
                    <td className={`px-4 py-4 font-bold text-sm ${v.bp_systolic && v.bp_diastolic && (v.bp_systolic >= 140 || v.bp_diastolic >= 90) ? 'text-red-600 bg-red-50/50 rounded-lg' : 'text-slate-700'}`}>
                      {v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : '—'}
                    </td>
                    <td className={`px-4 py-4 font-bold text-sm ${v.spo2 && v.spo2 < 95 ? 'text-red-600 bg-red-50/50 rounded-lg' : 'text-slate-700'}`}>
                      {v.spo2 ? `${v.spo2}` : '—'}
                    </td>

                    {/* 10. Wait Time */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-700 text-sm whitespace-nowrap">
                        {displayTime}
                      </div>
                    </td>

                    {/* 11. Action */}
                     <td className="px-5 py-4 text-right">
                      {role !== 'admin' && (
                        activeTab === 'ready' ? (
                          <button
                            onClick={() => startConsultation(v)}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 whitespace-nowrap shadow-sm
                              ${priority === 'emergency' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                priority === 'urgent' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                                'bg-primary-600 hover:bg-primary-700 text-white'}`}>
                            Attend
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black border border-slate-200 whitespace-nowrap">
                            <Refresh sx={{ fontSize: 14 }} className="animate-spin" /> In Lab
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={12}>
                    <div className="p-16 text-center text-slate-400 bg-slate-50/50">
                      <CheckCircle sx={{ fontSize: 56 }} className="mb-4 text-emerald-400 empty-state-icon" />
                      <p className="font-black text-xl text-slate-700 tracking-tight">Queue is clear!</p>
                      <p className="text-sm font-medium mt-2">No patients waiting in this category.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}
