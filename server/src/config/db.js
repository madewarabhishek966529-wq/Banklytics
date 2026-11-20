import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banklytics';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Primary connection failed (${error.message}). Checking environment...`);
    if (process.env.NODE_ENV === 'test') {
      console.log('[MongoDB] Running in test mode; database handled by test runner.');
      return null;
    }
    // Attempt local in-memory fallback for local development if standard MongoDB isn't running
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      console.log(`[MongoDB] Started in-memory MongoDB fallback at ${memoryUri}`);
      const conn = await mongoose.connect(memoryUri);
      return conn;
    } catch (fallbackError) {
      console.error('[MongoDB] Connection error and in-memory fallback failed:', fallbackError.message);
      throw error;
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
