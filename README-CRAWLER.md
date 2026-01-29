# Direct Firecrawl Job Crawler

A simple, local script to crawl job leads from **Naukri**, **Indeed**, and **Apna** using Firecrawl directly at `http://localhost:3002`.

## What This Does

✅ Crawls ONLY these three portals (no other websites)  
✅ Filters for **telecalling jobs** only (using keywords)  
✅ Restricts results to **India locations**  
✅ Extracts **7 structured fields**:
  - Company name
  - Job title
  - Location
  - Job description
  - Phone number (if found, null if missing)
  - Email ID (if found, null if missing)
  - Source portal (Naukri / Indeed / Apna)

✅ Handles missing data gracefully (returns `null` instead of failing)  
✅ Saves results as **JSON** and **CSV**  
✅ Prints results to console  
✅ Validates Firecrawl before crawling  

## Prerequisites

1. **Firecrawl running on port 3002**
   ```bash
   docker-compose -f firecrawl-selfhost/docker-compose.yml up
   ```

2. **Node.js installed** (for the Node.js script)
   ```bash
   node --version  # Should show v14 or higher
   ```

## Usage

### Option 1: Node.js Script

Install axios dependency:
```bash
npm install axios
```

Run the crawler:
```bash
node crawl-jobs.js
```

**Output:**
- Console display of all jobs
- `jobs-output.json` file
- `jobs-output.csv` file

### Option 2: PowerShell Script

Run the crawler:
```powershell
.\crawl-jobs.ps1
```

Save as JSON and CSV:
```powershell
.\crawl-jobs.ps1 -OutputFormat "both"
```

Save JSON only:
```powershell
.\crawl-jobs.ps1 -OutputFormat "json"
```

Save CSV only:
```powershell
.\crawl-jobs.ps1 -OutputFormat "csv"
```

**Output:**
- Console display of all jobs
- `jobs-output.json` file (if requested)
- `jobs-output.csv` file (if requested)

## How It Works

### 1. Health Check
- Validates that Firecrawl is running on `http://localhost:3002/health`
- Exits with error if Firecrawl is not available

### 2. Portal Crawling
For each portal (Naukri, Indeed, Apna):
- Sends a POST request to `http://localhost:3002/api/v1/crawl`
- Receives markdown content of the page
- Extracts job postings

### 3. Job Filtering
For each extracted job:
- ✅ Check if it mentions telecalling keywords
- ✅ Check if location is India
- ✅ Extract company, title, location, description
- ✅ Extract phone numbers (Indian format)
- ✅ Extract email addresses
- ❌ Discard if not telecalling related
- ❌ Discard if location is not India

### 4. Data Extraction

**Phone Number Patterns:**
- `+91 9876543210`
- `9876543210`
- `040-12345678` (landlines)

**Email Pattern:**
- `name@domain.com`

**If phone/email is missing:** Returns `null` (not an error)

### 5. Output

**Console Output:**
```
[1] Telecaller - Customer Support
    Company: ABC Company
    Location: Bangalore, India
    Phone: +919876543210
    Email: jobs@abc.com
    Source: Naukri
    Description: We are hiring...
```

**JSON Format:**
```json
[
  {
    "company": "ABC Company",
    "title": "Telecaller - Customer Support",
    "location": "Bangalore, India",
    "description": "...",
    "phone": "+919876543210",
    "email": "jobs@abc.com",
    "source": "Naukri",
    "crawledAt": "2024-01-29T10:30:00Z"
  }
]
```

**CSV Format:**
```
Company,Job Title,Location,Description,Phone,Email,Source,Crawled At
"ABC Company","Telecaller - Customer Support","Bangalore, India","...","+919876543210","jobs@abc.com","Naukri","2024-01-29T10:30:00Z"
```

## Job Portals Crawled

| Portal | URL | Telefilter |
|--------|-----|-----------|
| **Naukri** | https://www.naukri.com/jobs-in-india-for-telecaller | Naukri job portal |
| **Indeed** | https://in.indeed.com/jobs?q=telecaller&l=India | Indeed India jobs |
| **Apna** | https://www.apnaapp.com/jobs?title=telecaller&location=India | Apna mobile app jobs |

