# Telecalling Job Leads Scraper - Quick Start Guide

## Overview

This tool crawls multiple Indian job websites for telecalling positions using **Firecrawl directly** (no backend server needed). It extracts:

- Company name
- Job title
- Location
- Job description
- Phone number
- Email ID
- Source website

## Setup

### Prerequisites

1. **Docker Firecrawl running** on localhost:3002
   ```powershell
   cd c:\Users\535251\OneDrive\Documents\competitor-intelligence\firecrawl-selfhost
   docker-compose up -d
   ```

2. **Verify Firecrawl is running**
   ```powershell
   docker-compose ps
   ```

## Option 1: PowerShell Script (RECOMMENDED - No Dependencies)

### Usage

```powershell
cd c:\Users\535251\OneDrive\Documents\competitor-intelligence

# Basic usage (default settings)
.\job-leads-scraper.ps1

# Custom wait time for JavaScript rendering (5 seconds)
.\job-leads-scraper.ps1 -WaitTime 5000

# Limit jobs extracted per website
.\job-leads-scraper.ps1 -MaxJobs 50

# Skip CSV export
.\job-leads-scraper.ps1 -SkipCSV
```

### Output

- Console: Live status updates and sample results
- JSON file: `job-leads-YYYY-MM-DD_HHMMSS.json` (all structured data)
- CSV file: `job-leads-YYYY-MM-DD_HHMMSS.csv` (for Excel/spreadsheet)

### Example Output

```
======================================================================
TELECALLING JOB LEADS SCRAPER
======================================================================

📡 Checking Firecrawl status on localhost:3002...
✅ Firecrawl is running

======================================================================
SCRAPING: Indeed India
======================================================================

📍 Keyword: telecaller
📡 Sending crawl request...
   URL: https://in.indeed.com/jobs?q=telecaller&location=India
✅ Job created: 019c08da-xxxx-xxxx
   Polling for results...
✅ Crawl completed in 45.2s
✅ Retrieved 1 page(s)
✅ Extracted 8 potential jobs

[RESULTS]
[1] Telecaller - Inbound/Outbound
    Company  : ABC Insurance Ltd
    Location : Mumbai
    Email    : hr@abcinsurance.com
    Phone    : 9876543210
```

## Option 2: Node.js Script

### Setup

```powershell
# Install required package
npm install csv-writer

# Run
node job-leads-scraper.js
```

### Features

- Better error handling
- More robust data extraction
- Direct CSV generation
- Configurable timeouts and polling

## Supported Websites

The scraper crawls:

1. **Indeed India** (`in.indeed.com`)
   - Keywords: telecaller, telecalling, voice process, call executive

2. **LinkedIn Jobs** (`linkedin.com/jobs`)
   - Keywords: telecaller India, voice process India, call executive India

3. **Fresher.com**
   - Keywords: telecaller, voice process

