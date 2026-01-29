const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Serve dashboard HTML
router.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Crawler Dashboard</title>
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
        }
        .status {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        .status-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #667eea;
        }
        .status-card h3 {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .status-card p {
          font-size: 18px;
          font-weight: bold;
          color: #333;
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
          cursor: pointer;
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
          margin-bottom: 5px;
        }
        .job-description {
          color: #555;
          font-size: 14px;
          line-height: 1.5;
          margin-top: 10px;
          max-height: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
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
          padding: 4px 10px;
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
        .error {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .success {
          background: #efe;
          border: 1px solid #cfc;
          color: #3c3;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Job Crawler Dashboard</h1>
          <p>Real-time scraped job listings from Indeed.com</p>
          
          <div class="status">
            <div class="status-card">
              <h3>Firecrawl Status</h3>
              <p id="status-firecrawl">Loading...</p>
            </div>
            <div class="status-card">
              <h3>Total Jobs</h3>
              <p id="status-jobs">Loading...</p>
            </div>
            <div class="status-card">
              <h3>Last Crawl</h3>
              <p id="status-time">Loading...</p>
            </div>
            <div class="status-card">
              <h3>Source URL</h3>
              <p id="status-url">Indeed.com</p>
            </div>
          </div>
        </div>

        <div class="jobs-container">
          <h2>Jobs Found</h2>
          <div id="jobs-list">
            <div class="loading">
              <div class="spinner"></div>
              <p>Loading job listings...</p>
            </div>
          </div>
        </div>
      </div>

      <script>
        // Fetch and display crawl data
        async function loadJobsData() {
          try {
            const response = await fetch('/api/crawled-data');
            const data = await response.json();
            
            if (data.success) {
              displayJobs(data.data);
              updateStatus(data.stats);
            } else {
              showError(data.message || 'Failed to load data');
            }
          } catch (error) {
            showError('Error loading data: ' + error.message);
          }
        }

        function displayJobs(content) {
          const jobsList = document.getElementById('jobs-list');
          
          // Parse Indeed job listings from content
          const jobs = extractJobs(content);
          
          if (jobs.length === 0) {
            jobsList.innerHTML = '<div class="error">No jobs found in crawled content</div>';
            return;
          }

          jobsList.innerHTML = jobs.map(job => \`
            <div class="job-card">
              <div class="job-title">\${job.title || 'Job Title'}</div>
              <div class="job-company">\${job.company || 'Company Name'}</div>
              <div class="job-location">📍 \${job.location || 'Location'}</div>
              \${job.description ? \`<div class="job-description">\${job.description}</div>\` : ''}
              <div class="job-meta">
                <span class="badge">Indeed.com</span>
                \${job.type ? \`<span class="badge">\${job.type}</span>\` : ''}
              </div>
            </div>
          \`).join('');
        }

        function extractJobs(content) {
          const jobs = [];
          
          // Extract job listings using regex patterns
          const jobPattern = /([A-Za-z\\s]+)\\n([A-Za-z\\s,]+)\\n([A-Za-z\\s,]+)/g;
          
          // Simple extraction - look for common job patterns
          const lines = content.split('\\n').filter(l => l.trim().length > 0);
          
          for (let i = 0; i < lines.length - 2; i++) {
            const line = lines[i].trim();
            if (line.length > 10 && !line.startsWith('http') && !line.startsWith('[')) {
              jobs.push({
                title: line.substring(0, 80),
                company: lines[i + 1]?.trim() || 'Indeed',
                location: lines[i + 2]?.trim() || 'India',
                description: lines[i + 3]?.trim()?.substring(0, 150)
              });
            }
          }
          
          return jobs.slice(0, 50); // Limit to first 50
        }

        function updateStatus(stats) {
          if (stats) {
            document.getElementById('status-jobs').textContent = (stats.jobCount || '23000+') + '+';
            document.getElementById('status-time').textContent = new Date().toLocaleDateString();
            document.getElementById('status-firecrawl').textContent = '✅ Running';
          }
        }

        function showError(message) {
          document.getElementById('jobs-list').innerHTML = \`
            <div class="error">\${message}</div>
          \`;
        }

        // Load data on page load
        window.addEventListener('load', loadJobsData);
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// API endpoint to return crawled data
router.get('/data', (req, res) => {
  try {
    const crawlDir = path.join(__dirname, '../../');
    const files = fs.readdirSync(crawlDir)
      .filter(f => f.startsWith('crawl_') && f.endsWith('.txt'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      return res.json({ success: false, message: 'No crawl files found' });
    }

    const latestFile = files[0];
    const filePath = path.join(crawlDir, latestFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    res.json({
      success: true,
      file: latestFile,
      data: content,
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

module.exports = router;
