/**
 * SHA / Client Registry / M-Pesa Frontend Service
 * --------------------------------------------------
 * All calls go through the Express backend — API keys are never in the browser.
 */

import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

async function post(path, body) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

async function get(path) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const shaService = {
  /**
   * Verify SHA eligibility for a patient.
   * @param {Object} params
   * @param {'National ID'|'Birth Certificate'|'Passport'} params.identification_type
   * @param {string} params.identification_number
   * @param {'Walk-In'|'Emergency'|'Follow-Up'|'Scheduled'} params.visit_type
   * @returns {{ decision, payment_mode, eligible, member_details, reason, possible_solution, facility_level }}
   */
  async verifyEligibility({ identification_type, identification_number, visit_type = 'Walk-In' }) {
    return post('/sha/verify', { identification_type, identification_number, visit_type });
  },

  /**
   * Look up a patient in the national Client Registry by ID number.
   * @returns {{ found, cr_number, first_name, last_name, ... }} or { found: false }
   */
  async lookupRegistry({ identification_type = 'National ID', identification_number }) {
    return post('/sha/registry/lookup', { identification_type, identification_number });
  },

  /**
   * Register a brand-new patient in the Client Registry (gets a cr_number).
   * @returns {{ cr_number, status, message }}
   */
  async registerInRegistry(patientData) {
    return post('/sha/registry/register', patientData);
  },

  /**
   * Get facility-level settings from the backend (MFL level, name, mock mode status).
   */
  async getFacilitySettings() {
    return get('/sha/settings');
  },

  /**
   * Initiate M-Pesa STK Push to patient's phone for SHA arrears payment.
   * @param {{ phone, amount, sha_number }} params
   * @returns {{ success, checkout_request_id, message }}
   */
  async initiateSTKPush({ phone, amount, sha_number }) {
    return post('/mpesa/stk', { phone, amount, sha_number });
  },

  /**
   * Poll for the status of an STK Push transaction.
   * @param {string} checkoutId
   * @returns {{ status: 'pending'|'success'|'failed', mpesa_receipt?, reason? }}
   */
  async pollSTKStatus(checkoutId) {
    return get(`/mpesa/status/${checkoutId}`);
  },
};
