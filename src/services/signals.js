const { Signal, News, Change } = require('../models');

// India major cities for location detection
const INDIA_CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Surat', 'Chandigarh', 'Kota', 'Agra',
];

/**
 * Extract India locations from text
 */
const extractLocations = (text) => {
  if (!text) return ['India'];

  const locations = [];
  const lowerText = text.toLowerCase();

  for (const city of INDIA_CITIES) {
    if (lowerText.includes(city.toLowerCase())) {
      locations.push(city);
    }
  }

  // Always include India if locations found
  if (locations.length === 0) {
    locations.push('India');
  }

  return locations;
};

/**
 * Detect signal type and confidence from content
 */
const detectSignal = (title, content, metadata = {}) => {
  const text = (title + ' ' + content).toLowerCase();
  let signalType = 'OTHER';
  let confidence = 30;

  // EXPANSION signals
  if (
    text.includes('expand') ||
    text.includes('new office') ||
    text.includes('new location') ||
    text.includes('new warehouse')
  ) {
    signalType = 'EXPANSION';
    confidence = 75;
  }

  // HIRING signals
  else if (
    text.includes('hiring') ||
    text.includes('recruit') ||
    text.includes('job opening') ||
    text.includes('careers')
  ) {
    signalType = 'HIRING';
    confidence = 85;
  }

  // SERVICE_LAUNCH signals
  else if (
    text.includes('launch') ||
    text.includes('introduce') ||
    text.includes('announce') ||
    text.includes('new service')
  ) {
    signalType = 'SERVICE_LAUNCH';
    confidence = 70;
  }

  // CLIENT_WIN signals
  else if (
    text.includes('partnership') ||
    text.includes('collaborate') ||
    text.includes('client') ||
    text.includes('won')
  ) {
    signalType = 'CLIENT_WIN';
    confidence = 65;
  }

  // FINANCIAL signals
  else if (
    text.includes('fund') ||
    text.includes('investment') ||
    text.includes('revenue') ||
    text.includes('profit') ||
    text.includes('ipo')
  ) {
    signalType = 'FINANCIAL';
    confidence = 80;
  }

  // REGULATORY signals
  else if (
    text.includes('regulation') ||
    text.includes('compliance') ||
    text.includes('license') ||
    text.includes('permit')
  ) {
    signalType = 'REGULATORY';
    confidence = 70;
  }

  // MEDIA signals (mention)
  else if (
    text.includes('featured') ||
    text.includes('mention') ||
    text.includes('award')
  ) {
    signalType = 'MEDIA';
    confidence = 50;
  }

  return { signalType, confidence };
};

/**
 * Determine severity from signal type and confidence
 */
const determineSeverity = (signalType, confidence) => {
  if (confidence >= 80) {
    if (['EXPANSION', 'HIRING', 'FINANCIAL'].includes(signalType)) return 'CRITICAL';
    if (['SERVICE_LAUNCH', 'CLIENT_WIN'].includes(signalType)) return 'HIGH';
  }

  if (confidence >= 60) return 'HIGH';
  if (confidence >= 40) return 'MEDIUM';
  return 'LOW';
};

/**
 * Create Signal from News
 */
const createSignalFromNews = async (newsId, competitorId) => {
  try {
    const news = await News.findById(newsId);
    if (!news) throw new Error(`News not found: ${newsId}`);

    // Detect signal type
    const { signalType, confidence } = detectSignal(news.title, news.plainText, news.metadata);

    // Extract locations
    const locations = extractLocations(news.plainText);

    // Determine severity
    const severity = determineSeverity(signalType, confidence);

    // Check if signal with same type and news already exists
    const existing = await Signal.findOne({
      newsId,
      type: signalType,
      competitorId,
    });

    if (existing) {
      console.log(`⏭️  Signal already exists for news ${newsId}`);
      return existing;
    }

    // Create signal
    const signal = await Signal.create({
      competitorId,
      newsId,
      type: signalType,
      title: `${signalType}: ${news.title}`,
      description: news.plainText?.substring(0, 500),
      confidence,
      locations,
      severity,
      sourceIds: [newsId],
      sourceCount: 1,
      metadata: {
        detectedFrom: 'NEWS_CONTENT',
        newsTitle: news.title,
        newsUrl: news.url,
      },
    });

    console.log(`✅ Created Signal: ${signal.type} for ${news.title}`);
    return signal;
  } catch (error) {
    console.error(`❌ Error creating signal for ${newsId}:`, error.message);
    return null;
  }
};

