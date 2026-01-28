# Project Structure & File Reference

Complete inventory of all files and components in the Competitor Intelligence SaaS system.

## 📂 Directory Structure

```
competitor-intelligence/
├── Documentation (4 files)
│   ├── README.md                  # Full user guide & API documentation
│   ├── QUICKSTART.md              # 5-minute setup guide
│   ├── ARCHITECTURE.md            # Technical design & data flow
│   ├── CURL_COMMANDS.sh           # Bash curl examples
│   └── CURL_COMMANDS.ps1          # PowerShell curl examples
│
├── Configuration (2 files)
│   ├── .env                       # Environment variables (not in git)
│   └── package.json               # Dependencies & scripts
│
├── Tests & Diagnostics (6 files)
│   ├── test-ingestion.js          # E2E pipeline test (automated)
│   ├── test-firecrawl.js          # Firecrawl service test
│   ├── test-db.js                 # MongoDB connection test
│   ├── check-crawl.js             # Verify crawling capability
│   ├── diagnose-db.js             # Database diagnostics
│   └── simple-health.js           # Quick health check
│
├── Source Code (`src/` folder)
│   ├── app.js                     # Express server + MongoDB setup
│   ├── config/
│   │   └── (DNS, logging configs)
│   │
│   ├── models/
│   │   └── index.js               # 6 Mongoose schemas:
│   │                              #   - Competitor
│   │                              #   - News
│   │                              #   - Page
│   │                              #   - Signal (append-only)
│   │                              #   - Threat
│   │                              #   - Insight
│   │
│   ├── services/
│   │   ├── discovery.js           # URL discovery (RSS, sitemap, industry search)
│   │   ├── scraping.js            # Content extraction (Firecrawl integration)
│   │   ├── signals.js             # Signal generation (type detection, location extraction)
│   │   ├── threat.js              # Threat computation (scoring, ranking)
│   │   ├── firecrawl.js           # Real Firecrawl Docker integration
│   │   └── firecrawl-service.js.disabled  # (Old dummy service, disabled)
│   │
│   └── routes/
│       └── api.js                 # 20+ REST API endpoints
│
└── Root Files
    ├── node_modules/              # Installed dependencies (2000+ files)
    ├── package-lock.json          # Exact dependency versions
    └── [this file]                # Documentation index
```

---

## 📄 Documentation Files

### 1. README.md (Comprehensive Guide)
**Purpose:** Complete user documentation  
**Contents:**
- Feature overview
- Setup instructions (prerequisites, installation)
- Environment configuration
- API documentation with examples
- 5 manual curl commands for testing
- Dashboard endpoints
- Data models (detailed schemas)
- Performance considerations
- Threat scoring algorithm
- Troubleshooting guide
- Development setup

**When to use:** First reference for questions about features, API, or setup

---

### 2. QUICKSTART.md (5-Minute Setup)
**Purpose:** Get system running immediately  
**Contents:**
- Prerequisites checklist
- Step-by-step setup (4 steps)
- Automated test (`node test-ingestion.js`)
- Manual testing options
- Troubleshooting quick fixes
- Next steps after initial setup
- Data flow example

**When to use:** Quick reference for setup, especially first-time

---

### 3. ARCHITECTURE.md (Technical Deep Dive)
**Purpose:** System design and implementation details  
**Contents:**
- System architecture diagram
- Component breakdown (6 layers)
- Discovery layer (4 discovery methods)
- Scraping layer (deduplication strategy)
- Signal generation (signal types, locations, severity)
- Threat computation (scoring algorithm)
- API layer (20+ endpoints)
- Database schemas (with indexes)
- Data flow example (Zoho walk-through)
- Performance optimizations
- Error handling
- Scalability considerations
- Security practices
- Monitoring & observability

**When to use:** Understanding how system works, modifying code, scaling

---

### 4. CURL_COMMANDS.sh (Bash Version)
**Purpose:** Shell script with 5 curl commands + explanations  
**Contents:**
- 5 main commands (Create → Discover → Scrape → Signals → Rankings)
- 2 bonus commands (Dashboard, Hotspots)
- Detailed explanations for each
- Expected responses
- Threat score breakdown example

**When to use:** On Linux/Mac or in any bash-compatible shell

---

### 5. CURL_COMMANDS.ps1 (PowerShell Version)
**Purpose:** PowerShell script with 5 curl commands (Windows-friendly)  
**Contents:**
- Same 5 commands as .sh version
- PowerShell-specific syntax
- Interactive prompts between commands
- Colored output for readability
- Signal type legend
- Data flow example

**When to use:** On Windows with PowerShell 5.1+

---

## 🔧 Configuration Files

