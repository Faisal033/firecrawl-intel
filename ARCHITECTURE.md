# Architecture & Technical Design

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMPETITOR INTELLIGENCE SaaS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Discovery   │→ │   Scraping   │→ │   Signals    │→ Threat │
│  │  Layer       │  │   Layer      │  │   Layer      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│       ↓                   ↓                 ↓                    │
│   RSS Feeds         Firecrawl         Signal Detector           │
│   Sitemaps         Deduplication      Location Extract          │
│   Search           SHA256 Hash        Confidence Score          │
│                    URL Canon          Severity Level            │
│                    24h Cache          Append-Only               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │             MongoDB Atlas (Cloud)                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • Competitor (1-10 docs)                              │   │
│  │ • News (100s-1000s docs, indexed by competitorId)    │   │
│  │ • Page (100s-1000s docs, scraped content)            │   │
│  │ • Signal (100s-1000s docs, append-only, immutable)   │   │
│  │ • Threat (10s docs, daily snapshots)                 │   │
│  │ • Insight (optional, AI-generated)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Express API Server (Port 3001)                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • /api/competitors        - CRUD                      │   │
│  │ • /api/competitors/:id/discover                       │   │
│  │ • /api/competitors/:id/scrape                         │   │
│  │ • /api/competitors/:id/signals                        │   │
│  │ • /api/competitors/:id/threat                         │   │
│  │ • /api/threat/rankings                                │   │
│  │ • /api/dashboard/overview                             │   │
│  │ • /api/geography/hotspots                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  External Services                                     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • Google News RSS                                     │   │
│  │ • Company Sitemaps                                    │   │
│  │ • Industry News RSS feeds                             │   │
│  │ • Firecrawl Docker (localhost:3002)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Discovery Layer (`src/services/discovery.js`)

**Responsibility:** Find all public URLs mentioning competitor

**Methods:**

```javascript
fetchGoogleNewsRss(competitorName)
  → Search Google News API
  → Returns 10 most recent articles
  → Fields: title, url, source, publishedAt
  
parseSitemap(sitemapUrl, pathFilters)
  → Download sitemap.xml
  → Extract URLs matching patterns: /blog, /news, /press, /media, /investor, /careers
  → Filter by domain
  
discoverCompanyWebsite(websiteUrl)
  → Try sitemap.xml from root domain
  → Fallback to common paths if not found
  → Returns deduplicated URLs
  
searchIndustryNews(competitorName)
  → Search 5 logistics industry RSS feeds:
    - Freightwaves
    - Supply Chain Dive
    - Logistics Bureau
    - TechCircle
    - Inc42
  → Filter by keyword match
  → Returns relevant articles
```

**Output:** News collection documents with:
- url, urlCanonical
- sourceType (RSS, SITEMAP, SITE_SEARCH)
- status: DISCOVERED
- Timestamps

---

### 2. Scraping Layer (`src/services/scraping.js`)

**Responsibility:** Extract content from URLs using Firecrawl

**Key Features:**

**Deduplication Strategy:**
```
1. SHA256 Hash Content
   normalized = content.toLowerCase().trim().replace(/\s+/g, ' ')
   hash = SHA256(normalized)
   
2. URL Canonicalization
   Remove tracking params (?utm_*, ?ref=, etc)
   Remove #anchor fragments
   Lowercase domain
   Sort query params
   
3. 24-Hour Cache
   If same URL scraped < 24h ago, skip
   
4. Duplicate Detection
   Find other News docs with same contentHash
   Link via duplicateOf field
   Mark isDuplicate = true
```

**Methods:**

```javascript
scrapeAndSaveUrl(newsId, competitorId)
  1. Call Firecrawl: POST to http://localhost:3002/v1/crawl
  2. Extract: markdown, plaintext, html, metadata
  3. Compute contentHash via SHA256
  4. Check for 24-hour cache hit
  5. Check for content duplicates
  6. Save to Page collection
  7. Update News.status = SCRAPED
  
scrapePendingUrls(competitorId, limit)
  1. Get up to 'limit' URLs with status=DISCOVERED
  2. Process each with 500ms delay
  3. Aggregate results: scrapedCount, failedCount, skippedCount
```

**Output:** Page collection documents with:
- newsId reference
- markdown, plainText, html
- metadata (title, description, author, wordCount)
- Timestamps

---

### 3. Signal Generation Layer (`src/services/signals.js`)

**Responsibility:** Detect competitor signals from scraped content

**Signal Types & Keywords:**

