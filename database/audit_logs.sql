-- ============================================================
-- Biopassion HMS — Phase 1: Audit Logs Migration
-- Run this in your Supabase project SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type   VARCHAR(50) NOT NULL, -- e.g., 'UPDATE', 'DELETE', 'REVERSAL'
  table_name    VARCHAR(50) NOT NULL,
  record_id     UUID NOT NULL,        -- The ID of the modified row
  old_data      JSONB,                -- State before modification
  new_data      JSONB,                -- State after modification
  performed_by  UUID REFERENCES auth.users(id),
  ip_address    VARCHAR(50),
  reason        TEXT,                 -- e.g., "Reversed billing error"
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Protect the audit_logs table (Append-Only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow system to insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow admin to read audit logs"
  ON audit_logs FOR SELECT
  USING (true); -- Ideally restricted to admin roles only

-- Helper function to automatically track changes via triggers if needed,
-- but practically, the Node/Express backend or React edge functions will insert these manually.
