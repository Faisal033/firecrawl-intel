# Engineering Project Summary - Competitor Intelligence System

**Status:** MVP with core pipeline implemented  
**Language:** Node.js (CommonJS) + Express.js  
**Database:** MongoDB Atlas (Cloud)  
**Last Updated:** January 2026

---

## Executive Summary

A Node.js-based competitor intelligence system that discovers, scrapes, and analyzes competitor activity. The system ingests URLs from multiple sources, extracts content, generates signals from content, and computes threat scores. Designed for Indian logistics sector but extensible to other industries.

**Lines of Code:**
- Backend services: ~1,500 LOC
- API routes: ~377 LOC
- Database models: ~300 LOC
- Total implementat: ~2,200 LOC (excluding docs and tests)

---

## Architecture

### System Flow
```
Discovery → Deduplication → Scraping → Signal Detection → Threat Computation
```

### Core Components

#### 1. Discovery Service (`src/services/discovery.js`)
**Status: IMPLEMENTED**

Fetches URLs from multiple sources:
- **Google News RSS** - Queries news.google.com for competitor mentions (10 articles per query)
- **Sitemap Parsing** - Downloads and parses sitemap.xml with regex extraction
- **Industry News RSS** - Defined RSS sources (Freightwaves, Supply Chain Dive, Logistics Bureau, TechCircle, Inc42)
- **Website Discovery** - Attempts sitemap.xml from domain root

**Limitations:**
- Industry RSS sources are defined but feed parsing may fail silently if URLs become unavailable
- No active retry mechanism for failed feeds
- No pagination for Google News (hardcoded to 10 articles)

#### 2. Scraping Service (`src/services/scraping.js`)
**Status: IMPLEMENTED**

Extracts content via Firecrawl Docker service:
- Fetches URL via `scrapeUrl()` function
- Extracts markdown and plaintext
- Calculates SHA256 hash of normalized content
- Detects duplicate content (SHA256 matching within same competitor)
- URL canonicalization (normalizes URLs before duplicate check)

**Cache Implementation (PARTIAL):**
- **24-hour check exists** - `isScrapedRecently()` function queries for URLs scraped in last 24h
- **NOT enforced globally** - Cache is bypassed if URL is marked as duplicate or if called multiple times in session
- **No TTL index** - MongoDB collection has no automatic expiration; stale data persists
- **Use case:** Prevents re-scraping the same URL within a day, but cache effectiveness depends on calling patterns

#### 3. Deduplication
**Status: IMPLEMENTED**

Two mechanisms:
1. **Content Hash (SHA256)** - Normalizes text (lowercase, remove extra whitespace), hashes, matches against competitor's existing content
2. **URL Canonicalization** - Stored in `News.urlCanonical` field for URL-based matching

**Limitations:**
- URL canonicalization is basic (no full URI normalization like query param ordering)
- Content normalization strips only basic punctuation/whitespace; semantic duplicates not detected
- Only checks duplicates within same competitor; cross-competitor duplicates not flagged

#### 4. Signal Detection (`src/services/signals.js`)
**Status: IMPLEMENTED**

**Location Extraction:**
- Deterministic keyword matching against hardcoded list of 24 Indian cities
- Returns matched cities or defaults to "India"
- No geographical/administrative boundary awareness

**Signal Types Detected (8 types):**
```javascript
EXPANSION, HIRING, SERVICE_LAUNCH, CLIENT_WIN, FINANCIAL, REGULATORY, MEDIA, OTHER
```

**Detection Method:**
- Keyword matching on title + content (case-insensitive)
- Example: "expand", "new office", "new warehouse" → EXPANSION (confidence: 75)
- Confidence values hardcoded (30-85 range)

**Limitations:**
- Confidence scores are static per signal type, not learned/updated
- No semantic understanding; purely lexical pattern matching
- Keyword matching may produce false positives (e.g., "new" in a URL triggers SERVICE_LAUNCH)
- Location extraction only works for exact city name matches

#### 5. Threat Computation (`src/services/threat.js`)
**Status: IMPLEMENTED**

Computes threat score from signals:
- Weighted by signal type: EXPANSION (25), FINANCIAL (20), HIRING (20), etc.
- Normalized to 0-100 scale
- Time windows: 7D, 30D, OVERALL (365 days)
- Generates: signal count, type breakdown, top 5 locations

**Limitations:**
- Weights are static, not calibrated to actual competitor impact
- No temporal decay (old signals weighted same as recent)
- No competitor-specific context (all companies same weight formula)
- Threat only updated on demand; no automatic daily computation

#### 6. Database Models
**Status: IMPLEMENTED**

**Collections (7 total):**
1. **Competitor** - 1-10 docs typically
2. **News** - 100s-1000s docs (indexed: competitorId, urlCanonical, contentHash, status)
3. **Page** - 100s-1000s docs (scraped content storage)
4. **Signal** - 100s-1000s docs (append-only, immutable createdAt)
5. **Threat** - 10-100 docs (one per competitor, updated daily)
6. **Insight** - Optional AI-generated insights (not auto-populated)

**Note:** Previously claimed 6 collections; actually 7 (Insight added).

