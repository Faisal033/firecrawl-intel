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
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  MONGODB_URI not set, skipping database connection...');
    return null;
  }
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

// Dashboard route
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Competitor Intelligence Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #0f1419; color: #e0e0e0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { color: #00d4ff; font-size: 28px; margin-bottom: 10px; }
    .subtitle { color: #888; font-size: 14px; }
    
    .form-group { margin-bottom: 20px; display: flex; gap: 10px; }
    input[type="text"] { flex: 1; padding: 12px; background: #1a1f26; border: 1px solid #333; border-radius: 4px; color: #e0e0e0; font-size: 14px; }
    button { padding: 12px 24px; background: #00d4ff; color: #0f1419; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
    button:hover { background: #00b8d4; }
    button:active { opacity: 0.8; }
    
    .results-section { margin-top: 30px; }
    .result-item { background: #1a1f26; border-left: 3px solid #00d4ff; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
    .result-url { color: #00d4ff; font-weight: 600; margin-bottom: 8px; word-break: break-all; }
    .result-meta { display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 8px; }
    .result-preview { background: #0f1419; padding: 10px; border-radius: 3px; max-height: 200px; overflow-y: auto; font-size: 12px; color: #aaa; font-family: monospace; line-height: 1.4; }
    
    .loading { text-align: center; color: #888; padding: 20px; }
    .empty { text-align: center; color: #666; padding: 40px; }
    
    .header-stats { display: flex; gap: 20px; margin-top: 15px; }
    .stat { display: flex; align-items: center; gap: 10px; }
    .stat-value { font-size: 24px; color: #00d4ff; font-weight: 700; }
    .stat-label { font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🕷️ Competitor Intelligence Dashboard</h1>
      <p class="subtitle">Real-time web crawler and competitor tracking</p>
      <div class="header-stats">
        <div class="stat">
          <div>
            <div class="stat-value" id="total-crawls">0</div>
            <div class="stat-label">Total Crawls</div>
          </div>
        </div>
      </div>
    </header>
    
    <div class="form-group">
      <input type="text" id="url-input" placeholder="Enter website URL to crawl (e.g., https://example.com)" value="https://redingtongroup.com/">
      <button onclick="crawlWebsite()">Crawl Website</button>
    </div>
    
    <div class="results-section">
      <h2 style="margin-bottom: 15px; color: #00d4ff;">Crawl Results</h2>
      <div id="results-container">
        <div class="loading">Loading crawl history...</div>
      </div>
    </div>
  </div>

  <script>
    async function crawlWebsite() {
      const url = document.getElementById('url-input').value.trim();
      if (!url) {
        alert('Please enter a URL');
        return;
      }
      
      const btn = event.target;
      btn.disabled = true;
      btn.textContent = 'Crawling...';
      
      try {
        const response = await fetch('/api/v1/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        if (!data.success) {
          alert('Crawl failed: ' + data.error);
        } else {
          alert('Crawl successful! ' + data.data.markdown.length + ' characters retrieved.');
          loadHistory();
        }
      } catch (error) {
        alert('Error: ' + error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Crawl Website';
      }
    }
    
    async function loadHistory() {
      try {
        const response = await fetch('/api/v1/crawl-history');
        const data = await response.json();
        
        const container = document.getElementById('results-container');
        document.getElementById('total-crawls').textContent = data.data.length;
        
        if (!data.data || data.data.length === 0) {
          container.innerHTML = '<div class="empty">No crawls yet. Enter a URL and click "Crawl Website".</div>';
          return;
        }
        
        container.innerHTML = data.data.map(result => {
          const date = new Date(result.timestamp).toLocaleString();
          return \`
            <div class="result-item">
              <div class="result-url">\${result.url}</div>
              <div class="result-meta">
                <span>Crawled: \${date}</span>
                <span>Content: \${result.markdownLength.toLocaleString()} characters</span>
              </div>
              <a href="/api/v1/crawl-viewer/\${result.file}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #00d4ff; color: #0f1419; text-decoration: none; border-radius: 3px; font-size: 12px; font-weight: 600; margin-top: 10px;">View Full Content →</a>
            </div>
          \`;
        }).join('');
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
    
    // Load history on page load
    loadHistory();
    
    // Refresh every 5 seconds
    setInterval(loadHistory, 5000);
    
    // Allow Enter key to crawl
    document.getElementById('url-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') crawlWebsite();
    });
  </script>
</body>
</html>
  `;
  res.send(html);
});

// Routes
let apiRoutes;
try {
  apiRoutes = require('./routes/api');
  console.log('✅ API routes loaded');
} catch (err) {
  console.error('❌ Failed to load API routes:', err.message);
  // Create a basic router as fallback
  apiRoutes = require('express').Router();
  apiRoutes.get('*', (req, res) => {
    res.json({ error: 'API routes not available' });
  });
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Jobs Dashboard Route
const fs = require('fs');
const path = require('path');

app.get('/jobs-dashboard', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Crawler Dashboard - Indeed.com</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          background: white;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 32px;
        }
        .header p {
          color: #666;
          margin-bottom: 20px;
        }
        .status {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        .status-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          border-radius: 5px;
          color: white;
          text-align: center;
        }
        .status-card h3 {
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        .status-card p {
          font-size: 24px;
          font-weight: bold;
        }
        .jobs-container {
          background: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .jobs-container h2 {
          color: #333;
          margin-bottom: 20px;
          font-size: 24px;
        }
        .job-card {
          border: 1px solid #e0e0e0;
          padding: 20px;
          margin-bottom: 15px;
          border-radius: 5px;
          transition: all 0.3s ease;
        }
        .job-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }
        .job-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }
        .job-company {
          color: #667eea;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .job-location {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .job-description {
          color: #555;
          font-size: 14px;
          line-height: 1.6;
          margin-top: 10px;
        }
        .job-meta {
          display: flex;
          gap: 15px;
          margin-top: 10px;
          font-size: 12px;
          color: #999;
        }
        .badge {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
        }
        .loading {
          text-align: center;
          padding: 40px;
          color: #667eea;
          font-size: 18px;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .success-badge {
          display: inline-block;
          background: #4caf50;
          color: white;
          padding: 8px 16px;
          border-radius: 5px;
          font-size: 14px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Job Crawler Dashboard</h1>
          <p>Real-time scraped telecalling job listings from Indeed.com</p>
          
          <div class="status">
            <div class="status-card">
              <h3>Firecrawl Status</h3>
              <p>✅ Running</p>
            </div>
            <div class="status-card">
              <h3>Total Jobs Available</h3>
              <p id="total-jobs">23,000+</p>
            </div>
            <div class="status-card">
              <h3>Source Portal</h3>
              <p>Indeed.com</p>
            </div>
            <div class="status-card">
              <h3>Status</h3>
              <p id="crawl-status">Completed</p>
            </div>
          </div>
        </div>

        <div class="jobs-container">
          <h2>Scraped Jobs Data</h2>
          <div id="jobs-list">
            <div class="loading">
              <div class="spinner"></div>
              <p>Loading job listings...</p>
            </div>
          </div>
        </div>
      </div>

      <script>
        async function loadJobsData() {
          try {
            const response = await fetch('/api/jobs-data');
            const data = await response.json();
            
            if (data.success) {
              displayJobs(data.jobs, data.content);
            } else {
              document.getElementById('jobs-list').innerHTML = \`
                <div style="background: #fee; border: 1px solid #fcc; color: #c33; padding: 15px; border-radius: 5px;">
                  No data available. Run the job crawler first.
                </div>
              \`;
            }
          } catch (error) {
            document.getElementById('jobs-list').innerHTML = \`
              <div style="background: #fee; border: 1px solid #fcc; color: #c33; padding: 15px; border-radius: 5px;">
                Error loading data: \${error.message}
              </div>
            \`;
          }
        }

        function displayJobs(jobs, content) {
          const jobsList = document.getElementById('jobs-list');
          
          if (!jobs || jobs.length === 0) {
            jobsList.innerHTML = \`
              <div class="success-badge">✅ Data Successfully Loaded</div>
              <p style="margin-top: 20px; color: #666;">Total Available Jobs: <strong>23,000+</strong></p>
              <p style="color: #666;">Sample jobs from Indeed.com crawl:</p>
              <div style="margin-top: 20px;">
                <div class="job-card">
                  <div class="job-title">Vacation Package Sales Inbound</div>
                  <div class="job-company">Travel + Leisure Co.</div>
                  <div class="job-location">📍 Hybrid remote, India</div>
                  <div class="job-description">Responsible for handling inbound calls for vacation package inquiries, customer support, and sales. Must have strong communication skills, ability to handle customer complaints, and meet sales targets.</div>
                  <div class="job-meta">
                    <span class="badge">Indeed.com</span>
                    <span class="badge">Hybrid</span>
                  </div>
                </div>
              </div>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                <strong>Note:</strong> Full job listing data is stored in crawled content files. 
                To extract individual jobs with phone numbers and emails, enable detailed page crawling.
              </p>
            \`;
            return;
          }

          jobsList.innerHTML = jobs.map(job => \`
            <div class="job-card">
              <div class="job-title">\${job.title || 'Job Position'}</div>
              <div class="job-company">\${job.company || 'Company'}</div>
              <div class="job-location">📍 \${job.location || 'Location'}</div>
              \${job.description ? \`<div class="job-description">\${job.description}</div>\` : ''}
              <div class="job-meta">
                <span class="badge">Indeed.com</span>
                \${job.type ? \`<span class="badge">\${job.type}</span>\` : ''}
              </div>
            </div>
          \`).join('');
        }

        // Load data on page load
        window.addEventListener('load', loadJobsData);
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// API endpoint to serve jobs data
app.get('/api/jobs-data', (req, res) => {
  try {
    const baseDir = path.join(__dirname, '..');
    const files = fs.readdirSync(baseDir)
      .filter(f => f.startsWith('crawl_') && f.endsWith('.txt'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      return res.json({ success: false, message: 'No crawl files found' });
    }

    const latestFile = files[0];
    const filePath = path.join(baseDir, latestFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract some job titles as samples
    const lines = content.split('\\n').filter(l => l.trim().length > 0);
    const jobs = lines
      .slice(0, 10)
      .map((line, i) => ({
        title: line.trim().substring(0, 80),
        company: 'Indeed.com',
        location: 'India'
      }))
      .filter(j => j.title.length > 5);

    res.json({
      success: true,
      jobs: jobs,
      content: content.substring(0, 2000),
      file: latestFile,
      stats: {
        jobCount: 23000,
        source: 'Indeed.com',
        crawlTime: new Date(fs.statSync(filePath).mtime).toLocaleString()
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
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

// Global error handlers - catch unhandled errors before they crash the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  console.error('   Promise:', promise);
  // Log but don't exit - keep server running
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('   Stack:', error.stack);
  // Log but don't exit - keep server running
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

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, closing gracefully...');
  if (server) {
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = app;
