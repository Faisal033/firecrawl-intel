const express = require('express');
const dns = require('dns');
require('dotenv').config();

// Use public DNS to bypass router issues
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

const PORT = process.env.PORT || 3001;

// ============================================
// DATABASE CONNECTION
// ============================================
const mongoose = require('mongoose');

const connectDB = async () => {
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
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    console.log('⚠️  Continuing without database connection...');
    return null;
  }
};

// Connect to DB
connectDB();

// ============================================
// EXPRESS APP
// ============================================
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Routes
const apiRoutes = require('./routes/api');

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend server is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'Competitor Intelligence API',
    version: '1.0.0',
    endpoints: {
      competitors: 'GET/POST /api/competitors',
      discover: 'POST /api/competitors/:id/discover',
      scrape: 'POST /api/competitors/:id/scrape',
      news: 'GET /api/competitors/:id/news',
      signals: 'GET /api/competitors/:id/signals',
      threat: 'GET /api/competitors/:id/threat',
      dashboard: 'GET /api/dashboard/overview',
      hotspots: 'GET /api/geography/hotspots',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Health: GET http://localhost:${PORT}/health`);
  console.log(`📡 API Docs: GET http://localhost:${PORT}/api\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

module.exports = app;
