require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Use public DNS servers to bypass router DNS issues
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('⚠️  Continuing without database connection...');
    // Don't exit - allow app to run without DB for now
    return null;
  }
}

module.exports = connectDB;
