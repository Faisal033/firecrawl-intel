# Quick Start - Job Crawler

## Prerequisites
```powershell
# 1. Start Firecrawl Docker
cd firecrawl-selfhost
docker-compose up -d

# 2. Verify running
docker-compose ps
# Should show: firecrawl-api-1, nuq-postgres, playwright-service, rabbitmq, redis (all UP)
```

## Run Crawler

### Console Output Only
```powershell
.\job-crawler.ps1
```

### Save to JSON
```powershell
.\job-crawler.ps1 -ExportJSON
```

### Save to CSV
```powershell
.\job-crawler.ps1 -ExportCSV
```

### Save Both
```powershell
.\job-crawler.ps1 -ExportJSON -ExportCSV
```

## Output Files
- JSON: `jobs_YYYYMMDD_HHMMSS.json`
- CSV: `jobs_YYYYMMDD_HHMMSS.csv`

## What It Does
1. ✅ Checks Firecrawl is running
2. ✅ Crawls Naukri (India telecalling jobs)
3. ✅ Crawls Apna (India telecalling jobs)
4. ✅ Crawls Indeed (India telecalling jobs)
5. ✅ Extracts: company, title, location, phone, email
6. ✅ Displays results in console
7. ✅ Exports to JSON/CSV (if requested)

## Expected Output
```
===================================================
  FIRECRAWL DIRECT JOB CRAWLER (Backend-less)
  Target: Telecalling Jobs in India
  Websites: Naukri, Apna, Indeed
===================================================

[TIME] [SUCCESS] Firecrawl is running
[TIME] [INFO] Initiating crawl: https://www.naukri.com/...
[TIME] [INFO] Job initiated: JOB-ID
[TIME] [SUCCESS] Crawl completed: X pages retrieved
[TIME] [INFO] Processing X pages from Naukri

===================================================
  EXTRACTED JOB DATA - TELECALLING POSITIONS
===================================================

[Job 1]
  Source........: Naukri
  Company.......: CompanyName
  Title.........: Job Title
  Location......: City, State
  Phone.........: 9876543210
  Email.........: email@company.com
  Description...: Job details...

Total Jobs Found: X
===================================================
```

## Parameters

```powershell
# Longer timeout (for slow networks)
.\job-crawler.ps1 -TimeoutSeconds 300

# Custom Firecrawl URL
.\job-crawler.ps1 -FirecrawlURL "http://192.168.1.100:3002"

# Combine
.\job-crawler.ps1 -TimeoutSeconds 300 -ExportJSON -ExportCSV
```

## Troubleshooting

### Firecrawl Not Running
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml ps
```
If containers are down:
```powershell
docker-compose -f firecrawl-selfhost/docker-compose.yml up -d
```

### Script Not Executing
```powershell
# Check if execution is allowed
Get-ExecutionPolicy

# If "Restricted", allow for this session only
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Slow Crawls
- Each website takes 8-12 seconds
- Total time: ~30-40 seconds
- Increase `-TimeoutSeconds` if needed

### No Results Found
- Website structure may vary
- Keyword matching depends on page format
- Manual inspection of crawled content recommended

## Architecture

```
User runs script
     ↓
Health Check (GET http://localhost:3002/)
     ↓
Loop through 3 websites:
  1. Submit crawl (POST /v1/crawl)
  2. Poll for completion (GET /api/result/{id})
  3. Extract data using regex
  4. Add to results
     ↓
Display results in console
     ↓
Export to JSON/CSV (if requested)
```

## Files Created

- `job-crawler.ps1` - Main script
- `jobs_YYYYMMDD_HHMMSS.json` - Exported results (if -ExportJSON)
- `jobs_YYYYMMDD_HHMMSS.csv` - Exported results (if -ExportCSV)

## Key Differences from Backend Approach

| Feature | This Script |
|---------|------------|
| No Express/Node backend | ✅ |
| Direct Firecrawl API | ✅ |
| Single PowerShell file | ✅ |
| Zero server overhead | ✅ |
| Real-time feedback | ✅ |
| Strict 3-site limit | ✅ |
| Graceful null handling | ✅ |
| JSON/CSV export | ✅ |

## Extracted Data Structure

Each job includes:
- `Source` - Portal name (Naukri/Apna/Indeed)
- `CompanyName` - Hiring company (or null)
- `JobTitle` - Position title (or null)
- `Location` - Job location (or null)
- `Description` - First 500 chars of content
- `Phone` - Phone number if found (or null)
- `Email` - Email if found (or null)
- `ExtractedAt` - Timestamp (YYYY-MM-DD HH:MM:SS)

## One-Liner Reference

```powershell
# Run and export both formats
.\job-crawler.ps1 -ExportJSON -ExportCSV
```

Done! Results in JSON and CSV files.
