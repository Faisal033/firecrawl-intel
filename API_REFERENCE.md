# API Quick Reference

Common API requests for the Competitor Intelligence SaaS system. Copy and paste into your terminal.

---

## Setup

Ensure backend is running:
```powershell
npm run dev
```

Ensure Firecrawl Docker is running:
```powershell
docker ps | grep firecrawl
```

---

## 1. Competitors API

### Create Competitor

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

**Save the `_id` for subsequent requests.**

---

### List All Competitors

```bash
curl -X GET http://localhost:3001/api/competitors \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Zoho Corporation",
      "website": "https://www.zoho.com",
      "active": true
    }
  ]
}
```

---

### Get Single Competitor

```bash
# Replace COMPETITOR_ID with actual ID
curl -X GET http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Content-Type: application/json"
```

---

## 2. Discovery API

### Start URL Discovery

```bash
# Replace COMPETITOR_ID
curl -X POST http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1/discover \
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

**What happened:**
- Searched Google News for "Zoho" (found ~15 articles)
- Parsed Zoho's sitemap (found ~12 URLs)
- Searched 5 logistics RSS feeds (found ~15 articles)
- Deduplicated and saved 42 unique URLs

---

## 3. News API

### Get News Items for Competitor

```bash
# Get only scraped news
curl -X GET "http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1/news?status=SCRAPED&limit=10" \
  -H "Content-Type: application/json"
```

**Query Parameters:**
- `status`: DISCOVERED, SCRAPING, SCRAPED, FAILED, SKIPPED
- `limit`: Max results (default: 20)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
      "url": "https://...",
      "title": "Zoho opens new office",
      "status": "SCRAPED",
      "sourceType": "RSS",
      "isDuplicate": false
    }
  ]
}
```

---

### Get Single News Item

```bash
curl -X GET http://localhost:3001/api/news/67a1b2c3d4e5f6g7h8i9j0k2 \
  -H "Content-Type: application/json"
```

---

## 4. Scraping API

### Scrape Pending URLs

```bash
curl -X POST http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1/scrape \
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

**What happened:**
- Called Firecrawl for 5 URLs
- Extracted markdown, plaintext, HTML
- Computed SHA256 content hash
- Detected duplicates
- Saved to Page collection

---

### Get Scraping Statistics

```bash
curl -X GET http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1/scraping-stats \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "DISCOVERED": 35,
    "SCRAPING": 0,
    "SCRAPED": 5,
    "FAILED": 2,
    "SKIPPED": 0
  }
}
```

---

## 5. Signals API

### Create Signals from Scraped Content

```bash
curl -X POST http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1/signals/create \
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
    "FINANCIAL": 2,
    "OTHER": 0
  }
}
```

**What happened:**
- Analyzed 5 scraped articles
- Detected signal types (EXPANSION, HIRING, etc.)
- Extracted India cities
- Computed confidence scores
- Created 8 immutable Signal documents

---

### Get Signals for Competitor

```bash
# Get signals from last 30 days
curl -X GET "http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1/signals?days=30" \
  -H "Content-Type: application/json"
```

**Query Parameters:**
- `days`: 7, 30, or 365 (default: 30)

**Response:**
```json
{
  "success": true,
  "count": 8,
  "period": {
    "days": 30,
    "from": "2024-01-15T00:00:00Z",
    "to": "2024-02-14T00:00:00Z"
  },
  "data": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k3",
      "type": "EXPANSION",
      "title": "Zoho opens new office in Bangalore",
      "confidence": 95,
      "severity": "CRITICAL",
      "locations": ["Bangalore", "India"],
      "createdAt": "2024-02-10T10:30:00Z"
    },
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k4",
      "type": "HIRING",
      "title": "Zoho hiring 500 engineers",
      "confidence": 90,
      "severity": "CRITICAL",
      "locations": ["India"],
      "createdAt": "2024-02-09T15:45:00Z"
    }
  ]
}
```

---

## 6. Threat API

### Compute Threat for Competitor

```bash
curl -X POST http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1/threat/compute \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Threat computed",
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k5",
    "competitorId": "67a1b2c3d4e5f6g7h8i9j0k1",
    "threatScore": 78,
    "signalCount": 8,
    "signalByType": {
      "EXPANSION": 2,
      "HIRING": 3,
      "SERVICE_LAUNCH": 1,
      "FINANCIAL": 2,
      "OTHER": 0
    },
    "topLocations": [
      { "location": "Bangalore", "count": 5 },
      { "location": "Chennai", "count": 2 },
      { "location": "Mumbai", "count": 1 }
    ]
  }
}
```

---

### Get Threat for Competitor

```bash
curl -X GET http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1/threat \
  -H "Content-Type: application/json"
