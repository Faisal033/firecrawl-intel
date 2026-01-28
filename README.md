<<<<<<< HEAD
# firecrawl-leads
Lead generation system using Firecrawl to crawl Indian job portals and extract telecalling job leads.
=======
# Competitor Intelligence SaaS

Production-grade competitor intelligence system for Indian logistics companies. Discover, scrape, and analyze competitor activity across news, blogs, and press releases.

## Features

### 🔍 Discovery Layer
- **Google News RSS**: Automated news feed parsing
- **Sitemap Parsing**: Extract URLs from company sitemaps
- **Industry News Search**: Track logistics-specific news sources
- **Website Crawling**: Deep scan of competitor websites

### 🕷️ Scraping Layer
- **Real Firecrawl Integration**: Robust web scraping with error handling
- **Batch Processing**: Efficient URL processing with delays and retries
- **Content Extraction**: Markdown, plaintext, and HTML output

### 🔄 Deduplication
- **SHA256 Content Hashing**: Detect duplicate articles across sources
- **URL Canonicalization**: Normalize URLs before comparison
- **24-Hour Cache**: Avoid re-scraping recent content
- **Multi-Source Tracking**: Link same article from multiple RSS feeds

### 📊 Signal Generation
- **Type Detection**: EXPANSION, HIRING, SERVICE_LAUNCH, CLIENT_WIN, FINANCIAL, REGULATORY, MEDIA
- **Confidence Scoring**: 0-100 scale for signal certainty
- **Location Extraction**: Detect India cities mentioned in content
- **Append-Only**: Immutable signal records for audit trail

### ⚠️ Threat Computation
- **Weighted Scoring**: 0-100 threat score based on signal types
- **Daily Snapshots**: Automatic threat computation for all competitors
- **Rankings**: Top competitors by threat level
- **Geographic Hotspots**: Signal concentration by location

### 📈 Dashboard & Insights
- **KPI Overview**: Competitor count, news items, signals, high threats
- **Latest Alerts**: Recent high-impact signals
- **Top Threats**: Ranked competitors by threat score
- **Geographic Hotspots**: Signal clusters by location

---

## Setup

### Prerequisites

- **Node.js** 16+ (download from nodejs.org)
- **MongoDB Atlas** account (free tier: mongodb.com/cloud/atlas)
- **Docker** (for Firecrawl service)
- **Windows PowerShell 5.1+**

### Installation

```powershell
# 1. Extract and navigate to project
cd competitor-intelligence

# 2. Install dependencies
npm install

# 3. Setup Firecrawl Docker (in a new PowerShell window)
docker pull firecrawl/firecrawl
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl

# 4. Verify Firecrawl is running
curl http://localhost:3002/health

# 5. Update .env with your MongoDB connection string
# Edit .env and replace MONGODB_URI with your connection string from MongoDB Atlas
```

### Environment Configuration

Create or update `.env` file:

```
PORT=3001
FIRECRAWL_PORT=3002
FIRECRAWL_ENDPOINT=http://localhost:3002/v1/crawl
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/competitor-intel?retryWrites=true&w=majority
ENABLE_AI_INSIGHTS=true
NODE_ENV=development
```

### Start Backend

```powershell
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

The backend will start on `http://localhost:3001`.

---

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Windows PowerShell Guide

**IMPORTANT:** Windows PowerShell has different syntax than bash/macOS. Follow these rules carefully.

### Port Checking (Windows PowerShell)

```powershell
# Check if ports are listening
# Port 3001 - Backend
Test-NetConnection -ComputerName localhost -Port 3001

# Port 3002 - Firecrawl
Test-NetConnection -ComputerName localhost -Port 3002

# Port 3000 - UI (if deployed)
Test-NetConnection -ComputerName localhost -Port 3000
```

### API Calls - Option A: Using PowerShell's Invoke-RestMethod (Recommended)

