import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`[Banklytics Server] Running on http://localhost:${PORT}`);
      console.log(`[Banklytics Server] API Base: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('[Banklytics Server] Failed to start:', error.message);
    process.exit(1);
  }
}

startServer();
