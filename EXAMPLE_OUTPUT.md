# Example: Crawling with Firecrawl Direct API

## Command Run
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com"
```

## Script Output

```
==================================================
  FIRECRAWL DIRECT API CRAWLER
==================================================

[1/4] Checking Firecrawl status...
OK Firecrawl is running on port 3002

[2/4] Preparing crawl request...
  URL: https://example.com

[3/4] Sending crawl request...
OK Job created: 019c08c1-06f4-701d-b38a-cad1deb6d33f

Polling for results (max 120s)...
  [0s] Scraping...
  [2.0s] Scraping...
  [4.1s] Scraping...
  [6.1s] Scraping...
  [8.2s] Scraping...
  [10.4s] Scraping...
  [12.5s] Scraping...
  [14.7s] Scraping...
OK Crawl completed (16.8s)

[4/4] Processing results...
OK Results retrieved

-------------------------------------------
METADATA
-------------------------------------------
URL:              https://example.com
Status Code:      200
Content Length:   180 characters
Word Count:       ~36
Title:            Example Domain
Description:

-------------------------------------------
SCRAPED CONTENT (Markdown)
-------------------------------------------
Example Domain
==============

This domain is for use in documentation examples without needing permission. Avoid use in operations.

[Learn more](https://iana.org/domains/example)

==================================================
OK CRAWL COMPLETE
==================================================
```

---

## What Happened

1. **[1/4] Status Check** - Verified Firecrawl Docker is running on port 3002
2. **[2/4] Request Prep** - Built JSON payload with the target URL
3. **[3/4] Job Creation** - Sent request, got back async job ID
4. **Polling Loop** - Checked status every 2 seconds until completion (16.8s total)
5. **[4/4] Results** - Parsed response and displayed content

---

## With JavaScript Support

### Command
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
```

### Output (same structure, with notes)
```
[2/4] Preparing crawl request...
  - Screenshot enabled for verification
  - Scrolling enabled for lazy-loaded content
  URL: https://example.com

Polling for results (max 120s)...
  [0s] Scraping...
  [2.0s] Scraping...
  [4.1s] Scraping...
  ...takes longer due to JS execution...
  [28.5s] Scraping...
OK Crawl completed (30.7s)

[4/4] Processing results...
OK Results retrieved

-------------------------------------------
METADATA
-------------------------------------------
URL:              https://example.com
Status Code:      200
Content Length:   8421 characters (much more due to JS rendering!)
Word Count:       ~1684
Title:            Example Domain
...
```

---

## With HTML Output

### Command
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -IncludeHtml
```

### Additional Output Section
```
-------------------------------------------
HTML (First 2000 chars)
-------------------------------------------
<!DOCTYPE html>
<html>
<head>
    <title>Example Domain</title>

    <meta charset="utf-8" />
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type="text/css">
    body {
        background-color: #f0f0f2;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
            "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
            sans-serif;

    }
    div {
        width: 600px;
        margin: 5em auto;
        padding: 2em;
        background-color: #fdfdff;
        border-radius: 0.5em;
        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);
    }
    ...
```

---

## Error Handling Example

### If Firecrawl Not Running

```
==================================================
  FIRECRAWL DIRECT API CRAWLER
==================================================

[1/4] Checking Firecrawl status...
ERROR: Firecrawl is not responding!
  Make sure Docker is running:
  docker-compose -f firecrawl-selfhost/docker-compose.yml up -d
```

**Fix:** Start Docker containers
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml up -d
```

### If Timeout Occurs

```
ERROR: Timeout waiting for crawl results
```

**Fix:** Increase timeout
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Timeout 180
```

### If No Content

```
Content Length:   0 characters
```

**Fix:** Add wait time for JavaScript
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" -Wait 5000 -Scroll
```

---

## Response Structure (Raw JSON)

If you want the raw response, the polling URL returns:

```json
{
  "success": true,
  "status": "completed",
  "data": [
    {
      "url": "https://example.com",
      "statusCode": 200,
      "markdown": "Example Domain\n==============\n\nThis domain is...",
      "html": "<!DOCTYPE html>\n<html>\n...",
      "metadata": {
        "title": "Example Domain",
        "description": ""
      }
    }
  ]
}
```

The script parses this and displays it nicely!

---

## Performance Notes

### Timing Breakdown

| Stage | Duration | Notes |
|-------|----------|-------|
| Firecrawl check | <1s | Instant |
| Request build | <1s | JSON serialization |
| Job creation | 1-2s | API response |
| Polling overhead | 30s+ | Depends on JavaScript execution |
| **Total** | **30-60s** | Static pages faster, JS sites slower |

### Example Times by Site Type

- **Static HTML** (example.com) → 15-20 seconds
- **Simple JS** (GitHub) → 20-30 seconds  
- **Heavy JS** (news site) → 30-60 seconds
- **Very Heavy JS** (React SPA) → 60-120 seconds

---

## Saving Results

### To File
```powershell
.\firecrawl-crawl.ps1 -Url "https://example.com" | Out-File result.txt
```

### To JSON
```powershell
$result = .\firecrawl-crawl.ps1 -Url "https://example.com"
$result | ConvertTo-Json | Out-File result.json
```

### Just the Content
```powershell
$output = .\firecrawl-crawl.ps1 -Url "https://example.com" -IncludeHtml
$output | Select-String "SCRAPED CONTENT" -A 100 | Out-File content.txt
```

---

## Success Indicators

✅ You're good if you see:
- "OK Firecrawl is running on port 3002"
- "OK Job created: [UUID]"
- "OK Crawl completed ([time]s)"
- "OK Results retrieved"
- "OK CRAWL COMPLETE"

❌ You need to fix if you see:
- "ERROR: Firecrawl is not responding!" → Start Docker
- "ERROR: Request failed!" → Check Docker logs
- "ERROR: Timeout waiting for results" → Increase timeout
- "Content Length: 0 characters" → Add -Wait parameter

---

That's it! You now have a fully functional direct Firecrawl scraper! 🚀