```javascript
EXPANSION (25 points)
  Keywords: opened new office, expanded to, new location, expansion,
            new operations, new hub, opened center, expanded presence
  Confidence: 75-85

HIRING (20 points)
  Keywords: hiring, job opening, recruitment, job vacancy, openings,
            recruiting, career, we are hiring, recruitment drive
  Confidence: 80-90

SERVICE_LAUNCH (15 points)
  Keywords: launched, announced, new product, new service, launch,
            introducing, released, unveiled
  Confidence: 70-80

CLIENT_WIN (15 points)
  Keywords: signed, contract, acquired, client, deal, partnership,
            collaboration, client win, new customer
  Confidence: 65-75

FINANCIAL (20 points)
  Keywords: raised funding, IPO, revenue grew, profitable, funding round,
            investment, series A/B, valuation, profitable
  Confidence: 80-95

REGULATORY (15 points)
  Keywords: compliance, audit passed, regulatory approval, certification,
            license granted, regulatory, regulatory approval
  Confidence: 70-80

MEDIA (5 points)
  Keywords: featured, Forbes, TechCrunch, press, media mention,
            interview, article, interview
  Confidence: 50-70

OTHER (5 points)
  Generic competitor mentions not matching above
  Confidence: 30-50
```

**Location Extraction:**

Searches text for India cities:
- Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad
- Jaipur, Lucknow, Kanpur, Nagpur, Indore, Thane, Bhopal, Visakhapatnam
- Patna, Vadodara, Ghaziabad, Ludhiana, Surat, Chandigarh, Kota, Agra

Fallback: ["India"] if no cities found

**Severity Mapping:**

```javascript
Confidence >= 80
  EXPANSION, HIRING, FINANCIAL → CRITICAL
  Others → HIGH
  
Confidence 60-79
  Most types → HIGH
  
Confidence 40-59
  Most types → MEDIUM
  
Confidence < 40
  Most types → LOW
```

**Methods:**

```javascript
detectSignal(title, content)
  1. Concatenate title + content
  2. Check keyword matches for each type
  3. Calculate confidence (0-100)
  4. Return { signalType, confidence }
  
extractLocations(text)
  1. Search for India city matches
  2. Fallback to ["India"] if none found
  3. Return array of locations
  
createSignalFromNews(newsId, competitorId)
  1. Get Page content via newsId
  2. Detect signal type
  3. Extract locations
  4. Determine severity
  5. Create immutable Signal doc
```

**Output:** Signal collection (append-only):
- competitorId, newsIds
- type, title, description
- confidence (0-100)
- severity (LOW/MEDIUM/HIGH/CRITICAL)
- locations (array of India cities)
- createdAt (immutable timestamp)

---

### 4. Threat Computation Layer (`src/services/threat.js`)

**Responsibility:** Calculate threat scores and rankings

**Threat Score Algorithm:**

```
Step 1: Query all signals for competitor in time period
Step 2: Group by type
Step 3: Calculate points:
  
  totalPoints = Σ (signals[type] × weight[type])
  
  Example:
  2 EXPANSION × 25 = 50
  3 HIRING × 20 = 60
  2 FINANCIAL × 20 = 40
  1 SERVICE_LAUNCH × 15 = 15
  ─────────────────────────
  Total = 165 points
  
Step 4: Normalize to 0-100 scale:
  
  maxPossiblePoints = 1000 (estimated max)
  threatScore = (totalPoints / maxPossiblePoints) × 100
  threatScore = (165 / 1000) × 100 = 16.5
  
  (capped at 100)

Step 5: Extract top 5 locations by signal count
Step 6: Store in Threat collection
```

**Time Periods:**

- **7D:** Signals created in last 7 days
- **30D:** Signals created in last 30 days
- **OVERALL:** All signals ever

**Methods:**

```javascript
computeThreatForCompetitor(competitorId, period='30D')
  1. Query Signal collection:
     - Filter by competitorId
     - Filter by createdAt > (now - period)
  2. Group by signalType
  3. Calculate weighted points
  4. Normalize to 0-100
  5. Extract top locations
  6. Create/update Threat document
  
computeThreatForAllCompetitors()
  1. Get all active competitors
  2. For each: call computeThreatForCompetitor()
  3. Add 100ms delay between computations
  4. Log results
  
getThreatRankings(limit=10)
  1. Query Threat collection, sort by threatScore DESC
  2. Return top 'limit' competitors
  3. Include: competitorName, website, threatScore, signalCount, topLocations
```

**Output:** Threat collection:
- competitorId
- threatScore (0-100)
- signalCount
- signalByType (breakdown)
- topLocations (top 5)
- period (7D/30D/OVERALL)
- createdAt, updatedAt

---

### 5. API Layer (`src/routes/api.js`)

**Endpoints:**

