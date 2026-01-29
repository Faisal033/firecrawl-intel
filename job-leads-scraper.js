#!/usr/bin/env node

/**
 * Telecalling Job Leads Scraper
 * Uses Firecrawl directly on localhost:3002 to scrape Indian job websites
 * Extracts: Company, Job Title, Location, Description, Phone, Email
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

// Configuration
const CONFIG = {
  firecrawlUrl: 'http://localhost:3002/v1/crawl',
  timeout: 180000, // 3 minutes
  pollingInterval: 2000, // 2 seconds
  maxPolls: 90, // Max 3 minutes of polling
};

// Job websites and search keywords
const WEBSITES = [
  {
    name: 'Indeed India',
    baseUrl: 'https://in.indeed.com/jobs',
    searchTerms: ['telecaller', 'telecalling', 'voice process', 'call executive'],
    queryParam: 'q',
  },
  {
    name: 'LinkedIn Jobs',
    baseUrl: 'https://www.linkedin.com/jobs/search',
    searchTerms: ['telecaller', 'telecalling', 'voice process executive'],
    queryParam: 'keywords',
  },
  {
    name: 'Naukri.com',
    baseUrl: 'https://www.naukri.com',
    searchTerms: ['telecaller', 'telecalling'],
    queryParam: 'search',
  },
  {
    name: 'Fresher.com',
    baseUrl: 'https://fresher.com',
    searchTerms: ['telecaller jobs', 'voice process jobs'],
    queryParam: 'q',
  },
];

// Store all extracted jobs
let allJobs = [];

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith('https') ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      timeout: CONFIG.timeout,
    };

    const req = protocol.request(options, (res) => {
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
 * Crawl a URL using Firecrawl
 */
async function crawlWithFirecrawl(url, waitTime = 3000) {
  console.log(`  📡 Sending crawl request for: ${url}`);

  try {
    // Step 1: Submit crawl job
    const submitResponse = await makeRequest(CONFIG.firecrawlUrl, 'POST', {
      url: url,
      wait_for_loading_delay: waitTime,
    });

    if (!submitResponse.data.success || !submitResponse.data.id) {
      console.log(`  ❌ Failed to create crawl job`);
      return null;
    }

    const jobId = submitResponse.data.id;
    const statusUrl = submitResponse.data.url;
    console.log(`  ✅ Job created: ${jobId}`);

    // Step 2: Poll for results
    let attempts = 0;
    let result = null;

    while (attempts < CONFIG.maxPolls) {
      attempts++;
      
      try {
        const statusResponse = await makeRequest(statusUrl, 'GET');
        
        if (statusResponse.data.status === 'completed') {
          result = statusResponse.data;
          console.log(`  ✅ Crawl completed in ${attempts * (CONFIG.pollingInterval / 1000)}s`);
          break;
        }

        if (statusResponse.data.status === 'failed') {
          console.log(`  ❌ Crawl failed: ${statusResponse.data.error}`);
          break;
        }

        process.stdout.write(`.`);
        await sleep(CONFIG.pollingInterval);
      } catch (e) {
        console.log(`\n  ⚠️  Poll attempt ${attempts} failed: ${e.message}`);
        await sleep(CONFIG.pollingInterval);
      }
    }

    if (!result) {
      console.log(`\n  ❌ Polling timeout after ${attempts} attempts`);
      return null;
    }

    console.log(`\n  📄 Retrieved ${result.data.length} page(s)`);
    return result.data;
  } catch (error) {
    console.log(`  ❌ Crawl error: ${error.message}`);
    return null;
  }
}

/**
 * Extract job data from markdown content
 */
