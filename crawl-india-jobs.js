#!/usr/bin/env node

/**
 * India-Only Telecalling Jobs Crawler
 * Strict Location Filtering - Only India Positions
 * Uses Firecrawl Docker API (localhost:3002)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  firecrawlUrl: 'http://localhost:3002/v1/crawl',
  timeout: 120000,
  outputDir: '.',
};

// Job websites targeting India
const PORTALS = [
  {
    name: 'Indeed India',
    url: 'https://in.indeed.com/jobs?q=telecaller&l=India',
    source: 'Indeed',
  },
  {
    name: 'Naukri',
    url: 'https://www.naukri.com/jobs-in-india-for-telecaller',
    source: 'Naukri',
  },
  {
    name: 'LinkedIn Jobs',
    url: 'https://www.linkedin.com/jobs/search?keywords=telecaller&location=India',
    source: 'LinkedIn',
  },
];

// Telecalling job keywords
const TELECALLING_KEYWORDS = [
  'telecaller', 'telecalling', 'voice process', 'call executive',
  'call center', 'customer support', 'inbound calls', 'outbound calls',
  'tele-calling', 'phone based', 'voice', 'bpo', 'ites', 'call handling',
  'customer service', 'phone operator', 'inbound agent', 'outbound agent'
];

// India locations - extensive list
const INDIA_CITIES = [
  // Major metros
  'bangalore', 'bengaluru', 'delhi', 'new delhi', 'mumbai', 'pune',
  'hyderabad', 'gurgaon', 'gurugram', 'noida', 'greater noida',
  'kolkata', 'chennai', 'jaipur', 'lucknow', 'chandigarh',
  'indore', 'ahmedabad', 'surat', 'nagpur', 'bhopal',
  'visakhapatnam', 'vadodara', 'ludhiana', 'kochi', 'coimbatore',
  'thrissur', 'kottayam', 'ernakulam', 'thiruvananthapuram',
  'nashik', 'aurangabad', 'agra', 'kanpur', 'varanasi',
  'patna', 'guwahati', 'ranchi', 'raipur', 'vadodara',
  // Tier 2 cities
  'mysore', 'mysuru', 'salem', 'trichy', 'tiruppur',
  'madurai', 'salem', 'vijayawada', 'guntur', 'kakinada',
  'ongole', 'bhimavaram', 'rajamundry', 'faridabad', 'ghaziabad',
  'varanasi', 'meerut', 'bareilly', 'aligarh', 'mathura',
  'dehradun', 'shimla', 'srinagar', 'jaipur', 'udaipur',
  'jodhpur', 'ajmer', 'pushkar'
];

const INDIA_STATES = [
  'andhra pradesh', 'telangana', 'karnataka', 'tamil nadu', 'maharashtra',
  'delhi', 'uttar pradesh', 'west bengal', 'haryana', 'punjab',
  'kerala', 'rajasthan', 'madhya pradesh', 'bihar', 'jharkhand',
  'odisha', 'assam', 'chhattisgarh', 'himachal pradesh', 'uttarakhand',
  'jammu & kashmir', 'jammu and kashmir', 'ladakh', 'goa', 'tripura',
  'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'arunachal pradesh',
  'ap', 'tn', 'ts', 'kl', 'mh', 'kt', 'up', 'wb', 'hr', 'pb', 'mp', 'rj'
];

const GLOBAL_KEYWORDS = [
  'global', 'worldwide', 'international', 'remote - global', 'remote global',
  'work from home', 'work from anywhere', 'digital nomad', 'usa', 'uk', 'us',
  'united states', 'australia', 'canada', 'europe', 'middle east', 'uae',
  'dubai', 'singapore', 'malaysia', 'sri lanka', 'philippines', 'pacific',
  'apac', 'asia-pacific', 'south africa', 'new zealand', 'japan', 'china'
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: CONFIG.timeout,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test Firecrawl health
 */
async function testFirecrawlHealth() {
  console.log('\n[CHECK] Testing Firecrawl health...');
  try {
    const response = await makeRequest(CONFIG.firecrawlUrl, 'POST', {
      url: 'https://example.com'
    });
    console.log('✓ Firecrawl is running on localhost:3002\n');
    return true;
  } catch (error) {
    console.error('✗ Firecrawl is NOT running at localhost:3002');
    console.error('  Start it with: docker-compose -f firecrawl-selfhost/docker-compose.yml up -d\n');
    return false;
  }
}

