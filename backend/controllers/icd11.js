/**
 * ICD-11 Search Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxies ICD-11 searches to the WHO API so that auth tokens are never
 * exposed to the browser. Responses are cached for 10 minutes per query.
 *
 * WHO ICD-11 API Docs: https://icd.who.int/icdapi
 * Token endpoint:      https://icdaccessmanagement.who.int/connect/token
 *
 * ENV vars required:
 *   WHO_ICD_CLIENT_ID       – from icd.who.int/icdapi developer portal
 *   WHO_ICD_CLIENT_SECRET   – from icd.who.int/icdapi developer portal
 *   WHO_ICD_TOKEN_URL       – https://icdaccessmanagement.who.int/connect/token
 *   WHO_ICD_API_URL         – https://id.who.int/icd/release/11/2024-01/mms
 *
 * FALLBACK: If no credentials are set, returns a small static dataset of
 *           common conditions so the UI still works during development.
 */

import axios from 'axios';

// ── Token cache ───────────────────────────────────────────────────────────────
let _whoToken = null;
let _whoTokenExpiry = 0;

async function getWHOToken() {
  if (_whoToken && Date.now() < _whoTokenExpiry) return _whoToken;

  const { data } = await axios.post(
    process.env.WHO_ICD_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.WHO_ICD_CLIENT_ID,
      client_secret: process.env.WHO_ICD_CLIENT_SECRET,
      scope: 'icdapi_access',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  _whoToken = data.access_token;
  _whoTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _whoToken;
}

// ── Result cache (10 min TTL per search query) ────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

// ── Static fallback dataset ───────────────────────────────────────────────────
// Used when WHO credentials are not yet configured
const OFFLINE_ICD11 = [
  { code: 'CA40.0', title: 'Malaria due to Plasmodium falciparum' },
  { code: 'FF17', title: 'Hypertension' },
  { code: 'FF17.1', title: 'Essential hypertension' },
  { code: '5A10', title: 'Type 1 diabetes mellitus' },
  { code: '5A11', title: 'Type 2 diabetes mellitus' },
  { code: 'DA40', title: 'Typhoid fever' },
  { code: 'CA09', title: 'Upper respiratory tract infection' },
  { code: 'CA06.0', title: 'Pneumonia due to Streptococcus pneumoniae' },
  { code: 'JA00', title: 'Diarrhoeal diseases' },
  { code: 'CA08.0', title: 'Acute pharyngitis' },
  { code: 'MG43', title: 'Anaemia' },
  { code: 'MG43.0', title: 'Iron deficiency anaemia' },
  { code: 'QA21', title: 'Live birth' },
  { code: 'JA04.0', title: 'Cholera' },
  { code: '6A00', title: 'Depressive episode' },
  { code: '1A00', title: 'Tuberculosis of the lung' },
  { code: '1C62.0', title: 'HIV disease with opportunistic infections' },
];

function offlineSearch(q) {
  const lower = q.toLowerCase();
  return OFFLINE_ICD11.filter(
    (i) =>
      i.code.toLowerCase().includes(lower) ||
      i.title.toLowerCase().includes(lower)
  ).slice(0, 10);
}

// ── Controller ────────────────────────────────────────────────────────────────
/**
 * GET /api/v1/icd11/search?q=<term>
 * Returns: { results: [{ code, title }] }
 */
export async function searchICD11(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ results: [] });
    }

    // Check cache first
    const cacheKey = q.toLowerCase();
    const cached = _cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return res.json({ results: cached.results });
    }

    // No credentials? Fall back to static list
    if (!process.env.WHO_ICD_CLIENT_ID || !process.env.WHO_ICD_CLIENT_SECRET) {
      const results = offlineSearch(q);
      return res.json({ results, source: 'offline' });
    }

    // Live WHO API search
    const token = await getWHOToken();
    const { data } = await axios.get(`${process.env.WHO_ICD_API_URL}/search`, {
      params: {
        q,
        useFlexisearch: true,
        flatResults: true,
        highlightingEnabled: false,
        medicalCodingMode: true,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Accept-Language': 'en',
        'API-Version': 'v2',
      },
    });

    // WHO API returns destinationEntities for flat results
    const raw = data.destinationEntities || [];
    const results = raw.slice(0, 10).map((e) => ({
      code: e.theCode || e.code || '',
      title: e.title?.['@value'] || e.title || e.definition?.['@value'] || '',
    }));

    // Cache the results
    _cache.set(cacheKey, { results, expiry: Date.now() + CACHE_TTL });

    return res.json({ results, source: 'who_api' });
  } catch (err) {
    // If WHO API fails, fall back to offline
    console.error('[ICD-11] WHO API error:', err.message);
    const results = offlineSearch(req.query.q || '');
    return res.json({ results, source: 'offline_fallback' });
  }
}
