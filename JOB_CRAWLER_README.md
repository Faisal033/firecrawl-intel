# Job Crawler - Firecrawl Direct (Backend-less)

A PowerShell script that crawls Indian job websites using Firecrawl directly (no custom backend server required).

## Features

- **Direct Firecrawl Integration**: Uses Firecrawl Docker on `localhost:3002` without any custom Express/Node backend
- **Health Check**: Verifies Firecrawl is running before starting crawls
- **Three Job Portals**: Crawls Naukri, Apna, and Indeed exclusively
- **Telecalling Focus**: Filters results for telecalling, voice process, and customer support roles
- **India-Only**: Restricts search to India locations
- **Data Extraction**: Extracts company, title, location, description, phone, and email
- **Graceful Handling**: Returns `null` for missing phone/email instead of errors
- **Export Options**: Save results as JSON or CSV
- **Real-time Feedback**: Console output shows progress and discovered jobs

## Requirements

1. **Docker & Docker Compose** (running Firecrawl containers)
2. **PowerShell 5.0+** (Windows)
3. **Firecrawl running on localhost:3002**

## Starting Firecrawl

```powershell
cd firecrawl-selfhost
docker-compose up -d
```

Verify it's running:
```powershell
docker-compose ps
```

## Usage

### Basic Execution (Console Output Only)
```powershell
.\job-crawler.ps1
```

### Export as JSON
```powershell
.\job-crawler.ps1 -ExportJSON
```

### Export as CSV
```powershell
.\job-crawler.ps1 -ExportCSV
```

### Export Both Formats
```powershell
.\job-crawler.ps1 -ExportJSON -ExportCSV
```

### Custom Firecrawl URL
```powershell
.\job-crawler.ps1 -FirecrawlURL "http://custom-host:3002"
```

### Adjust Timeout (in seconds)
```powershell
.\job-crawler.ps1 -TimeoutSeconds 300
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `FirecrawlURL` | string | `http://localhost:3002` | Firecrawl service URL |
| `TimeoutSeconds` | int | `180` | Job polling timeout (seconds) |
| `PollIntervalSeconds` | int | `2` | Interval between status checks |
| `ExportJSON` | switch | `$false` | Export results to JSON file |
| `ExportCSV` | switch | `$false` | Export results to CSV file |
| `VerboseOutput` | switch | `$false` | Show detailed debug messages |

## Script Flow

```
1. HEALTH CHECK
   - Verify Firecrawl is responding
   - Exit if not running

2. CRAWL WEBSITES (sequential)
   - Submit crawl job to Firecrawl
   - Poll for completion (2-sec intervals)
   - Retrieve markdown content

3. PROCESS RESULTS
   - Filter for telecalling keywords
   - Extract structured data (regex)
   - Add to results array

4. DISPLAY & EXPORT
   - Show results in console
   - Save JSON/CSV if requested
```

## Target Websites

| Site | URL | Search Path |
|------|-----|-------------|
| **Naukri** | naukri.com | `/jobs-bangalore-telecaller-jobs` |
| **Apna** | apnaapp.com | `/jobs?q=telecaller` |
| **Indeed** | indeed.com | `/jobs?q=telecaller&l=India` |

## Search Keywords (Filtered)

- `telecaller`
- `telecalling`
- `voice process`
- `call executive`
- `customer support voice`
- `BPOS`
- `inbound call`

## Output Format

### Console Display
```
===========================================================
  FIRECRAWL DIRECT JOB CRAWLER (Backend-less)
  Target: Telecalling Jobs in India
  Websites: Naukri, Apna, Indeed
===========================================================

[15:33:20] [INFO] Checking Firecrawl health...
[15:33:20] [SUCCESS] Firecrawl is running

-----------------------------------------------------------
  Crawling: Naukri
-----------------------------------------------------------

[15:33:20] [INFO] Initiating crawl: https://www.naukri.com/jobs-bangalore-telecaller-jobs
[15:33:20] [INFO] Job initiated: 019c0935-a5a0-72f9-ac37-595c63b00ef1
[15:34:09] [SUCCESS] Crawl completed: 1 pages retrieved
[15:34:09] [INFO] Processing 1 pages from Naukri

==========================================================
  EXTRACTED JOB DATA - TELECALLING POSITIONS
==========================================================

[Job 1]
  Source........: Naukri
  Company.......: ABC Corp
  Title.........: Telecaller
  Location......: Bangalore, India
  Phone.........: 9876543210
  Email.........: jobs@abccorp.com
  Description...: We are hiring telecallers for our outbound campaign...

===========================================================
  Total Jobs Found: 1
===========================================================
```

