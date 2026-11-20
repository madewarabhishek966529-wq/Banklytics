import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './modules/auth/auth.routes.js';
import statementRoutes from './modules/statements/statements.routes.js';
import transactionRoutes from './modules/transactions/transactions.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Basic security headers
  app.use(helmet());

  // CORS configuration
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parsers
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());

  // Rate limiting for auth and uploads
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later',
      },
    },
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Base API routes
  const apiRouter = express.Router();
  apiRouter.use('/auth', authLimiter, authRoutes);
  apiRouter.use('/statements', statementRoutes);
  apiRouter.use('/transactions', transactionRoutes);
  apiRouter.use('/analytics', analyticsRoutes);

  app.use('/api/v1', apiRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found`,
      },
    });
  });

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}
