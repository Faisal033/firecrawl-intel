const axios = require('axios');
require('dotenv').config();

const FIRECRAWL_URL = 'http://localhost:3003/v1/crawl';

const testCrawl = async () => {
  try {
    // Test websites
    const testCases = [
      { url: 'https://zoho.com', company: 'Zoho' },
      { url: 'https://asana.com', company: 'Asana' },
      { url: 'https://github.com', company: 'GitHub' },
    ];

    console.log('\n🕷️  FIRECRAWL SERVICE TEST\n');
    console.log('=' .repeat(60));

    for (const testCase of testCases) {
      console.log(`\n📍 Testing: ${testCase.company}`);
      console.log(`🔗 URL: ${testCase.url}`);
      console.log('-'.repeat(60));

      try {
        const response = await axios.post(FIRECRAWL_URL, {
          url: testCase.url,
          company: testCase.company,
        }, {
          timeout: 5000,
        });

        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Data:');
        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testCrawl();
