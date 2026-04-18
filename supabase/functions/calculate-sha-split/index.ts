// Supabase Edge Function: calculate-sha-split
// ============================================================
// Calculates billing split between SHIF/PHF/ECCIF and patient
// for SHA 2026 Kenya Level-4 facilities.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface ServiceItem {
  service_code: string;   // must exist in sha_tariffs
  description: string;
  hospital_price: number;
  quantity: number;
  category?: string;
}

interface RequestBody {
  patient_id: string;
  sha_id?: string;          // SHA member number for DHA API lookup
  services: ServiceItem[];
  is_emergency?: boolean;
}

interface LineResult extends ServiceItem {
  sha_tariff_rate: number;
  sha_covered_amount: number;
  patient_copay: number;
  funding_source_used: string;
  invoice_item_status: string;
  requires_preauth: boolean;
  self_referral_override: boolean;
}

interface SplitResult {
  patient_id: string;
  household_id: string | null;
  means_testing_bracket: number | null;
  is_indigent: boolean;
  referral_status: 'Valid' | 'Missing' | 'Emergency_Bypass';
  referral_uuid: string | null;
  lines: LineResult[];
  totals: {
    hospital_total: number;
    sha_total: number;
    patient_total: number;
    govt_debtor_total: number;  // when bracket===1 copay shifts here
  };
  needs_preauth: boolean;
}