### JSON Export Format
File: `jobs_20260129_153420.json`
```json
[
  {
    "Source": "Naukri",
    "CompanyName": "ABC Corp",
    "JobTitle": "Telecaller",
    "Location": "Bangalore, India",
    "Description": "We are hiring telecallers...",
    "Phone": "9876543210",
    "Email": "jobs@abccorp.com",
    "ExtractedAt": "2026-01-29 15:34:20"
  }
]
```

### CSV Export Format
File: `jobs_20260129_153420.csv`
```csv
Source,CompanyName,JobTitle,Location,Phone,Email,ExtractedAt
Naukri,ABC Corp,Telecaller,Bangalore India,9876543210,jobs@abccorp.com,2026-01-29 15:34:20
```

## Key Functions

### `Test-FirecrawlHealth`
Checks if Firecrawl is running by making a request to the root endpoint.

### `Invoke-FirecrawlCrawl`
- Submits crawl job to Firecrawl
- Polls for job completion
- Returns markdown content from pages

### `Extract-JobData`
Uses regex patterns to extract from markdown:
- Phone: `\d{10}` or `+91 \d{10}`
- Email: Standard email pattern
- Company/Title/Location: Case-insensitive patterns

### `Process-CrawlResults`
- Filters pages for telecalling keywords
- Extracts structured data
- Validates entries

### `Display-Results`
Formats and prints results to console with colors

### `Export-Results`
Saves results to JSON and/or CSV files

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| Firecrawl not running | Docker containers down | Script exits with instructions |
| Crawl failed | Website blocked/timeout | Logs error, continues to next site |
| Missing phone/email | Not on page | Sets field to `null` |
| No jobs found | No matches for keywords | Displays "No results" message |

## Troubleshooting

### Firecrawl Health Check Fails
```powershell
# Check if containers are running
docker-compose -f firecrawl-selfhost/docker-compose.yml ps

# Restart if needed
docker-compose -f firecrawl-selfhost/docker-compose.yml restart
```

### Slow Crawls
- Increase `TimeoutSeconds` parameter
- Some sites may take 30-120 seconds depending on page complexity

### No Results Found
- Website structure may have changed
- Improve regex patterns in `Extract-JobData` function
- Check that search URLs are valid

### Export File Issues
- Ensure write permissions in current directory
- Check disk space
- Verify no file lock conflicts

## API Endpoints Used

### Health Check
```
GET http://localhost:3002/
```

### Crawl Initiation
```
POST http://localhost:3002/v1/crawl
Body: { "url": "https://example.com" }
```

### Status Polling
```
GET http://localhost:3002/api/result/{job-id}
```

## Performance

- **Naukri crawl**: ~10-12 seconds
- **Apna crawl**: ~8-10 seconds
- **Indeed crawl**: ~8-10 seconds
- **Total runtime**: ~30-40 seconds (without export delays)

## Customization

### Add New Job Portal
Edit the `$Config.Websites` array:
```powershell
@{
    Name = 'Portal Name'
    BaseURL = 'https://portalurl.com'
    SearchPath = '/search?q=telecaller'
    Identifier = 'portalid'
}
```

### Change Search Keywords
Edit `$Config.SearchTerms`:
```powershell
SearchTerms = @(
    'your keyword 1',
    'your keyword 2'
)
```

### Improve Data Extraction
Modify regex patterns in `Extract-JobData` function.

## Advantages Over Backend Approach

| Aspect | Firecrawl Direct | Backend Server |
|--------|-----------------|-----------------|
| **Deployment** | Single script | Node.js + Express setup |
| **Dependencies** | PowerShell, Docker | Node.js, NPM packages |
| **Overhead** | Minimal | Express wrapper layer |
| **Reliability** | Direct API calls | HTTP timeout complexity |
| **Performance** | Direct communication | Extra hop |
| **Debugging** | Inspect Firecrawl directly | Debug Express routes |

## Notes

- **No custom backend required** - uses Firecrawl API directly
- **Strictly three sites** - only Naukri, Apna, Indeed are crawled
- **Graceful null handling** - missing fields don't cause errors
- **Real-time feedback** - see progress as jobs are found
- **Portable results** - export to standard formats (JSON/CSV)

## License

Internal use only. Respect website terms of service when crawling.
