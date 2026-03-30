import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

import patientsRouter   from './patients.js';
import opdRouter        from './opd.js';
import labRouter        from './lab.js';
import pharmacyRouter   from './pharmacy.js';
import ipdRouter        from './ipd.js';
import billingRouter    from './billing.js';
import hrRouter         from './hr.js';
import reportsRouter    from './reports.js';
import inventoryRouter  from './inventory.js';

const router = Router();

// All API routes require authentication
router.use(authenticate);

router.use('/patients',  patientsRouter);
router.use('/opd',       opdRouter);
router.use('/lab',       labRouter);
router.use('/pharmacy',  pharmacyRouter);
router.use('/ipd',       ipdRouter);
router.use('/billing',   billingRouter);
router.use('/hr',        hrRouter);
router.use('/reports',   reportsRouter);
router.use('/inventory', inventoryRouter);

export default router;
