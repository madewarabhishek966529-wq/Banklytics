import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`[Banklytics Server] Running on http://localhost:${PORT}`);
    console.log(`[Banklytics Server] API Base: http://localhost:${PORT}/api/v1`);
    console.log(`[Banklytics Server] Local storage: JSON-backed (no MongoDB required)`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Banklytics Server] Port ${PORT} is busy. Automatically freeing port...`);
    } else {
      console.error(`[Banklytics Server] Server error: ${err.message}`);
    }
  });

  return server;
}

startServer();
