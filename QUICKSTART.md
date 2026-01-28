# 🚀 QUICK START GUIDE

Get up and running in 5 minutes.

## Prerequisites

- Node.js 16+ installed
- Docker installed
- MongoDB Atlas account (free tier)
- Windows PowerShell 5.1+

## Step 1: Get MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user (username: `Avinash`, password: `Avinash2002`)
4. Click "Connect" → "Drivers" → Copy connection string
5. It should look like:
   ```
   mongodb+srv://Avinash:Avinash2002@competitor-intel.abc123.mongodb.net/competitor-intel?retryWrites=true&w=majority
   ```

## Step 2: Configure Environment

Edit `.env` file and update:

```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/competitor-intel?retryWrites=true&w=majority
```

## Step 3: Start Services

### Terminal 1 - Start Firecrawl (Web Scraping Service)

```powershell
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl
```

Verify it's running:
```powershell
curl http://localhost:3002/health
```

### Terminal 2 - Start Backend

```powershell
npm install
npm run dev
```

Wait for message: `✅ Server running on port 3001`

## Step 4: Run E2E Test

### Terminal 3 - Run Test

```powershell
node test-ingestion.js
```

Expected output:
```
[10:30:00] 📝 Creating competitor...
[10:30:01] ✅ Created competitor: 67a1b2c3d4e5f6g7h8i9j0k1
[10:30:03] 🔍 Discovering URLs...
[10:30:05] ✅ Discovered 45 URLs, saved 42
[10:30:07] 🕷️  Scraping pending URLs...
[10:30:12] ✅ Scraped 5 URLs
[10:30:14] 📊 Creating signals from scraped content...
[10:30:15] ✅ Created 8 signals
[10:30:17] ⚠️  Computing threat level...
[10:30:18] ✅ Threat score: 78/100
[10:30:19] 📊 RESULTS:
         • Competitors: 1
         • News Items: 42
         • Signals: 8
         • High Threats: 1
🎉 SUCCESS!
```

## Step 5: Manual Testing

### Option A: Run PowerShell Test Script (Easiest)

```powershell
.\scripts\test-local.ps1
```

This runs all endpoint tests automatically with proper formatting.

---

### Option B: Manual API Calls

#### ⚠️ IMPORTANT: Windows PowerShell Command Syntax

PowerShell uses different syntax than bash. Choose ONE method:

**Method 1: Use Invoke-RestMethod (Recommended)**

```powershell
# Create Competitor
$body = @{
    name = "Zoho Corporation"
    website = "https://www.zoho.com"
    industry = "SaaS"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json
```

**Method 2: Use curl.exe (not 'curl' alias)**

If bash-style curl commands fail, use the explicit `curl.exe` command:

```powershell
# Note: 'curl' without .exe is PowerShell alias to Invoke-WebRequest
# Use 'curl.exe' for bash-style flags like -sS, -H, -d

curl.exe -X POST http://localhost:3001/api/competitors `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Zoho",
    "website": "https://www.zoho.com",
    "industry": "SaaS",
    "locations": ["Bangalore"]
  }'
