#!/usr/bin/env node

/**
 * Job Leads Crawler - Direct Firecrawl Integration
 * 
 * Crawls ONLY Naukri, Indeed, and Apna for telecalling jobs
 * Uses Firecrawl directly at http://localhost:3002
 * Extracts: Company, Title, Location, Description, Phone, Email, Source
 * Saves results as JSON and CSV
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const FIRECRAWL_BASE = 'http://localhost:3002';
const FIRECRAWL_CRAWL = `${FIRECRAWL_BASE}/v1/crawl`;

// Job portals to crawl
const PORTALS = [
  { name: 'Naukri', url: 'https://www.naukri.com/jobs-in-india-for-telecaller', source: 'Naukri' },
  { name: 'Indeed', url: 'https://in.indeed.com/jobs?q=telecaller&l=India', source: 'Indeed' },
  { name: 'Apna', url: 'https://www.apnaapp.com/jobs?title=telecaller&location=India', source: 'Apna' }
];

// Telecalling keywords
const TELECALLING_KEYWORDS = [
  'telecaller',
  'telecalling',
  'voice process',
  'call executive',
  'customer support (voice)',
  'inbound calls',
  'outbound calls',
  'tele-calling',
  'call center',
  'phone based'
];

// India location variations
const INDIA_LOCATIONS = [
  'india',
  'bangalore',
  'delhi',
  'mumbai',
  'pune',
  'hyderabad',
  'gurgaon',
  'noida',
  'chennai',
  'kolkata',
  'jaipur',
  'lucknow',
  'chandigarh',
  'indore',
  'ahmedabad'
];

/**
 * Check if Firecrawl is running
 */
async function checkFirecrawlHealth() {
  console.log('\n🔍 Checking Firecrawl health...');
  try {
    // Test the crawl endpoint with a simple URL
    const response = await axios.post(
      FIRECRAWL_CRAWL,
      { url: 'https://example.com' },
      { timeout: 10000 }
    );
    console.log('✅ Firecrawl is running!');
    return true;
  } catch (error) {
    console.error('❌ Firecrawl not running at ' + FIRECRAWL_BASE);
    console.error('   Make sure Docker is running and Firecrawl is started');
    return false;
  }
}

/**
 * Crawl a portal URL and extract text content
 */
async function crawlPortal(portalUrl, portalName) {
  console.log(`\n🔄 Crawling ${portalName}...`);
  console.log(`   URL: ${portalUrl}`);
  
  try {
    const response = await axios.post(
      FIRECRAWL_CRAWL,
      { url: portalUrl },
      { timeout: 60000 }
    );

    const data = response.data;
    
    if (!data.success) {
      console.warn(`   ⚠️  Crawl returned success: false`);
      return null;
    }

    const markdown = data.data?.markdown || data.markdown || '';
    console.log(`   ✓ Got ${markdown.length} characters of content`);
    
    return markdown;
  } catch (error) {
    console.error(`   ❌ Error crawling ${portalName}: ${error.message}`);
    return null;
  }
}

/**
 * Check if text contains telecalling keywords
 */
function isTelecallingJob(text) {
  const lowerText = text.toLowerCase();
  return TELECALLING_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Check if location is India
 */
function isIndiaLocation(text) {
  if (!text) return true; // If no location specified, assume it might be India
  const lowerText = text.toLowerCase();
  return INDIA_LOCATIONS.some(location => lowerText.includes(location));
}

/**
 * Extract phone numbers from text
 */
function extractPhone(text) {
  if (!text) return null;
  
  // Common Indian phone patterns
  const phonePatterns = [
    /\+91[\s.-]?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/gi,  // +91 format
    /\b[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/gi,          // 10 digit
    /\b(0\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4})\b/gi       // Landline
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].replace(/[\s.-]/g, '');
    }
  }
  
  return null;
}

/**
 * Extract email from text
 */
function extractEmail(text) {
  if (!text) return null;
  
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailPattern);
  
  return matches ? matches[0] : null;
}

/**
 * Parse jobs from crawled content (generic text-based parsing)
 */