4. **Naukri Jobs** (`naukri.com`)
   - Keywords: telecaller, telecalling

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│ 1. Build Search URLs for each website + keyword         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. POST to http://localhost:3002/v1/crawl              │
│    - Submit job with URL + JS wait time                 │
│    - Returns: Job ID + Status URL                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Poll Status URL every 2 seconds                      │
│    - Track: scraping → completed                        │
│    - Max timeout: 3 minutes                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Extract Structured Data from Markdown               │
│    - Regex patterns for: phone, email, location        │
│    - NLP-like pattern matching for titles/companies    │
│    - Safe extraction (no crashes on missing fields)    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Save Results as JSON + CSV                          │
│    - Job objects with all fields                       │
│    - Timestamps and source tracking                    │
└─────────────────────────────────────────────────────────┘
```

## Data Extraction Logic

### Phone Number
```regex
\b([0-9]{10}|\+91[0-9]{10})\b
```
Finds 10-digit or +91 format phone numbers

### Email
```regex
[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
```
Standard email pattern

### Job Title
```
Patterns checked:
1. "Job: [Title]" prefix
2. Content containing "telecaller", "voice process", etc.
3. First 100 chars of job block
```

### Location
```
1. "Location: [City]" prefix
2. Match against common Indian cities (Mumbai, Delhi, Bangalore, etc.)
3. Falls back to null if not found
```

### Company Name
```
1. "Company: [Name]" prefix
2. First line of job block if under 100 chars
3. Falls back to null if not found
```

## Configuration

Edit the script to customize:

```powershell
# Websites to crawl
$Websites = @(
    @{
        Name      = "Indeed India"
        BaseUrl   = "https://in.indeed.com/jobs"
        SearchTerms = @("telecaller", "telecalling", ...)
        QueryParam = "q"
    },
    ...
)

# Crawl parameters
$FirecrawlUrl = "http://localhost:3002/v1/crawl"  # Firecrawl endpoint
$WaitTime = 3000                                   # JS rendering wait (ms)
$PollingInterval = 2000                            # Poll every 2 seconds
$MaxPolls = 90                                     # 3 minute timeout
$MaxJobs = 20                                      # Per website
```

## Troubleshooting

### "Cannot connect to Firecrawl"

```powershell
# Check if Docker containers are running
docker-compose ps

# Start them if not running
cd firecrawl-selfhost
docker-compose up -d

# Verify port 3002
netstat -ano | findstr ":3002"
```

### "Polling timeout"

Some sites take longer to render. Try:

```powershell
# Increase wait time for JavaScript
.\job-leads-scraper.ps1 -WaitTime 5000

# Increase timeout
$MaxPolls = 120  # 4 minutes instead of 3
```

### "No jobs extracted"

1. Check if the website structure changed
2. Review the crawled markdown in the temporary files
3. Try a different search term
4. Verify the website is accessible (not blocked by robots.txt)

## Performance

- **Time per website**: 30-90 seconds (depends on JS rendering)
- **Total crawl time**: ~10-15 minutes for all websites
- **Rate limiting**: 2-second delay between requests (safe for most sites)

## Output Format

### JSON Structure

```json
[
  {
    "source_website": "Indeed India",
    "source_url": "https://in.indeed.com/jobs?q=telecaller&location=India",
    "company_name": "ABC Insurance Ltd",
    "job_title": "Telecaller - Inbound/Outbound",
    "location": "Mumbai",
    "description": "Excellent opportunity to join our growing team...",
    "phone": "9876543210",
    "email": "hr@abcinsurance.com",
    "extracted_at": "2026-01-29 14:30:45"
  },
  ...
]
```

### CSV Format

```csv
Website,Company,Job Title,Location,Description,Phone,Email,Source URL,Extracted At
"Indeed India","ABC Insurance Ltd","Telecaller - Inbound","Mumbai","Excellent opportunity...","+919876543210","hr@abcinsurance.com","https://in.indeed.com/jobs?q=telecaller","2026-01-29 14:30:45"
```

## Advanced Usage

### Extract from specific website only

```powershell
# Create a custom script with filtered websites
$Websites = @(
    @{
        Name      = "Indeed India"
        BaseUrl   = "https://in.indeed.com/jobs"
        SearchTerms = @("telecaller")
        QueryParam = "q"
    }
)
```

### Process results programmatically

```powershell
# Load the JSON results
$Jobs = Get-Content "job-leads-2026-01-29.json" | ConvertFrom-Json

# Filter by location
$MumbaiJobs = $Jobs | Where-Object { $_.location -eq "Mumbai" }

# Filter by company pattern
$InsuranceJobs = $Jobs | Where-Object { $_.company_name -like "*Insurance*" }

# Export specific filtered results
$MumbaiJobs | ConvertTo-Json | Out-File "mumbai-only.json"
```

## Limitations & Notes

1. **JavaScript rendering**: Wait time affects crawl duration (3-5 seconds typical)
2. **Website structure**: Different sites have different HTML. Some jobs may be missed.
3. **Phone/Email extraction**: Only extracts if visible in rendered HTML (not all jobs have contact info)
4. **Rate limiting**: Uses 2-second delays between requests (respectful crawling)
5. **robots.txt**: Honors most website guidelines (no aggressive crawling)
6. **Legal**: Ensure you have rights to crawl each website per their ToS

## Next Steps

1. **Run the scraper**: `.\job-leads-scraper.ps1`
2. **Check results**: Open generated JSON/CSV files
3. **Process data**: Filter by location, company, salary, etc.
4. **Integrate**: Build downstream tools to contact leads, analyze market trends, etc.

---

**Need Help?** Check that:
- ✅ Firecrawl is running on localhost:3002
- ✅ PowerShell execution policy allows script execution
- ✅ Internet connection is active
- ✅ Websites are accessible (not geoblocked)