#### 7. API Endpoints
**Status: MOSTLY IMPLEMENTED**

**Competitor Management:**
- `POST /api/competitors` - Create
- `GET /api/competitors` - List active
- `GET /api/competitors/:id` - Get single

**Discovery & Scraping:**
- `POST /api/competitors/:id/discover` - Trigger URL discovery
- `POST /api/competitors/:id/scrape` - Trigger scraping (limit param)
- `GET /api/competitors/:id/scraping-stats` - Stats

**News & Signals:**
- `GET /api/competitors/:id/news` - List news (status, limit params)
- `GET /news/:id` - Get single news item
- `POST /api/competitors/:id/signals/create` - Trigger signal creation
- `GET /api/competitors/:id/signals` - List signals

**Threat & Rankings:**
- `POST /api/competitors/:id/threat/compute` - Compute threat score
- `GET /api/competitors/:id/threat` - Get threat for competitor
- `GET /threat/rankings` - Top N competitors by threat

**Dashboard (PARTIAL):**
- `GET /api/dashboard/overview` - Returns KPI aggregates
  - **Status:** Functional but not production-ready; aggregates are computed per-request (no caching)
  - **Limitation:** O(N) queries; performance degrades with 100+ competitors

- `GET /api/geography/hotspots` - Geographic signal aggregation (MongoDB aggregation pipeline)

---

## Implementation Status by Feature

### (A) Fully Implemented
✅ Multi-source URL discovery (Google News, sitemaps, RSS feeds)  
✅ Web scraping via Firecrawl Docker  
✅ Content hash deduplication (SHA256)  
✅ URL canonicalization (basic)  
✅ Signal type detection (8 types, keyword-based)  
✅ India city location extraction (24 cities)  
✅ Threat score computation (weighted by signal type)  
✅ Geographic signal clustering (aggregation pipeline)  
✅ Append-only signal storage (immutable records)  
✅ MongoDB connectivity with DNS fallback  
✅ CORS and basic error handling  
✅ Health check endpoints  

### (B) Partially Implemented
⚠️ **24-hour scrape cache** - Exists but not globally enforced; bypassed in some paths  
⚠️ **Dashboard KPIs** - Endpoint exists but computed per-request without caching; not production-ready for 100+ competitors  
⚠️ **Industry RSS feeds** - Defined but not actively monitored; feed failures not reported  
⚠️ **Automated threat computation** - Endpoint exists but must be triggered manually; no scheduled daily run  

### (C) Not Implemented / Planned
❌ Automated daily threat computation (node-cron configured but not integrated)  
❌ AI-generated insights (Insight model defined but not auto-populated)  
❌ Semantic duplicate detection (only lexical hashing)  
❌ Temporal decay in threat scoring (old signals weighted same)  
❌ Competitor-specific signal weights  
❌ Real-time signal notifications  
❌ UI dashboard (API-only)  
❌ Authentication/authorization  
❌ Rate limiting  
❌ Comprehensive test suite (manual tests only)  

---

## Current Limitations

### Data Quality
1. **Location Detection:** Hardcoded city list; no boundary awareness; case-sensitive matching despite lowercase conversion
2. **Signal Confidence:** Static scores per type; no learning or adjustment based on accuracy
3. **Content Deduplication:** SHA256 catches exact duplicates only; paraphrased content not detected

### Performance & Scalability
1. **Dashboard Aggregation:** No caching; O(N) scan of all signals for KPIs
2. **Threat Computation:** Manual trigger only; no background jobs
3. **Scraping Delays:** No rate limiting or adaptive delays; risk of IP bans

### Reliability
1. **RSS Feed Failures:** Industry feeds fail silently if URLs change or become unavailable
2. **Firecrawl Dependency:** No fallback scraper; if Docker service down, entire pipeline blocked
3. **Network Resilience:** DNS fallback configured but no retry logic for transient failures

### Operational
1. **No Automated Scheduling:** Threat computation, signal generation, scraping all manual triggers
2. **No Monitoring/Alerting:** No metrics, logging, or alerting on data quality or failures
3. **No Data Validation:** Assumes RSS feeds return valid data; no schema validation on scraped content

### Testing
1. **Manual Only:** test-ingestion.js requires manual execution and inspection
2. **No Unit Tests:** Services lack isolated tests; no mocking of external dependencies
3. **No CI/CD:** No automated test runs or deployment validation

---

## Next Engineering Milestones

### Phase 1: Reliability (1-2 weeks)
1. **Automated Threat Computation**
   - Integrate node-cron to run `computeThreatForAllCompetitors()` daily at 00:00 UTC
   - Add signal generation as part of automated pipeline
   - Implement retry logic with exponential backoff

2. **RSS Feed Monitoring**
   - Add health checks for industry RSS feeds on startup
   - Log feed failures and provide status endpoint
   - Implement fallback to cached feed data if source unavailable

3. **Dashboard Caching**
   - Add Redis or in-memory cache for KPI aggregates
   - Invalidate cache on signal/news changes
   - Add cache stats endpoint for debugging

