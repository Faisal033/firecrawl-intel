# Firecrawl Direct API - Quick Start Guide

**Setup:** Use Firecrawl Docker on `localhost:3002` directly (no backend required)

---

## Prerequisites

Make sure Docker containers are running:
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml up -d
```

Check status:
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml ps
```

All 5 containers should show `Up`:
- `firecrawl-api-1` (port 3002)
- `nuq-postgres`
- `playwright-service`
- `rabbitmq`
- `redis`

---

## Basic Usage

### 1. Simple Crawl
```powershell
.\crawl.ps1 -Url "https://example.com"
```

### 2. JavaScript-Heavy Page (with wait & scroll)
```powershell
.\crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
```

### 3. Include HTML Output
```powershell
.\crawl.ps1 -Url "https://example.com" -IncludeHtml
```

### 4. Custom Timeout
```powershell
.\crawl.ps1 -Url "https://example.com" -Timeout 180
```

---

## Parameter Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-Url` | (required) | Website to crawl |
| `-Wait` | 0 | Wait time in milliseconds for page load (use 3000-5000 for JS sites) |
| `-Scroll` | false | Enable scrolling for lazy-loaded content |
| `-IncludeHtml` | false | Return HTML in addition to markdown |
| `-Timeout` | 120 | Request timeout in seconds |

---

## Real-World Examples

### News Website (lots of JS)
```powershell
.\crawl.ps1 -Url "https://news.example.com" -Wait 5000 -Scroll
```

### E-commerce Product Page (dynamic content)
```powershell
.\crawl.ps1 -Url "https://shop.example.com/product/123" -Wait 3000 -Scroll
```

### Blog Post (simple page)
```powershell
.\crawl.ps1 -Url "https://blog.example.com/article" -Wait 1000
```

### Developer Documentation (code snippets)
```powershell
.\crawl.ps1 -Url "https://docs.example.com/api" -IncludeHtml
```

### SPA Application (single-page app)
```powershell
.\crawl.ps1 -Url "https://app.example.com" -Wait 8000 -Scroll -Timeout 180
```

---

## Direct API Call (Manual)

If you want to call Firecrawl directly without the script:

### Simple Request
```powershell
$body = @{ url = "https://example.com" } | ConvertTo-Json
$response = Invoke-WebRequest -Uri "http://localhost:3002/v1/crawl" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -TimeoutSec 120
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### With Wait & Scroll
```powershell
$body = @{
    url = "https://example.com"
    waitFor = "//*"
    scroll = $true
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3002/v1/crawl" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -TimeoutSec 120 | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

---

## Troubleshooting

### "Firecrawl is not responding!"
**Solution:** Start Docker containers
```powershell
cd firecrawl-selfhost
docker-compose up -d
```

### "Request failed - timeout"
**Solution:** Increase timeout for heavy pages
```powershell
.\crawl.ps1 -Url "https://example.com" -Timeout 180
```

### "No content retrieved"
**Solution:** Try adding wait time for JS-heavy pages
```powershell
.\crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
```

### "Connection refused on port 3002"
**Solution:** Check Docker is running and Firecrawl is up
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml logs api
```

---

## Response Structure

The API returns JSON with:
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "statusCode": 200,
    "markdown": "# Page Title\n\nContent here...",
    "html": "<html>...</html>",
    "metadata": {
      "title": "Page Title",
      "description": "Page description"
    }
  }
}
```

**Keys:**
- `success`: Boolean indicating if crawl succeeded
- `data.markdown`: Clean markdown version of content
- `data.html`: Raw HTML (if requested)
- `data.metadata`: Title, description, etc.
- `data.statusCode`: HTTP status of target page

---

## Performance Tips

1. **For static pages** - No wait needed
   ```powershell
   .\crawl.ps1 -Url "https://example.com"
   ```

2. **For light JavaScript** - Small wait
   ```powershell
   .\crawl.ps1 -Url "https://example.com" -Wait 2000
   ```

3. **For heavy JavaScript** - Longer wait + scroll
   ```powershell
   .\crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
   ```

4. **For infinite scroll sites** - Maximum wait + scroll
   ```powershell
   .\crawl.ps1 -Url "https://example.com" -Wait 8000 -Scroll -Timeout 180
   ```

---

## What You Get

The script returns:
- ✅ Clean markdown content
- ✅ Metadata (title, description)
- ✅ Content length and word count
- ✅ HTTP status codes
- ✅ Optional HTML output
- ✅ Clear error messages

---

## Clean Setup

You now have:
- ✅ **Only Firecrawl Docker on port 3002** - No backend needed
- ✅ **Direct API calls** - Simpler architecture
- ✅ **Powerful PowerShell wrapper** - Easy to use
- ✅ **Full error handling** - Clear feedback
- ✅ **Flexible options** - Works with any site type
