const axios = require('axios');
require('dotenv').config();

const FIRECRAWL_URL = 'http://localhost:3003/v1/crawl';

const crawlWebsite = async (websiteUrl, company) => {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🕷️  WEBSITE CRAWL TEST');
    console.log('='.repeat(70));
    console.log(`\n📍 Company: ${company}`);
    console.log(`🔗 URL: ${websiteUrl}`);
    console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);
    console.log('-'.repeat(70));

    console.log('\n⏳ Crawling website...\n');

    const response = await axios.post(FIRECRAWL_URL, {
      url: websiteUrl,
      company: company,
    }, {
      timeout: 10000,
    });

    console.log('✅ CRAWL SUCCESSFUL\n');
    console.log('Response Status:', response.status, response.statusText);
    console.log('\n📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✨ Crawl Details:');
      console.log('  • Success:', response.data.data?.success !== false);
      console.log('  • Target:', response.data.data?.target);
      console.log('  • Content Preview:', response.data.data?.content?.substring(0, 100) + '...');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Test completed successfully!\n');
    return response.data;
  } catch (error) {
    console.error('\n❌ CRAWL FAILED');
    console.error('Error:', error.response?.data || error.message);
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
};

// Test with different websites
const testWebsites = async () => {
  const websites = [
    { url: 'https://www.zoho.com', company: 'Zoho' },
    { url: 'https://www.asana.com', company: 'Asana' },
    { url: 'https://www.github.com', company: 'GitHub' },
  ];

  for (const site of websites) {
    await crawlWebsite(site.url, site.company);
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Run tests
testWebsites();
