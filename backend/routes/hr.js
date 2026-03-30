import { Router } from 'express';
import { requireRole } from '../middleware/rbac.js';
import * as ctrl from '../controllers/hr.js';

const router = Router();
router.get('/staff',          requireRole('admin','hr'), ctrl.list);
router.put('/staff/:id',      requireRole('admin','hr'), ctrl.updateProfile);
router.get('/departments',    ctrl.getDepartments);
router.post('/users',         requireRole('admin','hr'), ctrl.createUser);
router.put('/users/:id/role', requireRole('admin','hr'), ctrl.assignRole);
export default router;