```

---

### Manual Test Examples

**1. Create Competitor:**
```powershell
$body = @{
    name = "Zoho Corporation"
    website = "https://www.zoho.com"
    industry = "SaaS/Logistics"
    locations = @("Bangalore", "Chennai")
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$competitorId = $response.data._id
Write-Host "Created competitor: $competitorId"
```

**2. Get Competitors:**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" -Method Get
$response.data | ConvertTo-Json
```

**3. Discover URLs:**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/discover" `
    -Method POST -ContentType "application/json"
$response | ConvertTo-Json
```

**4. Scrape Content:**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"
$body = @{ limit = 5 } | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/scrape" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
$response | ConvertTo-Json
```

**5. Generate Signals:**
```powershell
$competitorId = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$competitorId/signals/create" `
    -Method POST -ContentType "application/json"
$response | ConvertTo-Json
```

**6. Get Threat Rankings:**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/threat/rankings?limit=10" -Method Get
$response.data | ConvertTo-Json
```

---

## What Just Happened?

✅ **Discovery:** System found 30-50 articles about Zoho from:
  - Google News RSS feed
  - Zoho's website sitemap
  - 5 logistics industry news sources

✅ **Scraping:** Extracted markdown, plaintext, HTML, and metadata using Firecrawl

✅ **Deduplication:** Detected and linked 5-10 duplicate articles via SHA256 hashing

✅ **Signals:** Generated 8 competitor signals:
  - EXPANSION (2) - "opened new office"
  - HIRING (3) - "hiring engineers"
  - SERVICE_LAUNCH (1) - "launched new product"
  - FINANCIAL (2) - "raised funding"

✅ **Threat Score:** Computed 78/100 threat level based on signal weights

✅ **Dashboard:** Shows KPIs, top threats, and geographic hotspots

## Next Steps

### Add More Competitors

```powershell
$body = @{
    name = "FreshWorks"
    website = "https://www.freshworks.com"
    industry = "SaaS"
    locations = @("Chennai", "Bangalore")
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json
```

### View Dashboard

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard/overview" -Method Get
$response.data | ConvertTo-Json
```

### View Geographic Hotspots

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/geography/hotspots?days=30" -Method Get
$response.data | ConvertTo-Json
```

## Troubleshooting

### Firecrawl connection failed
```powershell
# Check if running
docker ps | grep firecrawl

# Restart if needed
docker stop firecrawl
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl
```

### MongoDB connection failed
- Check MONGODB_URI in .env is correct
- Verify IP whitelist on MongoDB Atlas
- Test connection: `node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(err => console.log('❌', err.message))"`

### Backend won't start
```powershell
# Check logs
npm run dev
# If port 3001 in use
Get-NetTCPConnection -LocalPort 3001
```

## Architecture Overview

```
USER PROVIDES COMPETITOR (Name + Website)
        ↓
🔍 DISCOVERY LAYER
  • Google News RSS
  • Sitemap Parsing
  • Industry News Search
        ↓
📰 NEWS COLLECTION
  • 30-50 unique URLs
  • Multi-source tracking
        ↓
🕷️ SCRAPING LAYER
  • Real Firecrawl Docker
  • Content extraction
        ↓
🔄 DEDUPLICATION
  • SHA256 hashing
  • URL canonicalization
  • 24-hour cache
        ↓
📊 SIGNAL GENERATION
  • Type detection
  • Location extraction
  • Confidence scoring
        ↓
⚠️ THREAT COMPUTATION
  • Weighted scoring
  • Ranking algorithm
  • Geographic aggregation
        ↓
📈 DASHBOARD
  • KPIs
  • Alerts
  • Top threats
  • Hotspots
```

## Key Features

| Feature | Status | Details |
|---------|--------|---------|
| URL Discovery | ✅ Complete | Google News, Sitemap, Industry sources |
| Web Scraping | ✅ Complete | Real Firecrawl Docker integration |
| Deduplication | ✅ Complete | SHA256 + URL canonicalization |
| Signal Detection | ✅ Complete | 8 signal types, confidence scoring |
| Threat Scoring | ✅ Complete | Weighted algorithm, 0-100 scale |
| Dashboard | ✅ Complete | KPIs, alerts, top threats |
| Cron Jobs | ⏳ Partial | Daily computation ready |
| AI Insights | ⏳ Pending | LLM integration needed |

## Data Flow Example

```
Input: Zoho Corporation (https://www.zoho.com)
        ↓
Discovery finds 42 URLs:
  • 15 from Google News
  • 12 from sitemap
  • 15 from industry RSS
        ↓
Scraping extracts content from 5 URLs (time-limited)
        ↓
Deduplication detects 2 duplicates across sources
        ↓
Signal creation generates 8 signals:
  • Title: "Zoho opens new office in Bangalore"
  • Type: EXPANSION
  • Confidence: 95
  • Locations: ["Bangalore", "India"]
        ↓
Threat computation:
  • 2 EXPANSION = 50 points
  • 3 HIRING = 60 points
  • 2 FINANCIAL = 40 points
  • 1 SERVICE_LAUNCH = 15 points
  • Total: 165 points → 78/100 threat score
        ↓
Output: Zoho ranked #1 threat among competitors
```

## Support

- 📖 See [README.md](README.md) for full documentation
- 📋 See [CURL_COMMANDS.md](CURL_COMMANDS.md) for API details
- 🧪 Run `node test-ingestion.js` for automated testing

---

**Ready to go!** 🚀 Follow the steps above and you'll have a working competitor intelligence system in minutes.