function extractJobData(markdown, sourceUrl, websiteName) {
  const jobs = [];

  // Split by common job card patterns
  const jobBlocks = markdown.split(/\n(?=[A-Z]|Job|\d+\.)/);

  for (const block of jobBlocks) {
    const job = {
      source_website: websiteName,
      source_url: sourceUrl,
      company_name: null,
      job_title: null,
      location: null,
      description: null,
      phone: null,
      email: null,
      extracted_at: new Date().toISOString(),
    };

    // Extract phone number
    const phoneMatch = block.match(/\b([0-9]{10}|[0-9]{3}-[0-9]{3}-[0-9]{4}|\+91[0-9]{10})\b/);
    if (phoneMatch) {
      job.phone = phoneMatch[1];
    }

    // Extract email
    const emailMatch = block.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      job.email = emailMatch[1];
    }

    // Extract job title (usually at start or after company)
    const titleMatch = block.match(/(?:Job|Position|Title|Role)[:\s]+([^\n]+)/i);
    if (titleMatch) {
      job.job_title = titleMatch[1].trim();
    } else {
      // Look for common job title patterns
      const titlePatterns = [
        /^(.*?telecaller.*?|.*?voice.*?process.*?|.*?call.*?executive.*?)[\s\n]/i,
        /^([A-Z][^(\n]{15,50})(?:\s*\(|\s*[|•]|\s*\n)/,
      ];
      for (const pattern of titlePatterns) {
        const match = block.match(pattern);
        if (match) {
          job.job_title = match[1].trim();
          break;
        }
      }
    }

    // Extract company name
    const companyMatch = block.match(/(?:Company|Employer|by)[:\s]+([^\n]+)/i);
    if (companyMatch) {
      job.company_name = companyMatch[1].trim();
    } else {
      // Try to find company from context
      const lines = block.split('\n');
      if (lines[0] && lines[0].length < 100 && !lines[0].includes('telecall')) {
        job.company_name = lines[0].trim();
      }
    }

    // Extract location
    const locationMatch = block.match(/(?:Location|Place|City|Area)[:\s]+([^\n]+)/i);
    if (locationMatch) {
      job.location = locationMatch[1].trim();
    } else {
      // Look for common Indian cities
      const cities = [
        'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata',
        'Ahmedabad', 'Jaipur', 'Chandigarh', 'Lucknow', 'Gurgaon', 'Noida',
      ];
      const cityMatch = block.match(new RegExp(`\\b(${cities.join('|')})\\b`, 'i'));
      if (cityMatch) {
        job.location = cityMatch[1];
      }
    }

    // Extract job description (first 200 chars of meaningful content)
    const descLines = block
      .split('\n')
      .filter((line) => line.length > 10 && !line.includes('Click') && !line.includes('Apply'))
      .slice(0, 3)
      .join(' ');
    if (descLines) {
      job.description = descLines.substring(0, 200).trim();
    }

    // Only add if we have at least job title or company
    if (job.job_title || job.company_name) {
      jobs.push(job);
    }
  }

  return jobs;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build search URLs
 */
function buildSearchUrls(website) {
  const urls = [];
  for (const term of website.searchTerms) {
    let url;
    if (website.name === 'Indeed India') {
      url = `${website.baseUrl}?${website.queryParam}=${encodeURIComponent(term)}&location=India`;
    } else if (website.name === 'LinkedIn Jobs') {
      url = `${website.baseUrl}?${website.queryParam}=${encodeURIComponent(term)}&location=India`;
    } else if (website.name === 'Naukri.com') {
      url = `${website.baseUrl}/jobs-${term.replace(/\s+/g, '-')}`;
    } else {
      url = `${website.baseUrl}?${website.queryParam}=${encodeURIComponent(term)}`;
    }
    urls.push(url);
  }
  return urls;
}

/**
 * Save results to JSON
 */
async function saveToJSON(jobs, filename) {
  const filepath = path.join(process.cwd(), filename);
  fs.writeFileSync(filepath, JSON.stringify(jobs, null, 2));
  console.log(`\n✅ Saved ${jobs.length} jobs to ${filename}`);
}

/**
 * Save results to CSV
 */
async function saveToCSV(jobs, filename) {
  if (jobs.length === 0) {
    console.log('No jobs to save');
    return;
  }

  const csvWriter = createObjectCsvWriter({
    path: path.join(process.cwd(), filename),
    header: [
      { id: 'source_website', title: 'Website' },
      { id: 'company_name', title: 'Company' },
      { id: 'job_title', title: 'Job Title' },
      { id: 'location', title: 'Location' },
      { id: 'description', title: 'Description' },
      { id: 'phone', title: 'Phone' },
      { id: 'email', title: 'Email' },
      { id: 'source_url', title: 'Source URL' },
      { id: 'extracted_at', title: 'Extracted At' },
    ],
  });

  await csvWriter.writeRecords(jobs);
  console.log(`✅ Saved ${jobs.length} jobs to ${filename}`);
}

/**
 * Main scraping function
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       Telecalling Job Leads Scraper (Firecrawl)           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check if Firecrawl is running
  try {
    console.log('🔍 Checking Firecrawl status...');
    const healthCheck = await makeRequest(CONFIG.firecrawlUrl, 'POST', { url: 'https://example.com' });
    if (healthCheck.status !== 200) {
      console.log('❌ Firecrawl not responding properly. Is it running on localhost:3002?');
      process.exit(1);
    }
    console.log('✅ Firecrawl is running\n');
  } catch (error) {
    console.log(`❌ Cannot connect to Firecrawl: ${error.message}`);
    console.log('Start it with: docker-compose up\n');
    process.exit(1);
  }

  // Process each website
  for (const website of WEBSITES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 Scraping: ${website.name}`);
    console.log(`${'='.repeat(60)}`);

    const searchUrls = buildSearchUrls(website);

    for (const searchUrl of searchUrls) {
      console.log(`\n📍 URL: ${searchUrl}`);
      
      const crawledPages = await crawlWithFirecrawl(searchUrl, 3000);
      
      if (crawledPages && crawledPages.length > 0) {
        for (const page of crawledPages) {
          const markdown = page.markdown || '';
          const jobs = extractJobData(markdown, searchUrl, website.name);
          allJobs.push(...jobs);
          console.log(`  ✅ Extracted ${jobs.length} potential job listings`);
        }
      }

      // Add delay between requests
      await sleep(2000);
    }
  }

  // Display summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 SCRAPING COMPLETE`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total potential jobs found: ${allJobs.length}\n`);

  // Display sample results
  if (allJobs.length > 0) {
    console.log('📋 Sample Results (First 5):');
    console.log('─'.repeat(60));
    
    allJobs.slice(0, 5).forEach((job, i) => {
      console.log(`\n[${i + 1}] ${job.job_title || 'N/A'}`);
      console.log(`    Company: ${job.company_name || 'N/A'}`);
      console.log(`    Location: ${job.location || 'N/A'}`);
      console.log(`    Website: ${job.source_website}`);
      if (job.email) console.log(`    Email: ${job.email}`);
      if (job.phone) console.log(`    Phone: ${job.phone}`);
    });
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const jsonFile = `job-leads-${timestamp}.json`;
  const csvFile = `job-leads-${timestamp}.csv`;

  await saveToJSON(allJobs, jsonFile);
  await saveToCSV(allJobs, csvFile);

  console.log(`\n✅ Data saved successfully!`);
  console.log(`   JSON: ${jsonFile}`);
  console.log(`   CSV:  ${csvFile}\n`);
}

// Run the scraper
main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
