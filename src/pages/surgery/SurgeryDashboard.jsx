import React, { useState, useEffect } from 'react';
import { ContentCut, Event, CheckCircle, Assignment, History, Add, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { surgeryService } from '../../services/surgery';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function SurgeryDashboard() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('BOARD'); // 'BOARD', 'CHECKLIST', 'INTRAOP'
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const [checklist, setChecklist] = useState(null);
  const [intraop, setIntraop] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await surgeryService.getBookings();
      setBookings(res || []);
    } catch (err) {
      toast.error('Failed to load theatre board');
    } finally {
      setLoading(false);
    }
  };

  const openTheatreChart = async (booking) => {
    setSelectedBooking(booking);
    setActiveTab('CHECKLIST');
    setLoading(true);
    try {
      const [chk, intra] = await Promise.all([
        surgeryService.getChecklist(booking.id),
        surgeryService.getIntraopRecord(booking.id)
      ]);
      setChecklist(chk || { sign_in_completed: false, time_out_completed: false, sign_out_completed: false, booking_id: booking.id });
      setIntraop(intra || null);
    } catch (err) {
      toast.error('Failed to load surgical records');
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklist = async (field) => {
    if (!checklist) return;
    const updated = { ...checklist, [field]: !checklist[field] };
    setChecklist(updated);
    try {
       await surgeryService.saveChecklist(updated);
       toast.success('Checklist updated');
    } catch(e) {
       toast.error('Failed to save checklist');
       setChecklist(checklist); // revert on failure
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <ContentCut fontSize="medium" className="text-emerald-600" />
            </div>
            Surgical Ward & Theatre
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Operating Slate, WHO Checklists & Intraop Records</p>
        </div>
      </div>

      {!selectedBooking ? (
        <div className="card bg-white p-6 md:p-8">
           <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
             <h2 className="text-xl font-black text-slate-800">Theatre Booking Board</h2>
             <button className="btn-primary py-2 px-4 shadow-emerald-200 bg-emerald-600 hover:bg-emerald-700">
               <Add fontSize="small" className="mr-1"/> Schedule Procedure
             </button>
           </div>

           {loading ? (
             <div className="flex justify-center p-12 text-slate-400 font-bold animate-pulse">Loading board...</div>
           ) : bookings.length === 0 ? (
             <div className="text-center py-16 text-slate-400">
                <Event sx={{fontSize: 56}} className="mb-4 opacity-20"/>
                <p className="font-bold">No upcoming surgical bookings</p>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map(b => (
                   <button key={b.id} onClick={() => openTheatreChart(b)} className="text-left bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-xl hover:border-emerald-200 transition-all group relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${b.priority === 'Emergency' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${b.priority === 'Emergency' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{b.priority}</span>
                        <span className="text-xs font-black text-slate-400">{b.theatre_number || 'TBD'}</span>
                      </div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">{b.procedure_name}</h3>
                      <p className="text-xs font-bold text-slate-500 mb-4">{b.patient?.first_name} {b.patient?.last_name} ({b.patient?.age}y)</p>
                      
                      <div className="space-y-1 mt-4 pt-4 border-t border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                         <div className="flex justify-between"><span>Surgeon</span> <span className="text-slate-700">{b.surgeon?.last_name || 'Unassigned'}</span></div>
                         <div className="flex justify-between"><span>Anaesthetist</span> <span className="text-slate-700">{b.anaesthetist?.last_name || 'Unassigned'}</span></div>
                         <div className="flex justify-between mt-2"><span>Date</span> <span className="text-emerald-700">{new Date(b.schedule_date).toLocaleDateString()}</span></div>
                      </div>
                   </button>
                ))}
             </div>
           )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Theatre Banner */}
          <div className="card p-6 bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-lg shadow-emerald-500/20">
             <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                 <ContentCut fontSize="large" className="text-white" />
               </div>
               <div>
                 <p className="text-xs font-black text-emerald-300 uppercase tracking-widest mb-1">{selectedBooking.theatre_number || 'Active Theatre'}</p>
                 <h2 className="text-2xl font-black">{selectedBooking.procedure_name}</h2>
                 <div className="flex items-center gap-3 mt-1.5 text-emerald-100 text-sm font-semibold">
                   <span>{selectedBooking.patient?.first_name} {selectedBooking.patient?.last_name}</span>
                   <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md text-xs">{selectedBooking.patient?.patient_no}</span>
                 </div>
               </div>
             </div>
             <div className="flex gap-3">
               <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20">
                 Back to Board
               </button>
             </div>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
             {[
               { id: 'CHECKLIST', label: 'WHO Checklist', icon: <CheckCircle fontSize="small" className="mr-1.5"/> },
               { id: 'INTRAOP', label: 'Intraop Record', icon: <Assignment fontSize="small" className="mr-1.5"/> },
               { id: 'POSTOP', label: 'Post-Op Recovery', icon: <History fontSize="small" className="mr-1.5"/> }
             ].map(t => (
               <button 
                 key={t.id}
                 onClick={() => setActiveTab(t.id)}
                 className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                   activeTab === t.id 
                     ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50' 
                     : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                 }`}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>

          <div className="card bg-white p-6 md:p-8 min-h-[400px]">
             {loading ? (
               <div className="flex items-center justify-center h-40 text-slate-400 font-bold animate-pulse">Loading theatre charts...</div>
             ) : (
               <>
                 {/* WHO CHECKLIST TAB */}
                 {activeTab === 'CHECKLIST' && checklist && (
                    <div className="space-y-8 max-w-3xl mx-auto">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-black text-slate-800">WHO Surgical Safety Checklist</h3>
                        <p className="text-sm font-bold text-slate-500 mt-1">Mandatory digital sign-off</p>
                      </div>

                      <div className="grid gap-6">
                        {/* Sign In */}
                        <div className={`p-6 rounded-3xl border-2 transition-all ${checklist.sign_in_completed ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                           <div className="flex items-center justify-between mb-4">
                             <h4 className="font-black text-slate-800 text-lg">Sign In</h4>
                             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Before induction of anaesthesia</p>
                           </div>
                           <button onClick={() => toggleChecklist('sign_in_completed')} className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-black transition-colors ${checklist.sign_in_completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'}`}>
                             {checklist.sign_in_completed ? <CheckBox /> : <CheckBoxOutlineBlank />}
                             {checklist.sign_in_completed ? 'Sign In Completed' : 'Mark Sign In Completed'}
                           </button>
                        </div>

                        {/* Time Out */}
                        <div className={`p-6 rounded-3xl border-2 transition-all ${checklist.time_out_completed ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                           <div className="flex items-center justify-between mb-4">
                             <h4 className="font-black text-slate-800 text-lg">Time Out</h4>
                             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Before skin incision</p>
                           </div>
                           <button onClick={() => toggleChecklist('time_out_completed')} className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-black transition-colors ${checklist.time_out_completed ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'}`}>
                             {checklist.time_out_completed ? <CheckBox /> : <CheckBoxOutlineBlank />}
                             {checklist.time_out_completed ? 'Time Out Completed' : 'Mark Time Out Completed'}
                           </button>
                        </div>

                        {/* Sign Out */}
                        <div className={`p-6 rounded-3xl border-2 transition-all ${checklist.sign_out_completed ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                           <div className="flex items-center justify-between mb-4">
                             <h4 className="font-black text-slate-800 text-lg">Sign Out</h4>
                             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Before patient leaves theatre</p>
                           </div>
                           <button onClick={() => toggleChecklist('sign_out_completed')} className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-black transition-colors ${checklist.sign_out_completed ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'}`}>
                             {checklist.sign_out_completed ? <CheckBox /> : <CheckBoxOutlineBlank />}
                             {checklist.sign_out_completed ? 'Sign Out Completed' : 'Mark Sign Out Completed'}
                           </button>
                        </div>
                      </div>
                    </div>
                 )}

                 {/* INTRAOP TAB */}
                 {activeTab === 'INTRAOP' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800">Intraoperative Record</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Surgical notes & consumables</p>
                        </div>
                      </div>
                      
                      {!intraop ? (
                        <div className="text-center py-12">
                           <Assignment sx={{fontSize: 56}} className="text-slate-200 mb-4"/>
                           <p className="font-black text-slate-700">No Intraop Record Found</p>
                           <button className="mt-4 btn-primary bg-emerald-600 shadow-emerald-200 pt-2 pb-2">Start Intraop Record</button>
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                           <p className="text-slate-500">Intraop data structure here...</p>
                        </div>
                      )}
                    </div>
                 )}
                 
                 {/* POSTOP TAB */}
                 {activeTab === 'POSTOP' && (
                    <div className="space-y-6">
                      <div className="text-center py-12">
                         <History sx={{fontSize: 56}} className="text-slate-200 mb-4"/>
                         <p className="font-black text-slate-700">Recovery Room (PACU) Documentation</p>
                         <p className="text-sm font-bold text-slate-400 mt-2">Aldrete Score & Post-Op Vitals</p>
                      </div>
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
