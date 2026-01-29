const axios = require('axios');
require('dotenv').config();

const FIRECRAWL_ENDPOINT = process.env.FIRECRAWL_ENDPOINT || 'http://localhost:3002/v1/crawl';
const DEBUG_FIRECRAWL = process.env.DEBUG_FIRECRAWL === 'true';

/**
 * Sleep utility with cancellation support
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Normalize response from Firecrawl to extract markdown content
 * Handles different response shapes: response.data.markdown, response.data.data.markdown, response.data[0].markdown, etc.
 * Never assumes structure - returns null if not found.
 */
const normalizeMarkdownFromResponse = (responseData) => {
  if (!responseData || typeof responseData !== 'object') return null;

  // Direct markdown at top level: resp.markdown
  if (typeof responseData.markdown === 'string' && responseData.markdown.trim().length > 0) {
    return responseData.markdown;
  }

  // Nested in data object: resp.data.markdown
  if (responseData.data && typeof responseData.data === 'object') {
    if (typeof responseData.data.markdown === 'string' && responseData.data.markdown.trim().length > 0) {
      return responseData.data.markdown;
    }

    // Array of results (some APIs return arrays): resp.data[0].markdown
    if (Array.isArray(responseData.data) && responseData.data.length > 0) {
      for (const item of responseData.data) {
        if (item && typeof item.markdown === 'string' && item.markdown.trim().length > 0) {
          return item.markdown;
        }
      }
    }
  }

  // Fallback: check if data itself is an array
  if (Array.isArray(responseData) && responseData.length > 0) {
    for (const item of responseData) {
      if (item && typeof item.markdown === 'string' && item.markdown.trim().length > 0) {
        return item.markdown;
      }
    }
  }

  return null;
};

/**
 * Normalize HTML content from response
 * Never assumes structure - returns empty string if not found.
 */
const normalizeHtmlFromResponse = (responseData) => {
  if (!responseData || typeof responseData !== 'object') return '';

  if (typeof responseData.html === 'string') {
    return responseData.html;
  }

  if (responseData.data && typeof responseData.data === 'object') {
    if (typeof responseData.data.html === 'string') {
      return responseData.data.html;
    }

    if (Array.isArray(responseData.data) && responseData.data.length > 0) {
      for (const item of responseData.data) {
        if (item && typeof item.html === 'string') {
          return item.html;
        }
      }
    }
  }

  if (Array.isArray(responseData) && responseData.length > 0) {
    for (const item of responseData) {
      if (item && typeof item.html === 'string') {
        return item.html;
      }
    }
  }

  return '';
};

/**
 * Normalize metadata from response
 * Never assumes structure - returns empty object if not found.
 */
const normalizeMetadataFromResponse = (responseData) => {
  if (!responseData || typeof responseData !== 'object') return {};

  if (responseData.metadata && typeof responseData.metadata === 'object') {
    return responseData.metadata;
  }

  if (responseData.data && typeof responseData.data === 'object') {
    if (responseData.data.metadata && typeof responseData.data.metadata === 'object') {
      return responseData.data.metadata;
    }

    if (Array.isArray(responseData.data) && responseData.data.length > 0) {
      for (const item of responseData.data) {
        if (item && item.metadata && typeof item.metadata === 'object') {
          return item.metadata;
        }
      }
    }
  }

  if (Array.isArray(responseData) && responseData.length > 0) {
    for (const item of responseData) {
      if (item && item.metadata && typeof item.metadata === 'object') {
        return item.metadata;
      }
    }
  }

  return {};
};

/**
 * Poll a Firecrawl job until it completes or times out
 * Uses simple timeout checks without Promise.race to avoid hangs
 */
