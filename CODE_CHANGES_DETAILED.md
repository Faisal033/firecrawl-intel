# CODE CHANGES - DETAILED REFERENCE

This document shows exactly what was added/modified in each file.

---

## File 1: src/models/index.js

### Location: End of file (after Insight model)

**ADDED: Change Schema** (23 lines)

```javascript
// ============================================
// CHANGE MODEL (for detecting content changes)
// ============================================
const changeSchema = new mongoose.Schema(
  {
    competitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', index: true, required: true },
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true },
    url: String,
    previousHash: String, // Previous content hash
    currentHash: String, // New content hash
    changeType: {
      type: String,
      enum: ['HIRING', 'EXPANSION', 'SERVICE_LAUNCH', 'MEDIA', 'FINANCIAL', 'REGULATORY', 'OTHER'],
      required: true,
    },
    confidence: { type: Number, min: 0, max: 100, required: true },
    description: String,
    detectedAt: { type: Date, default: Date.now, immutable: true },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { timestamps: false } // Append-only, immutable
);

changeSchema.index({ competitorId: 1, detectedAt: -1 });
changeSchema.index({ newsId: 1 });
```

**UPDATED: Exports** (added Change model)

```javascript
// OLD:
module.exports = {
  Competitor: mongoose.model('Competitor', competitorSchema),
  News: mongoose.model('News', newsSchema),
  Page: mongoose.model('Page', pageSchema),
  Signal: mongoose.model('Signal', signalSchema),
  Threat: mongoose.model('Threat', threatSchema),
  Insight: mongoose.model('Insight', insightSchema),
};

// NEW:
module.exports = {
  Competitor: mongoose.model('Competitor', competitorSchema),
  News: mongoose.model('News', newsSchema),
  Page: mongoose.model('Page', pageSchema),
  Signal: mongoose.model('Signal', signalSchema),
  Threat: mongoose.model('Threat', threatSchema),
  Insight: mongoose.model('Insight', insightSchema),
  Change: mongoose.model('Change', changeSchema),
};
```

---

## File 2: src/services/sync.js

### NEW FILE - 252 Lines Total

```javascript
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
    await competitor.save();

    console.log(`${'='.repeat(70)}`);
    console.log(`✨ SYNC COMPLETED FOR: ${competitor.name}`);
    console.log(`${'='.repeat(70)}\n`);

    return {
      discovered: discoveredUrls.length,
      scraped: scrapedPages.length,
      changesDetected: changesDetected.length,
      signalsCreated: signalsCreated.length,
      threatScore: threat.threatScore,
    };
  } catch (error) {
    console.error('❌ Sync pipeline error:', error.message);
    throw error;
  }
};

/**
 * Detect changes in scraped content
 * Compares current hash with previous, creates Change records
 */
const detectChanges = async (competitorId) => {
  try {
    // Get recently scraped news (last 7 days)
    const recentNews = await News.find({
      competitorId,
      status: 'SCRAPED',
      scrapedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const detectedChanges = [];

    for (const news of recentNews) {
      if (!news.contentHash) continue;

      // Check if change already exists
      const lastChange = await Change.findOne({ newsId: news._id }).sort({ createdAt: -1 });

      if (!lastChange || lastChange.currentHash !== news.contentHash) {
        // New change detected
        const changeType = detectChangeType(news.plainText || '');
        const confidence = calculateChangeConfidence(news.plainText || '');

        const change = await Change.create({
          competitorId,
          newsId: news._id,
          url: news.url,
          previousHash: lastChange?.currentHash,
          currentHash: news.contentHash,
          changeType,
          confidence,
          description: `Content changed on ${news.url}`,
        });

        detectedChanges.push(change);
      }
    }

    return detectedChanges;
  } catch (error) {
    console.error('Error detecting changes:', error.message);
    return [];
  }
};

/**
 * Detect change type using keyword matching
 */
const detectChangeType = (text) => {
  text = (text || '').toLowerCase();

  const patterns = {
    HIRING: /hiring|recruit|careers|job|applicant|apply|position|opening|hiring manager/i,
    EXPANSION: /expand|expansion|enter market|new office|new location|branch|subsidiary/i,
    SERVICE_LAUNCH: /launch|new service|introduce|product launch|unveiled|announce/i,
    FINANCIAL: /funding|investment|raise|series|valuation|ipo|profit|revenue|loss|quarter/i,
    REGULATORY: /compliance|regulation|license|approval|certification|audit|fda|sebi/i,
    MEDIA: /interview|article|featured|spotlight|mention|coverage|press release|news/i,
    OTHER: /.*/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (type !== 'OTHER' && pattern.test(text)) {
      return type;
    }
  }

  return 'OTHER';
};

/**
 * Calculate confidence score for detected change
 * Based on text length + keyword match density
 */
const calculateChangeConfidence = (text) => {
  if (!text) return 20;

  const length = text.length;
  let confidence = Math.min((length / 500) * 50, 50); // Max 50 from length

  // Bonus for keywords
  const keywords = ['hire', 'expand', 'launch', 'funding', 'regulatory', 'media'];
  let keywordMatches = 0;
  for (const keyword of keywords) {
    if (text.toLowerCase().includes(keyword)) keywordMatches++;
  }

  confidence += (keywordMatches / keywords.length) * 50; // Max 50 from keywords
  return Math.min(Math.round(confidence), 100);
};

/**
 * Sync multiple competitors
 */
const syncMultipleCompetitors = async (competitorIds) => {
  const results = [];
  for (const competitorId of competitorIds) {
    try {
      const result = await syncCompetitor(competitorId);
      results.push({ competitorId, ...result, success: true });
    } catch (error) {
      results.push({ competitorId, success: false, error: error.message });
    }
  }
  return results;
};

module.exports = {
  syncCompetitor,
  detectChanges,
  detectChangeType,
  calculateChangeConfidence,
  syncMultipleCompetitors,
};
```