```
COMPETITORS
  POST   /competitors                    Create competitor
  GET    /competitors                    List all competitors
  GET    /competitors/:id                Get single competitor
  
DISCOVERY
  POST   /competitors/:id/discover       Start discovery process
  GET    /competitors/:id/news           Get discovered/scraped URLs
  GET    /news/:id                       Get single news detail
  
SCRAPING
  POST   /competitors/:id/scrape         Scrape pending URLs
  GET    /competitors/:id/scraping-stats Get scraping statistics
  
SIGNALS
  POST   /competitors/:id/signals/create Generate signals from scraped content
  GET    /competitors/:id/signals        List signals by time window
  
THREAT
  POST   /competitors/:id/threat/compute Compute threat on-demand
  GET    /competitors/:id/threat         Get threat for competitor
  GET    /threat/rankings                Get all competitors ranked
  
DASHBOARD
  GET    /dashboard/overview             KPIs + alerts + top threats
  GET    /geography/hotspots             Signal concentration by location
  
HEALTH
  GET    /health                         Server health check
  GET    /api                            API information
```

---

### 6. Database Schema

**Competitor**
```javascript
{
  _id: ObjectId,
  name: String (unique),
  website: String,
  industry: String,
  locations: [String],
  rssKeywords: [String],
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
Indexes: name (unique), active, createdAt
```

**News**
```javascript
{
  _id: ObjectId,
  competitorId: ObjectId (indexed),
  url: String,
  urlCanonical: String (indexed, for dedup),
  title: String,
  sourceType: String (RSS|SITEMAP|SITE_SEARCH),
  sources: [{sourceType, sourceName}],
  status: String (DISCOVERED|SCRAPING|SCRAPED|FAILED|SKIPPED),
  contentHash: String,
  isDuplicate: Boolean,
  duplicateOf: ObjectId,
  createdAt: Date (indexed),
  updatedAt: Date
}
Indexes: competitorId, urlCanonical, status, createdAt
```

**Page**
```javascript
{
  _id: ObjectId,
  newsId: ObjectId (indexed),
  markdown: String,
  plainText: String,
  html: String,
  metadata: {
    title: String,
    description: String,
    author: String,
    publishedAt: Date,
    wordCount: Number
  },
  firecrawlJobId: String,
  createdAt: Date
}
Indexes: newsId, createdAt
```

**Signal (Append-Only)**
```javascript
{
  _id: ObjectId,
  competitorId: ObjectId (indexed),
  newsIds: [ObjectId],
  type: String (EXPANSION|HIRING|...) (indexed),
  title: String,
  description: String,
  confidence: Number (0-100),
  severity: String (LOW|MEDIUM|HIGH|CRITICAL),
  locations: [String],
  metadata: Object,
  createdAt: Date (indexed, immutable)
}
Indexes: competitorId, type, createdAt
```

**Threat**
```javascript
{
  _id: ObjectId,
  competitorId: ObjectId (unique),
  threatScore: Number (0-100),
  signalCount: Number,
  signalByType: {
    EXPANSION: Number,
    HIRING: Number,
    ...
  },
  topLocations: [{location: String, count: Number}],
  period: String (7D|30D|OVERALL),
  recentSignals: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
Indexes: competitorId (unique), threatScore, updatedAt
```

**Insight (Optional)**
```javascript
{
  _id: ObjectId,
  competitorId: ObjectId,
  insight: String,
  theme: String,
  confidence: Number,
  sourceCount: Number,
  actionable: Boolean,
  createdAt: Date
}
Indexes: competitorId, createdAt
```

---

## Data Flow Example: Zoho Discovery

