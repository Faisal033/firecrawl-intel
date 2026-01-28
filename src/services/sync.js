const mongoose = require('mongoose');
const { Competitor, News, Change, Signal } = require('../models');
const { discoverCompetitorUrls, saveDiscoveredUrls } = require('./discovery');
const { scrapePendingUrls } = require('./scraping');
const { createSignalsForPendingNews } = require('./signals');
const { computeThreatForCompetitor } = require('./threat');

/**
 * Complete sync pipeline for a competitor
 * Orchestrates: Discover → Scrape → Detect Changes → Generate Signals → Compute Threat
 */
const syncCompetitor = async (competitorId) => {
  try {
    const competitor = await Competitor.findById(competitorId);
    if (!competitor) {
      throw new Error(`Competitor not found: ${competitorId}`);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔄 STARTING SYNC FOR: ${competitor.name}`);
    console.log(`${'='.repeat(70)}\n`);

    // Step 1: Discovery
    console.log(`📍 STEP 1: DISCOVERY`);
    const discoveredUrls = await discoverCompetitorUrls(competitor);
    const discoveredCount = await saveDiscoveredUrls(competitor._id, discoveredUrls);
    console.log(`✅ Discovered: ${discoveredUrls.length} URLs, saved ${discoveredCount} new\n`);

    // Step 2: Scraping
    console.log(`🕷️  STEP 2: SCRAPING`);
    const scrapedPages = await scrapePendingUrls(competitor._id, 20);
    console.log(`✅ Scraped: ${scrapedPages.length} pages\n`);

    // Step 3: Change Detection
    console.log(`📊 STEP 3: CHANGE DETECTION`);
    const changesDetected = await detectChanges(competitor._id);
    console.log(`✅ Changes detected: ${changesDetected.length} items\n`);

    // Step 4: Signal Generation
    console.log(`🔔 STEP 4: SIGNAL GENERATION`);
    const signalsCreated = await createSignalsForPendingNews(competitor._id);
    console.log(`✅ Signals created: ${signalsCreated.length} signals\n`);

    // Step 5: Threat Computation
    console.log(`⚠️  STEP 5: THREAT COMPUTATION`);
    const threat = await computeThreatForCompetitor(competitor._id);
    console.log(`✅ Threat score: ${threat.threatScore}/100\n`);

    // Update competitor's last sync timestamp
    competitor.lastScrapedAt = new Date();
    competitor.lastThreatComputedAt = new Date();
    await competitor.save();

    console.log(`${'='.repeat(70)}`);
    console.log(`✅ SYNC COMPLETE FOR: ${competitor.name}`);
    console.log(`${'='.repeat(70)}\n`);

    return {
      success: true,
      competitor: {
        id: competitor._id,
        name: competitor.name,
      },
      stats: {
        discovered: discoveredCount,
        scraped: scrapedPages.length,
        changesDetected: changesDetected.length,
        signalsCreated: signalsCreated.length,
        threatScore: threat.threatScore,
      },
    };
  } catch (error) {
    console.error(`❌ Sync failed:`, error.message);
    throw error;
  }
};

/**
 * Detect content changes by comparing hashes
 * Creates immutable Change records for analysis
 */
const detectChanges = async (competitorId) => {
  try {
    // Get all recently scraped news items
    const recentNews = await News.find({
      competitorId,
      status: 'SCRAPED',
      scrapedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    })
      .select('_id url contentHash title plainText')
      .lean();

    const changesCreated = [];

    for (const newsItem of recentNews) {
      if (!newsItem.contentHash) continue;

      // Check if we already have a Change record for this URL
      const existingChange = await Change.findOne({
        newsId: newsItem._id,
        competitorId,
      });

      if (existingChange) {
        // Change already recorded
        continue;
      }

      // Look for previous version of same URL
      const previousVersion = await News.findOne({
        competitorId,
        url: newsItem.url,
        _id: { $ne: newsItem._id },
        status: 'SCRAPED',
        contentHash: { $exists: true },
      })
        .sort({ scrapedAt: -1 })
        .select('contentHash')
        .lean();

      if (previousVersion && previousVersion.contentHash !== newsItem.contentHash) {
        // Content has changed!
        const changeType = detectChangeType(newsItem.plainText || '');
        const confidence = calculateChangeConfidence(newsItem.plainText || '');

        const change = await Change.create({
          competitorId,
          newsId: newsItem._id,
          url: newsItem.url,
          previousHash: previousVersion.contentHash,
          currentHash: newsItem.contentHash,
          changeType,
          confidence,
          description: `Content changed for ${newsItem.title}`,
          detectedAt: new Date(),
        });

        changesCreated.push(change);
        console.log(`  📝 Change detected: ${newsItem.url}`);
      }
    }

    return changesCreated;
  } catch (error) {
    console.error(`❌ Change detection error:`, error.message);
    return [];
  }
};

/**
 * Heuristic: Detect change type from content
 */
const detectChangeType = (text) => {
  const lowerText = (text || '').toLowerCase();

  if (
    lowerText.includes('hiring') ||
    lowerText.includes('recruiting') ||
    lowerText.includes('job opening') ||
    lowerText.includes('careers')
  ) {
    return 'HIRING';
  }
  if (
    lowerText.includes('expand') ||
    lowerText.includes('new office') ||
    lowerText.includes('new location') ||
    lowerText.includes('warehouse')
  ) {
    return 'EXPANSION';
  }
  if (
    lowerText.includes('launch') ||
    lowerText.includes('new service') ||
    lowerText.includes('announcing') ||
    lowerText.includes('introduce')
  ) {
    return 'SERVICE_LAUNCH';
  }
  if (
    lowerText.includes('revenue') ||
    lowerText.includes('funding') ||
    lowerText.includes('investment') ||
    lowerText.includes('ipo')
  ) {
    return 'FINANCIAL';
  }
  if (
    lowerText.includes('regulation') ||
    lowerText.includes('compliance') ||
    lowerText.includes('penalty')
  ) {
    return 'REGULATORY';
  }
  if (
    lowerText.includes('press') ||
    lowerText.includes('media') ||
    lowerText.includes('news')
  ) {
    return 'MEDIA';
  }

  return 'OTHER';
};

/**
 * Calculate confidence score (0-100) based on content strength
 */
const calculateChangeConfidence = (text) => {
  if (!text) return 30;

  // More text = higher confidence
  const length = text.length;
  let score = Math.min(100, 30 + Math.log(length) * 10);

  // Key phrases boost confidence
  const keyPhrases = [
    'announce', 'launch', 'expand', 'hire', 'hiring', 'acquire',
    'partnership', 'collaboration', 'fund', 'investment', 'ipo',
  ];
  const hasKeyPhrases = keyPhrases.some((phrase) => text.toLowerCase().includes(phrase));
  if (hasKeyPhrases) score = Math.min(100, score + 15);

  return Math.round(score);
};

/**
 * Batch sync multiple competitors
 */
const syncMultipleCompetitors = async (competitorIds) => {
  const results = [];
  for (const competitorId of competitorIds) {
    try {
      const result = await syncCompetitor(competitorId);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        competitorId,
        error: error.message,
      });
    }
  }
  return results;
};

module.exports = {
  syncCompetitor,
  detectChanges,
  syncMultipleCompetitors,
};
