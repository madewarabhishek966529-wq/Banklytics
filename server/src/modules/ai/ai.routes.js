import express from 'express';
import { getAIStatus, handleAIChat, getFinancialInsights } from './ai.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/status', getAIStatus);
router.post('/chat', handleAIChat);
router.get('/insights', getFinancialInsights);

export default router;
