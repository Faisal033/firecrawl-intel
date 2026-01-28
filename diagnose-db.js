const dns = require('dns').promises;
const net = require('net');
require('dotenv').config();

async function diagnoseConnection() {
  console.log('🔍 MongoDB Atlas Connection Diagnostic\n');
  
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }
  
  console.log('📝 Environment Variables:');
  console.log(`   MONGODB_URI: ${mongoUri.substring(0, 50)}...`);
  console.log(`   PORT: ${process.env.PORT}\n`);
  
  // Extract hostname from connection string
  const match = mongoUri.match(/@([^/?]+)/);
  if (!match) {
    console.error('❌ Invalid MongoDB URI format');
    process.exit(1);
  }
  
  const hostname = match[1];
  console.log(`🌐 Hostname: ${hostname}\n`);
  
  // Test DNS resolution
  console.log('1️⃣  Testing DNS Resolution...');
  try {
    const addresses = await dns.resolve4(hostname);
    console.log(`   ✅ DNS resolved to: ${addresses.join(', ')}`);
  } catch (err) {
    console.error(`   ❌ DNS resolution failed: ${err.message}`);
    console.log('   💡 Tip: Check your internet connection or firewall settings\n');
    process.exit(1);
  }
  
  // Test TCP connection to MongoDB SRV record
  console.log('\n2️⃣  Testing TCP Connection...');
  try {
    const srvHost = hostname.replace(/:\d+$/, '');
    const socket = net.createConnection(27017, srvHost, { timeout: 5000 });
    
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log(`   ✅ TCP connection successful on port 27017`);
        socket.destroy();
        resolve();
      });
      socket.on('error', (err) => {
        reject(err);
      });
      socket.on('timeout', () => {
        reject(new Error('Connection timeout'));
      });
    });
  } catch (err) {
    console.error(`   ❌ TCP connection failed: ${err.message}`);
    console.log('   💡 Tip: Check your MongoDB Atlas IP whitelist\n');
  }
  
  // Test with mongoose
  console.log('\n3️⃣  Testing MongoDB Connection...');
  const mongoose = require('mongoose');
  
  try {
    await mongoose.connect(mongoUri, { 
      serverSelectionTimeoutMS: 5000,
    });
    console.log('   ✅ Successfully connected to MongoDB Atlas!');
    console.log(`   📦 Database: ${mongoose.connection.name}`);
    console.log(`   🏠 Host: ${mongoose.connection.host}`);
    await mongoose.disconnect();
    console.log('\n✨ All tests passed! Connection is working.');
  } catch (err) {
    console.error(`   ❌ MongoDB connection failed: ${err.message}`);
    console.log('\n⚠️  Troubleshooting steps:');
    console.log('   1. Check MongoDB Atlas network access (IP whitelist)');
    console.log('   2. Verify your internet connection');
    console.log('   3. Check firewall/antivirus settings');
    console.log('   4. Verify your connection string in .env file');
    console.log('   5. Ensure the cluster is active in MongoDB Atlas\n');
    process.exit(1);
  }
}

diagnoseConnection();