### .env (Not in Git)
**Purpose:** Runtime configuration  
**Contents:**
```
PORT=3001                                              # Express server port
FIRECRAWL_PORT=3002                                    # Firecrawl service port
FIRECRAWL_ENDPOINT=http://localhost:3002/v1/crawl     # Real Docker endpoint
MONGODB_URI=mongodb+srv://...                         # Cloud database connection
ENABLE_AI_INSIGHTS=true                               # Feature flag
NODE_ENV=development                                  # Environment mode
```

**Setup:** Copy values from MongoDB Atlas, ensure Docker port correct

---

### package.json
**Purpose:** Node.js project configuration  
**Contents:**
- Dependencies: express, mongoose, axios, rss-parser, node-cron, @mendable/firecrawl-js
- Dev dependencies: nodemon, concurrently
- Scripts:
  - `npm run dev:backend` - Start with auto-reload
  - `npm start` - Production start
  - `npm run test:ingestion` - Run E2E test

---

## 🧪 Test & Diagnostic Files

### test-ingestion.js (Main E2E Test)
**Purpose:** Validate entire system works end-to-end  
**Runs:**
1. Create competitor
2. Discover URLs (Google News, sitemap, industry RSS)
3. Scrape content (Firecrawl)
4. Create signals (type detection)
5. Compute threat (scoring)
6. Verify dashboard

**Usage:** `node test-ingestion.js`  
**Expected Output:** All 8 steps pass with data verification

---

### test-firecrawl.js
**Purpose:** Verify Firecrawl Docker service working  
**Tests:**
- Health endpoint
- Scraping a real URL
- Response parsing

**Usage:** `npm run test:firecrawl`

---

### test-db.js
**Purpose:** Verify MongoDB connection  
**Tests:**
- Connection to MongoDB Atlas
- Ping command
- Collection operations

**Usage:** `node test-db.js`

---

### check-crawl.js
**Purpose:** Test crawling specific URLs  
**Verifies:**
- Firecrawl can scrape Zoho, Asana, GitHub, Salesforce
- Content extraction works

**Usage:** `npm run check:crawl`

---

### diagnose-db.js
**Purpose:** Detailed database diagnostics  
**Shows:**
- Connection status
- Database name
- Collections
- Document counts

**Usage:** `node diagnose-db.js`

---

### simple-health.js
**Purpose:** Quick server health check  
**Checks:**
- Backend API responding
- Health endpoint
- Database connected

**Usage:** `node simple-health.js`

---

## 🔌 Source Code Files

### src/app.js (Express Server)
**Lines:** ~120  
**Purpose:** Main server entry point  
**Contains:**
- Express app initialization
- Middleware (JSON, CORS)
- MongoDB connection with DNS config
- Route mounting
- Health endpoint
- Error handlers
- PM2-ready server binding

**Key Functions:**
- `connectDB()` - Async MongoDB connection with dev/prod modes
- `app.use()` - Middleware registration
- `app.listen()` - Server start

---

### src/models/index.js (Database Schemas)
**Lines:** ~450  
**Purpose:** Define all data models  
**Schemas:**
1. **Competitor** (1-10 docs per system)
   - name, website, locations, rssKeywords, active
   
2. **News** (100s-1000s per competitor)
   - url, status, sources, contentHash, isDuplicate
   
3. **Page** (100s-1000s per competitor)
   - newsId, markdown, plainText, html, metadata
   
4. **Signal** (100s-1000s per competitor, append-only)
   - type, confidence, severity, locations, newsIds
   
5. **Threat** (1 per competitor per period)
   - threatScore, signalByType, topLocations
   
6. **Insight** (optional, AI-generated)
   - insight, theme, confidence, sourceCount

**Indexes:** competitorId, status, type, createdAt, urlCanonical

---

### src/services/discovery.js
**Lines:** ~400  
**Purpose:** Find all URLs mentioning competitor  
**Functions:**
- `fetchGoogleNewsRss(competitorName)` - Search Google News
- `parseSitemap(sitemapUrl)` - Extract URLs from sitemap.xml
- `discoverCompanyWebsite(websiteUrl)` - Crawl company site
- `searchIndustryNews(competitorName)` - Search logistics RSS feeds
- `discoverCompetitorUrls(competitor)` - Orchestrate all discovery
- `saveDiscoveredUrls(competitorId, urls)` - Deduplicate & persist

**Output:** News collection with 30-50 URLs per competitor

---

### src/services/scraping.js
**Lines:** ~200  
**Purpose:** Extract content from discovered URLs  
**Functions:**
- `hashContent(content)` - SHA256 hashing
- `isScrapedRecently(urlCanonical)` - 24-hour cache check
- `findDuplicateByContent(hash)` - Duplicate detection
- `scrapeAndSaveUrl(newsId)` - Call Firecrawl, save result
- `scrapePendingUrls(competitorId, limit)` - Batch scraping
- `getScrapingStats(competitorId)` - Aggregate stats

**Features:** Deduplication, 24h cache, Firecrawl integration

---

