import React, { useState, useEffect } from 'react';
import { structureService } from '../../services/structure';
import { Business, AutoAwesomeMosaic, Delete, Add, MeetingRoom, Hotel } from '@mui/icons-material';
import { notify } from '../../utils/toast';

export default function StructureTab() {
  const [activeSubTab, setActiveSubTab] = useState('desks'); // 'desks' or 'wards'

  // Standard loads
  const [departments, setDepartments] = useState([]);
  const [desks, setDesks] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [deskForm, setDeskForm] = useState({ department_id: '', name: '' });
  const [wardForm, setWardForm] = useState({ name: '', department_id: '', ward_type: 'general', total_beds: 10 });
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [depts, ds, ws] = await Promise.all([
        structureService.getDepartments(),
        structureService.getDesks().catch(() => []), // Fails gracefully if SQL not run yet
        structureService.getWards()
      ]);
      setDepartments(depts);
      setDesks(ds);
      setWards(ws);
      if (depts.length > 0) {
        setDeskForm(f => ({ ...f, department_id: depts[0].id }));
        setWardForm(f => ({ ...f, department_id: depts[0].id }));
      }
    } catch(e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDesk = async (e) => {
    e.preventDefault();
    if (!deskForm.name || !deskForm.department_id) return;
    setActionLoading(true);
    try {
      await structureService.addDesk(deskForm.department_id, deskForm.name);
      notify.success("Desk added!");
      setDeskForm(f => ({ ...f, name: '' }));
      loadData();
    } catch(e) { notify.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleAddWard = async (e) => {
    e.preventDefault();
    if (!wardForm.name || !wardForm.department_id || wardForm.total_beds < 1) return;
    setActionLoading(true);
    try {
      await structureService.createWardWithBeds(wardForm);
      notify.success(`Ward created with ${wardForm.total_beds} beds allocated!`);
      setWardForm(f => ({ ...f, name: '', total_beds: 10 }));
      loadData();
    } catch(e) { notify.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleDeleteDesk = async (id) => {
    if(!confirm("Delete this working desk/station?")) return;
    try { await structureService.deleteDesk(id); loadData(); } catch(e) { notify.error(e.message); }
  };

  const handleDeleteWard = async (id) => {
    if(!confirm("DANGER: Delete this ward AND all associated beds?")) return;
    try { await structureService.deleteWard(id); loadData(); } catch(e) { notify.error(e.message); }
  };

  if (loading) return <div className="p-8 text-center text-slate-400 font-bold text-xs">Loading structure...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveSubTab('desks')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors -mb-px flex items-center gap-2
            ${activeSubTab === 'desks' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <MeetingRoom sx={{ fontSize: 18 }} /> Working Desks & Stations
        </button>
        <button onClick={() => setActiveSubTab('wards')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors -mb-px flex items-center gap-2
            ${activeSubTab === 'wards' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Hotel sx={{ fontSize: 18 }} /> Wards & Beds Allocation
        </button>
      </div>

      {activeSubTab === 'desks' && (
        <div className="space-y-6">
           <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                 <AutoAwesomeMosaic className="text-primary-600" />
              </div>
              <div>
                 <h4 className="font-bold text-primary-800">Working Desks / Duty Stations</h4>
                 <p className="text-xs text-primary-700 mt-1">Configure physical spots (like Consultation Room 1, Triage Desk A). HR will strictly assign staff to these points when scheduling the master timetable.</p>
              </div>
           </div>

           <form onSubmit={handleAddDesk} className="flex flex-col sm:flex-row gap-4 p-4 border border-slate-200 rounded-2xl bg-slate-50">
              <div className="flex-1">
                 <label className="label">Department</label>
                 <select className="input" value={deskForm.department_id} onChange={e => setDeskForm({...deskForm, department_id: e.target.value})}>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                 </select>
              </div>
              <div className="flex-1">
                 <label className="label">Desk / Station Name</label>
                 <input className="input" placeholder="e.g. Eye Clinic Bench 1" value={deskForm.name} onChange={e => setDeskForm({...deskForm, name: e.target.value})} />
              </div>
              <div className="flex items-end">
                 <button type="submit" disabled={actionLoading || !deskForm.name} className="btn-primary w-full sm:w-auto h-11"><Add sx={{fontSize:18}}/> Add Desk</button>
              </div>
           </form>

           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {departments.map(dept => {
               const deptDesks = desks.filter(d => d.department_id === dept.id);
               if (deptDesks.length === 0) return null;
               
               return (
                 <div key={dept.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                       <h5 className="font-black text-xs text-slate-800 uppercase tracking-widest">{dept.name}</h5>
                    </div>
                    <ul className="divide-y divide-slate-100">
                       {deptDesks.map(desk => (
                         <li key={desk.id} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors group">
                            <span className="font-semibold text-sm text-slate-700">{desk.name}</span>
                            <button onClick={()=>handleDeleteDesk(desk.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Delete sx={{fontSize:16}}/></button>
                         </li>
                       ))}
                    </ul>
                 </div>
               );
             })}
             {desks.length === 0 && <div className="col-span-full p-8 text-center text-slate-400 font-bold border border-dashed border-slate-300 rounded-2xl">No working desks configured yet. Add one above!</div>}
           </div>
        </div>
      )}

      {activeSubTab === 'wards' && (
        <div className="space-y-6">
           <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                 <Hotel className="text-emerald-600" />
              </div>
              <div>
                 <h4 className="font-bold text-emerald-800">Wards & Bed Auto-Generation</h4>
                 <p className="text-xs text-emerald-700 mt-1">Creating a ward automatically generates the underlying beds. A "General Ward" with 10 beds automatically registers beds: "GW B1" through "GW B10".</p>
              </div>
           </div>

           <form onSubmit={handleAddWard} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border border-slate-200 rounded-2xl bg-slate-50">
              <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                 <label className="label">Ward Name</label>
                 <input className="input" placeholder="e.g. Newborn Unit" value={wardForm.name} onChange={e => setWardForm({...wardForm, name: e.target.value})} />
              </div>
              <div className="col-span-1">
                 <label className="label">Department Pivot</label>
                 <select className="input" value={wardForm.department_id} onChange={e => setWardForm({...wardForm, department_id: e.target.value})}>
                    {departments.filter(d=>d.dept_type === 'clinical').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                 </select>
              </div>
              <div className="col-span-1">
                 <label className="label">Bed Capacity</label>
                 <input type="number" min="1" max="200" className="input" value={wardForm.total_beds} onChange={e => setWardForm({...wardForm, total_beds: parseInt(e.target.value)})} />
              </div>
              <div className="col-span-1 flex items-end">
                 <button type="submit" disabled={actionLoading || !wardForm.name} className="btn-primary w-full h-11 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200"><Add sx={{fontSize:18}}/> Create</button>
              </div>
           </form>

           <div className="grid md:grid-cols-2 gap-4">
             {wards.map(ward => (
                <div key={ward.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                      <div>
                         <h5 className="font-black text-slate-800">{ward.name} <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-2 text-[10px]">{ward.short_name || 'WARD'}</span></h5>
                         <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{ward.departments?.name}</p>
                      </div>
                      <button onClick={()=>handleDeleteWard(ward.id)} className="text-red-400 hover:text-red-600 transition-colors p-1 bg-red-50 rounded hover:bg-red-100"><Delete sx={{fontSize:16}}/></button>
                   </div>
                   <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Auto-Generated Beds</span>
                      <span className="text-xs font-black text-slate-800 bg-white px-3 py-1 rounded shadow-sm border border-slate-200">{ward.total_beds} Capacity</span>
                   </div>
                </div>
             ))}
             {wards.length === 0 && <div className="col-span-full p-8 text-center text-slate-400 font-bold border border-dashed border-slate-300 rounded-2xl">No wards currently active.</div>}
           </div>
        </div>
      )}
    </div>
  );
}
