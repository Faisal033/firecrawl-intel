const Parser = require('rss-parser');
const axios = require('axios');
const { News } = require('../models');
const url = require('url');

const parser = new Parser({
  customFields: {
    item: [['media:content', 'mediaContent']],
  },
});

// Industry news sources for Indian logistics
const LOGISTICS_NEWS_SOURCES = [
  { name: 'Freightwaves', url: 'https://www.freightwaves.com/feed' },
  { name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/feed' },
  { name: 'Logistics Bureau', url: 'https://www.logisticsbureau.com/feed' },
  { name: 'TechCircle', url: 'https://techcircle.com/feed' },
  { name: 'Inc42', url: 'https://inc42.com/feed' },
];

/**
 * Fetch Google News RSS for competitor
 */
const fetchGoogleNewsRss = async (competitorName) => {
  try {
    console.log(`📰 Fetching Google News for: ${competitorName}`);
    const queryUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(competitorName)}&hl=en-IN&gl=IN&ceid=IN:en`;

    const feed = await parser.parseURL(queryUrl);
    const articles = [];

    for (const item of feed.items.slice(0, 10)) {
      articles.push({
        title: item.title,
        url: item.link,
        sourceDomain: new URL(item.link).hostname,
        sourceType: 'RSS',
        publishedAt: new Date(item.pubDate),
        description: item.content || item.contentSnippet,
        source: { rssId: 'google-news', feedUrl: queryUrl },
      });
    }

    console.log(`✅ Found ${articles.length} Google News articles`);
    return articles;
  } catch (error) {
    console.error(`❌ Google News error for ${competitorName}:`, error.message);
    return [];
  }
};

/**
 * Parse sitemap.xml and extract relevant URLs
 */
const parseSitemap = async (sitemapUrl, pathFilters = null) => {
  try {
    console.log(`🗺️  Parsing sitemap: ${sitemapUrl}`);

    const response = await axios.get(sitemapUrl, { timeout: 10000 });
    const urls = [];

    // Simple regex to extract URLs from sitemap
    const urlPattern = /<loc>([^<]+)<\/loc>/g;
    let match;

    while ((match = urlPattern.exec(response.data)) !== null) {
      const href = match[1];

      // Filter by paths if specified
      if (pathFilters && pathFilters.length > 0) {
        const hasRelevantPath = pathFilters.some((path) => href.includes(path));
        if (!hasRelevantPath) continue;
      }

      urls.push({
        url: href,
        sourceDomain: new URL(href).hostname,
        sourceType: 'SITEMAP',
      });
    }

    console.log(`✅ Found ${urls.length} URLs in sitemap`);
    return urls;
  } catch (error) {
    console.error(`❌ Sitemap error for ${sitemapUrl}:`, error.message);
    return [];
  }
};

/**
 * Discover company website structure
 */
const discoverCompanyWebsite = async (websiteUrl) => {
  try {
    console.log(`🔍 Discovering website structure: ${websiteUrl}`);

    const baseUrl = new URL(websiteUrl);
    const urls = [];

    // Try to fetch sitemap
    const sitemapUrl = `${baseUrl.origin}/sitemap.xml`;
    const pathFilters = ['blog', 'news', 'press', 'media', 'investor', 'careers', 'locations'];

    try {
      const sitemapUrls = await parseSitemap(sitemapUrl, pathFilters);
      urls.push(...sitemapUrls);
    } catch (e) {
      console.log(`⚠️  Sitemap not found, trying direct paths`);

      // If sitemap missing, try known paths
      for (const path of pathFilters) {
        urls.push({
          url: `${baseUrl.origin}/${path}`,
          sourceDomain: baseUrl.hostname,
          sourceType: 'SITE_SEARCH',
        });
      }
    }

    return urls;
  } catch (error) {
    console.error(`❌ Website discovery error for ${websiteUrl}:`, error.message);
    return [];
  }
};

/**
 * Search industry news sources for competitor keyword
 */
const searchIndustryNews = async (competitorName) => {
  try {
    console.log(`🔎 Searching industry news sources for: ${competitorName}`);

    const articles = [];

    for (const source of LOGISTICS_NEWS_SOURCES) {
      try {
        const feed = await parser.parseURL(source.url);

        const relevantItems = feed.items.filter((item) =>
          item.title.toLowerCase().includes(competitorName.toLowerCase()) ||
          item.content?.toLowerCase().includes(competitorName.toLowerCase())
        );

        for (const item of relevantItems.slice(0, 5)) {
          articles.push({
            title: item.title,
            url: item.link,
            sourceDomain: new URL(item.link).hostname,
            sourceType: 'RSS',
            publishedAt: new Date(item.pubDate),
            description: item.content || item.contentSnippet,
            source: { rssId: source.name, feedUrl: source.url },
          });
        }
      } catch (error) {
        console.warn(`⚠️  Error fetching ${source.name}:`, error.message);
      }
    }

    console.log(`✅ Found ${articles.length} industry news articles`);
    return articles;
  } catch (error) {
    console.error(`❌ Industry news search error:`, error.message);
    return [];
  }
};

/**
 * Discover all URLs for a competitor
 */
const discoverCompetitorUrls = async (competitor) => {
  try {
    console.log(`\n🕵️  Starting URL discovery for: ${competitor.name}`);

    const allUrls = [];

    // 1. Google News RSS
    const googleNews = await fetchGoogleNewsRss(competitor.name);
    allUrls.push(...googleNews);

    // 2. Company website discovery
    const websiteUrls = await discoverCompanyWebsite(competitor.website);
    allUrls.push(...websiteUrls);

    // 3. Industry news sources
    const industryNews = await searchIndustryNews(competitor.name);
    allUrls.push(...industryNews);

    console.log(`\n✅ Total URLs discovered: ${allUrls.length}`);

    return allUrls;
  } catch (error) {
    console.error(`❌ Discovery error for ${competitor.name}:`, error.message);
    return [];
  }
};

/**
 * Save discovered URLs to database (deduplicate existing ones)
 */
const saveDiscoveredUrls = async (competitorId, discoveredUrls) => {
  try {
    let savedCount = 0;

    for (const urlData of discoveredUrls) {
      // Check if URL already exists
      const existing = await News.findOne({ competitorId, url: urlData.url });

      if (existing) {
        // Add source to existing document
        if (urlData.source) {
          existing.sources.push(urlData.source);
          await existing.save();
        }
      } else {
        // Create new News document
        await News.create({
          competitorId,
          title: urlData.title,
          url: urlData.url,
          urlCanonical: normalizeUrl(urlData.url),
          sourceType: urlData.sourceType,
          sourceDomain: urlData.sourceDomain,
          sources: urlData.source ? [urlData.source] : [],
          publishedAt: urlData.publishedAt,
          status: 'DISCOVERED',
        });
        savedCount++;
      }
    }

    console.log(`💾 Saved ${savedCount} new URLs`);
    return savedCount;
  } catch (error) {
    console.error(`❌ Error saving discovered URLs:`, error.message);
    return 0;
  }
};

/**
 * Normalize URL for deduplication
 */
const normalizeUrl = (urlString) => {
  try {
    const parsed = new URL(urlString);
    parsed.search = ''; // Remove query params
    parsed.hash = ''; // Remove fragment
    return parsed.toString();
  } catch {
    return urlString;
  }
};

module.exports = {
  fetchGoogleNewsRss,
  parseSitemap,
  discoverCompanyWebsite,
  searchIndustryNews,
  discoverCompetitorUrls,
  saveDiscoveredUrls,
  normalizeUrl,
};
