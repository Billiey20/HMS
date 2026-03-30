import { Router } from 'express';
import { adminOnly } from '../middleware/rbac.js';
import * as ctrl from '../controllers/reports.js';

const router = Router();
router.get('/summary', adminOnly, ctrl.summary);
export default router;