### Phase 2: Data Quality (1-2 weeks)
1. **Semantic Deduplication**
   - Implement TF-IDF or embedding-based similarity
   - Flag paraphrased duplicates with confidence threshold
   - Cross-competitor duplicate detection

2. **Threat Score Calibration**
   - Analyze signal type accuracy against manual labels
   - Adjust weights based on actual competitor impact
   - Implement temporal decay (recent signals weighted 2x higher)

3. **Location Extraction**
   - Replace hardcoded list with administrative boundary data (India state/district)
   - Add fuzzzy matching for misspelled city names
   - Extract multiple locations per signal with confidence scores

### Phase 3: Automation (1-2 weeks)
1. **Insight Generation**
   - Implement logic to cluster related signals (same theme)
   - Generate narrative summaries using template engine
   - Auto-populate Insight collection on signal creation

2. **Scraping Optimization**
   - Implement adaptive delays based on Firecrawl response times
   - Add queue-based batch processing with priority levels
   - Implement per-domain rate limiting

3. **Background Jobs**
   - Move scraping to async queue (Bull/BullMQ)
   - Implement job status tracking and retry policies
   - Add webhook support for completion notifications

### Phase 4: Production Readiness (2-3 weeks)
1. **Testing & Observability**
   - Add unit tests for all services (target 70%+ coverage)
   - Implement structured logging with levels
   - Add metrics collection (Prometheus) for signals, threats, scrape times
   - Create CI/CD pipeline (GitHub Actions)

2. **Security**
   - Add API authentication (JWT or OAuth)
   - Implement rate limiting per API key
   - Add input validation and sanitization

3. **Deployment**
   - Docker containerization for backend
   - Docker Compose for full stack (backend + MongoDB + Firecrawl)
   - Kubernetes manifests for cloud deployment

---

## Dependencies & External Services

**npm Dependencies:**
- `@mendable/firecrawl-js` (4.11.4) - Web scraping client
- `express` (4.19.2) - Web framework
- `mongoose` (9.1.5) - MongoDB ODM
- `rss-parser` (3.13.0) - RSS feed parsing
- `axios` (1.13.3) - HTTP client
- `dotenv` (17.2.3) - Environment config
- `node-cron` (4.2.1) - Scheduled tasks (not yet integrated)

**External Services:**
- **MongoDB Atlas** - Required for persistence (connection string in .env)
- **Firecrawl Docker** - Required for scraping (must be running on localhost:3002)
- **Google News** - RSS feed (no key required, rate limited)
- **Industry RSS feeds** - May require credentials depending on source

---

## Known Issues

1. **DNS Configuration:** Uses public DNS servers (Cloudflare, Google) to bypass router issues; may not work in corporate networks with DNS inspection
2. **Mongoose Connection Timeout:** 10s server selection timeout may be too aggressive in slow networks
3. **No Database Indexes on Timestamps:** Threat queries filter by `createdAt` without index; performance degrades as Signal collection grows
4. **Memory Leaks in Long-Running Scrapes:** No connection pooling cleanup; sustained scraping may consume unbounded memory

---

## Documentation

**Core Documentation:**
- `README.md` - Feature overview and setup
- `ARCHITECTURE.md` - System design with diagrams
- `API_REFERENCE.md` - API endpoint reference
- `QUICKSTART.md` - 5-minute setup guide
- `GETTING_STARTED.md` - Project orientation

**Diagnostic Tools:**
- `test-ingestion.js` - End-to-end pipeline test
- `test-firecrawl.js` - Firecrawl service validation
- `test-db.js` - Database connection test
- `diagnose-db.js` - Detailed database diagnostics
- `simple-health.js` - Quick health check

---

## Deployment Instructions

### Prerequisites
- Node.js 16+
- Docker (for Firecrawl)
- MongoDB Atlas account

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Start Firecrawl Docker
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl

# 3. Configure .env with MongoDB URI

# 4. Start backend
npm start

# 5. Verify health
curl http://localhost:3001/health
```

### Running Manual Tests
```bash
# E2E ingestion test
npm run test:ingestion

# Firecrawl validation
npm run test:firecrawl

# Database diagnostics
node diagnose-db.js
```

---

## Code Quality Notes

- **Error Handling:** Try-catch blocks in all API routes and services; graceful degradation if DB unavailable
- **Logging:** Console logs with emoji prefixes for visual scanning; no structured logging framework
- **Database Queries:** Lean queries (.lean()) for read-heavy operations; proper indexing on hot paths
- **Async/Await:** Consistent use of async/await; no callback hell
- **Configuration:** Environment variables via dotenv; no hardcoded secrets

---

## Recommendations for Next Developer

1. **Read ARCHITECTURE.md first** - Understand the 5-layer design before modifying services
2. **Start with Phase 1 milestones** - Reliability wins will unlock automation
3. **Add logging framework early** - Will save debugging time at scale
4. **Test Firecrawl limits** - Verify API rate limits and timeouts under load
5. **Document signal keyword patterns** - Maintainability depends on clear signal detection rules
6. **Monitor MongoDB growth** - Signal and News collections grow unbounded; plan retention policy

---

**Last Reviewed:** January 28, 2026  
**Prepared for:** Handover & Continuation
