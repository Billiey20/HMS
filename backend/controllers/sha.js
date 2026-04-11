/**
 * SHA / Client Registry Controller
 * -----------------------------------
 * All calls to the DHA/SHA/CR APIs are proxied through this backend controller
 * so that API credentials are never exposed to the browser.
 *
 * MOCK MODE (MOCK_SHA_API=true in .env):
 *   Returns realistic responses mirroring real DHA API JSON structures.
 *   When real credentials arrive, set MOCK_SHA_API=false and fill in env vars.
 *   NO CODE CHANGES required — only env var changes.
 *
 * Mock Scenarios (by last digit of ID number):
 *   - Last digit 0      → Inactive SHA member (arrears)
 *   - Last digit 9      → Not an SHA member at all
 *   - All same digits   → CR not found (manual entry required)
 *   - Everything else   → Active SHA member
 */

import axios from 'axios';

// ── Helpers ────────────────────────────────────────────────────────────────────

function titleCase(str = '') {
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function facilityLevel() {
  return parseInt(process.env.FACILITY_MFL_LEVEL || '3', 10);
}

/**
 * Core decision engine: maps SHA eligibility + facility level + visit type
 * to a standardised decision string the frontend can act on.
 */
function resolveDecision(eligible, memberStatus, visitType = 'Walk-In') {
  const level = facilityLevel();

  if (eligible === 1) {
    return { decision: 'sha_active', payment_mode: 'SHA' };
  }

  // eligible === 0 from here
  if (visitType === 'Emergency') {
    // ECCIF covers emergency stabilisation for ALL Kenyans regardless of status
    return { decision: 'sha_eccif', payment_mode: 'SHA' };
  }

  if (level <= 3) {
    // Level 2 / 3: PHC fund covers all registered Kenyans (2026 PHC framework)
    return { decision: 'sha_phc', payment_mode: 'PHC' };
  }

  // Level 4+: strict SHIF compliance required
  return { decision: 'sha_inactive_prompt', payment_mode: 'Pending' };
}

// ── SHA Token ──────────────────────────────────────────────────────────────────
let _shaToken = null;
let _shaTokenExpiry = 0;

async function getSHAToken() {
  if (_shaToken && Date.now() < _shaTokenExpiry) return _shaToken;
  const res = await axios.post(`${process.env.SHA_API_BASE_URL}/oauth/token`, {
    grant_type: 'client_credentials',
    client_id: process.env.SHA_CLIENT_ID,
    client_secret: process.env.SHA_CLIENT_SECRET,
  });
  _shaToken = res.data.access_token;
  _shaTokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return _shaToken;
}

// ── MOCK DATA ──────────────────────────────────────────────────────────────────

function mockSHAResponse(idNumber) {
  const lastDigit = idNumber.slice(-1);
  const allSame = idNumber.split('').every(c => c === idNumber[0]);

  if (allSame) {
    // Not in SHA system at all
    return { eligible: 9, message: { eligible: 9, reason: 'Member not found in SHA system.', possible_solution: 'Ensure the ID number is correct or register for SHA.', member_details: null } };
  }

  if (lastDigit === '9') {
    return { eligible: 9, message: { eligible: 9, reason: 'Identification number not registered with SHA.', possible_solution: 'Visit the nearest Huduma Centre to register for SHA.', member_details: null } };
  }

  const baseDetails = {
    sha_member_no: `SHA-${new Date().getFullYear()}-${idNumber.slice(0, 5).padStart(8, '0')}`,
    cr_number: `CR${String(parseInt(idNumber, 10) % 1000000000 || 1).padStart(9, '0')}`,
    first_name: 'JOHN',
    middle_name: 'KAMAU',
    last_name: 'MWANGI',
    date_of_birth: '1990-05-15',
    gender: 'Male',
    id_number: idNumber,
    phone: '0712345678',
    scheme: 'SHIF',
  };

  if (lastDigit === '0') {
    return {
      eligible: 0,
      message: {
        id: baseDetails.sha_member_no,
        eligible: 0,
        reason: 'Member has outstanding SHIF contributions.',
        possible_solution: 'Member to clear outstanding arrears to activate coverage.',
        member_details: { ...baseDetails, member_status: 'Inactive', arrears_amount: 2750.00, last_contribution_date: '2025-01-01' },
      },
    };
  }

  // Default: Active
  return {
    eligible: 1,
    message: {
      id: baseDetails.sha_member_no,
      eligible: 1,
      reason: 'Active coverage status',
      possible_solution: null,
      member_details: { ...baseDetails, member_status: 'Active', last_contribution_date: '2026-03-01' },
    },
  };
}

function mockCRResponse(idNumber) {
  const allSame = idNumber.split('').every(c => c === idNumber[0]);
  if (allSame) {
    return { found: false, error: 'Client not found', status: 404 };
  }

  return {
    found: true,
    id: `CR${String(parseInt(idNumber, 10) % 1000000000 || 1).padStart(9, '0')}`,
    identification_number: idNumber,
    identification_type: 'National ID',
    first_name: 'JOHN',
    middle_name: 'KAMAU',
    last_name: 'MWANGI',
    date_of_birth: '1990-05-15',
    gender: 'male',
    civil_status: 'Single',
    phone: '0712345678',
    county: 'Nairobi',
    city: 'Nairobi',
    citizenship: 'Kenyan',
    originSystem: 'NHIF',
    other_identifications: [
      { type: 'SHA Number', value: `SHA-${new Date().getFullYear()}-${idNumber.slice(0, 5).padStart(8, '0')}` },
    ],
  };
}

// ── CONTROLLERS ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/sha/verify
 * Body: { identification_type, identification_number, visit_type }
 * Returns: { decision, payment_mode, eligible, member_details, reason, possible_solution }
 */
export async function verifyEligibility(req, res, next) {
  try {
    const { identification_type = 'National ID', identification_number, visit_type = 'Walk-In' } = req.body;

    if (!identification_number) {
      return res.status(400).json({ error: 'identification_number is required' });
    }

    let shaResponse;

    if (process.env.MOCK_SHA_API === 'true') {
      // ── MOCK MODE ──────────────────────────────────────────────────────────
      shaResponse = mockSHAResponse(identification_number);
    } else {
      // ── LIVE MODE ──────────────────────────────────────────────────────────
      const token = await getSHAToken();
      const { data } = await axios.get(`${process.env.SHA_API_BASE_URL}/v2/eligibility`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { identification_type, identification_number },
      });
      shaResponse = data;
    }

    const eligible = shaResponse.message?.eligible ?? shaResponse.eligible;
    const memberDetails = shaResponse.message?.member_details || null;
    const reason = shaResponse.message?.reason || '';
    const possibleSolution = shaResponse.message?.possible_solution || null;

    // Not in SHA system at all (eligible = 9 in our mock, or no member_details + eligible 0)
    if (eligible === 9 || (!memberDetails && eligible !== 1)) {
      return res.json({
        decision: 'not_sha_member',
        payment_mode: 'Private',
        eligible: 0,
        member_details: null,
        reason,
        possible_solution: possibleSolution,
        facility_level: facilityLevel(),
      });
    }

    const { decision, payment_mode } = resolveDecision(eligible, memberDetails?.member_status, visit_type);

    // Clean up member details for the frontend
    const cleanedDetails = memberDetails ? {
      sha_number: memberDetails.sha_member_no || shaResponse.message?.id,
      cr_number:  memberDetails.cr_number,
      first_name: titleCase(memberDetails.first_name),
      middle_name: titleCase(memberDetails.middle_name || ''),
      last_name:  titleCase(memberDetails.last_name),
      date_of_birth: memberDetails.date_of_birth,
      gender:     memberDetails.gender,
      id_number:  memberDetails.id_number || identification_number,
      phone:      memberDetails.phone,
      member_status: memberDetails.member_status,
      arrears_amount: memberDetails.arrears_amount || 0,
      scheme:     memberDetails.scheme,
      last_contribution_date: memberDetails.last_contribution_date,
    } : null;

    return res.json({
      decision,
      payment_mode,
      eligible,
      member_details: cleanedDetails,
      reason,
      possible_solution: possibleSolution,
      facility_level: facilityLevel(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/sha/registry/lookup
 * Body: { identification_type, identification_number }
 * Returns: { found, cr_number, demographics... } or { found: false }
 */
export async function lookupRegistry(req, res, next) {
  try {
    const { identification_type = 'National ID', identification_number } = req.body;

    if (!identification_number) {
      return res.status(400).json({ error: 'identification_number is required' });
    }

    let crData;

    if (process.env.MOCK_CR_API === 'true') {
      crData = mockCRResponse(identification_number);
    } else {
      // ── LIVE: Get CR Token ─────────────────────────────────────────────────
      // (CR may share token endpoint with SHA or have its own — adjust as needed)
      const tokenRes = await axios.post(`${process.env.CR_API_BASE_URL}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: process.env.CR_CLIENT_ID,
        client_secret: process.env.CR_CLIENT_SECRET,
      });
      const crToken = tokenRes.data.access_token;

      const { data } = await axios.get(`${process.env.CR_API_BASE_URL}/api/v1/patients`, {
        headers: { Authorization: `Bearer ${crToken}`, Accept: 'application/json' },
        params: { identification_number, identification_type },
      });

      crData = data?.id ? { found: true, ...data } : { found: false };
    }

    if (!crData.found) {
      return res.json({ found: false, reason: 'Client not found in national registry' });
    }

    // Map CR response → our standardised shape
    const shaNumber = crData.other_identifications?.find(o => o.type === 'SHA Number')?.value || null;

    return res.json({
      found: true,
      cr_number:    crData.id,
      sha_number:   shaNumber,
      id_number:    crData.identification_number,
      first_name:   titleCase(crData.first_name),
      middle_name:  titleCase(crData.middle_name || ''),
      last_name:    titleCase(crData.last_name),
      date_of_birth: crData.date_of_birth,
      gender:       crData.gender === 'male' ? 'Male' : crData.gender === 'female' ? 'Female' : crData.gender,
      phone:        crData.phone,
      location:     [crData.city, crData.county].filter(Boolean).join(', '),
      marital_status: crData.civil_status,
      nationality:  crData.citizenship || 'Kenyan',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/sha/registry/register
 * Body: { patient demographics }
 * Returns: { cr_number }
 */
export async function registerInRegistry(req, res, next) {
  try {
    const { first_name, last_name, middle_name, date_of_birth, gender,
            identification_number, identification_type = 'National ID',
            phone, county, nationality = 'Kenyan' } = req.body;

    if (!first_name || !last_name || !identification_number) {
      return res.status(400).json({ error: 'first_name, last_name, and identification_number are required' });
    }

    if (process.env.MOCK_CR_API === 'true') {
      // Mock: generate a deterministic CR number from the ID
      const crNum = `CR${String(parseInt(identification_number, 10) % 1000000000 || Date.now() % 1000000000).padStart(9, '0')}`;
      return res.json({ cr_number: crNum, status: 'created', message: 'Client registered successfully (mock)' });
    }

    const tokenRes = await axios.post(`${process.env.CR_API_BASE_URL}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: process.env.CR_CLIENT_ID,
      client_secret: process.env.CR_CLIENT_SECRET,
    });
    const crToken = tokenRes.data.access_token;

    const payload = {
      identification_number,
      identification_type,
      first_name: first_name.toUpperCase(),
      middle_name: (middle_name || '').toUpperCase(),
      last_name: last_name.toUpperCase(),
      date_of_birth,
      gender: gender?.toLowerCase(),
      phone,
      county: county || '',
      citizenship: nationality,
    };

    const { data } = await axios.post(`${process.env.CR_API_BASE_URL}/api/v1/patients`, payload, {
      headers: { Authorization: `Bearer ${crToken}`, 'Content-Type': 'application/json' },
    });

    return res.json({ cr_number: data.id, status: data.status, message: data.message });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/sha/settings
 * Returns facility-level settings (safe to expose to authenticated users)
 */
export async function getSettings(_req, res) {
  res.json({
    facility_level: facilityLevel(),
    facility_name: process.env.FACILITY_NAME || '',
    facility_mfl_code: process.env.FACILITY_MFL_CODE || '',
    mock_sha: process.env.MOCK_SHA_API === 'true',
    mock_cr:  process.env.MOCK_CR_API === 'true',
  });
}
