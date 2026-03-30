import { Router } from 'express';
import { requireRole } from '../middleware/rbac.js';
import * as ctrl from '../controllers/ipd.js';

const router = Router();
router.get('/occupancy',         ctrl.getBedOccupancy);
router.get('/beds',              ctrl.listBeds);
router.get('/admissions',        ctrl.listAdmissions);
router.post('/admissions',       requireRole('admin','doctor','nurse'), ctrl.admit);
router.put('/admissions/:id/discharge', requireRole('admin','doctor'), ctrl.discharge);
router.post('/notes',            requireRole('admin','doctor','nurse'), ctrl.addNote);
router.post('/vitals',           requireRole('admin','nurse'), ctrl.addVitals);
export default router;
