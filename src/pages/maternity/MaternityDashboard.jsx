import React, { useState, useEffect } from 'react';
import { PregnantWoman, Search, ChildCare, CalendarMonth, LocalHospital, MonitorHeart, MedicalInformation, Edit } from '@mui/icons-material';
import { patientService } from '../../services/api';
import { maternityService } from '../../services/maternity';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function MaternityDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [activeTab, setActiveTab] = useState('ANC'); // 'ANC', 'PARTOGRAPH', 'DELIVERY'
  const [ancVisits, setAncVisits] = useState([]);
  const [partographs, setPartographs] = useState([]);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search female patients only
  useEffect(() => {
    const t = setTimeout(async () => {
      if (search.length < 2) return;
      const res = await patientService.list({ search });
      setPatients(res.filter(p => p.gender === 'Female'));
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load maternity dossier for selected patient
  const loadDossier = async (patient) => {
    setSelectedPatient(patient);
    setSearch('');
    setPatients([]);
    setLoading(true);
    try {
      const [anc, part, del] = await Promise.all([
        maternityService.getANCVisits(patient.id),
        maternityService.getPartographs(patient.id),
        maternityService.getDeliveryRecord(patient.id)
      ]);
      setAncVisits(anc);
      setPartographs(part);
      setDelivery(del);
    } catch (err) {
      toast.error('Failed to load maternity records');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyCRVS = async () => {
    try {
      const res = await maternityService.notifyCRVS(delivery, selectedPatient.id);
      toast.success(res.message);
      loadDossier(selectedPatient); // refresh
    } catch (e) {
      toast.error('CRVS Notification failed');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center">
              <PregnantWoman fontSize="medium" className="text-pink-600" />
            </div>
            Maternity & Neonatal Unit
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">ANC Module, Digital Partograph & Delivery Records</p>
        </div>
      </div>

      {/* Main Layout */}
      {!selectedPatient ? (
        <div className="card p-8 md:p-16 text-center border border-slate-200">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="text-slate-400" sx={{ fontSize: 32 }} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Locate Patient</h3>
              <p className="text-sm text-slate-500 mt-2">Search for an expecting mother to open the maternity dossier.</p>
            </div>
            <div className="relative">
              <input 
                autoFocus
                className="input pl-12 h-14 text-lg w-full shadow-sm"
                placeholder="Name, ID or Phone number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            
            {/* Search Results */}
            {patients.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden mt-2 text-left absolute z-10 w-full max-w-md">
                {patients.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => loadDossier(p)}
                    className="w-full px-5 py-4 hover:bg-pink-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500">
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{p.first_name} {p.last_name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{p.patient_no} · {p.age} yrs</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Patient Banner */}
          <div className="card p-6 bg-gradient-to-br from-pink-600 to-rose-700 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shadow-lg">
                {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-black">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                <div className="flex items-center gap-3 mt-1.5 text-pink-100 text-sm font-semibold">
                  <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{selectedPatient.patient_no}</span>
                  <span>{selectedPatient.age} yrs</span>
                  <span>Blood: {selectedPatient.blood_group || 'Unknown'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedPatient(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20">
                Close Chart
              </button>
            </div>
          </div>

          {/* Module Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            {[
              { id: 'ANC', label: 'Antenatal Care', icon: <CalendarMonth fontSize="small" className="mr-1.5"/> },
              { id: 'PARTOGRAPH', label: 'Digital Partograph', icon: <MonitorHeart fontSize="small" className="mr-1.5"/> },
              { id: 'DELIVERY', label: 'Delivery & APGAR', icon: <ChildCare fontSize="small" className="mr-1.5"/> }
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                  activeTab === t.id 
                    ? 'bg-white text-pink-700 shadow-sm ring-1 ring-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="card bg-white p-6 md:p-8 min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-400 font-bold animate-pulse">Loading records...</div>
            ) : (
              <>
                {/* ANC TAB */}
                {activeTab === 'ANC' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-800">ANC Visits</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">WHO 8-contact model schedule</p>
                      </div>
                      <button className="btn-primary py-2 px-4 shadow-pink-200">
                        Log New ANC Visit
                      </button>
                    </div>

                    {ancVisits.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <MedicalInformation sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                        <p className="font-bold text-sm">No ANC visits recorded yet</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {ancVisits.map((v, i) => (
                           <div key={v.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                             <div className="flex items-center justify-between">
                               <span className="text-xs font-black px-2.5 py-1 bg-pink-100 text-pink-700 rounded-full">Visit {ancVisits.length - i}</span>
                               <span className="text-xs font-bold text-slate-500">{new Date(v.visit_date).toLocaleDateString()}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-y-2 mt-2">
                               <div className="text-xs"><span className="text-slate-400 block font-bold">Gestational Age</span><span className="font-black text-slate-800">{v.gestational_age_weeks} Weeks</span></div>
                               <div className="text-xs"><span className="text-slate-400 block font-bold">Fundal Height</span><span className="font-black text-slate-800">{v.fundal_height_cm} cm</span></div>
                               <div className="text-xs"><span className="text-slate-400 block font-bold">Fetal Heart Rate</span><span className="font-black text-slate-800">{v.fetal_heart_rate} bpm</span></div>
                               <div className="text-xs"><span className="text-slate-400 block font-bold">PMTCT</span><span className={`font-black ${v.pmtct_hiv_status === 'Positive' ? 'text-rose-600' : 'text-emerald-600'}`}>{v.pmtct_hiv_status || 'Unknown'}</span></div>
                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PARTOGRAPH TAB */}
                {activeTab === 'PARTOGRAPH' && (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-800">Active Labour (Partograph)</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Cervical dilation & vitals timeline</p>
                      </div>
                      <button className="btn-secondary py-2 px-4 border-pink-200 text-pink-700 hover:bg-pink-50">
                        Record Next Reading
                      </button>
                    </div>

                    {partographs.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <MonitorHeart sx={{fontSize: 48}} className="mb-3 opacity-20"/>
                        <p className="font-bold text-sm">Partograph not started</p>
                        <p className="text-xs mt-1 max-w-xs mx-auto">Initiate the partograph when the patient enters the active phase of labour (4cm+ dilation).</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-slate-200 ml-6 space-y-8 pb-8">
                        {partographs.map(p => (
                          <div key={p.id} className="relative pl-8">
                            <span className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-white border-4 border-pink-500 shadow-sm" />
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                              <p className="text-xs font-black text-slate-400 border-b border-slate-100 pb-2 mb-3">
                                {new Date(p.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><p className="text-[10px] uppercase font-black text-slate-400">Dilation</p><p className="font-black text-pink-600 text-lg">{p.cervical_dilation_cm} cm</p></div>
                                <div><p className="text-[10px] uppercase font-black text-slate-400">Contractions /10m</p><p className="font-black text-slate-800 text-lg">{p.contractions_per_10m}</p></div>
                                <div><p className="text-[10px] uppercase font-black text-slate-400">Fetal HR</p><p className="font-black text-slate-800 text-lg">{p.fetal_hr} bpm</p></div>
                                <div><p className="text-[10px] uppercase font-black text-slate-400">Maternal BP</p><p className="font-black text-slate-800 text-lg">{p.maternal_bp_systolic}/{p.maternal_bp_diastolic}</p></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DELIVERY TAB */}
                {activeTab === 'DELIVERY' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-800">Delivery & Neonatal Outcome</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Birth registry and APGAR scoring</p>
                      </div>
                    </div>

                    {!delivery ? (
                      <div className="text-center py-12">
                        <ChildCare sx={{fontSize: 56}} className="text-slate-200 mb-4"/>
                        <p className="font-black text-slate-700">Delivery Not Recorded</p>
                        <button className="mt-4 btn-primary shadow-pink-200 pt-2 pb-2">Finalize Delivery</button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
                          <h4 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-200 pb-2">Birth Details</h4>
                          <div className="space-y-4 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500 font-bold">Delivery Time</span><span className="font-black text-slate-800">{new Date(delivery.delivery_time).toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500 font-bold">Mode</span><span className="font-black text-slate-800">{delivery.mode_of_delivery}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500 font-bold">Blood Loss (EBL)</span><span className="font-black text-slate-800">{delivery.estimated_blood_loss_ml} ml</span></div>
                            <div className="flex justify-between"><span className="text-slate-500 font-bold">Complications</span><span className="font-black text-slate-800">{delivery.complications || 'None'}</span></div>
                          </div>
                        </div>

                        <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200">
                          <h4 className="text-sm font-black text-emerald-800 mb-4 border-b border-emerald-200/50 pb-2">Infant Outcome</h4>
                          <div className="space-y-4 text-sm text-emerald-900">
                             <div className="flex justify-between font-bold"><span>Gender</span><span className="font-black text-emerald-700">{delivery.infant_gender}</span></div>
                             <div className="flex justify-between font-bold"><span>Birth Weight</span><span className="font-black text-emerald-700">{delivery.infant_weight_kg} kg</span></div>
                             <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-200/50">
                               <div className="text-center"><p className="text-[10px] uppercase font-black text-emerald-600 mb-1">APGAR 1 min</p><span className="text-xl font-black">{delivery.apgar_1_min}/10</span></div>
                               <div className="text-center"><p className="text-[10px] uppercase font-black text-emerald-600 mb-1">APGAR 5 min</p><span className="text-xl font-black">{delivery.apgar_5_min}/10</span></div>
                             </div>
                          </div>
                        </div>

                        {/* CRVS Sync */}
                        <div className="md:col-span-2 mt-4 flex items-center justify-between p-4 rounded-2xl bg-slate-800 text-white shadow-xl">
                          <div>
                            <p className="font-bold text-sm flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                               Kenya IPRS / CRVS Integration
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {delivery.crvs_notified 
                                ? `Birth notified successfully. Tracking ID: ${delivery.crvs_notification_id}` 
                                : 'Draft record. Push to civil registry to issue birth notification.'}
                            </p>
                          </div>
                          {!delivery.crvs_notified && (
                            <button onClick={handleNotifyCRVS} className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                              Notify CRVS Now
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
