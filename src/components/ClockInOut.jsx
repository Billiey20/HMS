import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hrSchedulingService } from '../services/hrScheduling';
import { AccessTime, PlayArrow, Stop, FreeBreakfast } from '@mui/icons-material';
import { notify } from '../utils/toast';

export default function ClockInOut() {
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadStatus();
    // Auto-refresh every minute
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const loadStatus = async () => {
    try {
      const todayRecord = await hrSchedulingService.getTodayAttendance(user.id);
      setRecord(todayRecord);
    } catch (e) {
      console.warn('Clock fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      await hrSchedulingService.clockAction(user.id, action);
      const actionName = {
        'in': 'Clocked In', 
        'out': 'Clocked Out', 
        'break_start': 'Break Started', 
        'break_end': 'Break Ended'
      }[action];
      notify.success(`${actionName} successfully!`);
      loadStatus();
    } catch (e) {
      notify.error(e.message || 'Error executing action');
    }
  };

  if (loading) return null;

  // Determine current state
  const isClockedIn = !!record?.clock_in;
  const isClockedOut = !!record?.clock_out;
  const isOnBreak = !!record?.break_start && !record?.break_end;

  // Format times
  const fTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="relative group">
      <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border
        ${!isClockedIn ? 'bg-amber-100 text-amber-600 border-amber-200' :
          isClockedOut ? 'bg-slate-100 text-slate-400 border-slate-200' :
          isOnBreak ? 'bg-violet-100 text-violet-600 border-violet-200 animate-pulse' :
          'bg-emerald-100 text-emerald-600 border-emerald-200'}`}
      >
        <AccessTime sx={{ fontSize: 20 }} />
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-top-right !z-[9999] p-4 text-sm">
        <h4 className="font-black text-slate-800 mb-2 truncate">Today's Attendance</h4>
        
        <div className="space-y-2 mb-4 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-600">
            <span>Clock In</span>
            <span className="font-bold text-slate-900">{fTime(record?.clock_in) || '--:--'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Break</span>
            <span className="font-bold text-slate-900">
               {fTime(record?.break_start) ? `${fTime(record?.break_start)} - ${fTime(record?.break_end) || 'Now'}` : '--:--'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Clock Out</span>
            <span className="font-bold text-slate-900">{fTime(record?.clock_out) || '--:--'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!isClockedIn && !isClockedOut && (
            <button onClick={() => handleAction('in')} className="col-span-2 btn-primary py-2 text-xs">
              <PlayArrow sx={{ fontSize: 16 }} className="mr-1" /> Clock In
            </button>
          )}

          {isClockedIn && !isClockedOut && (
            <>
              {!isOnBreak && !record?.break_end && (
                <button onClick={() => handleAction('break_start')} className="btn-secondary text-violet-600 bg-violet-50 hover:bg-violet-100 border-0 py-2 text-xs">
                  <FreeBreakfast sx={{ fontSize: 14 }} className="mr-1" /> Break
                </button>
              )}
              {isOnBreak && (
                <button onClick={() => handleAction('break_end')} className="btn-secondary text-amber-600 bg-amber-50 hover:bg-amber-100 border-0 py-2 text-xs">
                   Resume
                </button>
              )}
              <button 
                 onClick={() => handleAction('out')} 
                 className={`btn-secondary text-rose-600 bg-rose-50 hover:bg-rose-100 border-0 py-2 text-xs ${isOnBreak || record?.break_end ? 'col-span-1' : 'col-span-2'}`}
              >
                <Stop sx={{ fontSize: 16 }} className="mr-1" /> Clock Out
              </button>
            </>
          )}

          {isClockedOut && (
            <div className="col-span-2 text-center text-xs font-bold text-slate-400 py-2 bg-slate-50 rounded-lg">
              Shift Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
