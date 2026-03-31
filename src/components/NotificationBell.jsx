import React, { useState, useEffect, useCallback } from 'react';
import { NotificationsNone, Assignment, Science, LocalPharmacy, Inventory, ReceiptLong, Close, DoneAll } from '@mui/icons-material';
import { notificationService } from '../services/notifications';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';


const TYPE_ICONS = {
  info:      { icon: Assignment,    color: 'text-blue-500 bg-blue-50' },
  warning:   { icon: Inventory,     color: 'text-amber-500 bg-amber-50' },
  emergency: { icon: LocalPharmacy, color: 'text-rose-500 bg-rose-50' },
  success:   { icon: DoneAll,       color: 'text-emerald-500 bg-emerald-50' },
  lab:       { icon: Science,       color: 'text-indigo-500 bg-indigo-50' },
  billing:   { icon: ReceiptLong,   color: 'text-purple-500 bg-purple-50' }
};

export default function NotificationBell() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationService.list(user.id, role);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, [user, role]);

  useEffect(() => {
    loadNotifications();
    const subscription = notificationService.subscribe(user?.id, role, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev].slice(0, 50));
      setUnreadCount(c => c + 1);
      // Optional: Play a subtle notification sound?
    });
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, [user, role, loadNotifications]);

  const handleMarkAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(user.id, role);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleAction = (notif) => {
    handleMarkAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 rounded-xl transition-all ${showDropdown ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
      >
        <NotificationsNone sx={{ fontSize: 22 }} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-primary-600 hover:text-primary-700 transition-colors">
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <NotificationsNone sx={{ fontSize: 32 }} className="opacity-20 mb-2" />
                  <p className="text-sm font-medium">Your inbox is clear!</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Cfg = TYPE_ICONS[n.type] || TYPE_ICONS.info;
                  return (
                    <div 
                      key={n.id} 
                      onClick={() => handleAction(n)}
                      className={`p-4 flex gap-3 cursor-pointer transition-all hover:bg-slate-50 ${!n.is_read ? 'bg-primary-50/20' : 'opacity-70'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${Cfg.color}`}>
                        <Cfg.icon sx={{ fontSize: 18 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className={`text-sm font-black truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                          <span className="text-[9px] font-bold text-slate-400 shrink-0 ml-2">
                             {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1.5" />}
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
               <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">View All Notifications</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