### src/services/signals.js
**Lines:** ~300  
**Purpose:** Detect competitor signals from content  
**Functions:**
- `extractLocations(text)` - Find India cities (24 cities supported)
- `detectSignal(title, content)` - Keyword-based type detection
- `determineSeverity(type, confidence)` - Map to LOW/MEDIUM/HIGH/CRITICAL
- `createSignalFromNews(newsId, competitorId)` - Create Signal document
- `createSignalsForPendingNews(competitorId)` - Batch signal creation

**Signal Types:** EXPANSION, HIRING, SERVICE_LAUNCH, CLIENT_WIN, FINANCIAL, REGULATORY, MEDIA, OTHER

**Confidence Range:** 30-95 depending on type

---

### src/services/threat.js
**Lines:** ~200  
**Purpose:** Calculate threat scores and rankings  
**Functions:**
- `computeThreatScore(signalsByType, totalSignals)` - Weighted calculation
- `computeThreatForCompetitor(competitorId, period)` - Per-competitor score
- `computeThreatForAllCompetitors()` - Batch computation
- `getThreatRankings(limit)` - Top N competitors

**Scoring:** 0-100 scale based on signal type weights

**Output:** Threat collection with scores and rankings

---

### src/services/firecrawl.js
**Lines:** ~90  
**Purpose:** Real Firecrawl Docker integration  
**Functions:**
- `scrapeUrl(url, options)` - Scrape single URL
- `scrapeUrls(urls, options)` - Batch scrape with delays
- Error handling with HTTP status logging

**Endpoint:** http://localhost:3002/v1/crawl  
**Output:** markdown, plainText, html, metadata

---

### src/routes/api.js
**Lines:** ~400  
**Purpose:** REST API endpoints  
**Endpoints:** 20+ covering:
- Competitor CRUD
- Discovery triggering
- Scraping triggering
- Signal creation
- Threat computation
- Rankings & dashboard
- Geographic hotspots

---

## 📊 Data Flow Summary

```
User provides competitor
        ↓
Discovery Service finds URLs (30-50)
        ↓
Scraping Service extracts content (limit 5)
        ↓
Deduplication checks SHA256 hash
        ↓
Signal Service generates signals (type detection)
        ↓
Threat Service computes score (weighted algorithm)
        ↓
API returns results to user
```

---

## 🚀 Getting Started Flowchart

```
1. Read QUICKSTART.md (5 min)
        ↓
2. Install dependencies & setup .env (3 min)
        ↓
3. Start Firecrawl Docker (1 min)
        ↓
4. Start backend: npm run dev (1 min)
        ↓
5. Run test-ingestion.js (2 min)
        ↓
6. View results in dashboard
        ↓
7. Add more competitors
        ↓
8. Read ARCHITECTURE.md for modifications
```

---

## 📚 Reference by Task

| Task | File | Section |
|------|------|---------|
| Setup | QUICKSTART.md | Step 1-5 |
| API Usage | README.md | API Documentation |
| Data Models | ARCHITECTURE.md | Database Schema |
| System Design | ARCHITECTURE.md | Component Architecture |
| Testing | test-ingestion.js | Automated test |
| Curl Examples | CURL_COMMANDS.ps1 | Windows |
| Curl Examples | CURL_COMMANDS.sh | Linux/Mac |
| Discovery Logic | src/services/discovery.js | All functions |
| Scraping Logic | src/services/scraping.js | All functions |
| Signal Types | src/services/signals.js | detectSignal() |
| Threat Scoring | src/services/threat.js | computeThreatScore() |

---

## 📖 Recommended Reading Order

**For Quick Start:**
1. QUICKSTART.md (start here)
2. CURL_COMMANDS.ps1 (for Windows)
3. README.md (full reference)

**For Understanding:**
1. ARCHITECTURE.md (overview)
2. README.md (API documentation)
3. src/models/index.js (data schemas)

**For Development:**
1. ARCHITECTURE.md (system design)
2. Specific service files (src/services/*.js)
3. API routes (src/routes/api.js)

**For Troubleshooting:**
1. README.md (Troubleshooting section)
2. test-ingestion.js (run & check output)
3. diagnose-db.js (database issues)

---

## 🔑 Key File Dependencies

```
app.js
  ├── models/index.js (all schemas)
  ├── services/discovery.js
  ├── services/scraping.js
  ├── services/signals.js
  ├── services/threat.js
  ├── services/firecrawl.js
  └── routes/api.js
      ├── All services
      └── All models

routes/api.js
  ├── models/index.js
  ├── services/discovery.js
  ├── services/scraping.js
  ├── services/signals.js
  └── services/threat.js

services/*
  └── models/index.js
```

---

**Total Project Size:**
- Source code: ~1500 lines
- Documentation: ~2000 lines
- Tests: ~500 lines
- Dependencies: 8 core packages

**Setup Time:** 5 minutes  
**First E2E Test:** 2 minutes  
**Total Time to Fully Working:** 7-10 minutes
