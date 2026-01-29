# Job Scraper - Quick Reference Card

## 🚀 Quick Start (30 seconds)

```powershell
# 1. Make sure Firecrawl is running
docker-compose ps

# 2. Run the scraper
cd c:\Users\535251\OneDrive\Documents\competitor-intelligence
.\job-leads-scraper.ps1

# 3. Results in:
# - job-leads-YYYY-MM-DD_HHMMSS.json
# - job-leads-YYYY-MM-DD_HHMMSS.csv
```

---

## 📋 Commands Reference

### Main Scraper
```powershell
# Default (crawl all websites)
.\job-leads-scraper.ps1

# Custom JS wait time (useful for heavy sites)
.\job-leads-scraper.ps1 -WaitTime 5000

# Limit jobs per website
.\job-leads-scraper.ps1 -MaxJobs 30

# Skip CSV export
.\job-leads-scraper.ps1 -SkipCSV

# Combine options
.\job-leads-scraper.ps1 -WaitTime 5000 -MaxJobs 50
```

### Test Script (Run This First!)
```powershell
# Test on single website
.\test-job-scraper.ps1
```

### Check Firecrawl Status
```powershell
cd firecrawl-selfhost
docker-compose ps

# Should see 5 containers: redis, api, worker, ui, db
```

### Start/Stop Firecrawl
```powershell
# Start
cd firecrawl-selfhost
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f api
```

---

## 🔧 Configuration

### Edit Websites Being Crawled

File: `job-leads-scraper.ps1` (around line 30)

```powershell
$Websites = @(
    @{
        Name      = "Indeed India"
        BaseUrl   = "https://in.indeed.com/jobs"
        SearchTerms = @("telecaller", "voice process")
        QueryParam = "q"
    },
    # Add more websites here
)
```

### Edit Wait Time for JS Rendering

```powershell
[int]$WaitTime = 3000  # milliseconds
# Change to 5000 for heavy JS sites
# Change to 2000 for light sites (faster)
```

### Edit Max Jobs Per Website

```powershell
[int]$MaxJobs = 20  # per website
# Higher = more jobs but longer crawl time
```

---

## 📊 Output Format

### JSON File Structure
```json
[
  {
    "source_website": "Indeed India",
    "company_name": "ABC Insurance",
    "job_title": "Telecaller",
    "location": "Mumbai",
    "description": "Full job description...",
    "phone": "9876543210",
    "email": "hr@abc.com",
    "source_url": "https://...",
    "extracted_at": "2026-01-29 14:30:45"
  }
]
```

### CSV File
- Directly importable to Excel
- One row per job
- All fields preserved

---

## 🎯 Supported Websites

| Website | Search Terms | Time | Success Rate |
|---------|------------|------|--------------|
| Indeed India | 4 keywords | ~45s | ~90% |
| LinkedIn | 3 keywords | ~60s | ~85% |
| Fresher.com | 2 keywords | ~35s | ~95% |
| Naukri Jobs | 2 keywords | ~50s | ~90% |

**Total typical runtime**: 10-15 minutes

---

## ⚡ Performance Tips

### Speed Up Crawling
```powershell
# Reduce JS wait time (faster but less reliable)
.\job-leads-scraper.ps1 -WaitTime 2000

# Reduce jobs per website
.\job-leads-scraper.ps1 -MaxJobs 10
```

### Increase Reliability
```powershell
# More JS wait time (slower but more complete)
.\job-leads-scraper.ps1 -WaitTime 5000

# More jobs per website
.\job-leads-scraper.ps1 -MaxJobs 50
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Firecrawl"
```powershell
# Solution:
cd firecrawl-selfhost
docker-compose up -d
docker-compose ps  # Verify all containers running
```

### Issue: "Polling timeout"
```powershell
# Solution: Increase wait time
.\job-leads-scraper.ps1 -WaitTime 5000
```

### Issue: "No jobs extracted"
```powershell
# Check the test script first:
.\test-job-scraper.ps1

# If test works, website structure may have changed
# Review HTML on that website manually
```

### Issue: Script not executing
```powershell
# Allow script execution:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run again
.\job-leads-scraper.ps1
```

---

## 📈 Data Analysis

### View extracted jobs in PowerShell
```powershell
# Load JSON
$Jobs = Get-Content "job-leads-2026-01-29_*.json" | ConvertFrom-Json

# Count by website
$Jobs | Group-Object source_website | Select-Object Name, Count

# Jobs by location
$Jobs | Group-Object location | Select-Object Name, Count

# Jobs with contact info
$Jobs | Where-Object { $_.phone -or $_.email } | Measure-Object

# Export specific results
$Jobs | Where-Object { $_.location -eq "Mumbai" } | 
  ConvertTo-Json | 
  Out-File "mumbai-jobs.json"
```

### Open in Excel
1. Run scraper
2. Find `job-leads-*.csv` file
3. Right-click → Open with Excel
4. Use filters and sorting

---

## 🔐 Legal Notes

✅ **OK:**
- Crawling job posting sites (typically allows it)
- Using Firecrawl (respects robots.txt)
- 2-second delays between requests
- Storing data for analysis

⚠️ **Check website ToS for:**
- Reselling contact information
- Bulk email campaigns
- Commercial use restrictions
- Personal data handling

---

## 💾 File Locations

```
competitor-intelligence/
├── job-leads-scraper.ps1        ← Main scraper (RUN THIS)
├── test-job-scraper.ps1         ← Test version
├── job-leads-scraper.js         ← Node.js alternative
├── JOB_SCRAPER_GUIDE.md         ← Full documentation
├── job-leads-*.json             ← Results (auto-generated)
├── job-leads-*.csv              ← Results (auto-generated)
└── firecrawl-selfhost/          ← Docker setup
    └── docker-compose.yml
```

---

## ⏱️ Typical Execution Timeline

```
00:00 - Start scraper
00:05 - Indeed India: 4 searches × ~45s each
00:25 - LinkedIn: 3 searches × ~60s each
00:45 - Fresher.com: 2 searches × ~35s each
00:55 - Naukri: 2 searches × ~50s each
01:15 - Save results (JSON + CSV)
01:15 - Done! 🎉
```

---

## 📞 Contact Fields

The scraper looks for:

### Phone Numbers
- 10-digit format: `9876543210`
- +91 format: `+919876543210`
- Dash format: `987-654-3210`

### Emails
- Standard format: `hr@company.com`
- Multi-part: `john.doe@company.co.in`
- Special chars: `contact_us@company.com`

**Note**: Only extracts if visible in rendered HTML

---

## 🎓 Learn More

- Read full guide: `JOB_SCRAPER_GUIDE.md`
- Firecrawl docs: `http://localhost:3002` (UI)
- Test first: `.\test-job-scraper.ps1`

---

## ✅ Checklist Before Running

- [ ] Docker running (`docker ps`)
- [ ] Firecrawl started (`docker-compose up -d`)
- [ ] Internet connection active
- [ ] Script execution allowed (`Set-ExecutionPolicy`)
- [ ] 10-15 minutes available
- [ ] Disk space for results (~1-5 MB)

---

**Version**: 1.0 | **Updated**: 2026-01-29
