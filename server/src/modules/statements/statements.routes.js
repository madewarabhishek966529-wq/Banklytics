import express from 'express';
import {
  previewStatement,
  confirmStatement,
  getStatements,
  getStatementById,
  deleteStatement,
  getStatementTransactions,
} from './statements.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';

const router = express.Router();

// Apply auth to all statement endpoints
router.use(authenticate);

router.post('/preview', upload.single('file'), previewStatement);
router.post('/confirm', confirmStatement);
router.get('/', getStatements);
router.get('/:id', getStatementById);
router.delete('/:id', deleteStatement);
router.get('/:id/transactions', getStatementTransactions);

export default router;
