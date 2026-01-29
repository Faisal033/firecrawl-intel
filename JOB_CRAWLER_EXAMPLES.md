# Job Crawler - Usage Examples

## Example 1: Basic Execution

```powershell
PS C:\competitor-intelligence> .\job-crawler.ps1

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
[15:33:22] [INFO] Polling... (2/180 sec)
[15:33:24] [INFO] Polling... (4/180 sec)
[15:33:26] [INFO] Polling... (6/180 sec)
[15:33:28] [INFO] Polling... (8/180 sec)
[15:33:30] [INFO] Polling... (10/180 sec)
[15:33:32] [INFO] Polling... (12/180 sec)
[15:33:34] [SUCCESS] Crawl completed: 1 pages retrieved
[15:33:34] [INFO] Processing 1 pages from Naukri

-----------------------------------------------------------
  Crawling: Apna
-----------------------------------------------------------

[15:33:38] [INFO] Initiating crawl: https://www.apnaapp.com/jobs?q=telecaller
[15:33:38] [INFO] Job initiated: 019c0935-e586-774b-8589-fc9ed2316796
[15:33:40] [INFO] Polling... (2/180 sec)
[15:33:42] [INFO] Polling... (4/180 sec)
[15:33:44] [INFO] Polling... (6/180 sec)
[15:33:46] [INFO] Polling... (8/180 sec)
[15:33:48] [INFO] Polling... (10/180 sec)
[15:33:50] [SUCCESS] Crawl completed: 1 pages retrieved
[15:33:50] [INFO] Processing 1 pages from Apna

-----------------------------------------------------------
  Crawling: Indeed
-----------------------------------------------------------

[15:33:54] [INFO] Initiating crawl: https://www.indeed.com/jobs?q=telecaller&l=India
[15:33:54] [INFO] Job initiated: 019c0936-265b-7631-9baa-1b7a03afb92c
[15:33:56] [INFO] Polling... (2/180 sec)
[15:33:58] [INFO] Polling... (4/180 sec)
[15:34:00] [INFO] Polling... (6/180 sec)
[15:34:02] [INFO] Polling... (8/180 sec)
[15:34:04] [SUCCESS] Crawl completed: 1 pages retrieved
[15:34:04] [INFO] Processing 1 pages from Indeed

==========================================================
  EXTRACTED JOB DATA - TELECALLING POSITIONS
==========================================================

No jobs found matching criteria.

PS C:\competitor-intelligence>
```

## Example 2: With Results Found and JSON Export

```powershell
PS C:\competitor-intelligence> .\job-crawler.ps1 -ExportJSON

[... crawling output ...]

[15:34:10] [SUCCESS] Found: Telecaller Executive @ ITPL Solutions
[15:34:11] [SUCCESS] Found: Voice Process Agent @ Global Contact Center
[15:34:12] [SUCCESS] Found: Call Executive @ Customer Care Systems

==========================================================
  EXTRACTED JOB DATA - TELECALLING POSITIONS
==========================================================

[Job 1]
  Source........: Naukri
  Company.......: ITPL Solutions
  Title.........: Telecaller Executive
  Location......: Bangalore, Karnataka
  Phone.........: 9876543210
  Email.........: hr@itpl.com
  Description...: ITPL Solutions is looking for experienced telecallers
                   with excellent communication skills. 2+ years of voice
                   process experience required. Competitive salary...

[Job 2]
  Source........: Apna
  Company.......: Global Contact Center
  Title.........: Voice Process Agent
  Location......: Mumbai, Maharashtra
  Phone.........: 9876543211
  Email.........: jobs@globalcc.com
  Description...: Join our growing team as a Voice Process Agent. Handle
                   inbound and outbound calls, customer support, sales
                   inquiries. Night shift available. Salary: 12-16k...

[Job 3]
  Source........: Indeed
  Company.......: Customer Care Systems
  Title.........: Call Executive
  Location......: Pune, Maharashtra
  Phone.........: N/A
  Email.........: recruitment@ccs.com
  Description...: CCS is hiring Call Executives for our 24x7 customer
                   support operations. No experience required. Training
                   provided. Work from home option available...

==========================================================
  Total Jobs Found: 3
===========================================================

[15:34:43] [SUCCESS] Exported JSON: jobs_20260129_153443.json
```

