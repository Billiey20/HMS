import { Router } from 'express';
import { searchICD11 } from '../controllers/icd11.js';

const router = Router();

// GET /api/v1/icd11/search?q=<term>
router.get('/search', searchICD11);

export default router;
