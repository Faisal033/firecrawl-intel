#!/usr/bin/env node

/**
 * Intelligent Job Leads Crawler - Two-Stage Approach
 * 
 * Stage 1: Extract job metadata from portals (respecting anti-bot)
 * Stage 2: Find company websites and extract contact info
 * Merge: Combine into complete leads
 * 
 * NO portal bypassing - ethical crawling
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const FIRECRAWL_BASE = 'http://localhost:3002';
const FIRECRAWL_CRAWL = `${FIRECRAWL_BASE}/v1/crawl`;

// Job portals - Stage 1 sources
const PORTALS = [
  { name: 'Naukri', url: 'https://www.naukri.com/jobs-in-india-for-telecaller', source: 'Naukri' },
  { name: 'Indeed', url: 'https://in.indeed.com/jobs?q=telecaller&l=India', source: 'Indeed' },
  { name: 'Apna', url: 'https://www.apnaapp.com/jobs?title=telecaller&location=India', source: 'Apna' }
];

// Telecalling keywords for detection
const TELECALLING_KEYWORDS = [
  'telecaller', 'telecalling', 'voice process', 'call executive',
  'customer support (voice)', 'inbound calls', 'outbound calls',
  'tele-calling', 'call center', 'phone based', 'bpo'
];

// India locations
const INDIA_LOCATIONS = [
  'india', 'bangalore', 'delhi', 'mumbai', 'pune', 'hyderabad',
  'gurgaon', 'noida', 'chennai', 'kolkata', 'jaipur', 'lucknow'
];

/**
 * Check if Firecrawl is running
 */
async function checkFirecrawlHealth() {
  console.log('\n🔍 Checking Firecrawl health...');
  try {
    const response = await axios.post(
      FIRECRAWL_CRAWL,
      { url: 'https://example.com' },
      { timeout: 10000 }
    );
    console.log('✅ Firecrawl is running!');
    return true;
  } catch (error) {
    console.error('❌ Firecrawl not running at ' + FIRECRAWL_BASE);
    return false;
  }
}

/**
 * STAGE 1: Extract job metadata from portal content
 * Extract only: company, title, location (no contact info from portals)
 */
function extractJobMetadata(content, source) {
  const jobs = [];
  
  // Split by common job separators
  const jobBlocks = content.split(/\n\n+/).filter(block => block.trim().length > 30);
  
  for (const block of jobBlocks) {
    // Check if contains telecalling keywords
    if (!isTelecallingJob(block)) {
      continue;
    }

    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Extract basic info
    let title = lines.length > 0 ? lines[0] : null;
    let company = lines.length > 1 ? lines[1] : null;
    let location = lines.length > 2 ? lines[2] : 'India';

    // Validate location
    if (!isIndiaLocation(location)) {
      continue;
    }

    // Create job metadata (no contact info from portals)
    const job = {
      company: company || null,
      title: title || 'Telecalling Job',
      location: location || 'India',
      source: source,
      discoveredAt: new Date().toISOString(),
      // Stage 2 will fill these:
      companyWebsite: null,
      phone: null,
      email: null
    };

    if (company) {
      jobs.push(job);
    }
  }
  
  return jobs;
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
  if (!text) return true;
  const lowerText = text.toLowerCase();
  return INDIA_LOCATIONS.some(location => lowerText.includes(location));
}

/**
 * STAGE 2: Find company website
 * Intelligent company website discovery
 */
async function findCompanyWebsite(companyName) {
  // Common patterns for company websites
  const patterns = [
    `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.in`,
    `https://${companyName.toLowerCase().replace(/\s+/g, '')}.in`
  ];

  // Test each pattern with quick Firecrawl check
  for (const url of patterns) {
    try {
      const response = await axios.post(
        FIRECRAWL_CRAWL,
        { url },
        { timeout: 15000 }
      );
      const data = response.data;
      
      // If it returns a job ID (async), it's a valid URL
      if (data.success && data.id) {
        return url;
      }
    } catch (error) {
      // Continue to next pattern
    }
  }
  
  return null; // Website not found
}

/**
 * STAGE 2: Extract contact info from company website
 */
async function extractContactInfoAsync(websiteUrl) {
  if (!websiteUrl) return { phone: null, email: null };

  try {
    // Submit async crawl job
    const response = await axios.post(
      FIRECRAWL_CRAWL,
      { url: websiteUrl },
      { timeout: 15000 }
    );

    const data = response.data;
    
    if (!data.success || !data.id) {
      return { phone: null, email: null };
    }

    // Wait for job to complete (with timeout)
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        const resultResponse = await axios.get(data.url, { timeout: 10000 });
        const resultData = resultResponse.data;

        if (resultData.status === 'completed' && resultData.data && resultData.data.length > 0) {
          const markdown = resultData.data[0].markdown;
          return {
            phone: extractPhone(markdown),
            email: extractEmail(markdown)
          };
        }

        // Wait 2 seconds before retrying
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        // Retry
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    return { phone: null, email: null };
  } catch (error) {
    return { phone: null, email: null };
  }
}

/**
 * Extract phone numbers from text
 */
