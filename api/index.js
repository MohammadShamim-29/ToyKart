import mongoose from "mongoose";
import app from "../server/src/app.js";

const buildMongoUri = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const host = process.env.MONGO_HOST || "127.0.0.1";
  const port = process.env.MONGO_PORT || "27017";
  const db = process.env.MONGO_DB || "toykart";
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const authSource = process.env.MONGO_AUTH_SOURCE || "admin";
  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}?authSource=${authSource}`;
  }
  return `mongodb://${host}:${port}/${db}`;
};

let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) return;
  try {
    cachedDb = await mongoose.connect(buildMongoUri());
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
}

connectDB();

export default app;
