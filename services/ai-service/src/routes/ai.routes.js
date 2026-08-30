import {Router} from 'express';

import { createAgenda, generateSummary, generateActionItems } from '../controllers/ai.controller.js';
import { searchDocuments } from '../controllers/document.controller.js';
import verifyJWT from '../middleware/auth.middleware.js';

const router = Router();

router.post('/generate-agenda', createAgenda);
router.post('/generate-summary', generateSummary);
router.post('/generate-action-items', generateActionItems);
router.post('/search', verifyJWT, searchDocuments);

export default router;