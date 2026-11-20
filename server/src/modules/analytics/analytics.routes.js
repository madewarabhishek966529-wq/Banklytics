import express from 'express';
import {
  getSummary,
  getMonthlyTrends,
  getCategoryBreakdown,
  getTopTransactions,
} from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyTrends);
router.get('/categories', getCategoryBreakdown);
router.get('/top-transactions', getTopTransactions);

export default router;
