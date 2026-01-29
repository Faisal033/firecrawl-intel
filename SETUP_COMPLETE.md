# Firecrawl Direct API - Complete Setup Summary

## ✅ SETUP COMPLETE

Your system is now configured to use **Firecrawl Docker API directly** on `localhost:3002` without any backend.

---

## What You Have

### Docker Containers (Running)
```
✅ firecrawl-api              Port 3002 (Main API)
✅ firecrawl-nuq-postgres     Port 5432 (Database)
✅ firecrawl-playwright-service           (JS Engine)
✅ firecrawl-rabbitmq         Ports 5672, 15672 (Queue)
✅ firecrawl-redis            Port 6379 (Cache)
```

### PowerShell Scripts
```
✅ firecrawl-crawl.ps1        Main crawler script (use this!)
✅ test-api.ps1               Testing suite
```

### Documentation Files
```
✅ FIRECRAWL_SETUP.md         Complete reference guide
✅ QUICK_REFERENCE.md         Quick command cheat sheet
✅ EXAMPLE_OUTPUT.md          Real output examples
✅ This file                   Setup summary
```

---

## How to Use (3 Steps)

### Step 1: Start Docker
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml up -d
```

### Step 2: Run the Crawler
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com"
```

### Step 3: Get Results
You'll receive:
- Clean markdown content
- Page metadata (title, description)
- Content statistics (word count, length)
- HTTP status codes
- Optional HTML source

---

## Command Examples

### Basic Crawl
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com"
```

### With JavaScript Support
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
```

### Save to File
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" | Out-File result.txt
```

### Get HTML Too
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -IncludeHtml
```

---

## Parameter Quick Reference

```powershell
-Url "https://..."     # Website to crawl (REQUIRED)
-Wait 5000             # Wait for JS in milliseconds (0-8000)
-Scroll                # Enable scrolling for lazy content
-IncludeHtml           # Also return raw HTML
-Timeout 180           # Max wait in seconds (default 120)
```

---

## Architecture

```
┌─────────────────────────┐
│   Your Computer         │
│  (Windows PowerShell)    │
└────────────┬────────────┘
             │
             │ .\firecrawl-crawl.ps1
             │
┌────────────▼────────────┐
│  Firecrawl Docker API   │
│  localhost:3002         │
│                         │
│  - API Container        │
│  - Playwright (JS)      │
│  - PostgreSQL (Cache)   │
│  - RabbitMQ (Queue)     │
│  - Redis (Store)        │
└────────────┬────────────┘
             │
             │ Async Crawl Job
             │
┌────────────▼────────────┐
│  Target Website         │
│  (any URL)              │
└────────────┬────────────┘
             │
             │ HTML Response
             │
┌────────────▼────────────┐
│  Parsed Results         │
│  - Markdown             │
│  - Metadata             │
│  - Statistics           │
└─────────────────────────┘
```

---

## File Structure

```
competitor-intelligence/
├── firecrawl-crawl.ps1          ← Use this script
├── test-api.ps1                 ← For testing
├── FIRECRAWL_SETUP.md           ← Full guide
├── QUICK_REFERENCE.md           ← Cheat sheet
├── EXAMPLE_OUTPUT.md            ← Real examples
├── firecrawl-selfhost/
│   ├── docker-compose.yml       ← 5 containers
│   └── db-init/
└── [other files]
```

---

## Key Differences from Backend Approach

| Aspect | Before (Backend) | Now (Direct) |
|--------|------------------|--------------|
| **Architecture** | Express backend + Docker | Docker only |
| **Port** | 3005 + 3002 | 3002 only |
| **Complexity** | More (2 systems) | Simpler (1 system) |
| **API Style** | Custom routes | Firecrawl native |
| **Startup** | npm start + Docker | Docker compose only |
| **Reliability** | Potential backend issues | Firecrawl direct, stable |
| **Flexibility** | Limited by backend | Full Firecrawl API |

---

## Performance Characteristics

### Timing by Page Type

| Page Type | Typical Time | Parameters |
|-----------|--------------|-----------|
| Static HTML | 15-20s | Default |
| Simple JS | 20-30s | Default |
| Heavy JS | 30-60s | `-Wait 5000 -Scroll` |
| Very Heavy JS | 60-120s | `-Wait 8000 -Scroll -Timeout 180` |

### Polling Behavior

- Checks status every 2 seconds
- JS pages take 10-30s to render
- Timeout prevents infinite waiting
- Graceful error handling

---

## What Gets Returned

### Metadata
```
- URL (of the page)
- Status Code (200, 404, etc.)
- Title (page title)
- Description (meta description)
```

### Content
```
- Markdown (clean, readable format)
- HTML (optional, raw source)
- Word count
- Character count
```

### Statistics
```
- Content length
- Estimated word count
- Page load time
- Job completion time
```

