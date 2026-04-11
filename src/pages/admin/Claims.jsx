import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { claimsService } from '../../services/index';
import { notify } from '../../utils/toast';
import { Settings, CloudDone, CheckCircle, Warning, AccountBalanceWallet } from '@mui/icons-material';

export default function Claims() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('unbatched');
  const [unbatched, setUnbatched] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setMigrationNeeded(false);
    try {
      const liveUnbatched = await claimsService.getUnbatchedClaims();
      const liveBatches = await claimsService.listBatches();
      setUnbatched(liveUnbatched || []);
      setBatches(liveBatches || []);
    } catch (err) {
      console.error(err);
      // If the error is about missing tables/columns, mark migration as needed
      if (err?.message?.includes('sha_claims') || err?.message?.includes('sha_batch_id') || err?.code === '42P01' || err?.code === '42703') {
        setMigrationNeeded(true);
      } else {
        notify.error("Failed to load claims data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === unbatched.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(unbatched.map(c => c.id)));
  };

  const selectedTotal = unbatched
    .filter(c => selectedIds.has(c.id))
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

  const handleGenerateBatch = async () => {
    if (selectedIds.size === 0) return;
    try {
      await claimsService.createBatch(Array.from(selectedIds), selectedTotal, user.id);
      notify.success(`Successfully batched ${selectedIds.size} claims!`);
      setSelectedIds(new Set());
      await loadData();
      setActiveTab('batches');
    } catch (err) {
      console.error(err);
      notify.error("Error generating batch.");
    }
  };

  const markReimbursed = async (batchId) => {
    try {
      await claimsService.markReimbursed(batchId);
      notify.success("Batch marked as Reimbursed!");
      await loadData();
    } catch(err) {
       console.error(err);
       notify.error("Failed to update batch status.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Insurance Claims Management</h1>
        <p className="text-sm font-bold text-slate-400 mt-1">Batch SHA claims and track reimbursements.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('unbatched')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors -mb-px
            ${activeTab === 'unbatched' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Pending Payments ({unbatched.length})
        </button>
        <button onClick={() => setActiveTab('batches')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors -mb-px
            ${activeTab === 'batches' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Claims Batches
        </button>
      </div>

      {activeTab === 'unbatched' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
               <p className="text-sm font-bold text-slate-700">{selectedIds.size} payments selected</p>
               <p className="text-xl font-black text-slate-900">KES {selectedTotal.toLocaleString()}</p>
            </div>
            <button 
              onClick={handleGenerateBatch} 
              disabled={selectedIds.size === 0} 
              className="btn-primary"
            >
              <CloudDone sx={{ fontSize: 18 }} className="mr-2" />
              Generate Claims Batch
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">
                    <input type="checkbox" className="rounded"
                      checked={selectedIds.size === unbatched.length && unbatched.length > 0}
                      onChange={toggleAll} />
                  </th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">SHA Number</th>
                  <th className="p-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unbatched.map(c => {
                  const pat = c.bills?.patients || {};
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <input type="checkbox" className="rounded"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelect(c.id)} />
                      </td>
                      <td className="p-4 text-slate-500">{new Date(c.created_at).toLocaleString()}</td>
                      <td className="p-4 font-bold text-slate-800">{pat.first_name} {pat.last_name}<p className="text-xs text-slate-400 font-normal">{pat.patient_no}</p></td>
                      <td className="p-4 font-mono text-slate-600">{pat.sha_number || '—'}</td>
                      <td className="p-4 font-bold text-indigo-700">KES {parseFloat(c.amount).toLocaleString()}</td>
                    </tr>
                  )
                })}
                {unbatched.length === 0 && (
                   <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">No unbatched claims found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
           {batches.map(b => (
             <div key={b.id} className={`card p-5 border-t-4 transition-all ${b.status === 'reimbursed' ? 'border-t-emerald-500 opacity-70' : 'border-t-primary-500 shadow-md'}`}>
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <AccountBalanceWallet sx={{fontSize: 14}}/> {b.batch_no}
                   </div>
                   {b.status === 'reimbursed' 
                     ? <span className="badge badge-green">Reimbursed</span> 
                     : <span className="badge badge-amber">Pending Payout</span>}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">KES {parseFloat(b.total_amount).toLocaleString()}</h3>
                <p className="text-sm font-bold text-slate-600 mb-4">{b.total_claims} claims included</p>
                
                <div className="text-xs text-slate-400 space-y-1 mb-5">
                   <p>Generated: {new Date(b.created_at).toLocaleDateString()}</p>
                   {b.reimbursed_at && <p className="text-emerald-600 font-semibold">Reimbursed: {new Date(b.reimbursed_at).toLocaleDateString()}</p>}
                </div>

                {b.status !== 'reimbursed' && (
                   <button onClick={() => markReimbursed(b.id)} className="w-full btn-secondary text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-600 hover:text-white border-0 py-2">
                     Mark as Reimbursed
                   </button>
                )}
             </div>
           ))}
           {batches.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-400 font-bold card border-dashed border-2 bg-transparent">
                 No batches generated yet. Select claims and compile them into a batch.
              </div>
           )}
        </div>
      )}

    </div>
  );
}
