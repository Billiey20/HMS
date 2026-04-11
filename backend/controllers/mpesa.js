/**
 * M-Pesa Daraja STK Push Controller
 * ------------------------------------
 * Initiates STK Push to patient's phone for SHA arrears clearance.
 * Callback from Safaricom updates transaction status in memory (upgrade to DB for production).
 *
 * Endpoints:
 *   POST /api/v1/mpesa/stk      → initiate STK push
 *   POST /api/v1/mpesa/callback → Safaricom callback (no auth required)
 *   GET  /api/v1/mpesa/status/:checkoutId → poll for result
 */

import axios from 'axios';

// ── In-memory transaction store (upgrade to Redis/DB for multi-server) ─────────
const transactions = new Map();

// ── Helpers ────────────────────────────────────────────────────────────────────

function mpesaTimestamp() {
  return new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
}

function mpesaPassword(shortcode, passkey, timestamp) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

function formatPhone(phone) {
  // Normalise to 254XXXXXXXXX format
  const cleaned = String(phone).replace(/\s+/g, '').replace(/^\+/, '');
  if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith('254')) return cleaned;
  return `254${cleaned}`;
}

const sandboxBase = 'https://sandbox.safaricom.co.ke';
const productionBase = 'https://api.safaricom.co.ke';

function mpesaBase() {
  return process.env.MPESA_ENV === 'production' ? productionBase : sandboxBase;
}

// ── Get Daraja OAuth Token ──────────────────────────────────────────────────────
let _mpesaToken = null;
let _mpesaTokenExpiry = 0;

async function getMpesaToken() {
  if (_mpesaToken && Date.now() < _mpesaTokenExpiry) return _mpesaToken;

  const consumerKey    = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in .env');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const { data } = await axios.get(`${mpesaBase()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  _mpesaToken = data.access_token;
  _mpesaTokenExpiry = Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000;
  return _mpesaToken;
}

// ── CONTROLLERS ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/mpesa/stk
 * Body: { phone, amount, sha_number, reference?, description? }
 * Returns: { success, checkout_request_id, merchant_request_id, message }
 */
export async function initiateSTKPush(req, res, next) {
  try {
    const {
      phone,
      amount,
      sha_number,
      reference = `SHA-ARREARS-${sha_number || 'UNKNOWN'}`,
      description = 'SHA Arrears Clearance - Biopassion HMS',
    } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'phone and amount are required' });
    }

    const shortcode  = process.env.MPESA_SHORTCODE;
    const passkey    = process.env.MPESA_PASSKEY;
    const callbackURL = process.env.MPESA_CALLBACK_URL;

    if (!shortcode || !passkey) {
      return res.status(500).json({ error: 'M-Pesa shortcode or passkey not configured' });
    }

    const timestamp = mpesaTimestamp();
    const password  = mpesaPassword(shortcode, passkey, timestamp);
    const formattedPhone = formatPhone(phone);

    const token = await getMpesaToken();

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackURL,
      AccountReference: reference.slice(0, 12),
      TransactionDesc: description.slice(0, 13),
    };

    const { data } = await axios.post(
      `${mpesaBase()}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    // Store pending transaction in memory
    const checkoutId = data.CheckoutRequestID;
    transactions.set(checkoutId, {
      status: 'pending',
      sha_number,
      phone: formattedPhone,
      amount,
      initiated_at: new Date().toISOString(),
    });

    // Auto-cleanup after 10 minutes
    setTimeout(() => transactions.delete(checkoutId), 10 * 60 * 1000);

    return res.json({
      success: true,
      checkout_request_id: checkoutId,
      merchant_request_id: data.MerchantRequestID,
      message: 'STK Push sent. Ask the patient to check their phone.',
    });
  } catch (err) {
    // Handle Daraja-specific errors gracefully
    if (err.response?.data) {
      return res.status(err.response.status || 500).json({
        error: err.response.data.errorMessage || JSON.stringify(err.response.data),
      });
    }
    next(err);
  }
}

/**
 * POST /api/v1/mpesa/callback  (no authentication — called by Safaricom)
 * Receives STK Push result from Safaricom and updates in-memory transaction store.
 */
export async function handleCallback(req, res) {
  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) {
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Bad request format' });
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;
    const txn = transactions.get(CheckoutRequestID);

    if (!txn) {
      console.warn(`[M-Pesa] Unknown CheckoutRequestID: ${CheckoutRequestID}`);
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode === 0) {
      // Success — extract receipt details
      const items = CallbackMetadata?.Item || [];
      const getItem = (name) => items.find(i => i.Name === name)?.Value;

      transactions.set(CheckoutRequestID, {
        ...txn,
        status: 'success',
        mpesa_receipt: getItem('MpesaReceiptNumber'),
        transaction_date: getItem('TransactionDate'),
        completed_at: new Date().toISOString(),
      });

      console.log(`[M-Pesa] Payment success for ${CheckoutRequestID} — Receipt: ${getItem('MpesaReceiptNumber')}`);
    } else {
      transactions.set(CheckoutRequestID, {
        ...txn,
        status: 'failed',
        reason: ResultDesc,
        completed_at: new Date().toISOString(),
      });
      console.log(`[M-Pesa] Payment failed for ${CheckoutRequestID}: ${ResultDesc}`);
    }

    // Always acknowledge to Safaricom
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('[M-Pesa Callback Error]', err);
    // Still return 200 or Safaricom will retry
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

/**
 * GET /api/v1/mpesa/status/:checkoutId
 * Polls for the result of an STK Push transaction.
 * Frontend polls this every 3s after initiating STK Push.
 */
export async function getTransactionStatus(req, res) {
  const txn = transactions.get(req.params.checkoutId);
  if (!txn) {
    return res.status(404).json({ status: 'not_found' });
  }
  return res.json(txn);
}
