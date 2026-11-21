import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  changePassword,
  deleteAccount,
  loginDemo,
} from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/demo', loginDemo);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);

export default router;
