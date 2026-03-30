import { Router } from 'express';
import { requireRole } from '../middleware/rbac.js';
import * as ctrl from '../controllers/pharmacy.js';

const router = Router();
router.get('/prescriptions', requireRole('admin','pharmacy','doctor'), ctrl.listPrescriptions);
router.get('/stock',         requireRole('admin','pharmacy'), ctrl.listDrugStock);
router.put('/dispense/:id',  requireRole('admin','pharmacy'), ctrl.dispense);
export default router;