## Example 3: Generated JSON File

**File: `jobs_20260129_153443.json`**

```json
[
  {
    "Source": "Naukri",
    "CompanyName": "ITPL Solutions",
    "JobTitle": "Telecaller Executive",
    "Location": "Bangalore, Karnataka",
    "Description": "ITPL Solutions is looking for experienced telecallers with excellent communication skills. 2+ years of voice process experience required. Competitive salary and benefits. Apply now!",
    "Phone": "9876543210",
    "Email": "hr@itpl.com",
    "ExtractedAt": "2026-01-29 15:34:10"
  },
  {
    "Source": "Apna",
    "CompanyName": "Global Contact Center",
    "JobTitle": "Voice Process Agent",
    "Location": "Mumbai, Maharashtra",
    "Description": "Join our growing team as a Voice Process Agent. Handle inbound and outbound calls, customer support, sales inquiries. Night shift available. Salary: 12-16k per month. Apply today!",
    "Phone": "9876543211",
    "Email": "jobs@globalcc.com",
    "ExtractedAt": "2026-01-29 15:34:11"
  },
  {
    "Source": "Indeed",
    "CompanyName": "Customer Care Systems",
    "JobTitle": "Call Executive",
    "Location": "Pune, Maharashtra",
    "Description": "CCS is hiring Call Executives for our 24x7 customer support operations. No experience required. Training provided. Work from home option available. Salary: 10-14k per month.",
    "Phone": null,
    "Email": "recruitment@ccs.com",
    "ExtractedAt": "2026-01-29 15:34:12"
  }
]
```

## Example 4: Generated CSV File

**File: `jobs_20260129_153443.csv`**

```csv
Source,CompanyName,JobTitle,Location,Phone,Email,ExtractedAt
Naukri,ITPL Solutions,Telecaller Executive,Bangalore Karnataka,9876543210,hr@itpl.com,2026-01-29 15:34:10
Apna,Global Contact Center,Voice Process Agent,Mumbai Maharashtra,9876543211,jobs@globalcc.com,2026-01-29 15:34:11
Indeed,Customer Care Systems,Call Executive,Pune Maharashtra,,recruitment@ccs.com,2026-01-29 15:34:12
```

## Example 5: Extended Timeout (Slow Connection)

```powershell
PS C:\competitor-intelligence> .\job-crawler.ps1 -TimeoutSeconds 300 -ExportCSV

===========================================================
  FIRECRAWL DIRECT JOB CRAWLER (Backend-less)
  Target: Telecalling Jobs in India
  Websites: Naukri, Apna, Indeed
===========================================================

[15:35:00] [INFO] Checking Firecrawl health...
[15:35:00] [SUCCESS] Firecrawl is running

-----------------------------------------------------------
  Crawling: Naukri
-----------------------------------------------------------

[15:35:00] [INFO] Initiating crawl: https://www.naukri.com/jobs-bangalore-telecaller-jobs
[15:35:00] [INFO] Job initiated: 019c0937-a5a0-72f9-ac37-595c63b00ef2
[15:35:02] [INFO] Polling... (2/300 sec)
[15:35:04] [INFO] Polling... (4/300 sec)
[15:35:06] [INFO] Polling... (6/300 sec)
[... more polling ...]
[15:35:35] [SUCCESS] Crawl completed: 5 pages retrieved
[15:35:35] [INFO] Processing 5 pages from Naukri
[15:35:36] [SUCCESS] Found: Telecaller @ Company1
[15:35:37] [SUCCESS] Found: Voice Process @ Company2
[15:35:38] [SUCCESS] Found: Customer Support @ Company3

[... Apna and Indeed ...]

[15:36:15] [SUCCESS] Exported CSV: jobs_20260129_153615.csv
```

