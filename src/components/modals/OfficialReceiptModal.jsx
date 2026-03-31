import React from 'react';
import { Close, Print, LocalHospital } from '@mui/icons-material';

export default function OfficialReceiptModal({ bill, onClose }) {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const total = parseFloat(bill.total_amount || 0);
  const paid = parseFloat(bill.paid_amount || 0);
  const balance = total - paid;
  const items = bill.bill_items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:shadow-none print:border-0 print:max-h-none print:w-full">
        
        {/* Modal Header (Hidden on print) */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shrink-0 print:hidden">
          <h2 className="font-black text-slate-800">Official Receipt</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-primary py-1.5 px-4 text-xs">
              <Print sx={{ fontSize: 14 }} className="mr-1" /> Print Receipt
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
              <Close />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 print:overflow-visible print:p-0">
          <div className="max-w-xl mx-auto space-y-8">
            
            {/* Hospital Branding */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0">
                  <LocalHospital />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tighter">HMS Medical Center</h1>
                  <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest">Quality Healthcare for All</p>
                </div>
              </div>
              <div className="text-right text-[10px] font-bold text-slate-500 capitalize tracking-widest leading-relaxed">
                <p>123 Medical Avenue, Nairobi</p>
                <p>Tel: +254 700 000 000</p>
                <p className="lowercase italic font-medium">billing@hms-medical.com</p>
              </div>
            </div>

            {/* Receipt Header Info */}
            <div className="grid grid-cols-2 gap-8 py-2">
              <div className="space-y-1.5 pt-1">
                <div className="flex items-baseline gap-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Bill To:</p>
                   <p className="text-base font-black text-slate-900 leading-tight">
                     {bill.patients?.first_name} {bill.patients?.last_name}
                   </p>
                </div>
                <p className="text-xs font-bold text-slate-500">Patient ID: {bill.patients?.patient_no}</p>
                <p className="text-xs text-slate-500 font-medium">Phone Number: {bill.patients?.phone || 'Not Provided'}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Receipt Details:</p>
                <p className="text-sm font-black text-slate-900">Receipt: {bill.bill_no}</p>
                <p className="text-xs font-bold text-slate-500">Date: {new Date(bill.created_at).toLocaleDateString('en-GB')}</p>
                <p className="text-xs font-bold text-slate-900">Status: <span className={`capitalize ${bill.status === 'paid' ? 'text-emerald-600' : 'text-slate-500'}`}>{bill.status}</span></p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="mt-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y-2 border-slate-900">
                    <th className="py-3 text-left font-black uppercase tracking-widest">Description</th>
                    <th className="py-3 text-center font-black uppercase tracking-widest w-16">Qty</th>
                    <th className="py-3 text-right font-black uppercase tracking-widest w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-bold text-slate-800">
                        {item.description}
                        <span className="block text-[10px] font-normal text-slate-400 uppercase tracking-tighter mt-0.5">{item.category}</span>
                      </td>
                      <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-right font-mono font-bold text-slate-800">
                        <span className="text-[10px] font-bold text-slate-900 mr-1">KSh.</span>
                        {parseFloat(item.total_price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900">
                    <td colSpan={2} className="py-4 text-right font-black text-slate-900 uppercase tracking-widest">Total Amount</td>
                    <td className="py-4 text-right font-black text-slate-900 font-mono text-base tracking-tighter">
                      <span className="text-[10px] font-bold text-slate-900 mr-1">KSh.</span>
                      {total.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td colSpan={2} className="py-2 text-right font-bold text-slate-500 uppercase tracking-widest">Amount Paid</td>
                    <td className="py-2 text-right font-bold text-emerald-600 font-mono">
                      <span className="text-[10px] font-bold text-slate-900 mr-1">KSh.</span>
                      {paid.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-100 bg-slate-50/50 print:bg-transparent">
                    <td colSpan={2} className="py-2 text-right font-black text-slate-900 uppercase tracking-widest">Balance Due</td>
                    <td className="py-2 text-right font-black text-rose-600 font-mono text-sm underline decoration-double">
                      <span className="text-[10px] font-bold text-slate-900 mr-1">KSh.</span>
                      {balance.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer / Notes */}
            <div className="pt-12 border-t border-slate-100 flex justify-between items-end">
              <div className="max-w-[250px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes:</p>
                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  This is a computer generated official receipt. Any alterations without official hospital stamp make this document invalid. 
                </p>
              </div>
              <div className="text-center w-32 border-t border-slate-400 pt-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cashier's Sign</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
