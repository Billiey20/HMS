import React, { useState, useEffect, useCallback } from 'react';
import { Refresh, VerifiedUser, ErrorOutline, Shield, Warning } from '@mui/icons-material';
import { billingService } from '../../services/billing';
import { toast } from 'react-toastify';

const FUND_COLORS = {
  SHIF:   'bg-blue-100 text-blue-700 border-blue-200',
  PHF:    'bg-violet-100 text-violet-700 border-violet-200',
  ECCIF:  'bg-orange-100 text-orange-700 border-orange-200',
  Patient:'bg-slate-100 text-slate-600 border-slate-200',
  Govt:   'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_COLORS = {
  Approved:            'bg-emerald-100 text-emerald-700',
  Awaiting_SHA_Approval:'bg-amber-100 text-amber-700',
  PreAuth_Submitted:   'bg-blue-100 text-blue-700',
  Limit_Exhausted:     'bg-red-100 text-red-700',
  Draft:               'bg-slate-100 text-slate-500',
  Rejected:            'bg-red-100 text-red-700',
};

function FundBadge({ fund }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${FUND_COLORS[fund] || 'bg-slate-100 text-slate-500'}`}>
      <Shield sx={{ fontSize: 10 }} /> {fund}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-500'}`}>
      {(status || '—').replace(/_/g, ' ')}
    </span>
  );
}

export default function ShaClaims() {
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billingService.listShaClaims();
      setClaims(data);
    } catch (e) {
      toast.error('Failed to load SHA claims: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = claims.filter(c => {
    const patient = c.bills?.patients;
    const name    = `${patient?.first_name || ''} ${patient?.last_name || ''}`.toLowerCase();
    const billNo  = (c.bills?.bill_no || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || billNo.includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.funding_source_used === filter;
    return matchSearch && matchFilter;
  });

  const shaTotals = claims.reduce((acc, c) => {
    const fund = c.funding_source_used || 'Patient';
    acc[fund] = (acc[fund] || 0) + parseFloat(c.sha_covered_amount || 0);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">SHA Claims</h1>
          <p className="text-sm text-slate-500 mt-1">SHIF · PHF · ECCIF fund disbursements & pre-auth tracking</p>
        </div>
        <button onClick={load} className="btn-secondary shrink-0">
          <Refresh fontSize="small" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total SHIF Claims',  key: 'SHIF',  color: 'border-blue-200 bg-blue-50',   text: 'text-blue-700' },
          { label: 'Total PHF Claims',   key: 'PHF',   color: 'border-violet-200 bg-violet-50',text: 'text-violet-700' },
          { label: 'Total ECCIF Claims', key: 'ECCIF', color: 'border-orange-200 bg-orange-50',text: 'text-orange-700' },
          { label: 'Claims (Pending)',   key: 'all',   color: 'border-amber-200 bg-amber-50',  text: 'text-amber-700' },
        ].map(({ label, key, color, text }) => (
          <div key={key} className={`rounded-2xl border p-4 ${color}`}>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${text} font-mono`}>
              <span className="text-xs mr-1">KSh.</span>
              {key === 'all'
                ? claims.filter(c => c.invoice_item_status === 'Awaiting_SHA_Approval').reduce((s, c) => s + parseFloat(c.sha_covered_amount || 0), 0).toLocaleString()
                : (shaTotals[key] || 0).toLocaleString()
              }
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name or bill no..." className="input" />
        </div>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {['all', 'SHIF', 'PHF', 'ECCIF'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-xs font-bold transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              {f === 'all' ? 'All Funds' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Claims Table */}
      <div className="card overflow-hidden ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 tracking-wider">
              <tr>
                {['Invoice', 'Patient / SHA No.', 'Service', 'Hospital Price', 'SHA Covers', 'Patient Pays', 'Fund', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400 animate-pulse">Loading SHA claims…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <VerifiedUser sx={{ fontSize: 40 }} className="mb-3 opacity-20" />
                    <p className="font-bold text-slate-500">No SHA claims found</p>
                    <p className="text-xs mt-1">Claims appear here when invoices are finalized for SHA patients.</p>
                  </td>
                </tr>
              )}
              {!loading && filtered.map(c => {
                const patient = c.bills?.patients;
                const haAlert = c.invoice_item_status === 'Awaiting_SHA_Approval';
                return (
                  <tr key={c.id} className={`hover:bg-slate-50/80 transition-colors ${haAlert ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-5 py-3 font-mono text-[10px] text-slate-500">{c.bills?.bill_no || '—'}</td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-800 text-xs">{patient?.first_name} {patient?.last_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{patient?.sha_number || patient?.patient_no}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-700 max-w-[180px] truncate">{c.description}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">
                      <span className="text-[10px] mr-0.5">KSh.</span>{parseFloat(c.hospital_price || c.unit_price * c.quantity || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono text-sm font-black text-emerald-700">
                      <span className="text-[10px] mr-0.5">KSh.</span>{parseFloat(c.sha_covered_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono text-sm font-black text-amber-700">
                      <span className="text-[10px] mr-0.5">KSh.</span>{parseFloat(c.patient_copay || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3"><FundBadge fund={c.funding_source_used} /></td>
                    <td className="px-5 py-3">
                      {haAlert ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200">
                          <Warning sx={{ fontSize: 10 }} /> Awaiting Pre-Auth
                        </span>
                      ) : (
                        <StatusBadge status={c.invoice_item_status} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={4} className="px-5 py-2.5 text-xs font-black text-slate-600 text-right">TOTALS ({filtered.length} lines)</td>
                  <td className="px-5 py-2.5 font-mono text-sm font-black text-emerald-700">
                    <span className="text-[10px] mr-0.5">KSh.</span>
                    {filtered.reduce((s, c) => s + parseFloat(c.sha_covered_amount || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-sm font-black text-amber-700">
                    <span className="text-[10px] mr-0.5">KSh.</span>
                    {filtered.reduce((s, c) => s + parseFloat(c.patient_copay || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
