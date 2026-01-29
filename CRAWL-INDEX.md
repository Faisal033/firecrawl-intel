# Direct Firecrawl Job Crawler - File Index

**Last Updated:** January 29, 2026  
**Status:** ✅ Complete & Ready

---

## 📑 Documentation (READ IN THIS ORDER)

### 1. 🎯 START HERE
**File:** [CRAWL-DELIVERY.md](CRAWL-DELIVERY.md)  
**Purpose:** Complete delivery overview  
**Contains:**
- What you have
- Quick start guide
- Features summary
- Usage examples
- Troubleshooting

### 2. 📖 DETAILED REFERENCE
**File:** [README-CRAWLER.md](README-CRAWLER.md)  
**Purpose:** Comprehensive technical guide  
**Contains:**
- Complete API documentation
- Output format examples
- Job filtering details
- Phone/email extraction patterns
- Advanced customization
- Performance metrics

### 3. 🔧 SETUP GUIDE
**File:** [CRAWL-SETUP-GUIDE.md](CRAWL-SETUP-GUIDE.md)  
**Purpose:** Detailed setup and installation  
**Contains:**
- Requirements checklist
- Installation steps
- File structure overview
- Error handling guide
- Version history
- Maintenance information

---

## 💻 Executable Scripts

### Node.js Version
**File:** [crawl-jobs.js](crawl-jobs.js)  
**Language:** JavaScript  
**Lines:** 250+  
**Requirements:**
- Node.js v14+ installed
- `npm install axios`

**Run:**
```bash
node crawl-jobs.js
```

**What it does:**
- Checks Firecrawl health
- Crawls Naukri, Indeed, Apna
- Extracts telecalling jobs
- Filters by keywords and location
- Saves JSON and CSV files
- Displays results in console

---

### PowerShell Version
**File:** [crawl-jobs.ps1](crawl-jobs.ps1)  
**Language:** PowerShell  
**Lines:** 350+  
**Requirements:**
- PowerShell 5.1+ (built-in Windows 10+)
- No additional dependencies

**Run:**
```powershell
.\crawl-jobs.ps1
```

**What it does:**
- Same as Node.js version
- Zero external dependencies
- Windows-native cmdlets
- Output format options

---

## 📚 Supporting Files

### Quick Start Display
**File:** [CRAWL-QUICKSTART.ps1](CRAWL-QUICKSTART.ps1)  
**Purpose:** Display quick start guide  
**Run:**
```powershell
.\CRAWL-QUICKSTART.ps1
```

### Dependencies
**File:** [package.json](package.json)  
**Purpose:** npm dependencies for Node.js version  
**Content:**
- axios (HTTP client)

**Install:**
```bash
npm install
```

---

## 📊 Generated Output Files

### Structured Data (JSON)
**File:** `jobs-output.json` (generated)  
**Format:** JSON array of job objects  
**Contains:**
```json
[
  {
    "company": "string",
    "title": "string",
    "location": "string",
    "description": "string",
    "phone": "string or null",
    "email": "string or null",
    "source": "Naukri|Indeed|Apna",
    "crawledAt": "ISO 8601 timestamp"
  }
]
```

### Spreadsheet Export (CSV)
**File:** `jobs-output.csv` (generated)  
**Format:** Comma-separated values  
**Columns:**
- Company
- Job Title
- Location
- Description
- Phone
- Email
- Source
- Crawled At

---

## 🔍 Quick Reference

### File Matrix

| File | Type | Purpose | Executable |
|------|------|---------|-----------|
| [CRAWL-DELIVERY.md](CRAWL-DELIVERY.md) | Markdown | Main overview | No |
| [README-CRAWLER.md](README-CRAWLER.md) | Markdown | Technical guide | No |
| [CRAWL-SETUP-GUIDE.md](CRAWL-SETUP-GUIDE.md) | Markdown | Setup instructions | No |
| [crawl-jobs.js](crawl-jobs.js) | JavaScript | Main crawler | ✅ Yes |
| [crawl-jobs.ps1](crawl-jobs.ps1) | PowerShell | Main crawler | ✅ Yes |
| [CRAWL-QUICKSTART.ps1](CRAWL-QUICKSTART.ps1) | PowerShell | Quick reference | ✅ Yes |
| [package.json](package.json) | JSON | Dependencies | No |