---

## File 3: src/routes/api.js

### Location: Line 1 (imports section)

**ADDED: Import for sync service**

```javascript
// BEFORE (line 1):
const express = require('express');
const router = express.Router();
const { Competitor, News, Page, Signal, Threat } = require('../models');

// AFTER (line 1):
const express = require('express');
const router = express.Router();
const { Competitor, News, Page, Signal, Threat } = require('../models');
const { syncCompetitor } = require('../services/sync');
```

### Location: After GET /competitors/:id endpoint (line 77)

**ADDED: POST /competitors/sync endpoint**

```javascript
/**
 * Sync competitor (complete pipeline)
 * Stages: Discover → Scrape → Change Detection → Signal Generation → Threat Computation
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
```

---

## File 4: src/services/signals.js

### Location: Top imports

**UPDATED: Added Change model import**

```javascript
// BEFORE:
const { Signal, News } = require('../models');

// AFTER:
const { Signal, News, Change } = require('../models');
```

### Location: createSignalsForPendingNews function

**UPDATED: Extended to process Changes**

```javascript
// BEFORE:
const createSignalsForPendingNews = async (competitorId) => {
  // ... existing code for News only
};

// AFTER:
const createSignalsForPendingNews = async (competitorId) => {
  // Process News items
  const pendingNews = await News.find({
    competitorId,
    status: 'SCRAPED',
  }).limit(50);

  const signals = [];
  for (const news of pendingNews) {
    const signal = await detectAndCreateSignal(news);
    if (signal) signals.push(signal);
  }

  // NEW: Process Change items
  const recentChanges = await Change.find({
    competitorId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
  });

  for (const change of recentChanges) {
    const signal = await createSignalFromChange(change, competitorId);
    if (signal) signals.push(signal);
  }

  return signals;
};
```

### Location: New function at end of file

**ADDED: createSignalFromChange function**

```javascript
/**
 * Convert Change record to Signal
 * Maps changeType to severity, extracts locations from linked News
 */
const createSignalFromChange = async (change, competitorId) => {
  try {
    // Get linked News for location extraction
    const news = await News.findById(change.newsId);
    let locations = [];
    
    if (news && news.locations) {
      locations = news.locations;
    }

    // Map change type to severity
    const severityMap = {
      HIRING: 'HIGH',
      EXPANSION: 'HIGH',
      SERVICE_LAUNCH: 'MEDIUM',
      FINANCIAL: 'HIGH',
      REGULATORY: 'CRITICAL',
      MEDIA: 'MEDIUM',
      OTHER: 'LOW',
    };

    // Check if signal already exists for this change
    const existingSignal = await Signal.findOne({
      'metadata.changeId': change._id,
    });

    if (existingSignal) {
      return null; // Already processed
    }

    const signal = await Signal.create({
      competitorId,
      newsId: change.newsId,
      type: change.changeType,
      title: `Content change: ${change.changeType}`,
      description: change.description,
      confidence: change.confidence,
      locations,
      severity: severityMap[change.changeType] || 'MEDIUM',
      metadata: {
        changeId: change._id,
        previousHash: change.previousHash,
        currentHash: change.currentHash,
      },
      detectedAt: change.detectedAt,
    });

    return signal;
  } catch (error) {
    console.error('Error creating signal from change:', error.message);
    return null;
  }
};

module.exports = {
  // ... existing exports
  createSignalFromChange,
};
```

---

## Summary of Changes

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| src/models/index.js | MODIFIED | +23 | Add Change schema |
| src/services/sync.js | CREATED | 252 | Orchestration service |
| src/routes/api.js | MODIFIED | +2 (import) + 50 (endpoint) | Wire sync endpoint |
| src/services/signals.js | MODIFIED | +100 | Handle Changes in signal gen |

**Total new code**: ~425 lines  
**Total modified code**: ~175 lines  
**Total impact**: 600 lines

---

## Testing Each Change

### Test Change Model
```javascript
// In Node REPL or script
const { Change } = require('./src/models');
const change = await Change.create({
  competitorId: '...',
  newsId: '...',
  url: 'https://example.com',
  previousHash: 'old',
  currentHash: 'new',
  changeType: 'HIRING',
  confidence: 85,
});
console.log(change); // Should have immutable timestamps
```

### Test Sync Service
```javascript
const { syncCompetitor } = require('./src/services/sync');
const result = await syncCompetitor(competitorId);
console.log(result); // Should have discovered, scraped, changesDetected, signalsCreated, threatScore
```

### Test Sync Endpoint
```powershell
$body = @{ companyName="Delhivery"; website="https://www.delhivery.com" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/sync" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

**All changes backward compatible - no breaking changes to existing endpoints**
