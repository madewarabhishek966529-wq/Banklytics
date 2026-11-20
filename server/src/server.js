import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`[Banklytics Server] Running on http://localhost:${PORT}`);
    console.log(`[Banklytics Server] API Base: http://localhost:${PORT}/api/v1`);
  });

  // Attempt database connection in background
  connectDB().catch((error) => {
    console.warn(`[Banklytics Server] MongoDB connection notice: ${error.message}`);
    console.warn(`[Banklytics Server] Please ensure MongoDB is running at ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banklytics'}.`);
  });

  return server;
}

startServer();
