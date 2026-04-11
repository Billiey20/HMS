import { supabase } from '../lib/supabase';

export const auditService = {
  /**
   * Log an audit trail entry.
   * @param {string} actionType - 'UPDATE', 'DELETE', 'REVERSAL'
   * @param {string} tableName  - The affected table (e.g., 'payments')
   * @param {string} recordId   - UUID of the affected record
   * @param {string} userId     - UUID of the staff performing the action
   * @param {object} oldData    - The state of the record before the change
   * @param {object} newData    - The state of the record after the change
   * @param {string} reason     - (Optional) Reason for the change
   */
  async log(actionType, tableName, recordId, userId, oldData = null, newData = null, reason = '') {
    try {
      const payload = {
        action_type: actionType,
        table_name: tableName,
        record_id: recordId,
        performed_by: userId,
        old_data: oldData,
        new_data: newData,
        reason: reason
      };

      const { error } = await supabase.from('audit_logs').insert([payload]);
      if (error) {
        console.error('Audit Log Sync Failure (Critical):', error);
      }
    } catch (e) {
      console.error('Audit Log Runtime Exception:', e);
    }
  },

  async listLogs(limit = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, performed_by(first_name, last_name, role)')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
};
