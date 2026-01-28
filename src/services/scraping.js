const crypto = require('crypto');
const { News, Page } = require('../models');
const { scrapeUrl } = require('./firecrawl');

/**
 * Calculate SHA256 hash of normalized content
 */
const hashContent = (content) => {
  if (!content) return null;

  // Normalize: lowercase, remove extra whitespace
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return crypto.createHash('sha256').update(normalized).digest('hex');
};

/**
 * Check if URL was scraped in last 24 hours
 */
const isScrapedRecently = async (urlCanonical) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existing = await News.findOne({
    urlCanonical,
    status: 'SCRAPED',
    scrapedAt: { $gte: oneDayAgo },
  });

  return !!existing;
};

/**
 * Find duplicate News by content hash
 */
const findDuplicateByContent = async (contentHash, competitorId) => {
  if (!contentHash) return null;

  const existing = await News.findOne({
    contentHash,
    competitorId,
    isDuplicate: false,
  });

  return existing;
};

/**
 * Scrape single URL and save to database
 */
const scrapeAndSaveUrl = async (newsId, competitorId) => {
  try {
    const news = await News.findById(newsId);
    if (!news) {
      console.error(`❌ News not found: ${newsId}`);
      return null;
    }

    // Check if already scraped recently
    if (await isScrapedRecently(news.urlCanonical)) {
      console.log(`⏭️  Skipping recently scraped URL: ${news.url}`);
      news.status = 'SKIPPED';
      await news.save();
      return null;
    }

    // Update status to scraping
    news.status = 'SCRAPING';
    await news.save();

    // Call Firecrawl
    const result = await scrapeUrl(news.url);

    if (!result.success) {
      news.status = 'FAILED';
      news.scrapeError = result.error;
      await news.save();
      console.error(`❌ Scraping failed for ${news.url}: ${result.error}`);
      return null;
    }

    // Extract markdown content
    const markdown = result.data.markdown || '';
    const plainText = result.data.plainText || markdown.replace(/[#*`\[\]()]/g, '');

    // Calculate content hash
    const contentHash = hashContent(markdown);

    // Check for content duplicates
    const duplicate = await findDuplicateByContent(contentHash, competitorId);
    if (duplicate && duplicate._id.toString() !== newsId) {
      console.log(`🔄 Duplicate content found, linking to: ${duplicate._id}`);
      news.isDuplicate = true;
      news.duplicateOf = duplicate._id;
      news.status = 'SKIPPED';
      await news.save();
      return null;
    }

    // Save Page document
    const page = await Page.create({
      newsId,
      competitorId,
      url: news.url,
      title: result.data.title || news.title,
      markdown,
      plainText,
      metadata: result.data.metadata || {},
      scrapedAt: new Date(),
      firecrawlJobId: result.data.jobId,
    });

    // Update News with scraped content
    news.status = 'SCRAPED';
    news.scrapedAt = new Date();
    news.markdown = markdown;
    news.plainText = plainText;
    news.contentHash = contentHash;
    news.metadata = result.data.metadata;
    await news.save();

    console.log(`✅ Scraped and saved: ${news.url}`);
    return page;
  } catch (error) {
    console.error(`❌ Error scraping ${newsId}:`, error.message);

    const news = await News.findById(newsId);
    if (news) {
      news.status = 'FAILED';
      news.scrapeError = error.message;
      await news.save();
    }

    return null;
  }
};

/**
 * Batch scrape pending URLs for a competitor
 */
const scrapePendingUrls = async (competitorId, limit = 10) => {
  try {
    console.log(`🕷️  Scraping pending URLs for competitor: ${competitorId}`);

    // Get unscraped URLs
    const pendingNews = await News.find({
      competitorId,
      status: 'DISCOVERED',
    })
      .limit(limit)
      .sort({ createdAt: 1 });

    console.log(`📋 Found ${pendingNews.length} pending URLs`);

    const scraped = [];
    for (const news of pendingNews) {
      const page = await scrapeAndSaveUrl(news._id, competitorId);
      if (page) scraped.push(page);

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`✅ Scraped ${scraped.length} URLs`);
    return scraped;
  } catch (error) {
    console.error(`❌ Error scraping pending URLs:`, error.message);
    return [];
  }
};

/**
 * Get scraping statistics
 */
const getScrapingStats = async (competitorId) => {
  const stats = await News.aggregate([
    { $match: { competitorId: mongoose.Types.ObjectId(competitorId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

module.exports = {
  hashContent,
  isScrapedRecently,
  findDuplicateByContent,
  scrapeAndSaveUrl,
  scrapePendingUrls,
  getScrapingStats,
};
