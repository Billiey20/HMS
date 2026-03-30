import { Router } from 'express';
import { requireRole } from '../middleware/rbac.js';
import * as ctrl from '../controllers/lab.js';

const router = Router();
router.get('/',             requireRole('admin','lab_staff','doctor'), ctrl.list);
router.post('/',            requireRole('admin','doctor'), ctrl.create);
router.put('/:id/status',   requireRole('admin','lab_staff'), ctrl.updateStatus);
router.put('/:id/results',  requireRole('admin','lab_staff'), ctrl.saveResults);
export default router;
