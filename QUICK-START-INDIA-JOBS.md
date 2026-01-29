# 🇮🇳 India-Only Telecalling Jobs Crawler - Quick Reference

## Execute Now

### PowerShell (Recommended)
```powershell
cd c:\Users\535251\OneDrive\Documents\competitor-intelligence
.\crawl-india-telecalling-jobs.ps1
```

### Node.js
```bash
cd c:\Users\535251\OneDrive\Documents\competitor-intelligence
node crawl-india-jobs.js
```

---

## What You Get

| Format | File | Usage |
|--------|------|-------|
| JSON | `india_telecalling_jobs_*.json` | Data processing, imports |
| CSV | `india_telecalling_jobs_*.csv` | Excel, Google Sheets |

---

## Filtering Rules

### ✅ INCLUDES (India Jobs)
- **"India"** in any field
- **Indian cities**: Bangalore, Mumbai, Delhi, Pune, Hyderabad, Chennai, etc.
- **Indian states**: Tamil Nadu, Karnataka, Maharashtra, etc.

### ❌ EXCLUDES (Non-India Jobs)
- **Global keywords**: Global, Worldwide, International, Remote-Global
- **Countries**: USA, UK, UAE, Canada, Australia, etc.
- **Cities**: Dubai, London, New York, Singapore, etc.

---

## Files Created

```
crawl-india-telecalling-jobs.ps1    PowerShell version
crawl-india-jobs.js                 Node.js version
INDIA-JOBS-IMPLEMENTATION.md        Full implementation guide
INDIA-JOBS-CRAWLER-GUIDE.md         Complete documentation
```

---

## Job Keywords Matched

**Telecalling, Telecalling, Voice Process, Call Executive**  
**Call Center, Customer Support, Inbound Calls, Outbound Calls**  
**BPO, ITES, Phone Operator, Voice Agent**

---

## Output Example

```json
{
  "metadata": {
    "totalJobs": 150,
    "filterApplied": "India-only",
    "extractedAt": "2026-01-29T17:04:15Z"
  },
  "jobs": [
    {
      "title": "Telecaller - Bangalore",
      "location": "Bangalore, Karnataka, India",
      "source": "Indeed"
    }
  ]
}
```

---

## Coverage

| Category | Count |
|----------|-------|
| Indian Cities | 27+ |
| Indian States | 28 |
| Job Keywords | 15+ |
| Global Keywords | 30+ |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Firecrawl not running" | `docker-compose -f firecrawl-selfhost/docker-compose.yml up -d` |
| "No India jobs found" | Wait 30-60 seconds, crawl still processing |
| "Script not executable" | `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |

---

## Next Steps

1. **Run the crawler**
   ```powershell
   .\crawl-india-telecalling-jobs.ps1
   ```

2. **Check the output files**
   ```
   india_telecalling_jobs_YYYYMMDD_HHMMSS.json
   india_telecalling_jobs_YYYYMMDD_HHMMSS.csv
   ```

3. **Import results**
   - Open CSV in Excel
   - Load JSON into database
   - Process with your tools

4. **Customize** (optional)
   - Edit location arrays
   - Add job keywords
   - Schedule daily runs

---

**Ready to go!** Start collecting India-only telecalling job leads now.
