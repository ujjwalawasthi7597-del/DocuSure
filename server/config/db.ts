import mongoose from 'mongoose';

let isConnected = false;
let usingFallback = false;

export async function connectDB(): Promise<{ isConnected: boolean; usingFallback: boolean }> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.log('[Database] No MONGODB_URI provided. Initializing DocuSure resilient document store.');
    usingFallback = true;
    return { isConnected: false, usingFallback: true };
  }

  try {
    console.log('[Database] Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    usingFallback = false;
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return { isConnected: true, usingFallback: false };
  } catch (error: any) {
    console.warn(`[Database] MongoDB connection failed (${error.message}). Falling back to DocuSure resilient document store.`);
    usingFallback = true;
    return { isConnected: false, usingFallback: true };
  }
}

export function getDBStatus() {
  return {
    isConnected,
    usingFallback,
    mongooseState: mongoose.connection.readyState,
  };
}