const pollJobUntilComplete = async (jobUrl, maxWaitMs = 90000) => {
  const startTime = Date.now();
  const pollInterval = 2000; // Check every 2 seconds
  let lastError = null;
  let pollCount = 0;

  if (DEBUG_FIRECRAWL) {
    console.log(`[DEBUG] Starting job poll: ${jobUrl}`);
    console.log(`[DEBUG] Max wait time: ${maxWaitMs}ms`);
  }

  while (Date.now() - startTime < maxWaitMs) {
    pollCount++;
    const elapsedMs = Date.now() - startTime;

    if (DEBUG_FIRECRAWL) {
      console.log(`[DEBUG] Poll attempt #${pollCount} at ${elapsedMs}ms`);
    }

    try {
      // Make the request with explicit timeout
      const response = await axios.get(jobUrl, {
        timeout: 8000, // 8 second timeout per request
        validateStatus: () => true, // Accept all status codes
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.data) {
        if (DEBUG_FIRECRAWL) {
          console.log(`[DEBUG] Poll #${pollCount}: Empty response, retrying...`);
        }
        lastError = 'Empty response from job polling';
        await sleep(pollInterval);
        continue;
      }

      const data = response.data;

      if (DEBUG_FIRECRAWL) {
        console.log(`[DEBUG] Poll #${pollCount}: status=${data.status}, http=${response.status}`);
      }

      // Check for completion
      if (data.status === 'completed' || data.status === 'done') {
        if (DEBUG_FIRECRAWL) {
          console.log(`[DEBUG] Job completed successfully after ${pollCount} polls`);
        }
        return {
          success: true,
          data: data,
          statusCode: response.status,
        };
      }

      // Check for failure
      if (data.status === 'failed' || data.error) {
        const errorMsg = data.error || data.message || 'Job failed';
        if (DEBUG_FIRECRAWL) {
          console.log(`[DEBUG] Job failed: ${errorMsg}`);
        }
        return {
          success: false,
          error: `Job failed: ${errorMsg}`,
          statusCode: response.status,
          data: data,
        };
      }

      // Still processing, wait before next poll
      if (DEBUG_FIRECRAWL) {
        console.log(`[DEBUG] Job in progress (${data.status}), waiting ${pollInterval}ms...`);
      }
      await sleep(pollInterval);

    } catch (error) {
      // Log error but continue retrying
      lastError = error.message;
      const elapsedSecs = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (DEBUG_FIRECRAWL) {
        console.log(`[DEBUG] Poll #${pollCount} request error at ${elapsedSecs}s: ${error.message}`);
      }

      // If timeout, don't keep retrying
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        const remaining = maxWaitMs - (Date.now() - startTime);
        if (remaining <= 0) {
          break; // Exit polling loop
        }
      }

      await sleep(pollInterval);
    }
  }

  // Timeout reached
  const timeoutMsg = `Job polling timed out after ${pollCount} polls and ${maxWaitMs}ms`;
  if (DEBUG_FIRECRAWL) {
    console.log(`[DEBUG] ${timeoutMsg}`);
  }
  return {
    success: false,
    error: timeoutMsg,
    statusCode: 0,
    lastError: lastError,
  };
};

/**
 * Call real Firecrawl Docker instance with robust error handling
 * Handles the async job pattern: POST returns job ID, must poll job URL for results
 * Implements retry logic with exponential backoff
 * @param {string} url - URL to crawl
 * @param {object} options - Optional parameters (timeout, limit, scrapeOptions, debug, maxRetries)
 * @returns {Promise<object>} - Scraped content or error details
 */
