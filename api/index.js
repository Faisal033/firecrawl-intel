module.exports = (req, res) => {
  // Vercel serverless function entry point
  // This is handled by the main app.js Express server
  res.status(200).json({
    status: 'ok',
    message: 'Competitor Intelligence API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      crawl: '/api/v1/crawl',
      health: '/api/v1/health',
      jobs: '/api/v1/jobs'
    }
  });
};