```

---

### Get Threat Rankings

```bash
curl -X GET "http://localhost:3001/api/threat/rankings?limit=10" \
  -H "Content-Type: application/json"
```

**Query Parameters:**
- `limit`: Max results to return (default: 10)

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
      "signalCount": 8,
      "topLocations": [
        { "location": "Bangalore", "count": 5 },
        { "location": "Chennai", "count": 2 }
      ],
      "createdAt": "2024-02-14T10:30:00Z"
    }
  ]
}
```

---

## 7. Dashboard API

### Get Dashboard Overview

```bash
curl -X GET http://localhost:3001/api/dashboard/overview \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "competitors": 1,
      "newsItems": 42,
      "signals": 8,
      "highThreats": 1
    },
    "latestAlerts": [
      {
        "competitorName": "Zoho Corporation",
        "signal": "Zoho opens new office in Bangalore",
        "severity": "CRITICAL",
        "createdAt": "2024-02-10T10:30:00Z"
      }
    ],
    "topThreats": [
      {
        "competitorName": "Zoho Corporation",
        "threatScore": 78,
        "signalCount": 8
      }
    ]
  }
}
```

---

## 8. Geographic Hotspots API

### Get Geographic Hotspots

```bash
# Get hotspots from last 30 days
curl -X GET "http://localhost:3001/api/geography/hotspots?days=30" \
  -H "Content-Type: application/json"
```

**Query Parameters:**
- `days`: Time range (7, 30, 90, 365; default: 30)

**Response:**
```json
{
  "success": true,
  "period": {
    "days": 30,
    "from": "2024-01-15T00:00:00Z",
    "to": "2024-02-14T00:00:00Z"
  },
  "data": [
    {
      "_id": "Bangalore",
      "signalCount": 15,
      "competitors": ["Zoho Corporation", "FreshWorks"]
    },
    {
      "_id": "Chennai",
      "signalCount": 8,
      "competitors": ["Zoho Corporation"]
    },
    {
      "_id": "Mumbai",
      "signalCount": 5,
      "competitors": ["Zoho Corporation", "Mindtree"]
    }
  ]
}
```

---

## Health Endpoints

### Server Health Check

```bash
curl -X GET http://localhost:3001/health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-02-14T10:30:00Z"
}
```

---

### API Information

```bash
curl -X GET http://localhost:3001/api
```

**Response:**
```json
{
  "name": "Competitor Intelligence API",
  "version": "1.0.0",
  "description": "Production-grade competitor intelligence system",
  "endpoints": {
    "competitors": "/api/competitors",
    "discovery": "/api/competitors/:id/discover",
    "scraping": "/api/competitors/:id/scrape",
    "signals": "/api/competitors/:id/signals",
    "threat": "/api/threat/rankings",
    "dashboard": "/api/dashboard/overview"
  }
}
```

---

## PowerShell Users

For PowerShell, use this syntax for curl with JSON bodies:

```powershell
$body = @{
    limit = 5
} | ConvertTo-Json

curl -X POST http://localhost:3001/api/competitors/67a1b2c3d4e5f6g7h8i9j0k1/scrape `
  -H "Content-Type: application/json" `
  -Body $body
```

Or use `Invoke-WebRequest`:

```powershell
$body = @{
    name = "Zoho Corporation"
    website = "https://www.zoho.com"
    industry = "SaaS"
    locations = @("Bangalore")
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/competitors" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response.Content | ConvertFrom-Json
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid competitor ID format"
}
```

---

### 404 Not Found

```json
{
  "success": false,
  "message": "Competitor not found"
}
```

---

### 500 Server Error

```json
{
  "success": false,
  "message": "Database connection failed",
  "error": "ECONNREFUSED"
}
```

---

## Common Issues

### Competitor not found
- Verify _id is correct and copied in full
- Check competitor exists: `curl http://localhost:3001/api/competitors`

### No URLs discovered
- Check competitor website is accessible
- Verify RSS feeds have content
- Try different competitor name

### Scraping returns 0 results
- Ensure Firecrawl Docker is running: `docker ps`
- Check Firecrawl health: `curl http://localhost:3002/health`
- Verify URLs are reachable manually

### Database connection failed
- Check .env has correct MONGODB_URI
- Verify IP is whitelisted on MongoDB Atlas
- Check network connectivity

---

## Rate Limiting

Currently no rate limiting implemented. In production, add:
- 100 requests/minute per IP
- 10 discovery requests/hour per competitor
- 50 scrape requests/hour per competitor

---

## Testing All Endpoints

Run the automated test:

```bash
node test-ingestion.js
```

This will:
1. Create competitor
2. Discover URLs
3. Scrape content
4. Create signals
5. Compute threat
6. Verify all data

Expected runtime: 2-3 minutes