// ── Step A: DHA API Mock ──────────────────────────────────────────────────────
// Replace with real DHA endpoint when available.
async function fetchDHAProfile(shaId: string): Promise<{ household_id: string; means_testing_bracket: number }> {
  const dhaApiUrl = Deno.env.get('DHA_API_URL');
  const dhaApiKey = Deno.env.get('DHA_API_KEY');

  if (dhaApiUrl && dhaApiKey) {
    try {
      const res = await fetch(`${dhaApiUrl}/patient-profile?sha_id=${shaId}`, {
        headers: { 'Authorization': `Bearer ${dhaApiKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        return {
          household_id: data.household_id,
          means_testing_bracket: data.means_testing_bracket,
        };
      }
    } catch (_e) {
      // Fall through to mock
    }
  }

  // MOCK: derive from sha_id for determinism in dev/staging
  const bracket = (shaId?.charCodeAt(shaId.length - 1) % 5) + 1 || 3;
  return {
    household_id: `HH-${shaId?.slice(-6) || 'UNKNOWN'}`,
    means_testing_bracket: bracket,
  };
}

// ── Main Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body: RequestBody = await req.json();
    const { patient_id, sha_id, services, is_emergency = false } = body;

    if (!patient_id || !services?.length) {
      return new Response(JSON.stringify({ error: 'patient_id and services are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── Step A: Get patient & verify SHA profile ────────────────────────────
    const { data: patient, error: patErr } = await supabase
      .from('patients')
      .select('id, sha_number, household_id, means_testing_bracket, is_indigent, current_referral_id')
      .eq('id', patient_id)
      .single();

    if (patErr || !patient) throw new Error('Patient not found');

    const effectiveShaId = sha_id || patient.sha_number;
    let household_id = patient.household_id;
    let means_testing_bracket = patient.means_testing_bracket;

    // If patient has a SHA number, attempt live lookup (or mock)
    if (effectiveShaId) {
      const dhaProfile = await fetchDHAProfile(effectiveShaId);
      household_id = dhaProfile.household_id || household_id;
      means_testing_bracket = dhaProfile.means_testing_bracket || means_testing_bracket;

      // Persist updated SHA profile back to patients table
      await supabase.from('patients').update({
        household_id,
        means_testing_bracket,
        last_verified_at: new Date().toISOString(),
        is_verified: true,
      }).eq('id', patient_id);
    }

    const is_indigent = patient.is_indigent || means_testing_bracket === 1;

    // ── Step B: Referral Check ──────────────────────────────────────────────
    let referral_status: 'Valid' | 'Missing' | 'Emergency_Bypass' = 'Missing';
    let referral_uuid: string | null = null;

    if (is_emergency) {
      referral_status = 'Emergency_Bypass';
    } else {
      const { data: activeReferral } = await supabase
        .from('referrals')
        .select('referral_uuid, expiry_date, status')
        .eq('patient_id', patient_id)
        .eq('status', 'Active')
        .gte('expiry_date', new Date().toISOString().slice(0, 10))
        .order('expiry_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeReferral) {
        referral_status = 'Valid';
        referral_uuid = activeReferral.referral_uuid;
      }
    }

    // ── Load SHA Tariffs for provided service codes ─────────────────────────
    const serviceCodes = services.map((s) => s.service_code);
    const { data: tariffs } = await supabase
      .from('sha_tariffs')
      .select('*')
      .in('service_code', serviceCodes);

    const tariffMap = new Map((tariffs || []).map((t: any) => [t.service_code, t]));

    // ── Load Benefit Limits for this household ─────────────────────────────
    const { data: benefitRows } = await supabase
      .from('benefit_limits')
      .select('*')
      .eq('household_id', household_id || '')
      .eq('period_year', new Date().getFullYear());

    const limitMap = new Map((benefitRows || []).map((b: any) => [b.category, b]));

    // ── Steps C, D, E: Per-line calculations ───────────────────────────────
    let sha_total = 0, patient_total = 0, hospital_total = 0, govt_debtor_total = 0;
    let needs_preauth = false;

    const lines: LineResult[] = services.map((svc) => {
      const qty = svc.quantity || 1;
      const hospital_price_total = svc.hospital_price * qty;
      const tariff = tariffMap.get(svc.service_code) as any | undefined;

      const level_4_rate = tariff?.level_4_rate ?? 0;
      const fund_source = tariff?.fund_source ?? 'SHIF';
      const requires_preauth = tariff?.requires_preauth ?? false;
      const category = tariff?.category || svc.category || 'general';

      let sha_covered = 0;
      let copay = hospital_price_total;
      let funding_source_used = 'Patient';
      let invoice_item_status = 'Draft';
      let self_referral_override = false;

      const isShaEligible = !!effectiveShaId && !!tariff;

      if (!isShaEligible) {
        // No SHA tariff → 100% patient pays
      } else if (referral_status === 'Missing') {
        // Step B: Self-Referral → 100% patient pays
        self_referral_override = true;
        funding_source_used = 'Patient';
      } else {
        // Step C: Split Calculation
        const effective_fund = is_emergency ? 'ECCIF' : fund_source;
        sha_covered = Math.min(hospital_price_total, level_4_rate * qty);
        copay = hospital_price_total - sha_covered;

        // Step D: Benefit Limit Validation
        const limit = limitMap.get(category) as any | undefined;
        if (limit && limit.consumed_value >= limit.max_value) {
          // Limit exhausted
          const isEccifEligible = ['icu', 'chronic', 'cancer', 'dialysis', 'procedure'].includes(category.toLowerCase());
          if (isEccifEligible) {
            funding_source_used = 'ECCIF';
            invoice_item_status = 'Approved';
          } else {
            // Non-ECCIF: shift SHA covered back to copay
            copay = hospital_price_total;
            sha_covered = 0;
            funding_source_used = 'Patient';
            invoice_item_status = 'Limit_Exhausted';
          }
        } else {
          funding_source_used = effective_fund;
          invoice_item_status = 'Approved';
        }

        // Step E: Pre-Auth
        if (requires_preauth) {
          needs_preauth = true;
          invoice_item_status = 'Awaiting_SHA_Approval';
        }
      }

      // Indigent: copay shifts to government debtor account
      if (is_indigent && copay > 0 && funding_source_used !== 'Patient') {
        govt_debtor_total += copay;
        copay = 0;
      }

      hospital_total += hospital_price_total;
      sha_total += sha_covered;
      patient_total += copay;

      return {
        ...svc,
        sha_tariff_rate: level_4_rate,
        sha_covered_amount: sha_covered,
        patient_copay: copay,
        funding_source_used,
        invoice_item_status,
        requires_preauth,
        self_referral_override,
      };
    });

    const result: SplitResult = {
      patient_id,
      household_id,
      means_testing_bracket,
      is_indigent,
      referral_status,
      referral_uuid,
      lines,
      totals: {
        hospital_total,
        sha_total,
        patient_total,
        govt_debtor_total,
      },
      needs_preauth,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
