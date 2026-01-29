# 🕷️ Telecalling Job Leads Extractor - Frontend Only System

## ✅ SYSTEM DEPLOYED & READY

### 📱 Access the Application
```
🌐 http://localhost:8080
```

**Status**: ✅ Running and ready to use

---

## 🎯 What This System Does

A **frontend-only** web application that:

1. ✅ Calls Firecrawl API directly (no backend server)
2. ✅ Crawls 3 job portals: **Naukri**, **Indeed**, **Apna**
3. ✅ Extracts **telecalling-related jobs only**
4. ✅ Extracts structured data per job:
   - Job title
   - Company name
   - Location
   - Job description
   - Phone number (if available)
   - Email (if available)
   - Source portal
5. ✅ Stores results in **browser localStorage**
6. ✅ Displays results as **formatted JSON**
7. ✅ Download as **JSON or CSV**

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│           YOUR BROWSER (Localhost)              │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │  Frontend App (http://localhost:8080)  │    │
│  │  • React-free HTML/JavaScript          │    │
│  │  • Job search interface                │    │
│  │  • Results display                     │    │
│  │  • localStorage persistence            │    │
│  └────────────────────────────────────────┘    │
│             ▲                                   │
│             │                                   │
│             │ HTTP REST Calls                  │
│             │ (No backend involved)            │
│             ▼                                   │
└─────────────────────────────────────────────────┘
              │
              │ Direct API Calls
              │
┌─────────────────────────────────────────────────┐
│          Firecrawl Docker (localhost:3002)      │
│                                                 │
│  ✅ Health Check: GET /health                  │
│  ✅ Crawl API: POST /v1/crawl                  │
│                                                 │
│  • Crawls websites                             │
│  • Returns markdown content                    │
│  • No Express backend involved                 │
└─────────────────────────────────────────────────┘
```

### Key Points:
- **NO Express/Node backend server running**
- **NO /api routes**
- **Direct browser ↔ Firecrawl communication**
- **All data stored in browser's localStorage**
- **No server-side database**

---

## 🚀 How to Use

### Step 1: Open the Application
```
1. Go to: http://localhost:8080
2. You'll see the Telecalling Job Leads Extractor interface
```

### Step 2: Select Job Portals
```
☑️ Naukri
☑️ Indeed
☑️ Apna

(All three are selected by default)
```

### Step 3: Enter Search Query (Optional)
```
Default: "telecaller"
You can change to: "voice process", "call executive", etc.
```

### Step 4: Start Crawling
```
Click: 🚀 Start Crawling

The system will:
1. Check Firecrawl health
2. Crawl search pages from each portal
3. Extract jobs matching "telecalling" keywords
4. Show progress in real-time
5. Store results in browser
```

### Step 5: View Results
```
Three tabs available:

📋 Preview Tab
   └─ See all extracted jobs in card format
   └─ View each job's details (title, company, location, etc)

📄 JSON Data Tab
   └─ View complete data as formatted JSON
   └─ Copy or analyze the raw data

💾 Downloads Tab
   └─ Download as JSON file
   └─ Download as CSV file
   └─ Copy JSON to clipboard
```

---

## 📊 Data Structure

Each extracted job contains:
```json
{
  "title": "Telecaller - Inbound Sales",
  "company": "Company Name",
  "location": "Bangalore, India",
  "description": "Handle inbound calls for...",
  "phone": "+91-XXXXXXXXXX" | null,
  "email": "contact@company.com" | null,
  "source": "indeed" | "naukri" | "apna",
  "extractedAt": "2026-01-29T10:30:00Z"
}
```

### Fields Explanation:
- **title**: Job position name
- **company**: Hiring company
- **location**: Job location
- **description**: Job details/requirements
- **phone**: Contact phone (null if not found)
- **email**: Contact email (null if not found)
- **source**: Which portal (naukri/indeed/apna)
- **extractedAt**: When it was extracted

---

## 🔍 Filtering Logic

The system automatically filters for **telecalling-related jobs** using these keywords:
- `telecaller`
- `telecalling`
- `voice process`
- `call executive`
- `customer support`
- `inbound call`
- `bpo`
- `telesales`

If a job listing contains ANY of these keywords, it's extracted.

---

## 📁 File Locations

```
c:\Users\535251\OneDrive\Documents\competitor-intelligence\

├── index.html              ← Main frontend app (HTTP served)
├── serve.js                ← Static file server (Node.js)
└── (no backend files needed)
```

### Starting the Server:
```powershell
cd "c:\Users\535251\OneDrive\Documents\competitor-intelligence"
node serve.js

# Output:
# ✅ Server running on: http://localhost:8080
```

---

## 🔧 Technical Details

### Frontend Technologies:
- **HTML5** - Markup
- **CSS3** - Styling (no frameworks)
- **Vanilla JavaScript** - Logic (no jQuery, React, etc)
- **LocalStorage API** - Persistent storage

### APIs Used:
1. **Firecrawl Health Check**
   ```
   GET http://localhost:3002/health
   ```

2. **Firecrawl Crawl API**
   ```
   POST http://localhost:3002/v1/crawl
   Content-Type: application/json
   
   {
     "url": "https://www.indeed.com/jobs?q=telecaller&l=India",
     "timeout": 60000
   }
   ```

### Response Format from Firecrawl:
```json
{
  "data": {
    "markdown": "# Page content in markdown format..."
  }
}
```

### Job Extraction:
- Parses the returned markdown
- Searches for telecalling keywords
- Extracts fields using regex patterns
- Phone regex: `/(?:\+?91[-.\s]?|0)?\d{10}/`
- Email regex: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/`

---

## 💾 Data Persistence

### LocalStorage:
- **Key**: `telecalling-jobs`
- **Data**: JSON with jobs array and last crawl time
- **Capacity**: ~5-10MB per browser
- **Persistence**: Survives browser restart

### Manual Save:
```javascript
// Save current state
localStorage.setItem('telecalling-jobs', JSON.stringify({
  jobs: appState.jobs,
  lastCrawlTime: appState.lastCrawlTime
}));

// Load on page load (automatic)
const stored = localStorage.getItem('telecalling-jobs');
```

---

## 📥 Export Options

### 1. Download JSON
```
Click: 📥 Download JSON
Format: Complete structured data
Filename: telecalling-jobs-2026-01-29.json
```

### 2. Download CSV
```
Click: 📥 Download CSV
Format: Excel-compatible spreadsheet
Filename: telecalling-jobs-2026-01-29.csv
```

### 3. Copy to Clipboard
```
Click: 📋 Copy JSON
Paste anywhere: Ctrl+V
```

---

## ⚙️ Configuration

You can customize in the code (`index.html`):

### Change Search Keywords:
```javascript
const searchQuery = document.getElementById('search-query').value || 'telecaller';
```

### Change Portal URLs:
```javascript
const urls = {
  naukri: `https://www.naukri.com/search?keyword=${query}`,
  indeed: `https://www.indeed.com/jobs?q=${query}&l=India`,
  apna: `https://www.apnaapp.com/jobs?q=${query}`
};
```

### Change Firecrawl API:
```javascript
const FIRECRAWL_API = 'http://localhost:3002';
```

### Change Telecalling Keywords:
```javascript
const telecallingKeywords = [
  'telecaller', 'telecalling', 'voice process',
  'call executive', 'customer support', 'inbound call',
  'bpo', 'telesales'
];
```

---

## 🚨 Troubleshooting

### Issue: "Firecrawl is not running"
```
✅ Solution:
1. Check if Firecrawl Docker is running:
   docker-compose ps
   