---

## 🚀 Getting Started

### For Node.js Users
1. Read: [CRAWL-DELIVERY.md](CRAWL-DELIVERY.md)
2. Install: `npm install axios`
3. Run: `node crawl-jobs.js`
4. Reference: [README-CRAWLER.md](README-CRAWLER.md)

### For PowerShell Users
1. Read: [CRAWL-DELIVERY.md](CRAWL-DELIVERY.md)
2. Run: `.\crawl-jobs.ps1`
3. Reference: [README-CRAWLER.md](README-CRAWLER.md)

### For Setup Help
1. Read: [CRAWL-SETUP-GUIDE.md](CRAWL-SETUP-GUIDE.md)
2. Follow step-by-step instructions
3. Troubleshoot using included section

---

## 📌 Key Concepts

### What Crawlers Do
- ✅ Crawl ONLY 3 portals (hardcoded: Naukri, Indeed, Apna)
- ✅ Extract telecalling job listings
- ✅ Filter by keywords and India locations
- ✅ Parse 7 structured fields
- ✅ Handle missing data gracefully
- ✅ Save results as JSON + CSV

### No Backend Required
- Uses Firecrawl API directly
- `http://localhost:3002/v1/crawl`
- All processing local to your machine
- No external servers involved

### Output Formats
- **Console:** Real-time progress and results
- **JSON:** Structured data for APIs/databases
- **CSV:** Spreadsheet-ready for Excel/Sheets

---

## 🔗 Dependencies

### Node.js Version
```
Node.js v14+
├── axios (HTTP requests)
└── Built-in modules
    ├── fs (file I/O)
    ├── path (file paths)
    └── json (serialization)
```

### PowerShell Version
```
PowerShell 5.1+
├── Invoke-WebRequest (HTTP)
├── ConvertTo-Json (serialization)
└── Other built-in cmdlets
```

### System Requirements
```
Firecrawl Docker
├── localhost:3002 (running)
├── /v1/crawl endpoint
└── Job portal access
```

---

## ⚡ Performance

| Operation | Time |
|-----------|------|
| Health check | <1s |
| Per portal crawl | 10-30s |
| Total runtime (3 portals) | 30-90s |
| File I/O | <1s |

---

## 📋 Checklist for First Run

- [ ] Firecrawl Docker is running
- [ ] Port 3002 is accessible
- [ ] Read [CRAWL-DELIVERY.md](CRAWL-DELIVERY.md)
- [ ] Choose Node.js or PowerShell
- [ ] Install dependencies (if Node.js)
- [ ] Run the crawler
- [ ] Check console output
- [ ] Open `jobs-output.json`
- [ ] Open `jobs-output.csv`
- [ ] Read [README-CRAWLER.md](README-CRAWLER.md) for details

---

## 🆘 Need Help?

1. **Installation issues?**  
   → Read [CRAWL-SETUP-GUIDE.md](CRAWL-SETUP-GUIDE.md)

2. **How to use?**  
   → Read [CRAWL-DELIVERY.md](CRAWL-DELIVERY.md)

3. **Technical details?**  
   → Read [README-CRAWLER.md](README-CRAWLER.md)

4. **Quick reference?**  
   → Run `.\CRAWL-QUICKSTART.ps1`

5. **Troubleshooting?**  
   → See Troubleshooting sections in [CRAWL-DELIVERY.md](CRAWL-DELIVERY.md)

---

## 📞 File Locations

All files are in:
```
c:\Users\535251\OneDrive\Documents\competitor-intelligence\
```

---

## ✅ Verification

- ✅ Both crawlers created and tested
- ✅ API endpoints verified
- ✅ Job filtering logic implemented
- ✅ JSON/CSV export working
- ✅ Error handling in place
- ✅ Documentation complete
- ✅ Ready for production use

---

## 🎯 Next Action

**Choose one and run:**

```bash
# Option 1: Node.js
npm install axios
node crawl-jobs.js

# Option 2: PowerShell
.\crawl-jobs.ps1
```

---

**Last Update:** January 29, 2026  
**Status:** ✅ Production Ready
