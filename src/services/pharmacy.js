import { supabase } from '../lib/supabase';
import { notificationService } from './notifications';

export const pharmacyService = {
  async listPrescriptions() {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, patients(patient_no, first_name, last_name), prescription_items(*), prescribed_by_user:prescribed_by(first_name, last_name)')
      .order('prescribed_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async listDrugStock() {
    const { data, error } = await supabase
      .from('drug_catalog')
      .select('*, drug_stock(quantity, expiry_date, batch_no)')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    
    // Flatten stock out and separate expired inventory
    return data.map(d => {
      let current = 0;
      let expired = 0;
      const today = new Date().toISOString().slice(0, 10);

      (d.drug_stock || []).forEach(rs => {
        if (rs.expiry_date && rs.expiry_date < today) {
          expired += (rs.quantity || 0);
        } else {
          current += (rs.quantity || 0);
        }
      });
      // Fallback to current_stock catalog field if drug_stock table isn't populated
      if (!d.drug_stock || d.drug_stock.length === 0) {
          current = d.current_stock || 0;
      }

      return {
        ...d,
        current_qty: current,
        expired_qty: expired,
      };
    });
  },

  async createDrug(payload) {
    const { data, error } = await supabase.from('drug_catalog').insert([{
      name: payload.name, category: payload.category || 'General', form: payload.unit || 'tablets',
      reorder_level: payload.reorder_level || 0, selling_price: payload.unit_cost || 0,
      is_active: true,
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async receiveStock(drugId, qty, meta) {
    // Insert into drug_stock 
    const { error: insertErr } = await supabase.from('drug_stock').insert([{
      drug_id: drugId,
      quantity: qty,
      batch_no: meta.batchNo || '-',
      expiry_date: meta.expiry || null,
      purchase_price: parseFloat(meta.cost) || 0,
      received_at: new Date().toISOString()
    }]);
    if(insertErr) throw insertErr;

    // Update aggregate
    const { data: cat } = await supabase.from('drug_catalog').select('current_stock').eq('id', drugId).single();
    await supabase.from('drug_catalog').update({
       current_stock: (cat?.current_stock || 0) + qty
    }).eq('id', drugId);

    // Track transaction natively
    await supabase.from('inventory_transactions').insert([{
      item_id: null,
      notes: `Drug ID ${drugId} - ${meta.batchNo}`,
      txn_type: 'receive', quantity: qty,
      cost: parseFloat(meta.cost) || 0, performed_by: meta.userId,
    }]);

    // Resolve any low stock notifications
    await notificationService.resolve(drugId, 'stock');
  },

  async dispense(prescriptionId, itemUpdates, allDone) {
    for (const upd of itemUpdates) {
      if(!upd.toDispense) continue;
      // 1. Mark dispensed locally
      const { data: pi } = await supabase.from('prescription_items').select('quantity_dispensed').eq('id', upd.id).single();
      await supabase.from('prescription_items')
        .update({ quantity_dispensed: (pi?.quantity_dispensed || 0) + upd.toDispense })
        .eq('id', upd.id);

      // 2. Reduce aggregate stock from drug_catalog (if drug is linked)
      if (upd.drug_id) {
        const { data: dc } = await supabase.from('drug_catalog').select('current_stock').eq('id', upd.drug_id).single();
        if(dc) {
           await supabase.from('drug_catalog').update({
              current_stock: Math.max(0, (dc.current_stock || 0) - upd.toDispense)
           }).eq('id', upd.drug_id);
        }
      }
    }
    await supabase.from('prescriptions').update({
      status: allDone ? 'dispensed' : 'partial',
      dispensed_at: new Date().toISOString(),
    }).eq('id', prescriptionId);

    // Get details for notification
    const { data: rx } = await supabase.from('prescriptions').select('*, patients(*)').eq('id', prescriptionId).single();
    
    // Notify Doctor if dispensed
    if (allDone && rx) {
      await notificationService.create({
        title: 'Prescription Dispensed',
        message: `Medication for ${rx.patients?.first_name} ${rx.patients?.last_name} has been dispensed.`,
        userId: rx.prescribed_by,
        type: 'success',
        link: '/opd/queue',
        refId: rx.visit_id,
        refType: 'visit'
      });
    }

    // Check for Low Stock alerts
    for (const upd of itemUpdates) {
      if (!upd.drug_id) continue;
      const { data: dc } = await supabase.from('drug_catalog').select('name, current_stock, reorder_level').eq('id', upd.drug_id).single();
      if (dc && dc.current_stock <= dc.reorder_level) {
        await notificationService.create({
          title: 'Low Stock Alert',
          message: `Stock for ${dc.name} is low (${dc.current_stock} remaining). Reorder recommended.`,
          role: 'pharmacy',
          type: 'warning',
          link: '/inventory',
          refId: upd.drug_id,
          refType: 'stock'
        });
      }
    }
  },
};
