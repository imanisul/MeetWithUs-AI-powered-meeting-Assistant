import { Router } from 'express';
import verifyJWT from '../middleware/auth.middleware.js'
import { createMeeting, updateAI, getMeetings, getMeetingById, updateMeeting } from '../controllers/meeting.controller.js';
import { getAnalytics } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/analytics', verifyJWT, getAnalytics);
router.get('/', verifyJWT, getMeetings);
router.get('/:id', verifyJWT, getMeetingById);
router.post('/', verifyJWT, createMeeting);
router.put('/:id/ai', updateAI);
router.patch('/:id', verifyJWT, updateMeeting);

export default router;


