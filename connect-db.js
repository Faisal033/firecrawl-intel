require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

// Use Cloudflare DNS (1.1.1.1) as fallback
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

async function connectDB() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas with alternate DNS...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('\n⚠️  Try these solutions:');
    console.log('   1. Restart your router');
    console.log('   2. Run PowerShell as Administrator and execute:');
    console.log('      netsh interface ipv4 set dnsservers "Wi-Fi" static 8.8.8.8 primary');
    console.log('   3. Contact your network admin if on corporate network');
    console.log('   4. Try mobile hotspot to test if it works on different network');
    process.exit(1);
  }
}

connectDB();