**Create Competitor:**
```powershell
$body = @{
    name = "Zoho Corporation"
    website = "https://www.zoho.com"
    industry = "SaaS/Logistics"
    locations = @("Bangalore", "Chennai", "Mumbai")
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json
$competitorId = $response.data._id
```

**Get Competitors:**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" -Method Get
$response.data | Select-Object -First 5 | ConvertTo-Json
```

**Get News for Competitor:**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"  # Replace with actual ID
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/news?limit=5" -Method Get
$response.data | Select-Object -First 5 | ConvertTo-Json
```

**Get Signals for Competitor:**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/signals" -Method Get
$response.data | Select-Object -First 5 | ConvertTo-Json
```

**Get Threat Score:**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/threat" -Method Get
$response.data | ConvertTo-Json
```

**Get Threat Rankings:**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/threat/rankings?limit=5" -Method Get
$response.data | ConvertTo-Json
```

**Trigger Discovery (POST):**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/discover" `
    -Method POST `
    -ContentType "application/json"
$response | ConvertTo-Json
```

**Trigger Scraping (POST):**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"
$body = @{ limit = 5 } | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/scrape" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
$response | ConvertTo-Json
```

**Trigger Signal Creation (POST):**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/signals/create" `
    -Method POST `
    -ContentType "application/json"
$response | ConvertTo-Json
```

**Trigger Threat Computation (POST):**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/threat/compute" `
    -Method POST `
    -ContentType "application/json"
$response | ConvertTo-Json
```

**Firecrawl Direct Call:**
```powershell
$body = @{
    url = "https://www.example.com"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3002/v1/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
$response | ConvertTo-Json
```

### API Calls - Option B: Using curl.exe (Windows native curl)

**IMPORTANT:** Use `curl.exe` not `curl` (curl is PowerShell alias to Invoke-WebRequest)

```powershell
# Use curl.exe to call like bash
curl.exe -X POST http://localhost:3001/api/competitors `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Zoho",
    "website": "https://www.zoho.com",
    "industry": "SaaS"
  }'
