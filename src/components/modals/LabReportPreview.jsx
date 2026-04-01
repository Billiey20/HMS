import React, { useRef } from 'react';
import { Close, Print, Download } from '@mui/icons-material';
import { TEST_TEMPLATES, computeFlag, refInterval } from '../../utils/labConstants';
import { useAuth } from '../../context/AuthContext';

export default function LabReportPreview({ item, onClose }) {
  const { user } = useAuth();
  const printRef = useRef();

  const patient = item?.lab_orders?.patients;
  let parsedResult = {};
  try { parsedResult = item?.result ? JSON.parse(item.result) : {}; } catch {}

  const template = TEST_TEMPLATES[item?.test_name] || [];
  const patientData = item?.lab_orders?.patients || patient;

  const getOrdinalDay = (day) => {
    if (day > 3 && day < 21) return day + 'th';
    switch (day % 10) {
      case 1:  return day + "st";
      case 2:  return day + "nd";
      case 3:  return day + "rd";
      default: return day + "th";
    }
  };

  const formatHumanDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = getOrdinalDay(d.getDate());
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${month} ${day} ${year} ${hours}:${mins}`;
  };

  const toSentenceCase = (str) => {
    if (!str) return '';
    const s = String(str).toLowerCase().trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const formatDoctorName = (name) => {
    if (!name) return 'Dr. Clinician';
    // Split and take first name only, capitalize first letter
    const firstName = name.split(/[\s,]+/)[0];
    return `Dr. ${toSentenceCase(firstName)}`;
  };

  const calculateAge = (ageString) => {
    if (!ageString) return '-';
    // Age might be a string like "34" or "34 yrs" in HMS table
    return String(ageString).replace(/[^0-9]/g, '') || '-';
  };

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=900,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Lab Report - ${patient?.first_name || 'Patient'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
             @media print {
               @page { margin: 0; size: A4; }
               body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
               .print-hide { display: none !important; }
               .page-break { page-break-after: always; }
             }
          </style>
        </head>
        <body>
          <div style="width: 210mm; min-height: 297mm; margin: 0 auto; background: white;">
            ${printContent}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!item || !patient) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-emerald-200 bg-emerald-50 shrink-0">
          <div>
            <h3 className="font-black text-lg text-emerald-800">Preview Results</h3>
            <p className="text-xs font-bold text-emerald-600">{patient?.first_name} {patient?.last_name} · {item?.test_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95">
              <Print sx={{ fontSize: 16 }} /> Print PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors">
              <Close fontSize="small" />
            </button>
          </div>
        </div>

        {/* Modal Body / Paper Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex flex-col items-center">
          
          {/* A4 Document Setup */}
          <div ref={printRef} className="w-full max-w-[210mm] bg-white shadow-xl min-h-[297mm] flex flex-col relative text-slate-900" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            
            {/* --- Document Header --- */}
            <div className="px-8 pt-10 pb-4 flex justify-between items-start">
              <div className="flex items-center">
                 {/* Generic Hospital Icon instead of logo string */}
                 <div className="w-24 h-24 border-4 border-[#055b38] rounded-full flex items-center justify-center text-[#055b38]">
                    <span className="text-4xl font-black">CH</span>
                 </div>
              </div>

              <div className="text-left flex flex-col items-start max-w-[300px]">
                <h2 className="text-3xl font-black" style={{ color: '#055b38' }}>CareFirst Hospital</h2>
                <p className="text-[14px] font-semibold mt-1">Nairobi, Kenya</p>
                <p className="text-[14px]">P.O Box 12345-00100 City Square</p>
                <p className="text-[14px]">TEL: <span className="font-bold">020 123 4567 / 0700 123 456</span></p>
                <p className="text-[14px] text-blue-800">Email: lab@carefirsthospital.co.ke</p>
                <p className="text-[14px] text-blue-800">Website: www.carefirsthospital.co.ke</p>
                <p className="text-[13px] font-bold text-emerald-700 mt-1 italic leading-tight">Compassionate care, advanced diagnostics.</p>
              </div>
            </div>

            {/* Separator Lines */}
            <div className="h-[2px] w-full bg-[#055b38] opacity-80 mt-2 mb-1"></div>
            <div className="h-[1px] w-full bg-[#055b38] opacity-40 mb-4"></div>

            {/* --- Info Blocks --- */}
            <div className="px-8 grid grid-cols-3 gap-4 text-[12px] pb-4">
              
              {/* Patient Info */}
              <div>
                <h4 className="font-bold uppercase text-slate-600 mb-2 border-b border-slate-200 pb-1">Patient Information</h4>
                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1">
                  <span className="font-semibold text-slate-600">Patient</span> <span className="uppercase font-bold">: {patientData?.first_name} {patientData?.last_name}</span>
                  <span className="font-semibold text-slate-600">Age</span> <span className="uppercase">: {calculateAge(patientData?.age)} YRS</span>
                  <span className="font-semibold text-slate-600">Gender</span> <span className="uppercase">: {patientData?.gender || 'UNKNOWN'}</span>
                  <span className="font-semibold text-slate-600">Patient No</span> <span className="font-mono">: {patientData?.patient_no}</span>
                  <span className="font-semibold text-slate-600">Telephone</span> <span>: {patientData?.phone || '-'}</span>
                </div>
              </div>

              {/* Lab / Test Info */}
              <div>
                <h4 className="font-bold uppercase text-slate-600 mb-2 border-b border-slate-200 pb-1">Test Information</h4>
                <div className="grid grid-cols-[120px_1fr] gap-x-2 gap-y-1 whitespace-nowrap">
                  <span className="font-semibold text-slate-600 shrink-0">Lab ID</span> <span className="uppercase font-mono font-bold">: {item?.lab_id}</span>
                  <span className="font-semibold text-slate-600 shrink-0">Received</span> <span className="text-[11px]">: {formatHumanDate(item?.lab_orders?.ordered_at)}</span>
                  <span className="font-semibold text-slate-600 shrink-0">Sample Collected</span> <span className="text-[11px]">: {formatHumanDate(item?.sample_collected_at)}</span>
                  <span className="font-semibold text-slate-600 shrink-0">Results Validated</span> <span className="text-[11px]">: {formatHumanDate(item?.validated_at || item?.result_at)}</span>
                </div>
              </div>

              {/* Referral Info */}
              <div>
                <h4 className="font-bold uppercase text-slate-600 mb-2 border-b border-slate-200 pb-1">Origin Details</h4>
                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1">
                  <span className="font-semibold text-slate-600">Requested By</span> <span className="font-bold">: {formatDoctorName(item?.lab_orders?.ordered_by)}</span>
                  <span className="font-semibold text-slate-600">Location</span> <span>: {toSentenceCase(item?.lab_orders?.location || 'Outpatient dept')}</span>
                  <span className="font-semibold text-slate-600">Priority</span> <span className="font-bold">: {toSentenceCase(item?.lab_orders?.urgency || 'Routine')}</span>
                </div>
              </div>

            </div>

            <div className="h-[1px] w-full bg-slate-200 mt-1 mb-2"></div>

            {/* --- Department Banner --- */}
            <div className="px-8 mb-4">
               <div className="w-full bg-[#055b38]/5 border-2 border-[#055b38] py-1 flex items-center justify-center">
                  <span className="font-bold text-[#055b38] uppercase tracking-wide">Department of Pathology & Laboratory Medicine</span>
               </div>
            </div>

            {/* --- Results Section --- */}
            <div className="px-8 flex-grow">
               <div className="text-center font-black uppercase text-lg underline underline-offset-4 mb-4">
                 {item?.test_name}
               </div>

               {template.length > 0 ? (
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="border-b-2 border-slate-800">
                       <th className="text-left py-2 font-black w-[40%]">Test / Parameter</th>
                       <th className="text-left py-2 font-black w-[15%]">Result</th>
                       <th className="text-left py-2 font-black w-[15%]">Units</th>
                       <th className="text-left py-2 font-black w-[10%]">Flag</th>
                       <th className="text-left py-2 font-black w-[20%]">Biological Reference ranges</th>
                     </tr>
                   </thead>
                   <tbody>
                      {template.map((row, idx) => {
                        const val  = parsedResult[row.name] || '';
                        const flag = computeFlag(val, row);
                        const isAbn = flag === 'H' || flag === 'L';
                        
                        return (
                          <tr key={idx} className="border-b border-slate-200">
                            <td className={`py-2 pl-2 ${isAbn ? 'font-bold' : ''}`}>{row.name}</td>
                            <td className={`py-2 ${isAbn ? 'font-bold text-red-600' : ''}`}>{val || '—'}</td>
                            <td className={`py-2 text-slate-600 ${isAbn ? 'font-bold' : ''}`}>{row.unit || '—'}</td>
                            <td className="py-2">
                              {flag && (
                                <span className={`font-mono ${flag === 'H' || flag === 'L' ? 'font-black' : 'font-normal text-slate-500'}`}>
                                  {flag === 'H' ? <span className="text-red-600">{flag}</span> : flag === 'L' ? <span className="text-blue-600">{flag}</span> : flag}
                                </span>
                              )}
                            </td>
                            <td className={`py-2 text-slate-600 text-[13px] ${isAbn ? 'font-bold' : ''}`}>{refInterval(row)}</td>
                          </tr>
                        );
                      })}
                   </tbody>
                 </table>
               ) : (
                 <div className="border border-slate-200 p-6 min-h-[300px] whitespace-pre-wrap font-medium">
                   {parsedResult.__freetext || item?.result || 'No structured results provided.'}
                 </div>
               )}
            </div>

            {/* Flag Key */}
            <div className="mt-8 px-8">
               <div className="font-bold text-[13px] border-b-2 border-slate-800 pb-1 mb-2 tracking-wide">
                   FLAG KEY: <span className="font-normal italic">L = Low; H = High; */Bold = Abnormal; ! = Critical result</span>
               </div>
            </div>

            {/* --- Footer Signature Area --- */}
            <div className="px-8 mt-4 pt-4 relative">
               <div className="text-center font-black text-[12px] mb-8">
                  ****** END OF REPORT ******
               </div>
               
               <div className="flex justify-between items-end mb-8 relative">
                  <div className="text-[12px] flex flex-col items-center">
                     <p className="font-bold border-t border-slate-400 pt-1 px-4 text-center">Test Performed & Validated By</p>
                     <p className="font-semibold text-slate-800 uppercase mt-1">{user?.email?.split('@')[0] || user?.name || 'Lab Technologist'}</p>
                     {/* Mock signature */}
                     <div className="mt-1 text-2xl font-signature text-[#055b38]/60" style={{ fontFamily: 'cursive' }}>
                        {user?.email?.split('@')[0] || user?.name || 'Sign'}
                     </div>
                  </div>
                  
                  {/* Mock Stamp */}
                  <div className="opacity-80 right-10 bottom-0 text-emerald-900/60 w-[120px] h-[120px] border-[3px] border-emerald-900/40 rounded-full flex items-center justify-center flex-col transform rotate-[-15deg] pointer-events-none absolute right-4">
                     <p className="text-[10px] uppercase font-bold text-center leading-tight">CareFirst Hospital</p>
                     <p className="text-[12px] font-bold mt-1 uppercase" style={{fontFamily: 'monospace'}}>{item?.validated_at ? new Date(item.validated_at).toLocaleDateString('en-GB') : 'VALIDATED'}</p>
                     <p className="text-[8px] mt-1 text-center font-bold">Authorized Lab Copy</p>
                  </div>
               </div>
            </div>

            {/* --- Page Bottom Footer --- */}
            <div className="w-full mt-auto print:absolute print:bottom-0">
               <div className="bg-slate-700 text-white text-center py-2 text-[11px] font-bold tracking-wider">
                  Test Performed At CareFirst Diagnostic Laboratory. Reproduction Of Reports Without Authorization Is Strictly Prohibited.
               </div>
               <div className="bg-[#055b38] text-white text-center py-1.5 text-[12px] font-bold italic w-full">
                  Excellence in Diagnostics.
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
