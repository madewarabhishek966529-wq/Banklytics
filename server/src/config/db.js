import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banklytics';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      return null;
    }
    // Attempt local in-memory fallback if supported, without breaking if unavailable
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: { dbName: 'banklytics' },
      });
      const memoryUri = mongod.getUri();
      console.log(`[MongoDB] Started in-memory MongoDB fallback at ${memoryUri}`);
      const conn = await mongoose.connect(memoryUri);
      return conn;
    } catch (fallbackError) {
      throw error;
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