## Telecalling Keywords

The script filters for these keywords:
- `telecaller`
- `telecalling`
- `voice process`
- `call executive`
- `customer support (voice)`
- `inbound calls`
- `outbound calls`
- `tele-calling`
- `call center`
- `phone based`

## India Locations

Restricted to these locations (case-insensitive):
- India
- Bangalore, Delhi, Mumbai, Pune, Hyderabad
- Gurgaon, Noida, Chennai, Kolkata, Jaipur
- Lucknow, Chandigarh, Indore, Ahmedabad

## Error Handling

| Error | Behavior |
|-------|----------|
| Firecrawl not running | Exit with message, suggest Docker check |
| Portal not accessible | Skip that portal, continue with others |
| No jobs found | Display "0 jobs found", still save empty JSON/CSV |
| Missing phone/email | Return `null`, continue processing |
| Invalid HTML structure | Use text-based parsing, extract best effort |

## Troubleshooting

### "Firecrawl not running"
```bash
# Start Firecrawl
cd firecrawl-selfhost
docker-compose up
```

### "No jobs found"
1. Check if Firecrawl is actually running: `http://localhost:3002`
2. Try crawling manually:
   ```bash
   curl -X POST http://localhost:3002/api/v1/crawl \
     -H "Content-Type: application/json" \
     -d '{"url":"https://www.naukri.com/jobs-in-india-for-telecaller"}'
   ```
3. The portals may have rate-limiting or bot detection

### Files not being saved
- Ensure you have write permissions in the current directory
- Check that `jobs-output.json` and `jobs-output.csv` don't have locked file handles

## Advanced Usage

### Modify Portal URLs
Edit the `PORTALS` section in the script to change URLs:

**Node.js:**
```javascript
const PORTALS = [
  { name: 'Naukri', url: 'https://custom-naukri-url', source: 'Naukri' },
  // ... more portals
];
```

**PowerShell:**
```powershell
$PORTALS = @(
    @{ Name = "Naukri"; Url = "https://custom-url"; Source = "Naukri" },
    # ... more portals
)
```

### Add More Telecalling Keywords
Edit the `TELECALLING_KEYWORDS` array to include more keywords.

### Change India Locations
Edit the `INDIA_LOCATIONS` array to customize allowed locations.

## API Integration

Both scripts use the Firecrawl API directly:

```bash
POST http://localhost:3002/api/v1/crawl
Content-Type: application/json

{
  "url": "https://www.naukri.com/jobs-in-india-for-telecaller"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "markdown": "..."
  }
}
```

## Performance

- **Crawl time:** ~10-30 seconds per portal (depends on page size)
- **Total runtime:** ~30-90 seconds for all 3 portals
- **Memory usage:** <50 MB
- **Disk usage:** ~100 KB per run (JSON/CSV files)

## Files Generated

```
jobs-output.json     # Structured data in JSON format
jobs-output.csv      # Spreadsheet-ready CSV format
crawl-jobs.js        # Node.js version (run: node crawl-jobs.js)
crawl-jobs.ps1       # PowerShell version (run: .\crawl-jobs.ps1)
README-CRAWLER.md    # This guide
```

## Comparison with Frontend System

| Feature | Frontend System | This Script |
|---------|-----------------|------------|
| Setup | Browser UI | Command-line |
| Persistence | localStorage | JSON/CSV files |
| Interactivity | Full UI | CLI parameters |
| Automation | Manual | Easily automated |
| No dependencies | ✅ (HTML/JS) | ❌ (requires Node/Axios) |
| Quick crawls | ✅ | ✅ |

## License

MIT

## Support

For issues:
1. Check if Firecrawl is running: `http://localhost:3002`
2. Verify node/powershell versions
3. Check console output for specific error messages
4. Try crawling a portal manually to isolate the issue
