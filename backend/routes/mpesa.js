import { Router } from 'express';
import { initiateSTKPush, handleCallback, getTransactionStatus } from '../controllers/mpesa.js';

const router = Router();

// STK Push initiation (requires auth — called by logged-in HMS user)
router.post('/stk',               initiateSTKPush);

// Status polling (requires auth)
router.get('/status/:checkoutId', getTransactionStatus);

// Safaricom callback — NO auth middleware (Safaricom calls this externally)
// This route is registered WITHOUT authenticate middleware in routes/index.js
router.post('/callback',          handleCallback);

export default router;
