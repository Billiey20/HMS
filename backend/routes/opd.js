import { Router } from 'express';
import * as ctrl from '../controllers/opd.js';

const router = Router();
router.get('/queue',        ctrl.getQueue);
router.post('/visits',      ctrl.createVisit);
router.get('/visits/:id',   ctrl.getVisit);
router.put('/visits/:id/status', ctrl.updateStatus);
export default router;