```

### Running the Test Script

```powershell
# Run comprehensive local environment test
.\scripts\test-local.ps1
```

This script:
- ✓ Checks if ports 3001, 3002 are listening
- ✓ Tests /health endpoint
- ✓ Tests all GET endpoints
- ✓ Tests competitor-specific endpoints
- ✓ Displays KPIs and threat rankings
- ✓ Handles JSON formatting (displays first 5 items)

---

## E2E Ingestion Test

Run the complete pipeline test:

```powershell
node test-ingestion.js
```

This demonstrates:
1. ✅ Create competitor
2. ✅ Discover URLs (Google News + Sitemap + Industry News)
3. ✅ Scrape content (via Firecrawl)
4. ✅ Create signals (type detection + location extraction)
5. ✅ Compute threat (scoring + rankings)

---

## Manual Testing - 5 Curl Commands

### 1. Create Competitor

```bash
curl -X POST http://localhost:3001/api/competitors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Zoho Corporation",
    "website": "https://www.zoho.com",
    "industry": "SaaS/Logistics",
    "locations": ["Bangalore", "Chennai", "Mumbai"]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Zoho Corporation",
    "website": "https://www.zoho.com",
    "rssKeywords": ["Zoho"],
    "active": true
  }
}
```

**Save the `_id` for next commands.**

---

### 2. Discover URLs

```bash
# Replace COMPETITOR_ID with the _id from step 1
curl -X POST http://localhost:3001/api/competitors/COMPETITOR_ID/discover \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Discovery completed",
  "discoverCount": 45,
  "savedCount": 42
}
```

**This searches Google News, Zoho's website, and industry sources.**

---

### 3. Scrape Pending URLs

```bash
# Replace COMPETITOR_ID
curl -X POST http://localhost:3001/api/competitors/COMPETITOR_ID/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 5
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Scraping completed",
  "scrapedCount": 5,
  "failedCount": 0,
  "skippedCount": 0
}
```

**Firecrawl extracts markdown, plaintext, and metadata from URLs.**

---

### 4. Create Signals

```bash
# Replace COMPETITOR_ID
curl -X POST http://localhost:3001/api/competitors/COMPETITOR_ID/signals/create \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Signals created",
  "signalCount": 8,
  "signalsByType": {
    "EXPANSION": 2,
    "HIRING": 3,
    "SERVICE_LAUNCH": 1,
    "FINANCIAL": 2
  }
}
```

**Signals detected from content:**
- EXPANSION: "opened new office", "expanded operations"
- HIRING: "hiring", "job openings", "recruitment"
- SERVICE_LAUNCH: "launched new service", "announced"
- FINANCIAL: "raised funding", "revenue", "IPO"
- REGULATORY: "compliance", "regulations"
- etc.

---

### 5. Get Threat Rankings

```bash
curl -X GET "http://localhost:3001/api/threat/rankings?limit=10" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "competitorId": "67a1b2c3d4e5f6g7h8i9j0k1",
      "competitorName": "Zoho Corporation",
      "website": "https://www.zoho.com",
      "threatScore": 78,
      "signalCount": 12,
      "topLocations": [
        { "location": "Bangalore", "count": 5 },
        { "location": "Chennai", "count": 3 },
        { "location": "Mumbai", "count": 2 }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Dashboard Endpoints

### Overview

```bash
curl -X GET http://localhost:3001/api/dashboard/overview \
  -H "Content-Type: application/json"
```

**Returns KPIs, latest alerts, top threats**

### Geographic Hotspots

```bash
curl -X GET "http://localhost:3001/api/geography/hotspots?days=30" \
  -H "Content-Type: application/json"
```

**Returns top cities with signal counts**

---

## Data Models

### Competitor
```javascript
{
  name: String,                    // Unique competitor name
  website: String,                 // Company website
  industry: String,                // Industry classification
  locations: [String],             // Operating locations
  rssKeywords: [String],           // Keywords for RSS search
  active: Boolean,                 // Active tracking status
  createdAt: Date,
  updatedAt: Date
}
```

### News
```javascript
{
  competitorId: ObjectId,          // Reference to competitor
  url: String,                     // Original URL
  urlCanonical: String,            // Normalized URL (for dedup)
  title: String,
  sourceType: String,              // RSS, SITEMAP, SITE_SEARCH, MANUAL
  sources: [                        // Multi-source tracking
    { sourceType: String, sourceName: String }
  ],
  status: String,                  // DISCOVERED, SCRAPING, SCRAPED, FAILED, SKIPPED
  contentHash: String,             // SHA256 for dedup detection
  isDuplicate: Boolean,
  duplicateOf: ObjectId,           // Link to original article
  createdAt: Date,
  updatedAt: Date
}
```

### Page
```javascript
{
  newsId: ObjectId,
  markdown: String,                // Cleaned markdown content
  plainText: String,               // Plain text version
  html: String,                    // Raw HTML
  metadata: {
    title: String,
    description: String,
    author: String,
    publishedAt: Date,
    wordCount: Number
  },
  firecrawlJobId: String,          // Reference to Firecrawl job
  createdAt: Date
}
```

### Signal (Append-Only)
```javascript
{
  competitorId: ObjectId,
  newsIds: [ObjectId],             // Multiple news sources
  type: String,                    // EXPANSION, HIRING, SERVICE_LAUNCH, etc.
  title: String,
  description: String,
  confidence: Number,              // 0-100
  severity: String,                // LOW, MEDIUM, HIGH, CRITICAL
  locations: [String],             // Extracted India cities
  metadata: Object,
  createdAt: Date                  // Immutable
}
```

### Threat
```javascript
{
  competitorId: ObjectId,
  threatScore: Number,             // 0-100
  signalCount: Number,
  signalByType: {                  // Counts by type
    EXPANSION: Number,
    HIRING: Number,
    etc: Number
  },
  topLocations: [                  // Top 5 locations
    { location: String, count: Number }
  ],
  period: String,                  // 7D, 30D, OVERALL
  recentSignals: [ObjectId],       // Latest signals
  createdAt: Date,
  updatedAt: Date
}
```

---

## Performance Considerations

### N+1 Query Prevention
- Dashboard uses single aggregation pipeline
- Hotspots computed with $group and $sort
- Rankings use lean queries for speed

### Deduplication Strategy
- SHA256 hashing on normalized content
- URL canonicalization removes tracking params
- 24-hour cache prevents re-scraping
- Duplicate detection links articles to original

### Batch Processing
- Discovery: 2-3 seconds per source
- Scraping: 1-2 seconds per URL (Firecrawl rate-limited)
- Signal creation: <100ms per article
- Threat computation: <500ms per competitor

### Indexing
All collections indexed on:
- `competitorId` (discovery, scraping, signals)
- `createdAt` (time-range queries)
- `urlCanonical` (deduplication)
- `type` (signal filtering)

---

## Threat Scoring Algorithm

### Signal Type Weights
| Type | Points | Example |
|------|--------|---------|
| EXPANSION | 25 | "opened new office", "expanded to 10 cities" |
| HIRING | 20 | "hiring 500 engineers", "job openings" |
| FINANCIAL | 20 | "raised $50M", "revenue grew 100%" |
| SERVICE_LAUNCH | 15 | "launched new product" |
| CLIENT_WIN | 15 | "signed contract with Uber" |
| REGULATORY | 15 | "passed compliance audit" |
| MEDIA | 5 | "featured in Forbes" |
| OTHER | 5 | Generic competitor mention |

### Score Calculation
```
threatScore = (Σ signal_points) / max_possible_points * 100
```

For example:
- 5 EXPANSION signals = 125 points
- 3 HIRING signals = 60 points
- **Total = 185 points → 78/100 threat score**

---

## Troubleshooting

### Firecrawl Connection Failed
```
Error: connect ECONNREFUSED http://localhost:3002
```

**Solution:**
```powershell
# Check Firecrawl is running
docker ps | grep firecrawl

# If not running, restart it
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl

# Test connection
curl http://localhost:3002/health
```

### MongoDB Connection Failed
```
Error: querySrv ECONNREFUSED
```

**Solution:**
- Ensure public DNS is configured in app.js
- Check MongoDB Atlas IP whitelist includes your IP
- Verify connection string in .env

### No URLs Found in Discovery
```json
{
  "discoverCount": 0,
  "savedCount": 0
}
```

**Solution:**
- Verify competitor website is accessible
- Check RSS keywords in competitor record
- Try manual URL addition via POST /competitors/:id/news

---

## Development

### Project Structure
```
competitor-intelligence/
├── src/
│   ├── app.js                 # Express server + DB connection
│   ├── models/                # Mongoose schemas
│   │   └── index.js
│   ├── services/              # Business logic
│   │   ├── discovery.js       # URL finding
│   │   ├── scraping.js        # Content extraction
│   │   ├── signals.js         # Signal generation
│   │   ├── threat.js          # Threat computation
│   │   ├── firecrawl.js       # Web scraping
│   │   └── insights.js        # AI insights
│   └── routes/
│       └── api.js             # REST endpoints
├── test-ingestion.js          # E2E test script
├── .env                       # Configuration
├── package.json
└── README.md
```

### npm Scripts
```bash
npm run dev              # Start with auto-reload (nodemon)
npm start               # Start production server
node test-ingestion.js  # Run E2E test
```

---

## Future Roadmap

- [ ] Next.js UI for dashboard
- [ ] Real-time WebSocket updates
- [ ] Email alerts for high-threat signals
- [ ] AI insights generation (OpenAI integration)
- [ ] Competitor comparison view
- [ ] Historical trend analysis
- [ ] Export reports (PDF, CSV)
- [ ] Advanced filtering and search
- [ ] Team collaboration features

---

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review API Documentation
3. Run test-ingestion.js to validate setup

---

## License

Proprietary - Competitor Intelligence SaaS
>>>>>>> 2b22be1 (Initial commit)