---

## Error Handling

The script checks for and handles:
- ✅ Firecrawl not running → Clear error with fix
- ✅ Connection failures → Retry guidance
- ✅ Timeouts → Increase timeout suggestion
- ✅ Parse errors → Detailed error messages
- ✅ No content → Wait time suggestion

---

## Docker Commands Reference

### Start Firecrawl
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml up -d
```

### Check Status
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml ps
```

### View Logs
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml logs api
```

### Stop Firecrawl
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml down
```

### Clean Up Everything
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml down -v
```

---

## API Details (Advanced)

### Endpoint
```
POST http://localhost:3002/v1/crawl
```

### Request Format
```json
{
  "url": "https://example.com"
}
```

### Response (Async)
```json
{
  "success": true,
  "id": "019c08c1-06f4-701d-b38a-cad1deb6d33f",
  "url": "http://localhost:3002/v1/crawl/019c08c1-06f4-701d-b38a-cad1deb6d33f"
}
```

### Polling the Status URL
```
GET http://localhost:3002/v1/crawl/[JOB-ID]
```

### Final Response
```json
{
  "success": true,
  "status": "completed",
  "data": [
    {
      "url": "https://example.com",
      "statusCode": 200,
      "markdown": "...",
      "html": "...",
      "metadata": {...}
    }
  ]
}
```

The script handles all of this automatically!

---

## Real-World Usage Examples

### Business Intelligence
```powershell
# Crawl competitor website daily
.\firecrawl-crawl.ps1 -Url "https://competitor.com" -Wait 5000 | Out-File "competitor-$(Get-Date -f 'yyyyMMdd').txt"
```

### Content Analysis
```powershell
# Get all content from documentation site
.\firecrawl-crawl.ps1 -Url "https://docs.example.com" -IncludeHtml -Wait 3000
```

### Batch Crawling
```powershell
$sites = @(
    "https://site1.com",
    "https://site2.com",
    "https://site3.com"
)

foreach ($site in $sites) {
    .\firecrawl-crawl.ps1 -Url $site -Wait 3000 | Out-File "$($site -replace '[^a-z0-9]','_').txt"
}
```

### Smart Scraping
```powershell
# Try without wait first, if fails add wait
try {
    .\firecrawl-crawl.ps1 -Url $url -ErrorAction Stop
} catch {
    .\firecrawl-crawl.ps1 -Url $url -Wait 5000
}
```

---

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| "Connection refused on port 3002" | `docker-compose -f firecrawl-selfhost/docker-compose.yml up -d` |
| "Timeout waiting for results" | Increase `-Timeout` to 180+ |
| "No content retrieved" | Add `-Wait 5000` |
| "Docker error" | Check: `docker-compose ps` |
| "Slow crawling" | JS execution naturally takes time (normal) |
| "Variable not set warnings" | Harmless Docker warnings, safe to ignore |

---

## Next Steps

1. **Verify Everything Works**
   ```powershell
   .\firecrawl-crawl.ps1 -Url "https://example.com"
   ```

2. **Test Your Specific Sites**
   ```powershell
   .\firecrawl-crawl.ps1 -Url "https://your-target.com" -Wait 5000 -Scroll
   ```

3. **Check Documentation**
   - Read: FIRECRAWL_SETUP.md (full reference)
   - Read: QUICK_REFERENCE.md (quick commands)
   - Read: EXAMPLE_OUTPUT.md (real examples)

4. **Automate Your Crawling**
   - Create PowerShell scheduled tasks
   - Batch process multiple URLs
   - Save results to files/database

---

## Success Checklist

- ✅ Docker containers running (`docker-compose ps` shows 5 containers)
- ✅ firecrawl-crawl.ps1 script available
- ✅ Can run: `.\firecrawl-crawl.ps1 -Url "https://example.com"`
- ✅ Gets results with markdown content
- ✅ Understanding of -Wait and -Scroll parameters
- ✅ Able to save results to file

---

## Support Resources

- **Quick Commands** → QUICK_REFERENCE.md
- **Full Guide** → FIRECRAWL_SETUP.md  
- **Real Examples** → EXAMPLE_OUTPUT.md
- **Docker Help** → `docker-compose help`
- **Firecrawl Docs** → https://firecrawl.dev

---

## Summary

You now have a **production-ready web scraping setup** using Firecrawl's Docker API directly:

✅ **Simple** - One command: `.\firecrawl-crawl.ps1 -Url "..."`
✅ **Powerful** - Handles JavaScript, lazy loading, dynamic content
✅ **Flexible** - Works with any website type
✅ **Reliable** - Built-in error handling and status checking
✅ **Fast** - Async polling, 2-second checks
✅ **Clean** - Markdown output + metadata

**Ready to crawl! 🚀**
