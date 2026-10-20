import mongoose from "mongoose";
import { CONFIG } from "./config.js";

// Turn off buffering to immediately fail and reveal the REAL driver error if the URI or credentials are bad
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);

// ---------------------------------------------------------------------------
// Serverless-safe DB connection.
// Vercel reuses warm function instances between invocations but does NOT keep
// a persistent process running like a traditional server. We cache the
// connection (and the email config load) on the module scope so a warm
// invocation reuses them, and only reconnect when actually needed.
// ---------------------------------------------------------------------------
let dbConnectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<void> {
  // Already connected on this warm instance
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // A connection attempt is already in flight — reuse it instead of racing
  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose
      .connect(CONFIG.MONGO_URI as string, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((conn) => {
        console.log('✅ Connected to DB');
        return conn;
      })
      .catch((err) => {
        // Reset so the next request can retry instead of being stuck on a dead promise
        dbConnectionPromise = null;
        throw err;
      });
  }

  await dbConnectionPromise;

}