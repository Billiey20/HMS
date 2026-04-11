import { Router } from 'express';
import { verifyEligibility, lookupRegistry, registerInRegistry, getSettings } from '../controllers/sha.js';

const router = Router();

router.post('/verify',             verifyEligibility);
router.post('/registry/lookup',    lookupRegistry);
router.post('/registry/register',  registerInRegistry);
router.get('/settings',            getSettings);

export default router;
