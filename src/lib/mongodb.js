// lib/mongodb.js
import mongoose from "mongoose";

const uri =
  process.env.NODE_ENV === "development"
    ? process.env.MONGODB_URI_LOCAL
    : process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

let isConnected = null; // track connection state

export async function connectMongo() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(uri, {
      bufferCommands: false,
    });
    isConnected = conn.connections[0].readyState === 1;
    console.log("✅ MongoDB connected:", uri.includes("127.0.0.1") ? "Local" : "Atlas");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}