const scrapeUrl = async (url, options = {}) => {
  const debug = options.debug || DEBUG_FIRECRAWL;
  const maxWaitMs = options.timeout || 90000; // Wait up to 90 seconds for job completion
  const maxRetries = options.maxRetries || 2; // Retry up to 2 times on network errors
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (debug) {
        console.log(`[DEBUG] Scrape attempt ${attempt + 1}/${maxRetries + 1} for: ${url}`);
      }

      console.log(`\n🕷️  Scraping: ${url}`);

      const requestPayload = {
        url,
        limit: options.limit || 1,
        scrapeOptions: options.scrapeOptions || {},
      };

      if (debug) {
        console.log('[DEBUG] Request Payload:', JSON.stringify(requestPayload, null, 2));
      }

      // Step 1: Initiate the crawl job with timeout
      let initResponse;
      try {
        initResponse = await axios.post(
          FIRECRAWL_ENDPOINT,
          requestPayload,
          {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json',
            },
            validateStatus: () => true, // Accept all status codes
          }
        );
      } catch (networkError) {
        lastError = networkError;
        const timeoutMs = 1000 * Math.pow(2, attempt); // Exponential backoff
        
        if (attempt < maxRetries) {
          console.warn(`⚠️  Network error (attempt ${attempt + 1}): ${networkError.message}`);
          console.log(`⏳ Retrying in ${timeoutMs}ms...`);
          await sleep(timeoutMs);
          continue;
        } else {
          console.error(`❌ Firecrawl unreachable after ${maxRetries + 1} attempts: ${networkError.message}`);
          return {
            success: false,
            error: `Firecrawl service unreachable: ${networkError.message}`,
            statusCode: 0,
            url,
          };
        }
      }

      if (!initResponse) {
        const msg = 'No response from Firecrawl service';
        if (attempt < maxRetries) {
          console.warn(`⚠️  ${msg}, retrying...`);
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        return {
          success: false,
          error: msg,
          statusCode: 0,
          url,
        };
      }

      if (debug) {
        console.log(`[DEBUG] Init Response Status: ${initResponse.status}`);
        console.log('[DEBUG] Init Response Body:', JSON.stringify(initResponse.data, null, 2).substring(0, 500));
      }

      // Check for init errors (non-200 status)
      if (initResponse.status >= 400) {
        const errorMsg = `HTTP ${initResponse.status} during job initiation`;
        console.error(`❌ Firecrawl init error for ${url}:`, errorMsg);
        
        if (initResponse.status >= 500 && attempt < maxRetries) {
          // Retry on server errors
          console.log(`⏳ Server error, retrying in ${1000 * Math.pow(2, attempt)}ms...`);
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }

        return {
          success: false,
          error: errorMsg,
          statusCode: initResponse.status,
          responseBody: initResponse.data,
          url,
        };
      }

      // Ensure we have data
      if (!initResponse.data || typeof initResponse.data !== 'object') {
        const msg = 'Invalid response data from Firecrawl';
        if (attempt < maxRetries) {
          console.warn(`⚠️  ${msg}, retrying...`);
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        return {
          success: false,
          error: msg,
          statusCode: initResponse.status,
          url,
        };
      }

      const initData = initResponse.data;

      // Check if we got a job ID (async response)
      if (initData.id && initData.url && typeof initData.url === 'string') {
        if (debug) {
          console.log(`[DEBUG] Got job ID: ${initData.id}`);
          console.log(`[DEBUG] Polling job URL: ${initData.url}`);
        }

        // Step 2: Poll the job URL until completion
        console.log(`⏳ Waiting for job to complete (max ${maxWaitMs / 1000}s)...`);
        const pollResult = await pollJobUntilComplete(initData.url, maxWaitMs);

        if (!pollResult.success) {
          const pollError = pollResult.error || 'Unknown polling error';
          console.error(`❌ Job polling failed: ${pollError}`);
          
          // Only retry on transient errors, not on job failure
          if (pollError.includes('unreachable') || pollError.includes('ECONNREFUSED')) {
            if (attempt < maxRetries) {
              console.log(`⏳ Retrying after poll failure...`);
              await sleep(1000 * Math.pow(2, attempt));
              continue;
            }
          }

          return {
            success: false,
            error: pollError,
            statusCode: pollResult.statusCode,
            url,
          };
        }

        // Step 3: Extract content from completed job - SAFELY
        if (!pollResult.data || typeof pollResult.data !== 'object') {
          return {
            success: false,
            error: 'Job completed but returned invalid data',
            statusCode: pollResult.statusCode,
            url,
          };
        }

        const jobData = pollResult.data;
        const markdown = normalizeMarkdownFromResponse(jobData);
        const html = normalizeHtmlFromResponse(jobData);
        const metadata = normalizeMetadataFromResponse(jobData);

        // Only log success if we actually got content
        if (!markdown || markdown.trim().length === 0) {
          const warningMsg = `No content extracted from completed job for ${url}`;
          console.warn(`⚠️  ${warningMsg}`);
          return {
            success: false,
            error: 'Firecrawl completed but returned no content (site may have blocked the crawler)',
            statusCode: pollResult.statusCode,
            responseBody: jobData,
            url,
          };
        }

        // Only log "Scraped" if we have valid content
        console.log(`✅ Scraped: ${url} (${markdown.length} chars)`);

        return {
          success: true,
          status: 'success',
          url,
          markdown,
          htmlContent: html || '',
          metadata: metadata || {},
          statusCode: pollResult.statusCode,
          contentLength: markdown.length,
        };
      }

      // If no job ID, check if it's a sync response with content
      const markdown = normalizeMarkdownFromResponse(initData);
      if (markdown && markdown.trim().length > 0) {
        const html = normalizeHtmlFromResponse(initData);
        const metadata = normalizeMetadataFromResponse(initData);

        console.log(`✅ Scraped: ${url} (${markdown.length} chars - sync response)`);

        return {
          success: true,
          status: 'success',
          url,
          markdown,
          htmlContent: html || '',
          metadata: metadata || {},
          statusCode: initResponse.status,
          contentLength: markdown.length,
        };
      }

      // No content and no job ID
      console.error(`❌ Unexpected response format for ${url}`);
      if (attempt < maxRetries && initResponse.status >= 500) {
        console.log(`⏳ Server error, retrying...`);
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }

      return {
        success: false,
        error: 'Unexpected Firecrawl response format - no job ID and no content',
        statusCode: initResponse.status,
        responseBody: initData,
        url,
      };

    } catch (error) {
      lastError = error;
      console.error(`❌ Firecrawl error for ${url}:`, error.message);

      if (attempt < maxRetries) {
        const backoffMs = 1000 * Math.pow(2, attempt);
        console.log(`⏳ Retrying in ${backoffMs}ms (attempt ${attempt + 2}/${maxRetries + 1})...`);
        await sleep(backoffMs);
        continue;
      }

      const errorResult = {
        success: false,
        error: error.message,
        statusCode: error.response?.status || error.code || 0,
        responseBody: error.response?.data || null,
        url,
      };

      if (debug) {
        console.log('[DEBUG] Error Result:', JSON.stringify(errorResult, null, 2));
        console.log('[DEBUG] Full Error:', error);
      }

      return errorResult;
    }
  }

  // Should not reach here, but just in case
  return {
    success: false,
    error: lastError?.message || 'Unknown error after all retries',
    statusCode: 0,
    url,
  };
};

/**
 * Batch scrape URLs
 */
const scrapeUrls = async (urls, options = {}) => {
  const results = [];
  const delay = options.delay || 1000;

  for (const url of urls) {
    const result = await scrapeUrl(url, options);
    results.push(result);
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
  normalizeMarkdownFromResponse,
  normalizeHtmlFromResponse,
  normalizeMetadataFromResponse,
};
