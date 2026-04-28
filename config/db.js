
// const mongoose = require("mongoose");

// let isConnected = false;

// async function connectDB() {
//   if (isConnected) {
//     console.log("✅ Using existing MongoDB connection");
//     return;
//   }

//   try {
//     const db = await mongoose.connect(process.env.MONGODB_URI);

//     isConnected = db.connections[0].readyState === 1;

//     console.log("✅ MongoDB connected successfully");
//   } catch (error) {
//     console.error("❌ MongoDB connection failed:", error.message);
//   }
// }

// module.exports = connectDB;

// config/db.js
const mongoose = require('mongoose');

let cached = global.mongooseConn || { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    // optional: tune timeouts (Lambda friendly)
    const opts = {
      serverSelectionTimeoutMS: 10000, // 10s
      maxPoolSize: 10,
    };
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then(m => m.connection);
  }
  cached.conn = await cached.promise;
  console.log('✅ MongoDB connected');
  return cached.conn;
}

global.mongooseConn = cached;
module.exports = connectDB;