/**
 * Create signals for all new News items AND Change records
 */
const createSignalsForPendingNews = async (competitorId) => {
  try {
    console.log(`📊 Creating signals for competitor: ${competitorId}`);

    const signals = [];

    // 1. Create signals from scraped News
    const newsWithoutSignals = await News.find({
      competitorId,
      status: 'SCRAPED',
    })
      .lean()
      .limit(20);

    console.log(`📋 Found ${newsWithoutSignals.length} news items for signal creation`);

    for (const news of newsWithoutSignals) {
      const signal = await createSignalFromNews(news._id, competitorId);
      if (signal) signals.push(signal);
    }

    // 2. Create signals from Change records
    const unprocessedChanges = await Change.find({
      competitorId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    })
      .lean()
      .limit(20);

    console.log(`📋 Found ${unprocessedChanges.length} change records for signal creation`);

    for (const change of unprocessedChanges) {
      const signalFromChange = await createSignalFromChange(change, competitorId);
      if (signalFromChange) signals.push(signalFromChange);
    }

    console.log(`✅ Created ${signals.length} total signals`);
    return signals;
  } catch (error) {
    console.error(`❌ Error creating signals:`, error.message);
    return [];
  }
};

/**
 * Create signal from a Change record
 */
const createSignalFromChange = async (change, competitorId) => {
  try {
    // Check if signal already exists for this change
    const existing = await Signal.findOne({
      competitorId,
      // Link to change via metadata
      'metadata.changeId': change._id.toString(),
    });

    if (existing) {
      console.log(`⏭️  Signal already exists for change ${change._id}`);
      return existing;
    }

    // Get the news item to extract content for locations
    const news = await News.findById(change.newsId).lean();
    const locations = news ? extractLocations(news.plainText) : ['India'];

    // Map change type to signal severity
    const severityMap = {
      HIRING: 'HIGH',
      EXPANSION: 'HIGH',
      SERVICE_LAUNCH: 'MEDIUM',
      FINANCIAL: 'HIGH',
      REGULATORY: 'MEDIUM',
      MEDIA: 'LOW',
      OTHER: 'LOW',
    };

    const signal = await Signal.create({
      competitorId,
      newsId: change.newsId,
      type: change.changeType,
      title: `${change.changeType}: ${change.description}`,
      description: change.description,
      confidence: change.confidence,
      locations,
      severity: severityMap[change.changeType] || 'MEDIUM',
      sourceIds: [change.newsId],
      sourceCount: 1,
      metadata: {
        detectedFrom: 'CHANGE_DETECTION',
        changeId: change._id.toString(),
        url: change.url,
      },
    });

    console.log(`✅ Created Signal from Change: ${signal.type}`);
    return signal;
  } catch (error) {
    console.error(`❌ Error creating signal from change:`, error.message);
    return null;
  }
};

/**
 * Get signals by type for competitor
 */
const getSignalsByType = async (competitorId, timeWindow = 30) => {
  const since = new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000);

  const signals = await Signal.aggregate([
    {
      $match: {
        competitorId: require('mongoose').Types.ObjectId(competitorId),
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        recentSignals: { $push: '$$ROOT' },
      },
    },
  ]);

  return signals;
};

module.exports = {
  extractLocations,
  detectSignal,
  determineSeverity,
  createSignalFromNews,
  createSignalFromChange,
  createSignalsForPendingNews,
  getSignalsByType,
};
