import { Router } from 'express';
import { requireRole } from '../middleware/rbac.js';
import * as ctrl from '../controllers/inventory.js';

const router = Router();
router.get('/',          requireRole('admin','pharmacy'), ctrl.list);
router.post('/receive',  requireRole('admin','pharmacy'), ctrl.receive);
router.post('/issue',    requireRole('admin','pharmacy'), ctrl.issue);
router.get('/history',   requireRole('admin','pharmacy'), ctrl.transactions);
export default router;
