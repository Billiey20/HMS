import React, { useState, useEffect } from 'react';
import { hrSchedulingService } from '../../services/hrScheduling';
import { structureService } from '../../services/structure';
import { EventAvailable, AssignmentInd, FreeBreakfast, Add, Edit, Delete, CalendarMonth, Close } from '@mui/icons-material';
import { notify } from '../../utils/toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ManageScheduleModal({ staff, mode, schedule, locum, onClose, onRefresh }) {
  const isLocum = mode === 'locum';
  const [form, setForm] = useState({
    day_of_week: schedule?.day_of_week ?? 1,
    shift_date: locum?.shift_date || '',
    start_time: schedule?.start_time || locum?.start_time || '08:00',
    end_time: schedule?.end_time || locum?.end_time || '17:00',
    duty_station: schedule?.duty_station || locum?.duty_station || '',
  });

  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);

  useEffect(() => {
    async function loadStations() {
      try {
        const [ds, ws] = await Promise.all([
          structureService.getDesks().catch(() => []),
          structureService.getWards().catch(() => [])
        ]);
        // Combine them into a selectable list
        const combined = [
          ...ds.map(d => ({ value: `${d.departments?.name || 'Dept'} - ${d.name}`, label: `Desk: ${d.name} (${d.departments?.name})` })),
          ...ws.map(w => ({ value: `${w.departments?.name || 'Dept'} - ${w.name}`, label: `Ward: ${w.name} (${w.departments?.name})` }))
        ];
        setStations(combined);
        // Pre-select first if none provided
        if (!form.duty_station && combined.length > 0) {
          setForm(f => ({ ...f, duty_station: combined[0].value }));
        }
      } catch (err) {
        console.warn('Failed finding stations', err);
      } finally {
        setLoadingStations(false);
      }
    }
    loadStations();
  }, []);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isLocum) {
        await hrSchedulingService.addShift({
          user_id: staff.id,
          shift_date: form.shift_date,
          start_time: form.start_time,
          end_time: form.end_time,
          duty_station: form.duty_station,
          is_locum: true
        });
      } else {
        await hrSchedulingService.saveWeeklySchedule({
          user_id: staff.id,
          day_of_week: form.day_of_week,
          start_time: form.start_time,
          end_time: form.end_time,
          duty_station: form.duty_station
        });
      }
      notify.success("Schedule updated!");
      onRefresh();
      onClose();
    } catch(e) {
      notify.error(e.message || "Failed to update schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
        <h3 className="font-black text-slate-800 text-lg">
          {isLocum ? 'Assign Locum / Quick Shift' : 'Add Weekly Schedule'} for {staff.first_name}
        </h3>
        
        {isLocum ? (
          <div>
            <label className="label">Specific Date</label>
            <input type="date" className="input" value={form.shift_date} onChange={e => setForm({...form, shift_date: e.target.value})} />
          </div>
        ) : (
          <div>
            <label className="label">Day of Week</label>
            <select className="input" value={form.day_of_week} onChange={e => setForm({...form, day_of_week: parseInt(e.target.value)})}>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Time</label>
            <input type="time" className="input" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
          </div>
          <div>
            <label className="label">End Time</label>
            <input type="time" className="input" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
          </div>
        </div>

        <div>
           <label className="label">Duty Station / Ward</label>
           <select 
              className="input" 
              value={form.duty_station} 
              onChange={e => setForm({...form, duty_station: e.target.value})}
              disabled={loadingStations}
           >
              {loadingStations ? (
                <option value="">Loading stations...</option>
              ) : stations.length === 0 ? (
                <option value="">-- No stations configured in Settings --</option>
              ) : (
                <>
                  <option value="">-- Select a Station --</option>
                  {stations.map((s, i) => (
                    <option key={i} value={s.value}>{s.label}</option>
                  ))}
                </>
              )}
           </select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">Save Schedule</button>
        </div>
      </div>
    </div>
  );
}

export default function Timetables({ staffMembers }) {
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeStaff, setActiveStaff] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'weekly' or 'locum'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scheds, sl] = await Promise.all([
        hrSchedulingService.getWeeklySchedules(),
        hrSchedulingService.getShifts()
      ]);
      setSchedules(scheds);
      setShifts(sl);
    } catch(e) {
      console.warn('Could not load schedules', e);
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id) => {
    if(!confirm('Remove this schedule?')) return;
    try {
      await hrSchedulingService.deleteWeeklySchedule(id);
      loadData();
    } catch(e) { notify.error(e.message) }
  };

  return (
    <div className="space-y-6">
      {loading && <div className="p-8 text-center text-slate-400">Loading master timetable...</div>}

      {!loading && staffMembers.map(staff => {
        const staffWeek = schedules.filter(s => s.user_id === staff.id);
        const staffLocums = shifts.filter(s => s.user_id === staff.id);
        
        return (
          <div key={staff.id} className="card p-5 border border-slate-200">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center border border-primary-200">
                     <span className="font-black text-primary-700">{staff.first_name[0]}{staff.last_name[0]}</span>
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-800">{staff.first_name} {staff.last_name}</h3>
                     <p className="text-xs font-mono text-slate-500">{staff.employee_no || 'NO-ID'}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => { setActiveStaff(staff); setModalMode('weekly'); }} className="btn-secondary py-1.5 text-[11px] uppercase font-bold tracking-widest"><CalendarMonth sx={{fontSize: 14}} className="mr-1"/> Add Weekly</button>
                   <button onClick={() => { setActiveStaff(staff); setModalMode('locum'); }} className="btn-secondary text-amber-600 bg-amber-50 py-1.5 text-[11px] uppercase font-bold tracking-widest"><AssignmentInd sx={{fontSize: 14}} className="mr-1"/> Add Locum</button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
               {DAYS.map((day, i) => {
                 const dayScheds = staffWeek.filter(s => s.day_of_week === i);
                 if (dayScheds.length === 0) return (
                   <div key={day} className="p-2 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl flex flex-col items-center justify-center text-center opacity-50 min-h-[60px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{day}</span>
                   </div>
                 );
                 
                 return (
                   <div key={day} className="p-3 border border-slate-200 bg-white shadow-sm rounded-xl flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest pb-1 border-b border-slate-100">{day}</span>
                      {dayScheds.map(ds => (
                         <div key={ds.id} className="relative group text-xs bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                            <button onClick={()=>deleteSchedule(ds.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 hidden group-hover:block"><Close sx={{fontSize: 12}}/></button>
                            <p className="font-bold text-indigo-700">{ds.start_time.slice(0,5)} - {ds.end_time.slice(0,5)}</p>
                            <p className="text-[10px] text-indigo-500 truncate">{ds.duty_station}</p>
                         </div>
                      ))}
                   </div>
                 )
               })}
             </div>

             {staffLocums.length > 0 && (
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                   <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Locum / Special Shifts</p>
                   <div className="flex flex-wrap gap-2">
                     {staffLocums.map(l => (
                        <div key={l.id} className="text-xs bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-3">
                           <div>
                             <p className="font-bold text-amber-800">{new Date(l.shift_date).toLocaleDateString()} <span className="font-mono text-amber-600 ml-1">{l.start_time.slice(0,5)}-{l.end_time.slice(0,5)}</span></p>
                             <p className="text-[10px] text-amber-600/70">{l.duty_station}</p>
                           </div>
                           <button onClick={async () => { if(confirm('Delete?')) { await hrSchedulingService.deleteShift(l.id); loadData();} }} className="text-red-400 hover:text-red-600"><Delete sx={{fontSize: 14}}/></button>
                        </div>
                     ))}
                   </div>
                </div>
             )}
          </div>
        )
      })}

      {(activeStaff && modalMode) && (
        <ManageScheduleModal 
          staff={activeStaff} 
          mode={modalMode} 
          onClose={() => { setActiveStaff(null); setModalMode(null); }} 
          onRefresh={loadData} 
        />
      )}
    </div>
  );
}
