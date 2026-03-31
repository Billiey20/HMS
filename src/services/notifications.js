import { supabase } from '../lib/supabase';

export const notificationService = {
  /**
   * List notifications for the current user and their role
   */
  async list(userId, role) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},role.eq.${role}`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new notification
   */
  async create({ title, message, type = 'info', userId, role, link, refId, refType }) {
    const payload = {
      title,
      message,
      type,
      user_id: userId,
      role,
      link,
      reference_id: refId,
      reference_type: refType
    };
    const { data, error } = await supabase.from('notifications').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  /**
   * Resolve/Dismiss notifications by reference (e.g. Visit seen, Stock added)
   */
  async resolve(refId, refType) {
    if (!refId || !refType) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('reference_id', refId)
      .eq('reference_type', refType);
    if (error) throw error;
  },

  /**
   * Mark individual notification as read
   */
  async markAsRead(id) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  /**
   * Mark all as read for user
   */
  async markAllAsRead(userId, role) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .or(`user_id.eq.${userId},role.eq.${role}`)
      .eq('is_read', false);
    if (error) throw error;
  },

  /**
   * Real-time subscription
   */
  subscribe(userId, role, onNotification) {
    return supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        payload => onNotification(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `role=eq.${role}`
        },
        payload => onNotification(payload.new)
      )
      .subscribe();
  }
};
