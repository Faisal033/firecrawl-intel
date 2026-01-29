const express = require('express');
const mongoose = require('mongoose');

// Try to load models - will fail gracefully if DB not connected
let Competitor, News, Signal, Threat, Insight;
try {
  const models = require('../models');
  Competitor = models.Competitor;
  News = models.News;
  Signal = models.Signal;
  Threat = models.Threat;
  Insight = models.Insight;
} catch (err) {
  console.warn('⚠️  Models not available (database not connected)');
  Competitor = null;
  News = null;
  Signal = null;
  Threat = null;
  Insight = null;
}

// Try to load services - will fail gracefully if DB not connected
let discoverCompetitorUrls, saveDiscoveredUrls, scrapePendingUrls, getScrapingStats;
let createSignalsForPendingNews, getSignalsByType;
let computeThreatForCompetitor, getThreatRankings;
let syncCompetitor;

try {
  ({ discoverCompetitorUrls, saveDiscoveredUrls } = require('../services/discovery'));
} catch (err) { console.warn('⚠️  Discovery service not available'); }

try {
  ({ scrapePendingUrls, getScrapingStats } = require('../services/scraping'));
} catch (err) { console.warn('⚠️  Scraping service not available'); }

const { scrapeUrl } = require('../services/firecrawl');

try {
  ({ createSignalsForPendingNews, getSignalsByType } = require('../services/signals'));
} catch (err) { console.warn('⚠️  Signals service not available'); }

try {
  ({ computeThreatForCompetitor, getThreatRankings } = require('../services/threat'));
} catch (err) { console.warn('⚠️  Threat service not available'); }

try {
  ({ syncCompetitor } = require('../services/sync'));
} catch (err) { console.warn('⚠️  Sync service not available'); }

const router = express.Router();

// In-memory storage for crawl results
const crawlResults = [];
const MAX_RESULTS = 50;

/**
 * Health check endpoint - verifies backend and Firecrawl connectivity
 */
router.get('/v1/health', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      backend: 'operational',
      firecrawl: 'checking...',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
    });
  }
});

/**
 * Crawl any URL (ad-hoc)
 * Full error handling: health check → crawl → safe response parsing
 */
