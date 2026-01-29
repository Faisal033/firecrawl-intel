# Firecrawl Direct API - Quick Reference Card

## Installation Complete ✅

Your setup is now ready to use. Run Firecrawl directly on localhost:3002 without backend.

---

## Quick Start (30 seconds)

```powershell
# 1. Make sure Docker is running
docker-compose -f firecrawl-selfhost/docker-compose.yml up -d

# 2. Crawl any website
.\firecrawl-crawl.ps1 -Url "https://example.com"

# Done! You'll get clean markdown content
```

---

## Common Commands

### Crawl a Website
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com"
```

### Crawl with JavaScript Support
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
```

### Save to File
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" | Out-File results.txt
```

### Get HTML Too
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -IncludeHtml
```

### Longer Timeout (for slow pages)
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Timeout 180
```

---

## Parameter Cheat Sheet

```powershell
-Url "https://..."        # Website to crawl (REQUIRED)
-Wait 5000                # Wait 5 seconds for JS (0-8000 recommended)
-Scroll                   # Enable scrolling for lazy-loaded content
-IncludeHtml              # Also return HTML source
-Timeout 180              # Max wait in seconds (default 120)
```

---

## Real Examples

### GitHub (moderate JS)
```powershell
.\firecrawl-crawl.ps1 -Url "https://github.com/username/repo" -Wait 3000
```

### News Site (heavy JS + images)
```powershell
.\firecrawl-crawl.ps1 -Url "https://news.ycombinator.com" -Wait 5000 -Scroll
```

### E-commerce (lazy loading)
```powershell
.\firecrawl-crawl.ps1 -Url "https://amazon.com" -Scroll -Wait 3000
```

### Documentation (code blocks)
```powershell
.\firecrawl-crawl.ps1 -Url "https://docs.python.org" -IncludeHtml
```

### Infinite Scroll (Twitter-like)
```powershell
.\firecrawl-crawl.ps1 -Url "https://twitter.com" -Wait 8000 -Scroll -Timeout 180
```

---

## What You Get

Each crawl returns:
- ✅ **Markdown** - Clean, readable text
- ✅ **Metadata** - Title, description
- ✅ **Statistics** - Word count, content size
- ✅ **Status Code** - HTTP response
- ✅ **HTML** (optional) - Raw source code

---

## Architecture

```
Your Computer
    ↓
PowerShell Script (firecrawl-crawl.ps1)
    ↓
Firecrawl Docker API (localhost:3002)
    ↓
Target Website
    ↓
Results (JSON)
    ↓
Cleaned Markdown + Metadata
```

**No backend. No complexity. Just Firecrawl.**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | `docker-compose -f firecrawl-selfhost/docker-compose.yml up -d` |
| "Timeout" | Add `-Timeout 180` |
| "No content" | Add `-Wait 3000` for JS sites |
| "Too slow" | JS sites naturally take 10-30 seconds |
| "Docker error" | Check: `docker-compose -f firecrawl-selfhost/docker-compose.yml ps` |

---

## Docker Commands

```powershell
# Start Firecrawl
docker-compose -f firecrawl-selfhost/docker-compose.yml up -d

# Check status
docker-compose -f firecrawl-selfhost/docker-compose.yml ps

# View logs
docker-compose -f firecrawl-selfhost/docker-compose.yml logs api

# Stop
docker-compose -f firecrawl-selfhost/docker-compose.yml down
```

---

## API Endpoint

Direct API calls (advanced):
```
POST http://localhost:3002/v1/crawl
Content-Type: application/json

{
  "url": "https://example.com"
}

Response:
{
  "success": true,
  "id": "job-uuid",
  "url": "http://localhost:3002/v1/crawl/job-uuid"
}

Then poll the URL to get results...
```

The script handles all of this automatically!

---

## Files

```
firecrawl-crawl.ps1          Main crawler script
FIRECRAWL_SETUP.md           Full documentation  
FIRECRAWL_DIRECT_API.md      Detailed guide
firecrawl-selfhost/          Docker containers
```

---

## Tips

✨ **Pro Tips:**
- Static pages don't need wait time
- Add `-Scroll` for sites with lazy loading
- Use `-IncludeHtml` to debug content extraction
- Increase `-Timeout` for complex JavaScript
- JS execution takes 10-30 seconds normally

---

## You're All Set! 🚀

```powershell
# One command to crawl anything:
.\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
```

Get clean, structured content from any website directly using Firecrawl's Docker API.
