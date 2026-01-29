# Firecrawl Direct API Setup - Complete Guide

## Your New Setup

You now have a **clean, direct Firecrawl-only setup** running on `localhost:3002`:

```
FIRECRAWL DOCKER (Port 3002)
    ├─ API: http://localhost:3002/v1/crawl
    ├─ Type: Asynchronous job-based API
    └─ No backend required
```

**What you removed:**
- ❌ Node.js Express backend (was on port 3005)
- ❌ Custom /api routes
- ❌ Backend complexity

**What you kept:**
- ✅ Docker Firecrawl (all 5 containers running)
- ✅ Direct async API access
- ✅ Full content scraping capabilities

---

## How to Use

### 1. Start Firecrawl
```powershell
cd firecrawl-selfhost
docker-compose up -d
```

### 2. Crawl a Website
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com"
```

### 3. For JavaScript-Heavy Pages
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
```

### 4. Save Output to File
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" | Out-File crawl-result.txt
```

---

## Examples

### Simple Static Page
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com"
```

### News Site (dynamic JS)
```powershell
.\firecrawl-crawl.ps1 -Url "https://news.example.com" -Wait 5000 -Scroll
```

### Product Page (lazy loading)
```powershell
.\firecrawl-crawl.ps1 -Url "https://shop.example.com/product/123" -Scroll
```

### With HTML Output
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -IncludeHtml
```

### Custom Timeout
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Timeout 180
```

---

## Script Parameters

| Flag | Default | Purpose |
|------|---------|---------|
| `-Url` | Required | Website to crawl |
| `-Wait` | 0 | Wait time in ms (0 = no wait, 3000-5000 for JS sites) |
| `-Scroll` | false | Enable scrolling for lazy content |
| `-IncludeHtml` | false | Return raw HTML (in addition to markdown) |
| `-Timeout` | 120 | Max wait time in seconds |

---

## What the Script Does

```
[1] Check if Firecrawl is running ✓
[2] Build crawl request ✓
[3] Send request and get job ID ✓
[4] Poll for results every 2 seconds ✓
[5] Display results (markdown + metadata) ✓
```

### Output Includes:
- ✅ Cleaned markdown content
- ✅ Page title and description
- ✅ Content length and word count
- ✅ HTTP status codes
- ✅ Optional HTML source

---

## Direct API Usage (Manual)

If you want to call the API directly in PowerShell:

### Create Job
```powershell
$body = @{ url = "https://example.com" } | ConvertTo-Json
$response = Invoke-WebRequest -Uri "http://localhost:3002/v1/crawl" `
  -Method POST -ContentType "application/json" -Body $body
$job = $response.Content | ConvertFrom-Json
Write-Host "Job ID: $($job.id)"
Write-Host "Status URL: $($job.url)"
```

### Poll for Results
```powershell
$statusUrl = "http://localhost:3002/v1/crawl/019c08c0-892d-77ba-9c02-f1b60a04bba5"
$result = Invoke-WebRequest -Uri $statusUrl -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json
$result | ConvertTo-Json -Depth 5
```

---

## Response Structure

```json
{
  "success": true,
  "status": "completed",
  "data": [
    {
      "url": "https://example.com",
      "statusCode": 200,
      "markdown": "# Page Title\n\nContent...",
      "html": "<html>...</html>",
      "metadata": {
        "title": "Example Domain",
        "description": "..."
      }
    }
  ]
}
```

---

## Status Codes

- `scraping` - Still processing the page
- `completed` - Ready to retrieve results
- `failed` - Crawl failed with error

---

## Troubleshooting

### "Firecrawl is not responding"
```powershell
# Check Docker status
docker-compose -f firecrawl-selfhost/docker-compose.yml ps

# Start if needed
docker-compose -f firecrawl-selfhost/docker-compose.yml up -d
```

### "Timeout waiting for results"
Increase the `-Timeout` parameter:
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Timeout 180
```

### "No content retrieved"
Add wait time for JavaScript execution:
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
```

### "Connection refused on port 3002"
Ensure Docker containers are running:
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml logs api
```

---

## Performance Tips

**For best results:**

1. **Static pages** → No wait needed
   ```powershell
   .\firecrawl-crawl.ps1 -Url "https://example.com"
   ```

2. **Light JS** → Small wait (1-2 seconds)
   ```powershell
   .\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 2000
   ```

3. **Heavy JS** → Longer wait (5-8 seconds) + scroll
   ```powershell
   .\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
   ```

4. **Infinite scroll** → Max wait + scroll + timeout
   ```powershell
   .\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 8000 -Scroll -Timeout 180
   ```

---

## Files in Your Project

```
firecrawl-crawl.ps1           # Main crawler script
FIRECRAWL_DIRECT_API.md       # This guide
firecrawl-selfhost/           # Docker setup
  docker-compose.yml          # 5 containers
```

---

## Summary

✅ **Simple**: Just Firecrawl Docker API on port 3002
✅ **Fast**: Async job polling (2s per check)
✅ **Flexible**: Parameters for any site type
✅ **Clean**: Markdown output + metadata
✅ **Robust**: Error handling + status checking

Ready to crawl! 🚀
