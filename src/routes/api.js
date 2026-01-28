const express = require('express');
const mongoose = require('mongoose');
const { Competitor, News, Signal, Threat, Insight } = require('../models');
const { discoverCompetitorUrls, saveDiscoveredUrls } = require('../services/discovery');
const { scrapePendingUrls, getScrapingStats } = require('../services/scraping');
const { scrapeUrl } = require('../services/firecrawl');
/**
 * Crawl any URL (ad-hoc)
 */
router.post('/v1/crawl', async (req, res) => {
  try {
    const { url, options } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Missing url' });
    }
    const result = await scrapeUrl(url, options || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
const { createSignalsForPendingNews, getSignalsByType } = require('../services/signals');
const { computeThreatForCompetitor, getThreatRankings } = require('../services/threat');
const { syncCompetitor } = require('../services/sync');

const router = express.Router();

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

module.exports = router;
