const mongoose = require('mongoose');
const { Signal, Threat, Competitor } = require('../models');

/**
 * Compute threat score from signals
 */
const computeThreatScore = (signalsByType, totalSignals) => {
  if (totalSignals === 0) return 0;

  let score = 0;

  // Weight different signal types
  const weights = {
    EXPANSION: 25,
    HIRING: 20,
    SERVICE_LAUNCH: 15,
    CLIENT_WIN: 15,
    FINANCIAL: 20,
    REGULATORY: 15,
    MEDIA: 5,
    OTHER: 5,
  };

  for (const [type, count] of Object.entries(signalsByType)) {
    score += (count || 0) * (weights[type] || 5);
  }

  // Normalize to 0-100
  score = Math.min(100, (score / (totalSignals * 25)) * 100);

  return Math.round(score);
};

/**
 * Compute threat for single competitor
 */
const computeThreatForCompetitor = async (competitorId, period = '30D') => {
  try {
    console.log(`📊 Computing threat for competitor: ${competitorId}`);

    // Determine time window
    let daysBack = 30;
    if (period === '7D') daysBack = 7;
    else if (period === 'OVERALL') daysBack = 365; // 1 year

    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get signals for period
    const signals = await Signal.find({
      competitorId: mongoose.Types.ObjectId(competitorId),
      createdAt: { $gte: since },
    }).lean();

    console.log(`📋 Found ${signals.length} signals`);

    // Group signals by type
    const signalsByType = {};
    const locationCounts = {};

    for (const signal of signals) {
      // Count by type
      signalsByType[signal.type] = (signalsByType[signal.type] || 0) + 1;

      // Count by location
      for (const location of signal.locations || ['India']) {
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    }

    // Compute threat score
    const threatScore = computeThreatScore(signalsByType, signals.length);

    // Get top locations
    const topLocations = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, signalCount: count }))
      .sort((a, b) => b.signalCount - a.signalCount)
      .slice(0, 5);

    // Get recent signals (last 5)
    const recentSignals = await Signal.find({
      competitorId: mongoose.Types.ObjectId(competitorId),
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id type title');

    // Create or update threat document
    const threat = await Threat.findOneAndUpdate(
      { competitorId },
      {
        threatScore,
        signalCount: signals.length,
        signalByType: signalsByType,
        topLocations,
        recentSignals: recentSignals.map((s) => s._id),
        lastUpdated: new Date(),
        period,
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Threat score: ${threatScore}/100`);
    return threat;
  } catch (error) {
    console.error(`❌ Error computing threat:`, error.message);
    throw error;
  }
};

/**
 * Compute threat for all active competitors
 */
const computeThreatForAllCompetitors = async () => {
  try {
    console.log(`\n🌍 Computing threat for ALL competitors`);

    const competitors = await Competitor.find({ active: true }).lean();
    console.log(`📋 Found ${competitors.length} active competitors`);

    const threats = [];
    for (const competitor of competitors) {
      const threat = await computeThreatForCompetitor(competitor._id);
      threats.push(threat);

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Computed threat for ${threats.length} competitors`);
    return threats;
  } catch (error) {
    console.error(`❌ Error computing threat for all:`, error.message);
    return [];
  }
};

/**
 * Get threat rankings
 */
const getThreatRankings = async (limit = 10) => {
  try {
    const rankings = await Threat.find()
      .sort({ threatScore: -1 })
      .limit(limit)
      .populate('competitorId', 'name website')
      .lean();

    return rankings.map((threat) => ({
      rank: rankings.indexOf(threat) + 1,
      competitorId: threat.competitorId._id,
      competitorName: threat.competitorId.name,
      website: threat.competitorId.website,
      threatScore: threat.threatScore,
      signalCount: threat.signalCount,
      signalByType: threat.signalByType,
      topLocations: threat.topLocations,
      lastUpdated: threat.lastUpdated,
    }));
  } catch (error) {
    console.error(`❌ Error getting threat rankings:`, error.message);
    return [];
  }
};

module.exports = {
  computeThreatScore,
  computeThreatForCompetitor,
  computeThreatForAllCompetitors,
  getThreatRankings,
};
