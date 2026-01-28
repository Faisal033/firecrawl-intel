const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI not found in .env file');
  process.exit(1);
}

console.log('Connecting to MongoDB Atlas...');

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✓ Successfully connected to MongoDB Atlas!');
    console.log(`Database: ${mongoose.connection.name}`);
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('✗ MongoDB connection failed:');
    console.error(err.message);
    process.exit(1);
  });