function extractPhone(text) {
  if (!text) return null;
  
  const phonePatterns = [
    /\+91[\s.-]?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/gi,
    /\b[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/gi,
    /\b(0\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4})\b/gi
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
 * Crawl portal and extract job metadata
 */
async function crawlPortal(portalUrl, portalName) {
  console.log(`\n🔄 Stage 1: Crawling ${portalName}...`);
  console.log(`   URL: ${portalUrl}`);
  
  try {
    // Submit async crawl
    const response = await axios.post(
      FIRECRAWL_CRAWL,
      { url: portalUrl },
      { timeout: 20000 }
    );

    const data = response.data;
    
    if (!data.success || !data.id) {
      console.warn(`   ⚠️  Failed to start crawl job`);
      return null;
    }

    console.log(`   📋 Job started: ${data.id.substring(0, 8)}...`);
    console.log(`   ⏳ Waiting for results...`);

    // Wait for results (max 60 seconds)
    const maxWait = 60000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        const resultResponse = await axios.get(data.url, { timeout: 10000 });
        const resultData = resultResponse.data;

        if (resultData.status === 'completed' && resultData.data && resultData.data.length > 0) {
          const markdown = resultData.data[0].markdown;
          console.log(`   ✓ Got ${markdown.length} characters`);
          return markdown;
        }

        await new Promise(r => setTimeout(r, 3000));
      } catch (error) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.log(`   ⚠️  Timeout waiting for results`);
    return null;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Print complete leads
 */
function printLeads(leads) {
  console.log('\n' + '='.repeat(100));
  console.log(`📋 EXTRACTED ${leads.length} COMPLETE LEADS WITH CONTACT INFO`);
  console.log('='.repeat(100));
  
  leads.forEach((lead, index) => {
    console.log(`\n[${index + 1}] ${lead.title}`);
    console.log(`    Company: ${lead.company}`);
    console.log(`    Location: ${lead.location}`);
    console.log(`    Source: ${lead.source}`);
    console.log(`    Website: ${lead.companyWebsite || 'Not found'}`);
    console.log(`    Phone: ${lead.phone || 'Not found'}`);
    console.log(`    Email: ${lead.email || 'Not found'}`);
  });
  
  console.log('\n' + '='.repeat(100));
}

/**
 * Save leads to JSON
 */
function saveToJSON(leads, filename = 'leads-complete.json') {
  const filepath = path.join(process.cwd(), filename);
  fs.writeFileSync(filepath, JSON.stringify(leads, null, 2));
  console.log(`\n📄 Saved ${leads.length} leads to: ${filename}`);
  return filepath;
}

/**
 * Save leads to CSV
 */
function saveToCSV(leads, filename = 'leads-complete.csv') {
  const filepath = path.join(process.cwd(), filename);
  
  const headers = ['Company', 'Job Title', 'Location', 'Source', 'Website', 'Phone', 'Email', 'Discovered At'];
  
  const rows = leads.map(lead => [
    (lead.company || '').replace(/"/g, '""'),
    (lead.title || '').replace(/"/g, '""'),
    (lead.location || '').replace(/"/g, '""'),
    lead.source || '',
    lead.companyWebsite || '',
    lead.phone || '',
    lead.email || '',
    lead.discoveredAt || ''
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  fs.writeFileSync(filepath, csvContent);
  console.log(`📊 Saved ${leads.length} leads to: ${filename}`);
  return filepath;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔' + '═'.repeat(98) + '╗');
  console.log('║' + ' '.repeat(20) + 'INTELLIGENT TELECALLING LEADS EXTRACTOR' + ' '.repeat(38) + '║');
  console.log('║' + ' '.repeat(10) + 'Stage 1: Portal Discovery | Stage 2: Company Contact Extraction' + ' '.repeat(24) + '║');
  console.log('╚' + '═'.repeat(98) + '╝');

  // Check Firecrawl health
  const isHealthy = await checkFirecrawlHealth();
  if (!isHealthy) {
    process.exit(1);
  }

  const allLeads = [];
  const discoveredJobs = [];

  // STAGE 1: Discover jobs from portals
  console.log('\n' + '='.repeat(100));
  console.log('STAGE 1: JOB DISCOVERY FROM PORTALS (Respecting Anti-Bot)');
  console.log('='.repeat(100));

  for (const portal of PORTALS) {
    const content = await crawlPortal(portal.url, portal.name);
    
    if (content) {
      const jobs = extractJobMetadata(content, portal.source);
      console.log(`   Found ${jobs.length} telecalling jobs`);
      discoveredJobs.push(...jobs);
    }
  }

  // STAGE 2: Find company websites and extract contact info
  console.log('\n' + '='.repeat(100));
  console.log(`STAGE 2: COMPANY WEBSITE EXTRACTION (${discoveredJobs.length} companies)`);
  console.log('='.repeat(100));

  for (let i = 0; i < discoveredJobs.length; i++) {
    const job = discoveredJobs[i];
    const progress = `[${i + 1}/${discoveredJobs.length}]`;
    
    console.log(`\n${progress} Processing: ${job.company}`);
    
    // Find company website
    console.log(`   🔍 Finding website...`);
    const website = await findCompanyWebsite(job.company);
    job.companyWebsite = website;
    
    if (website) {
      console.log(`   ✓ Found: ${website}`);
      console.log(`   📧 Extracting contact info...`);
      
      // Extract contact info
      const contactInfo = await extractContactInfoAsync(website);
      job.phone = contactInfo.phone;
      job.email = contactInfo.email;
      
      if (job.phone || job.email) {
        console.log(`   ✓ Phone: ${job.phone || 'Not found'}`);
        console.log(`   ✓ Email: ${job.email || 'Not found'}`);
        allLeads.push(job);
      } else {
        console.log(`   ⚠️  No contact info found`);
      }
    } else {
      console.log(`   ⚠️  Website not found`);
    }

    // Rate limiting - be respectful
    await new Promise(r => setTimeout(r, 2000));
  }

  // Print and save results
  if (allLeads.length > 0) {
    printLeads(allLeads);
    saveToJSON(allLeads);
    saveToCSV(allLeads);
    console.log('\n✅ Lead extraction completed successfully!');
  } else {
    console.log('\n⚠️  No complete leads found with contact information.');
  }

  console.log('\n');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