```
Input: Zoho Corporation (https://www.zoho.com)
       │
       ├─→ Discovery Layer
       │   ├─→ Google News RSS: "Zoho"
       │   │   ├─ "Zoho opens office in Bangalore"
       │   │   ├─ "Zoho hiring 500 engineers"
       │   │   └─ "Zoho raises $100M funding"
       │   │
       │   ├─→ Sitemap Parser: https://www.zoho.com/sitemap.xml
       │   │   ├─ /blog/post-1
       │   │   ├─ /blog/post-2
       │   │   ├─ /press/release-1
       │   │   └─ /news/article-1
       │   │
       │   └─→ Industry News RSS (5 sources):
       │       ├─ Freightwaves: "Zoho expands logistics"
       │       └─ Inc42: "Indian SaaS funding boom"
       │
       ├─→ News Collection Created (42 URLs)
       │   ├─ url: "news.google.com/..."
       │   ├─ status: DISCOVERED
       │   └─ sourceType: RSS|SITEMAP|...
       │
       ├─→ Scraping Layer (limit: 5 URLs)
       │   ├─→ Firecrawl Call #1: news.google.com/...
       │   │   ├─ Extract markdown content
       │   │   ├─ Compute SHA256 hash
       │   │   ├─ Check 24-hour cache (miss)
       │   │   ├─ Check duplicate (miss)
       │   │   └─ Save to Page collection
       │   │
       │   ├─→ Firecrawl Call #2: zoho.com/blog/post-1
       │   │   └─ [same process]
       │   │
       │   └─→ ...
       │
       ├─→ Page Collection Updated (5 docs)
       │   ├─ markdown: "Zoho Corporation announced..."
       │   ├─ plainText: "Zoho Corporation announced..."
       │   └─ metadata: {title, author, ...}
       │
       ├─→ Signal Generation (5 pages analyzed)
       │   ├─→ Page 1: "Zoho opens office in Bangalore"
       │   │   ├─ Detect: EXPANSION (confidence: 95)
       │   │   ├─ Locations: ["Bangalore", "India"]
       │   │   ├─ Severity: CRITICAL
       │   │   └─ Create Signal #1
       │   │
       │   ├─→ Page 2: "Hiring 500 engineers"
       │   │   ├─ Detect: HIRING (confidence: 90)
       │   │   ├─ Locations: ["India"]
       │   │   ├─ Severity: CRITICAL
       │   │   └─ Create Signal #2
       │   │
       │   └─→ ...
       │
       ├─→ Signal Collection Updated (8 docs)
       │
       ├─→ Threat Computation
       │   ├─ Query 8 signals for competitor
       │   ├─ Points calculation:
       │   │   ├─ 2 EXPANSION × 25 = 50 points
       │   │   ├─ 3 HIRING × 20 = 60 points
       │   │   ├─ 2 FINANCIAL × 20 = 40 points
       │   │   └─ 1 SERVICE_LAUNCH × 15 = 15 points
       │   │   Total: 165 points
       │   │
       │   ├─ Normalize: (165 / 1000) × 100 = 16.5
       │   ├─ Cap at 100: threatScore = 16.5
       │   ├─ Extract top locations:
       │   │   ├─ Bangalore: 5 signals
       │   │   ├─ Chennai: 2 signals
       │   │   └─ Mumbai: 1 signal
       │   │
       │   └─ Create Threat doc
       │
       └─→ Output
           ├─ threatScore: 16.5/100
           ├─ signalCount: 8
           ├─ topLocations: [Bangalore, Chennai, Mumbai]
           └─ Dashboard updated
```

---

## Performance Optimizations

### N+1 Query Prevention

**Dashboard Overview:**
```javascript
// ❌ BAD - N+1 queries
competitors.forEach(c => {
  signals = Signal.find({competitorId: c._id})
  threats = Threat.findOne({competitorId: c._id})
})

// ✅ GOOD - Single aggregation
Threat.aggregate([
  { $group: {
      _id: null,
      competitors: { $sum: 1 },
      highThreats: { $sum: { $cond: [{$gte: ["$threatScore", 70]}, 1, 0] } }
    }
  }
])
```

### Indexing Strategy

All collections use indexes on:
- `competitorId` - Filter by competitor
- `createdAt` - Time-based queries
- Composite indexes for common queries

### Batch Processing

- Discovery: Parallel RSS parsing
- Scraping: 1-2 sec/URL with delays
- Signal creation: <100ms/article
- Threat computation: 100ms delay between competitors

### Caching

- 24-hour scrape cache (no re-download same URL)
- Content hash deduplication (no duplicate storage)
- Dashboard queries cached in aggregation pipeline

---

## Error Handling

**Firecrawl Failures:**
- Retry up to 3 times
- Log HTTP status and response
- Mark News.status = FAILED
- Continue with next URL

**MongoDB Failures:**
- Production: fail fast (exit process)
- Development: retry with exponential backoff
- Connection pooling prevents connection exhaustion

**RSS Parsing:**
- Try/catch on each feed
- Continue on parse errors
- Log failures but don't block discovery

---

## Scalability Considerations

**Current Capacity:**
- 10-100 competitors
- 1,000-10,000 news items
- 500-2,000 signals per competitor
- Sub-second dashboard queries

**Future Scaling:**
- Database sharding by competitorId
- Microservices: separate discovery/scraping/signals
- Message queue for async processing
- Cache layer (Redis) for hot signals
- CDN for dashboard assets

---

## Security

**API:**
- Input validation on all endpoints
- Rate limiting (future)
- CORS configured

**Database:**
- MongoDB Atlas network access controls
- IP whitelist
- Credentials via .env (never in code)

**Scraping:**
- Respect robots.txt (Firecrawl handles)
- Rate limiting on RSS feeds
- Delays between requests

---

## Monitoring & Observability

**Key Metrics:**
- Discovery success rate (URLs found vs saved)
- Scraping success rate (URLs scraped successfully)
- Signal quality (confidence distribution)
- API response times
- Database connection pool health

**Logging:**
- All API requests
- Firecrawl calls and responses
- Database operations
- Error stack traces

**Future:**
- Prometheus metrics
- ELK stack for log aggregation
- Grafana dashboards
