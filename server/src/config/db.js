import { initDB } from '../data/store.js';

export async function connectDB() {
  initDB();
  return true;
}

export async function disconnectDB() {
  return true;
}
