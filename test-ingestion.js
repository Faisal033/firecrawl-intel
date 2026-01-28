#!/usr/bin/env node

/**
 * End-to-End Ingestion Test
 * Tests the complete competitor intelligence pipeline:
 * 1. Create competitor
 * 2. Discover URLs
 * 3. Scrape content
 * 4. Create signals
 * 5. Compute threat
 * 6. Verify results
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (prefix, msg) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${prefix} ${msg}`);
};

const test = async () => {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 COMPETITOR INTELLIGENCE E2E INGESTION TEST');
    console.log('='.repeat(70) + '\n');

    // 1. CREATE COMPETITOR
    log('📝', 'Creating competitor...');
    const competitorRes = await axios.post(`${API_URL}/competitors`, {
      name: 'Zoho Corporation',
      website: 'https://www.zoho.com',
      industry: 'SaaS/Logistics',
      locations: ['Bangalore', 'Chennai', 'Mumbai'],
    });

    const competitorId = competitorRes.data.data._id;
    log('✅', `Created competitor: ${competitorId}`);

    // 2. DISCOVER URLs
    log('🔍', 'Discovering URLs...');
    await delay(2000);
    const discoverRes = await axios.post(`${API_URL}/competitors/${competitorId}/discover`);
    log('✅', `Discovered ${discoverRes.data.discoverCount} URLs, saved ${discoverRes.data.savedCount}`);

    // 3. SCRAPE CONTENT
    log('🕷️ ', 'Scraping pending URLs...');
    await delay(2000);
    const scrapeRes = await axios.post(`${API_URL}/competitors/${competitorId}/scrape`, {
      limit: 5,
    });
    log('✅', `Scraped ${scrapeRes.data.scrapedCount} URLs`);

    // 4. CREATE SIGNALS
    log('📊', 'Creating signals from scraped content...');
    await delay(2000);
    const signalsRes = await axios.post(`${API_URL}/competitors/${competitorId}/signals/create`);
    log('✅', `Created ${signalsRes.data.signalCount} signals`);

    // 5. COMPUTE THREAT
    log('⚠️ ', 'Computing threat level...');
    await delay(1000);
    const threatRes = await axios.post(`${API_URL}/competitors/${competitorId}/threat/compute`);
    log('✅', `Threat score: ${threatRes.data.data.threatScore}/100`);

    // 6. GET RESULTS
    console.log('\n' + '-'.repeat(70));
    log('📈', 'RESULTS:');
    console.log('-'.repeat(70));

    const newsRes = await axios.get(`${API_URL}/competitors/${competitorId}/news?status=SCRAPED`);
    log('📰', `News items: ${newsRes.data.count}`);

    const signalsGetRes = await axios.get(`${API_URL}/competitors/${competitorId}/signals`);
    log('🎯', `Signals: ${signalsGetRes.data.count}`);

    const threatGetRes = await axios.get(`${API_URL}/competitors/${competitorId}/threat`);
    log('⚠️ ', `Threat Score: ${threatGetRes.data.data.threatScore}`);
    log('📍', `Top Locations: ${threatGetRes.data.data.topLocations.map((l) => l.location).join(', ')}`);

    // 7. GET DASHBOARD
    const dashboardRes = await axios.get(`${API_URL}/dashboard/overview`);
    const { kpis } = dashboardRes.data.data;
    log('📊', `Dashboard KPIs:`);
    console.log(`     • Competitors: ${kpis.competitors}`);
    console.log(`     • News Items: ${kpis.newsItems}`);
    console.log(`     • Signals: ${kpis.signals}`);
    console.log(`     • High Threats: ${kpis.highThreats}`);

    console.log('\n' + '='.repeat(70));
    log('✨', 'END-TO-END INGESTION TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    log('❌', `Test failed: ${error.message}`);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
};

// Run test
test();
