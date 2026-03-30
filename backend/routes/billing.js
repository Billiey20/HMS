import { Router } from 'express';
import { requireRole } from '../middleware/rbac.js';
import * as ctrl from '../controllers/billing.js';

const router = Router();
router.get('/',           requireRole('admin','billing'), ctrl.list);
router.post('/',          requireRole('admin','billing'), ctrl.create);
router.post('/payments',  requireRole('admin','billing'), ctrl.recordPayment);
export default router;