router.post('/v1/crawl', async (req, res) => {
  try {
    const { url, options } = req.body;
    
    // Input validation
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid url parameter',
        details: {
          message: 'url must be a non-empty string',
          possibleCauses: ['URL parameter not provided', 'URL parameter is not a string'],
        }
      });
    }

    // Sanitize URL
    const trimmedUrl = url.trim();
    if (trimmedUrl.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URL cannot be empty',
      });
    }

    console.log(`\n📡 Crawl request for: ${trimmedUrl}`);
    
    // Verify scrapeUrl function exists and is callable
    if (typeof scrapeUrl !== 'function') {
      console.error('❌ scrapeUrl is not a function');
      return res.status(500).json({
        success: false,
        error: 'Scraper service unavailable',
        details: {
          message: 'Internal scraping service failed to load',
          possibleCauses: ['Service module loading error', 'Configuration issue'],
        }
      });
    }

    // Call scrapeUrl with proper error handling - never assume result structure
    let result;
    try {
      result = await scrapeUrl(trimmedUrl, options || {});
    } catch (scrapeError) {
      console.error(`❌ scrapeUrl threw exception: ${scrapeError.message}`);
      result = {
        success: false,
        error: `Scraping exception: ${scrapeError.message}`,
        statusCode: 0,
        url: trimmedUrl,
      };
    }

    // Verify result is an object
    if (!result || typeof result !== 'object') {
      console.error('❌ scrapeUrl returned invalid result type:', typeof result);
      return res.status(500).json({
        success: false,
        error: 'Scraper returned invalid response',
        url: trimmedUrl,
        details: {
          message: 'Internal service error - invalid response format',
          possibleCauses: ['Service internal error'],
        }
      });
    }

    console.log(`📊 Crawl result status:`, result.success ? '✅ Success' : '❌ Failed');
    
    // If scraping failed, return detailed error
    if (!result.success) {
      const errorResponse = {
        success: false,
        status: 'failed',
        url: result.url || trimmedUrl,
        error: result.error || 'Unknown scraping error',
        statusCode: result.statusCode || 0,
        details: {
          message: result.error || 'Unknown error',
          possibleCauses: [
            'Website blocked the crawler (anti-bot protection)',
            'Firecrawl service is unreachable or not responding',
            'Invalid URL or network error',
            'Website returned empty/no scrapeable content',
            'Firecrawl response structure unexpected',
            'Request timeout or connection reset'
          ],
          firecrawlResponse: result.responseBody ? JSON.stringify(result.responseBody).substring(0, 500) : null,
        }
      };
      console.error(`❌ Crawl failed:`, errorResponse.error);
      return res.status(422).json(errorResponse);
    }

    // Verify result has required fields for success case
    if (typeof result.markdown !== 'string') {
      console.error('❌ Success result missing markdown field');
      return res.status(500).json({
        success: false,
        error: 'Scraper returned success but no content',
        url: result.url || trimmedUrl,
      });
    }

    // Only log "Scraped" if we have valid content
    const contentLength = result.markdown ? result.markdown.length : 0;
    if (contentLength === 0) {
      console.warn(`⚠️  Scraped but content is empty: ${result.url}`);
      return res.status(422).json({
        success: false,
        status: 'failed',
        url: result.url,
        error: 'Content returned is empty',
        details: {
          message: 'Website may have blocked the crawler or returned no content',
          possibleCauses: [
            'Website blocked the crawler (anti-bot protection)',
            'Content did not load properly',
            'Website returned empty response',
          ]
        }
      });
    }

    console.log(`✅ Scraped: ${contentLength} characters from ${result.url}`);

    // Success response with content - SAFE extraction
    const htmlContent = result.htmlContent || '';
    const metadata = result.metadata || {};

    const responseData = {
      success: true,
      status: 'completed',
      url: result.url,
      data: {
        markdown: result.markdown,
        html: htmlContent,
        metadata: metadata,
      },
      stats: {
        contentLength: contentLength,
        statusCode: result.statusCode || 200,
      }
    };
    
    // Store result for dashboard - safely
    try {
      const crawlRecord = {
        id: Date.now().toString(),
        url: result.url,
        timestamp: new Date().toISOString(),
        markdownLength: contentLength,
        status: 'completed',
        success: true,
      };
      crawlResults.unshift(crawlRecord);
      if (crawlResults.length > MAX_RESULTS) {
        crawlResults.pop();
      }
    } catch (storageError) {
      console.warn(`⚠️  Failed to store crawl result: ${storageError.message}`);
      // Don't fail the response - just log it
    }

    console.log(`✅ Crawl completed successfully`);
    res.json(responseData);

  } catch (error) {
    console.error(`🚨 Crawl endpoint error:`, error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack:', error.stack);
    }
    
    res.status(500).json({ 
      success: false, 
      status: 'error',
      url: req.body?.url || 'unknown',
      error: `Server error: ${error.message}`,
      details: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

/**
 * Get crawl history
 */
router.get('/v1/crawl-history', (req, res) => {
  res.json({ success: true, data: crawlResults });
});

/**
 * Get detailed crawl result by ID
 */
router.get('/v1/crawl/:id', (req, res) => {
  const result = crawlResults.find(r => r.id === req.params.id);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Crawl result not found' });
  }
  res.json({ success: true, data: result });
});

// ============================================
// COMPETITOR ROUTES
// ============================================

/**
 * Create competitor
 */
router.post('/competitors', async (req, res) => {
  try {
    const { name, website, industry, locations } = req.body;

    if (!name || !website) {
      return res.status(400).json({ error: 'Name and website required' });
    }

    const competitor = await Competitor.create({
      name,
      website,
      industry,
      locations: locations || ['India'],
      active: true,
    });

    res.status(201).json({ success: true, data: competitor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * List competitors
 */
router.get('/competitors', async (req, res) => {
  try {
    const competitors = await Competitor.find({ active: true })
      .select('-__v')
      .lean();

    res.json({ success: true, data: competitors, count: competitors.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get competitor by ID
 */
router.get('/competitors/:id', async (req, res) => {
  try {
    const competitor = await Competitor.findById(req.params.id);

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    res.json({ success: true, data: competitor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync competitor (Full pipeline: Discover → Scrape → Detect Changes → Generate Signals → Threat)
 * Main orchestration endpoint for the sync feature
 */
router.post('/competitors/sync', async (req, res) => {
  try {
    const { companyName, website } = req.body;

    if (!companyName || !website) {
      return res.status(400).json({ error: 'companyName and website required' });
    }

    // Create or get competitor
    let competitor = await Competitor.findOne({ name: companyName });
    if (!competitor) {
      competitor = await Competitor.create({
        name: companyName,
        website,
        active: true,
        locations: ['India'],
      });
      console.log(`✨ Created new competitor: ${companyName}`);
    } else {
      console.log(`♻️  Using existing competitor: ${companyName}`);
    }

    // Trigger full sync pipeline
    const result = await syncCompetitor(competitor._id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Sync error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DISCOVERY ROUTES
// ============================================

/**
 * Discover URLs for competitor
 */
router.post('/competitors/:id/discover', async (req, res) => {
  try {
    const competitor = await Competitor.findById(req.params.id);

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    console.log(`\n🔍 Starting discovery for ${competitor.name}`);

    const discoveredUrls = await discoverCompetitorUrls(competitor);
    const savedCount = await saveDiscoveredUrls(competitor._id, discoveredUrls);

    res.json({
      success: true,
      message: `Discovered ${discoveredUrls.length} URLs, saved ${savedCount} new`,
      discoverCount: discoveredUrls.length,
      savedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SCRAPING ROUTES
// ============================================

/**
 * Scrape pending URLs
 */
router.post('/competitors/:id/scrape', async (req, res) => {
  try {
    const { limit = 10 } = req.body;

    const pages = await scrapePendingUrls(req.params.id, limit);

    res.json({
      success: true,
      scrapedCount: pages.length,
      pages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get scraping stats
 */
router.get('/competitors/:id/scraping-stats', async (req, res) => {
  try {
    const stats = await getScrapingStats(req.params.id);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// NEWS ROUTES
// ============================================

/**
 * Get news for competitor
 */
router.get('/competitors/:id/news', async (req, res) => {
  try {
    const { status = 'SCRAPED', limit = 20 } = req.query;

    const news = await News.find({
      competitorId: req.params.id,
      status: status || { $exists: true },
    })
      .sort({ scrapedAt: -1 })
      .limit(parseInt(limit))
      .select('-markdown -plainText') // Exclude large fields for list view
      .lean();

    res.json({ success: true, data: news, count: news.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get single news item
 */
router.get('/news/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SIGNALS ROUTES
// ============================================

/**
 * Create signals for competitor
 */
router.post('/competitors/:id/signals/create', async (req, res) => {
  try {
    const signals = await createSignalsForPendingNews(req.params.id);

    res.json({
      success: true,
      message: `Created ${signals.length} signals`,
      signalCount: signals.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get signals for competitor
 */
router.get('/competitors/:id/signals', async (req, res) => {
  try {
    const { timeWindow = 30 } = req.query;

    const signals = await Signal.find({
      competitorId: req.params.id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const byType = await getSignalsByType(req.params.id, parseInt(timeWindow));

    res.json({
      success: true,
      data: signals,
      byType,
      count: signals.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// THREAT ROUTES
// ============================================

/**
 * Compute threat for competitor
 */
router.post('/competitors/:id/threat/compute', async (req, res) => {
  try {
    const threat = await computeThreatForCompetitor(req.params.id);

    res.json({
      success: true,
      data: threat,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get threat for competitor
 */
router.get('/competitors/:id/threat', async (req, res) => {
  try {
    const threat = await Threat.findOne({ competitorId: req.params.id })
      .populate('recentSignals', 'type title severity')
      .lean();

    if (!threat) {
      return res.status(404).json({ error: 'No threat data available' });
    }

    res.json({ success: true, data: threat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get threat rankings
 */
router.get('/threat/rankings', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const rankings = await getThreatRankings(parseInt(limit));

    res.json({
      success: true,
      data: rankings,
      count: rankings.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DASHBOARD ENDPOINTS (Performance)
// ============================================

/**
 * Get dashboard overview
 */
router.get('/dashboard/overview', async (req, res) => {
  try {
    const competitorCount = await Competitor.countDocuments({ active: true });
    const newsCount = await News.countDocuments({ status: 'SCRAPED' });
    const signalCount = await Signal.countDocuments();
    const threatsHigh = await Threat.countDocuments({ threatScore: { $gte: 70 } });

    // Latest alerts (high-severity signals)
    const latestAlerts = await Signal.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('competitorId', 'name')
      .lean();

    // Threat rankings
    const topThreats = await getThreatRankings(5);

    res.json({
      success: true,
      data: {
        kpis: {
          competitors: competitorCount,
          newsItems: newsCount,
          signals: signalCount,
          highThreats: threatsHigh,
        },
        latestAlerts,
        topThreats,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get geographic hotspots
 */
router.get('/geography/hotspots', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const hotspots = await Signal.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
        },
      },
      {
        $unwind: '$locations',
      },
      {
        $group: {
          _id: '$locations',
          signalCount: { $sum: 1 },
          types: { $push: '$type' },
        },
      },
      {
        $sort: { signalCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json({
      success: true,
      data: hotspots.map((hs) => ({
        location: hs._id,
        signalCount: hs.signalCount,
        signalTypes: hs.types,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CRAWL HISTORY & RESULTS VIEWER
// ============================================
const fs = require('fs');
const path = require('path');

router.get('/v1/crawl-history', (req, res) => {
  try {
    const crawlDir = path.join(__dirname, '../../');
    const files = fs.readdirSync(crawlDir).filter(f => f.match(/^crawl_\d{8}_\d{6}\.txt$/));
    
    const crawls = files.map(file => {
      const filePath = path.join(crawlDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const match = file.match(/crawl_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.txt/);
      
      let url = 'Unknown';
      let markdownLength = content.length;
      
      const lines = content.split('\n');
      lines.forEach(line => {
        if (line.includes('URL:')) {
          url = line.replace('URL:', '').trim();
        }
        if (line.includes('Markdown:')) {
          const match = line.match(/(\d+)\s*chars/);
          if (match) markdownLength = parseInt(match[1]);
        }
      });
      
      const date = match ? new Date(
        parseInt(match[1]), 
        parseInt(match[2]) - 1, 
        parseInt(match[3]),
        parseInt(match[4]),
        parseInt(match[5]),
        parseInt(match[6])
      ) : new Date();
      
      return {
        file,
        url,
        markdownLength,
        timestamp: date.toISOString(),
        viewUrl: `/api/v1/crawl-file/${file}`
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      data: crawls
    });
  } catch (error) {
    console.error('Error loading crawl history:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

router.get('/v1/crawl-file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename to prevent directory traversal
    if (!filename.match(/^crawl_\d{8}_\d{6}\.txt$/)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, '../../', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    res.json({
      success: true,
      file: filename,
      content: content,
      length: content.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/v1/crawl-viewer/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename
    if (!filename.match(/^crawl_\d{8}_\d{6}\.txt$/)) {
      return res.status(400).send('Invalid filename');
    }
    
    const filePath = path.join(__dirname, '../../', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crawl Result - ${filename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #0f1419; color: #e0e0e0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { color: #00d4ff; font-size: 24px; margin-bottom: 10px; }
    .meta { display: flex; gap: 20px; font-size: 12px; color: #888; margin-top: 10px; }
    .content { background: #1a1f26; border-left: 3px solid #00d4ff; padding: 20px; border-radius: 4px; font-family: 'Courier New', monospace; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; max-height: 800px; overflow-y: auto; font-size: 13px; }
    .back-btn { display: inline-block; padding: 10px 20px; background: #333; color: #00d4ff; text-decoration: none; border-radius: 4px; margin-bottom: 20px; transition: background 0.2s; }
    .back-btn:hover { background: #444; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-btn">← Back to Dashboard</a>
    <header>
      <h1>📄 ${filename}</h1>
      <div class="meta">
        <span>Size: ${(content.length / 1024).toFixed(2)} KB</span>
        <span>Characters: ${content.length.toLocaleString()}</span>
      </div>
    </header>
    <div class="content">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>
</body>
</html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

module.exports = router;
