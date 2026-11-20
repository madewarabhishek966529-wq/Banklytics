import express from 'express';
import {
  getTransactions,
  updateTransaction,
  deleteTransaction,
  exportTransactionsCSV,
} from './transactions.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getTransactions);
router.get('/export', exportTransactionsCSV);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
