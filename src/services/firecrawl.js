const axios = require('axios');
require('dotenv').config();

const FIRECRAWL_ENDPOINT = process.env.FIRECRAWL_ENDPOINT || 'http://localhost:3002/v1/crawl';

/**
 * Call real Firecrawl Docker instance
 * @param {string} url - URL to crawl
 * @param {object} options - Optional parameters
 * @returns {Promise<object>} - Scraped content
 */
const scrapeUrl = async (url, options = {}) => {
  try {
    console.log(`🕷️  Scraping: ${url}`);

    const response = await axios.post(
      FIRECRAWL_ENDPOINT,
      {
        url,
        limit: options.limit || 1,
        scrapeOptions: options.scrapeOptions || {},
      },
      {
        timeout: options.timeout || 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.success) {
      throw new Error(`Firecrawl failed: ${JSON.stringify(response.data)}`);
    }

    console.log(`✅ Scraped: ${url}`);

    return {
      success: true,
      data: response.data.data,
      statusCode: response.status,
    };
  } catch (error) {
    console.error(`❌ Firecrawl error for ${url}:`, error.message);

    return {
      success: false,
      error: error.message,
      statusCode: error.response?.status || 0,
      responseBody: error.response?.data,
      url,
    };
  }
};

/**
 * Batch scrape URLs
 */
const scrapeUrls = async (urls, options = {}) => {
  const results = [];
  const delay = options.delay || 1000; // Delay between requests

  for (const url of urls) {
    const result = await scrapeUrl(url, options);
    results.push(result);
    // Delay between requests
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
};

module.exports = {
  scrapeUrl,
  scrapeUrls,
  FIRECRAWL_ENDPOINT,
};