function parseJobsFromContent(content, source) {
  const jobs = [];
  
  // Split by common job separators
  const jobBlocks = content.split(/\n\n+/).filter(block => block.trim().length > 50);
  
  for (const block of jobBlocks) {
    // Check if block contains telecalling job keywords
    if (!isTelecallingJob(block)) {
      continue;
    }

    // Extract information using text heuristics
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Try to identify job details
    let title = null;
    let company = null;
    let location = null;
    let description = block;
    
    // First few lines usually contain title/company
    if (lines.length > 0) {
      title = lines[0];
    }
    if (lines.length > 1) {
      company = lines[1];
    }
    if (lines.length > 2) {
      location = lines[2];
    }

    // Check if location is India
    if (!isIndiaLocation(location)) {
      continue;
    }

    // Extract phone and email
    const phone = extractPhone(block);
    const email = extractEmail(block);

    // Create job record
    const job = {
      company: company || null,
      title: title || 'Telecalling Job',
      location: location || 'India',
      description: description.substring(0, 500),
      phone: phone,
      email: email,
      source: source,
      crawledAt: new Date().toISOString()
    };

    jobs.push(job);
  }
  
  return jobs;
}

/**
 * Save jobs to JSON file
 */
function saveToJSON(jobs, filename = 'jobs-output.json') {
  const filepath = path.join(process.cwd(), filename);
  fs.writeFileSync(filepath, JSON.stringify(jobs, null, 2));
  console.log(`\n📄 Saved ${jobs.length} jobs to: ${filename}`);
  return filepath;
}

/**
 * Save jobs to CSV file
 */
function saveToCSV(jobs, filename = 'jobs-output.csv') {
  const filepath = path.join(process.cwd(), filename);
  
  // CSV header
  const headers = ['Company', 'Job Title', 'Location', 'Description', 'Phone', 'Email', 'Source', 'Crawled At'];
  
  // CSV rows
  const rows = jobs.map(job => [
    (job.company || '').replace(/"/g, '""'),
    (job.title || '').replace(/"/g, '""'),
    (job.location || '').replace(/"/g, '""'),
    (job.description || '').replace(/"/g, '""').substring(0, 100),
    job.phone || '',
    job.email || '',
    job.source || '',
    job.crawledAt || ''
  ]);

  // Build CSV content
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  fs.writeFileSync(filepath, csvContent);
  console.log(`📊 Saved ${jobs.length} jobs to: ${filename}`);
  return filepath;
}

/**
 * Print jobs to console
 */
function printJobs(jobs) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 EXTRACTED ${jobs.length} TELECALLING JOBS`);
  console.log('='.repeat(80));
  
  jobs.forEach((job, index) => {
    console.log(`\n[${index + 1}] ${job.title || 'N/A'}`);
    console.log(`    Company: ${job.company || 'N/A'}`);
    console.log(`    Location: ${job.location || 'N/A'}`);
    console.log(`    Phone: ${job.phone || 'N/A'}`);
    console.log(`    Email: ${job.email || 'N/A'}`);
    console.log(`    Source: ${job.source}`);
    console.log(`    Description: ${(job.description || 'N/A').substring(0, 80)}...`);
  });
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(15) + 'FIRECRAWL JOB LEADS EXTRACTOR' + ' '.repeat(33) + '║');
  console.log('║' + ' '.repeat(20) + 'Naukri, Indeed, Apna' + ' '.repeat(38) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  // Check Firecrawl health
  const isHealthy = await checkFirecrawlHealth();
  if (!isHealthy) {
    process.exit(1);
  }

  // Crawl all portals
  const allJobs = [];

  for (const portal of PORTALS) {
    const content = await crawlPortal(portal.url, portal.name);
    
    if (content) {
      const jobs = parseJobsFromContent(content, portal.source);
      console.log(`   Found ${jobs.length} telecalling jobs`);
      allJobs.push(...jobs);
    }
  }

  // Print results
  if (allJobs.length > 0) {
    printJobs(allJobs);
    
    // Save to files
    saveToJSON(allJobs);
    saveToCSV(allJobs);
    
    console.log('\n✅ Crawling completed successfully!');
  } else {
    console.log('\n⚠️  No telecalling jobs found.');
  }

  console.log('\n');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
