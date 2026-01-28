const mongoose = require('mongoose');

// ============================================
// COMPETITOR MODEL
// ============================================
const competitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    website: { type: String, required: true },
    industry: String,
    description: String,
    locations: [String], // India cities
    fundingStage: String,
    employees: Number,
    // Discovery config
    rssKeywords: [String],
    newsSourceIds: [String], // Industry news sites to monitor
    // Active monitoring
    active: { type: Boolean, default: true },
    lastScrapedAt: Date,
    lastThreatComputedAt: Date,
  },
  { timestamps: true }
);

// ============================================
// NEWS MODEL (discovered URLs)
// ============================================
const newsSchema = new mongoose.Schema(
  {
    competitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', index: true },
    title: String,
    url: { type: String, index: true },
    urlCanonical: String, // normalized URL
    sourceType: { type: String, enum: ['RSS', 'SITEMAP', 'SITE_SEARCH', 'MANUAL'], default: 'RSS' },
    sourceDomain: String,
    sources: [{ rssId: String, feedUrl: String, discoveredAt: Date }], // Multi-source tracking
    publishedAt: Date,
    scrapedAt: Date,
    // Content
    markdown: String,
    plainText: String,
    contentHash: String, // SHA256 of normalized content
    metadata: {
      title: String,
      description: String,
      author: String,
      image: String,
    },
    // Scraping status
    status: { type: String, enum: ['DISCOVERED', 'SCRAPING', 'SCRAPED', 'FAILED', 'SKIPPED'], default: 'DISCOVERED' },
    scrapeError: String,
    // Quality
    relevanceScore: { type: Number, min: 0, max: 100 },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'News' },
  },
  { timestamps: true }
);

newsSchema.index({ competitorId: 1, createdAt: -1 });
newsSchema.index({ urlCanonical: 1 });
newsSchema.index({ contentHash: 1 });
newsSchema.index({ status: 1 });

// ============================================
// PAGE MODEL (scraped content)
// ============================================
const pageSchema = new mongoose.Schema(
  {
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true, unique: true },
    competitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', index: true },
    url: String,
    title: String,
    markdown: String,
    plainText: String,
    html: String, // Optionally store raw HTML
    metadata: mongoose.Schema.Types.Mixed,
    scrapedAt: Date,
    firecrawlJobId: String,
  },
  { timestamps: true }
);

// ============================================
// SIGNAL MODEL (append-only, immutable)
// ============================================
const signalSchema = new mongoose.Schema(
  {
    competitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', index: true, required: true },
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News' },
    type: {
      type: String,
      enum: ['EXPANSION', 'HIRING', 'SERVICE_LAUNCH', 'CLIENT_WIN', 'FINANCIAL', 'REGULATORY', 'MEDIA', 'OTHER'],
      required: true,
    },
    title: String,
    description: String,
    confidence: { type: Number, min: 0, max: 100, required: true },
    locations: [String], // India cities mentioned
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    sourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'News' }], // Multiple sources
    sourceCount: { type: Number, default: 1 },
    metadata: mongoose.Schema.Types.Mixed,
    // Immutable
    detectedAt: { type: Date, default: Date.now, immutable: true },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { timestamps: false } // Append-only, no updates
);

signalSchema.index({ competitorId: 1, createdAt: -1 });
signalSchema.index({ type: 1, createdAt: -1 });
signalSchema.index({ locations: 1 });

// ============================================
// THREAT MODEL (computed daily)
// ============================================
const threatSchema = new mongoose.Schema(
  {
    competitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', required: true, index: true },
    threatScore: { type: Number, min: 0, max: 100, required: true },
    signalCount: { type: Number, default: 0 },
    signalByType: mongoose.Schema.Types.Mixed, // { EXPANSION: 5, HIRING: 3, ... }
    topLocations: [{ location: String, signalCount: Number }],
    recentSignals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Signal' }],
    lastUpdated: { type: Date, default: Date.now },
    period: { type: String, default: 'OVERALL' }, // OVERALL, 7D, 30D
  },
  { timestamps: true }
);

threatSchema.index({ threatScore: -1 });

// ============================================
// INSIGHT MODEL (AI-generated)
// ============================================
const insightSchema = new mongoose.Schema(
  {
    competitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', index: true },
    signalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Signal' }],
    newsIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'News' }],
    title: String,
    description: String,
    insight: String, // AI-generated insight
    theme: String, // e.g., "Market Expansion", "Workforce Growth"
    confidence: { type: Number, min: 0, max: 100 },
    sourceCount: { type: Number, default: 1 },
    // For UI
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    actionable: Boolean,
    generatedAt: Date,
  },
  { timestamps: true }
);

insightSchema.index({ competitorId: 1, createdAt: -1 });

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

// Export models
module.exports = {
  Competitor: mongoose.model('Competitor', competitorSchema),
  News: mongoose.model('News', newsSchema),
  Page: mongoose.model('Page', pageSchema),
  Signal: mongoose.model('Signal', signalSchema),
  Threat: mongoose.model('Threat', threatSchema),
  Insight: mongoose.model('Insight', insightSchema),
  Change: mongoose.model('Change', changeSchema),
};