/**
 * Check if location is in India
 */
function isIndiaLocation(locationText) {
  if (!locationText) return false;
  
  const location = locationText.toLowerCase().trim();
  
  // Check for global/non-India keywords - EXCLUDE these
  for (const keyword of GLOBAL_KEYWORDS) {
    if (location.includes(keyword)) {
      return false;
    }
  }
  
  // Check for India explicitly
  if (location.includes('india')) {
    return true;
  }
  
  // Check for Indian cities
  for (const city of INDIA_CITIES) {
    if (location.includes(city)) {
      return true;
    }
  }
  
  // Check for Indian states
  for (const state of INDIA_STATES) {
    if (location.includes(state)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if text contains telecalling keywords
 */
function isTelecallingJob(text) {
  if (!text) return false;
  
  const lower = text.toLowerCase();
  for (const keyword of TELECALLING_KEYWORDS) {
    if (lower.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Parse jobs from markdown content
 */
function parseJobsFromMarkdown(markdown, source) {
  const jobs = [];
  
  // Split by common job listing patterns
  const jobBlocks = markdown.split(/\n\n+/);
  
  for (const block of jobBlocks) {
    const lines = block.split('\n').filter(l => l.trim());
    
    if (lines.length === 0) continue;
    
    // Try to identify job information from the block
    const job = {
      title: '',
      company: '',
      location: '',
      description: '',
      source: source,
      scrapedAt: new Date().toISOString(),
    };
    
    // First non-empty line often contains job title
    if (lines[0] && lines[0].trim().length > 5 && lines[0].trim().length < 200) {
      job.title = lines[0].trim();
    }
    
    // Look for location patterns in the block
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('location') || lower.includes('city') || lower.includes('based')) {
        // Extract location after the keyword
        const match = line.match(/(?:location|city|based)[:\s]+([^,\n]+)/i);
        if (match) {
          job.location = match[1].trim();
        }
      }
      
      // Accumulate description from other lines
      if (!job.title.includes(line) && !job.company.includes(line)) {
        job.description += line + ' ';
      }
    }
    
    job.description = job.description.trim().substring(0, 500);
    
    // Only add if it contains telecalling keywords and has basic info
    if (isTelecallingJob(job.title + ' ' + job.description) && job.title.length > 3) {
      jobs.push(job);
    }
  }
  
  return jobs;
}

/**
 * Crawl a portal using Firecrawl
 */
async function crawlPortal(portal) {
  console.log(`\n[CRAWL] Processing ${portal.name}...`);
  console.log(`   URL: ${portal.url}`);
  
  try {
    console.log('   → Sending crawl request to Firecrawl...');
    
    const response = await makeRequest(CONFIG.firecrawlUrl, 'POST', {
      url: portal.url,
      limit: 5,
    });
    
    if (response.data.success || response.data.id) {
      const jobId = response.data.id;
      console.log(`   ✓ Crawl initiated: ${jobId}`);
      
      // Wait for processing
      console.log('   → Waiting for results...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get results
      const resultResponse = await makeRequest(
        `http://localhost:3002/v1/crawl/${jobId}`,
        'GET'
      );
      
      if (resultResponse.data.success && resultResponse.data.data) {
        const markdown = resultResponse.data.data.markdown || '';
        console.log(`   ✓ Retrieved ${markdown.length} characters`);
        return markdown;
      } else {
        console.log(`   ⚠ Crawl status: ${resultResponse.data.status}`);
        return '';
      }
    } else {
      console.log(`   ✗ Crawl failed: ${response.data.error}`);
      return '';
    }
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
    return '';
  }
}

/**
 * Filter jobs to India only
 */
function filterIndiaJobs(allJobs) {
  console.log('\n[FILTER] Applying India-only location filter...');
  
  const indiaJobs = [];
  let rejectedCount = 0;
  
  for (const job of allJobs) {
    let isIndian = false;
    let rejectReason = '';
    
    // Check for global keywords in any field
    const fullText = (job.title + ' ' + job.location + ' ' + job.description).toLowerCase();
    for (const keyword of GLOBAL_KEYWORDS) {
      if (fullText.includes(keyword)) {
        rejectedCount++;
        continue;
      }
    }
    
    // Check location
    if (job.location && isIndiaLocation(job.location)) {
      isIndian = true;
    }
    // Check title
    else if (job.title && isIndiaLocation(job.title)) {
      isIndian = true;
    }
    // Check description
    else if (job.description && isIndiaLocation(job.description)) {
      isIndian = true;
    }
    
    if (isIndian) {
      indiaJobs.push(job);
    } else {
      rejectedCount++;
    }
  }
  
  console.log(`   ✓ India jobs: ${indiaJobs.length}`);
  console.log(`   ✗ Rejected (non-India): ${rejectedCount}`);
  
  return indiaJobs;
}

/**
 * Save to JSON
 */
function saveAsJson(jobs) {
  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '').substring(0, 14);
  const filename = `india_telecalling_jobs_${timestamp}.json`;
  const filepath = path.join(CONFIG.outputDir, filename);
  
  const data = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalJobs: jobs.length,
      filterApplied: 'India-only',
      categories: ['Telecalling', 'Call Center', 'Voice Process', 'BPO'],
    },
    jobs: jobs,
  };
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ JSON saved: ${filepath}`);
  
  return filepath;
}

/**
 * Save to CSV
 */
function saveAsCsv(jobs) {
  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '').substring(0, 14);
  const filename = `india_telecalling_jobs_${timestamp}.csv`;
  const filepath = path.join(CONFIG.outputDir, filename);
  
  // CSV header
  const headers = ['Title', 'Company', 'Location', 'Source', 'Description', 'Scraped At'];
  const rows = [headers.map(h => `"${h}"`).join(',')];
  
  // Data rows
  for (const job of jobs) {
    const row = [
      job.title,
      job.company,
      job.location,
      job.source,
      job.description.substring(0, 100),
      job.scrapedAt,
    ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(',');
    
    rows.push(row);
  }
  
  fs.writeFileSync(filepath, rows.join('\n'), 'utf8');
  console.log(`✓ CSV saved: ${filepath}`);
  
  return filepath;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   INDIA-ONLY TELECALLING JOBS CRAWLER (Firecrawl)             ║');
  console.log('║   Strict Location Filtering - India Positions Only            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  // Health check
  console.log('\n[STEP 1] Firecrawl Health Check');
  if (!await testFirecrawlHealth()) {
    process.exit(1);
  }
  
  // Crawl portals
  console.log('[STEP 2] Crawling Job Portals');
  const allScrapedContent = [];
  
  for (const portal of PORTALS) {
    const markdown = await crawlPortal(portal);
    if (markdown.length > 0) {
      allScrapedContent.push({
        source: portal.source,
        content: markdown,
      });
    }
  }
  
  // Parse jobs
  console.log('\n[STEP 3] Parsing Job Listings');
  const allJobs = [];
  
  for (const scraped of allScrapedContent) {
    console.log(`   Parsing ${scraped.source}...`);
    const jobs = parseJobsFromMarkdown(scraped.content, scraped.source);
    console.log(`   Found ${jobs.length} job entries`);
    allJobs.push(...jobs);
  }
  
  console.log(`   Total jobs before filtering: ${allJobs.length}`);
  
  // Filter to India only
  console.log('\n[STEP 4] Applying India-Only Filter');
  const indiaJobs = filterIndiaJobs(allJobs);
  
  // Export results
  console.log('\n[STEP 5] Exporting Results');
  
  if (indiaJobs.length === 0) {
    console.log('⚠  No India jobs found in crawled data');
    console.log('   This may be because:');
    console.log('   • Crawl is still processing');
    console.log('   • Website blocked the crawl');
    console.log('   • No jobs matched the filters');
  } else {
    saveAsJson(indiaJobs);
    saveAsCsv(indiaJobs);
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total jobs scraped:         ${allJobs.length}`);
  console.log(`India-only jobs:            ${indiaJobs.length}`);
  console.log(`Rejected (non-India):       ${allJobs.length - indiaJobs.length}`);
  if (allJobs.length > 0) {
    const successRate = ((indiaJobs.length / allJobs.length) * 100).toFixed(2);
    console.log(`Success rate:               ${successRate}%`);
  }
  console.log('\n✓ Process complete!\n');
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
