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
import shaRouter        from './sha.js';
import mpesaRouter      from './mpesa.js';
import icd11Router      from './icd11.js';

const router = Router();

// ── Public routes (no auth) ───────────────────────────────────────────────────
// Safaricom callback must be reachable without a Bearer token
router.post('/mpesa/callback', (req, res, next) => {
  // Import and call directly to bypass authenticate middleware
  import('../controllers/mpesa.js').then(m => m.handleCallback(req, res, next));
});

// ── All other API routes require authentication ───────────────────────────────
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
router.use('/sha',       shaRouter);
router.use('/mpesa',     mpesaRouter);
router.use('/icd11',     icd11Router);

export default router;