## Example 6: Firecrawl Not Running

```powershell
PS C:\competitor-intelligence> .\job-crawler.ps1

===========================================================
  FIRECRAWL DIRECT JOB CRAWLER (Backend-less)
  Target: Telecalling Jobs in India
  Websites: Naukri, Apna, Indeed
===========================================================

[15:37:00] [INFO] Checking Firecrawl health...
[15:37:10] [ERROR] Firecrawl health check failed: Unable to connect
[15:37:10] [ERROR] CRITICAL: Firecrawl is not running. Cannot proceed.

To start Firecrawl:
  docker-compose -f firecrawl-selfhost/docker-compose.yml up -d

PS C:\competitor-intelligence>
```

## Example 7: Both Exports (JSON + CSV)

```powershell
PS C:\competitor-intelligence> .\job-crawler.ps1 -ExportJSON -ExportCSV

[... crawling and results ...]

Total Jobs Found: 5
===========================================================

[15:38:45] [SUCCESS] Exported JSON: jobs_20260129_153845.json
[15:38:45] [SUCCESS] Exported CSV: jobs_20260129_153845.csv

PS C:\competitor-intelligence> dir jobs_*.* | Sort-Object LastWriteTime -Descending | Select-Object -First 2

    Directory: C:\competitor-intelligence

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---           1/29/2026  3:38 PM           3428 jobs_20260129_153845.csv
-a---           1/29/2026  3:38 PM           5742 jobs_20260129_153845.json
```

## Example 8: Custom Firecrawl URL

```powershell
# If Firecrawl is on a different host
PS C:\competitor-intelligence> .\job-crawler.ps1 -FirecrawlURL "http://192.168.1.100:3002"

===========================================================
  FIRECRAWL DIRECT JOB CRAWLER (Backend-less)
  Target: Telecalling Jobs in India
  Websites: Naukri, Apna, Indeed
===========================================================

[15:39:00] [INFO] Checking Firecrawl health at http://192.168.1.100:3002...
[15:39:00] [SUCCESS] Firecrawl is running

[... rest of crawl ...]
```

## Example 9: Real-world Workflow

```powershell
# Step 1: Start Firecrawl
PS> cd firecrawl-selfhost
PS> docker-compose up -d
Creating firecrawl_redis_1 ... done
Creating firecrawl_postgres_1 ... done
Creating firecrawl_api_1 ... done

# Step 2: Wait a moment for startup
PS> Start-Sleep -Seconds 5

# Step 3: Run crawler with both exports
PS> cd ..
PS> .\job-crawler.ps1 -ExportJSON -ExportCSV
[outputs from Example 2]

# Step 4: Check the files created
PS> Get-Item jobs_*.json | Select-Object Name, Length

Name                           Length
----                           ------
jobs_20260129_153845.json      5742

PS> Get-Item jobs_*.csv | Select-Object Name, Length

Name                           Length
----                           ------
jobs_20260129_153845.csv       3428

# Step 5: View results
PS> Get-Content jobs_20260129_153845.json | ConvertFrom-Json | ForEach-Object { Write-Host "$($_.CompanyName) - $($_.JobTitle) @ $($_.Location)" }

ITPL Solutions - Telecaller Executive @ Bangalore, Karnataka
Global Contact Center - Voice Process Agent @ Mumbai, Maharashtra
Customer Care Systems - Call Executive @ Pune, Maharashtra
```

## Summary

- **Health Check**: Automatic verification that Firecrawl is running
- **Three Websites**: Naukri, Apna, Indeed (India-only, telecalling jobs)
- **Data Extraction**: Company, title, location, phone, email
- **Graceful Nulls**: Missing fields return null (not errors)
- **Real-time Feedback**: See jobs as they're discovered
- **Multiple Formats**: Export to JSON, CSV, or console
- **Error Handling**: Clear messages if issues occur
- **No Backend**: Direct Firecrawl API, no Express wrapper