2. Ensure port 3002 is accessible:
   http://localhost:3002/
   
3. Restart Firecrawl if needed:
   docker-compose up -d
```

### Issue: "No jobs extracted"
```
✅ Solutions:
1. Check if portal URLs are accessible manually
2. Verify telecalling keywords are correct
3. Try different search terms
4. Some sites may block automated access
5. Check browser console (F12) for errors
```

### Issue: "Phone/Email not extracted"
```
✅ Expected behavior:
- Phone/Email are optional fields
- Many job listings don't display them
- Returns null if not found (not an error)
- Details often on individual job pages
```

### Issue: "Crawl takes too long"
```
✅ Expected:
- First crawl: 2-5 minutes (depends on site size)
- Subsequent crawls: Faster (cached)
- Portal timeouts: Some sites are slow
- Progress indicator shows status
```

---

## 📊 Example Output

### JSON Format:
```json
{
  "metadata": {
    "totalJobs": 145,
    "extractedAt": "2026-01-29T10:30:00Z",
    "firecrawlUrl": "http://localhost:3002"
  },
  "jobs": [
    {
      "title": "Telecaller - Inbound Sales",
      "company": "XYZ Ltd",
      "location": "Bangalore",
      "description": "Handle inbound sales calls...",
      "phone": "+91-9876543210",
      "email": "hr@xyz.com",
      "source": "indeed",
      "extractedAt": "2026-01-29T10:30:15Z"
    },
    ...145 more jobs
  ]
}
```

### CSV Format:
```
Title,Company,Location,Description,Phone,Email,Source,Extracted At
"Telecaller - Sales","XYZ Ltd","Bangalore","Handle calls...","+91-9876543210","hr@xyz.com",indeed,2026-01-29T10:30:15Z
```

---

## 🔒 Security Notes

### Data Privacy:
- ✅ All data stored **locally** in your browser
- ✅ **No data sent to external servers** (except target job sites)
- ✅ **No backend server to compromise**
- ✅ **No authentication/login required**
- ✅ Clear data anytime: "🗑️ Clear Data" button

### Browser Storage:
- Data persists in localStorage
- Can be cleared in browser settings
- Survives page refresh
- Lost when browser cache is cleared

---

## 📈 Performance

### Expected Times:
- **Health Check**: < 1 second
- **Single Portal Crawl**: 30-120 seconds (depends on site)
- **All 3 Portals**: 3-5 minutes
- **Data Processing**: < 1 second
- **Download**: < 1 second

### Optimization Tips:
1. Search for specific keywords (narrower scope)
2. Crawl one portal at a time for faster results
3. Close other browser tabs to reduce memory
4. Clear old data regularly

---

## 🎓 Learning Resources

### Understanding the Code:
1. **HTML Structure** (index.html)
   - Form inputs for portal selection
   - Result display tabs
   - Download buttons

2. **JavaScript Logic**
   - Firecrawl API calls
   - Job extraction using regex
   - LocalStorage persistence
   - UI state management

3. **API Integration**
   - Direct REST calls to Firecrawl
   - CORS handling
   - Response parsing

### Key Functions:
```javascript
startCrawl()           // Main crawling flow
crawlPortal()          // Crawl single portal
extractJobsFromContent()  // Parse and filter jobs
saveToStorage()        // Persist to localStorage
downloadJSON()         // Export as JSON
downloadCSV()          // Export as CSV
```

---

## 🌟 Features Checklist

- ✅ Frontend-only (no backend)
- ✅ Direct Firecrawl API calls
- ✅ Health check before crawling
- ✅ Support for 3 portals (Naukri, Indeed, Apna)
- ✅ Telecalling job filtering
- ✅ Structured data extraction
- ✅ Phone/Email extraction (with null handling)
- ✅ Results display (Preview, JSON, Downloads)
- ✅ localStorage persistence
- ✅ JSON export
- ✅ CSV export
- ✅ Copy to clipboard
- ✅ Progress indicator
- ✅ Error handling
- ✅ Responsive design
- ✅ Real-time UI updates

---

## 🔄 Next Steps

### Option 1: Enhance Job Extraction
```javascript
// Crawl individual job detail pages
// Extract from detail pages
// Get more complete data
```

### Option 2: Add More Portals
```javascript
// Add LinkedIn
// Add Monster
// Add Quikr
// Add other regional portals
```

### Option 3: Add Database
```javascript
// If you want persistent backend storage
// Add simple Node.js + MongoDB
// Export to database
```

### Option 4: Schedule Crawls
```javascript
// Browser can't schedule
// Use desktop automation (when browser is open)
// Or add simple backend for scheduling
```

---

## 📞 Support

### Common Issues:
1. **Firecrawl down**: Check Docker status
2. **Slow crawling**: Some sites are naturally slow
3. **No results**: Try different keywords
4. **Download fails**: Check browser download settings

### Debug Mode:
```javascript
// Open browser console (F12)
// Check console.log messages
// View appState in console
// Check localStorage
```

---

## 📝 Summary

You now have a **complete frontend-only system** that:
- ✅ Calls Firecrawl directly
- ✅ Crawls Naukri, Indeed, Apna
- ✅ Extracts telecalling jobs
- ✅ Stores data in browser
- ✅ Displays formatted JSON
- ✅ Exports as JSON/CSV
- ✅ No backend server needed

**Start now**: http://localhost:8080

---

**Status**: ✅ READY TO USE
**Last Updated**: 2026-01-29
**System Type**: Frontend-Only
