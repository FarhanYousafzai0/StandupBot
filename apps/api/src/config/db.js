import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.MONGODB_URI);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("MongoDB connection failed:", message);
    process.exit(1);
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
