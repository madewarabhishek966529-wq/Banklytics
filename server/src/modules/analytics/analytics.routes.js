import express from 'express';
import {
  getSummary,
  getMonthlyTrends,
  getCategoryBreakdown,
  getTopMerchants,
  getTransferAnalysis,
  getTopTransactions,
  downloadPDFReport,
  downloadExcelReport,
} from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyTrends);
router.get('/categories', getCategoryBreakdown);
router.get('/merchants', getTopMerchants);
router.get('/transfers', getTransferAnalysis);
router.get('/top-transactions', getTopTransactions);
router.get('/report/pdf', downloadPDFReport);
router.get('/report/excel', downloadExcelReport);

export default router;
