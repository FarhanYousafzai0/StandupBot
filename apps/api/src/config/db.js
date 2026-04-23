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

/** Only serve API requests when MongoDB is fully connected. */
export function isDbReadyForApi() {
  return mongoose.connection.readyState === 1;
}
