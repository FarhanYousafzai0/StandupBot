import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoConnectUri, {
    serverSelectionTimeoutMS: 10_000,
  });
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/** Connected or still connecting — Mongoose buffers operations while connecting. */
export function isDbReadyForApi() {
  const s = mongoose.connection.readyState;
  return s === 1 || s === 2;
}
