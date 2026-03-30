import { Router } from 'express';
import * as ctrl from '../controllers/patients.js';

const router = Router();
router.get('/',     ctrl.list);
router.get('/:id',  ctrl.get);
router.post('/',    ctrl.create);
router.put('/:id',  ctrl.update);
export default router;
