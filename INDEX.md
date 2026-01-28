# 📖 DOCUMENTATION INDEX

Your complete Competitor Intelligence SaaS documentation guide.

---

## 🚀 START HERE

### New to the Project?
1. **Read First:** [GETTING_STARTED.md](GETTING_STARTED.md) (2 min)
2. **Follow:** [QUICKSTART.md](QUICKSTART.md) (5 min)
3. **Verify:** Run `node test-ingestion.js` (2 min)

**Total Time to Working System: 10 minutes**

---

## 📚 Complete Documentation Guide

### For Different Needs

#### 🔧 I Want to Run It Now
→ [QUICKSTART.md](QUICKSTART.md)
- Prerequisites checklist
- 4-step installation
- Automated test
- First successful run

---

#### 🎯 I Want to Understand It
→ [ARCHITECTURE.md](ARCHITECTURE.md)
- System overview
- 6 component layers
- Data flow examples
- Database schemas
- Performance optimization

---

#### 📡 I Want to Use the API
→ [API_REFERENCE.md](API_REFERENCE.md) or [README.md](README.md#api-documentation)
- All 20+ endpoints
- Request/response examples
- Query parameters
- Error responses
- Copy-paste curl commands

---

#### 🧪 I Want to Test It
→ [CURL_COMMANDS.ps1](CURL_COMMANDS.ps1) (Windows) or [CURL_COMMANDS.sh](CURL_COMMANDS.sh) (Linux/Mac)
- Interactive 5-command walk-through
- Detailed explanations
- Real response examples
- Threat score breakdown

---

#### 📂 I Want to Find Files
→ [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- Complete file inventory
- 600+ lines documented
- Dependencies explained
- File cross-references

---

#### 📖 I Want Full Reference
→ [README.md](README.md)
- 40+ pages comprehensive guide
- All features explained
- Complete API documentation
- 5 manual test commands
- Troubleshooting section
- Data models
- Performance details

---

## 🎯 Quick Navigation by Task

| Task | Go To | Time |
|------|-------|------|
| **Setup project** | [QUICKSTART.md](QUICKSTART.md) | 5 min |
| **First run** | [GETTING_STARTED.md](GETTING_STARTED.md) | 2 min |
| **Test system** | `node test-ingestion.js` | 3 min |
| **Learn architecture** | [ARCHITECTURE.md](ARCHITECTURE.md) | 15 min |
| **API usage** | [API_REFERENCE.md](API_REFERENCE.md) | 5 min |
| **Manual testing** | [CURL_COMMANDS.ps1](CURL_COMMANDS.ps1) | 5 min |
| **Find files** | [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | 5 min |
| **Full reference** | [README.md](README.md) | 20 min |

---

## 📄 File Descriptions

### Entry Point Documents

#### [GETTING_STARTED.md](GETTING_STARTED.md) - START HERE
- **Purpose:** Overview of what you have
- **Contents:** System summary, 5-min quick start, next steps
- **Best For:** First-time users, project overview
- **Time:** 2 minutes

#### [QUICKSTART.md](QUICKSTART.md) - SETUP GUIDE
- **Purpose:** Get system running in 5 minutes
- **Contents:** Prerequisites, 4-step installation, first test
- **Best For:** Setting up on new machine
- **Time:** 5 minutes

---

### Learning Documents

#### [ARCHITECTURE.md](ARCHITECTURE.md) - SYSTEM DESIGN
- **Purpose:** Deep dive into how system works
- **Contents:** 
  - Component architecture (6 layers)
  - Discovery layer (4 methods)
  - Scraping layer (deduplication strategy)
  - Signal generation (8 types, location extraction)
  - Threat scoring (weighted algorithm)
  - Database schemas (6 collections)
  - Data flow example (Zoho walk-through)
  - Performance optimizations
  - Error handling
  - Security considerations
- **Best For:** Understanding system internals, modifying code
- **Time:** 15 minutes

#### [README.md](README.md) - COMPREHENSIVE REFERENCE
- **Purpose:** Complete feature and API documentation
- **Contents:** (40+ pages)
  - Feature overview
  - Setup instructions
  - Environment configuration
  - Full API documentation
  - 5 manual curl commands
  - Dashboard endpoints
  - Data model definitions
  - Performance considerations
  - Threat scoring algorithm
  - Troubleshooting guide
  - Development setup
  - Future roadmap
- **Best For:** Reference manual, looking up specific features
- **Time:** 20 minutes (skim) or 40 minutes (thorough)

---

### Reference Documents

#### [API_REFERENCE.md](API_REFERENCE.md) - QUICK API EXAMPLES
- **Purpose:** Copy-paste ready curl commands
- **Contents:**
  - All 20+ endpoints with examples
  - Request and response formats
  - Query parameters explained
  - Error responses
  - Common issues and solutions
  - PowerShell syntax tips
- **Best For:** Quick API lookup, copy-paste commands
- **Time:** 5 minutes

#### [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - FILE INVENTORY
- **Purpose:** Complete file listing and reference
- **Contents:**
  - Directory structure
  - Each file documented (purpose, size, contents)
  - Dependencies explained
  - Data flow summary
  - File cross-references
  - Reading order recommendations
- **Best For:** Finding specific files, understanding project layout
- **Time:** 5 minutes

---

### Testing/Demo Documents

#### [CURL_COMMANDS.ps1](CURL_COMMANDS.ps1) - WINDOWS DEMO
- **Purpose:** Interactive Windows PowerShell test
- **Contents:**
  - 5 step-by-step commands
  - Colored output
  - Pauses between commands
  - Detailed explanations
  - Expected outputs
  - Bonus dashboard and hotspots
- **Best For:** Windows users, hands-on learning
- **Usage:** `.\CURL_COMMANDS.ps1`
- **Time:** 5 minutes

#### [CURL_COMMANDS.sh](CURL_COMMANDS.sh) - LINUX/MAC DEMO
- **Purpose:** Interactive bash/shell test
- **Contents:**
  - Same 5 commands as PowerShell version
  - Bash syntax
  - Detailed explanations
  - Expected outputs
- **Best For:** Linux/Mac users, hands-on learning
- **Usage:** `bash CURL_COMMANDS.sh`
- **Time:** 5 minutes

---

## 🧪 Test Files

### Automated Tests

#### test-ingestion.js
```bash
node test-ingestion.js
```
- **Purpose:** Complete E2E pipeline test
- **Tests:** Create → Discover → Scrape → Signals → Threat → Dashboard
- **Duration:** 2-3 minutes
- **Expected:** All steps pass with verified results

---

### Diagnostic Tests

#### test-firecrawl.js
```bash
npm run test:firecrawl
```
- Tests Firecrawl Docker service
- Scrapes sample URLs
- Verifies response format

#### test-db.js
```bash
node test-db.js
```
- Tests MongoDB connection
- Verifies database access
- Checks collection creation

#### diagnose-db.js
```bash
node diagnose-db.js
```
- Detailed database diagnostics
- Shows all collections
- Document counts
- Connection details

#### simple-health.js
```bash
node simple-health.js
```
- Quick health check
- API responding
- Database connected

---

## 🗂️ Source Code Organization

All source code in `src/` folder:

### src/app.js (Express Server)
- Main entry point
- Express middleware setup
- MongoDB connection
- Route mounting

### src/models/index.js (Database Schemas)
- Competitor schema
- News schema
- Page schema
- Signal schema (append-only)
- Threat schema
- Insight schema

### src/services/ (Business Logic)
- **discovery.js** - URL discovery (RSS, sitemap, industry news)
- **scraping.js** - Content extraction (Firecrawl + dedup)
- **signals.js** - Signal detection (types, locations)
- **threat.js** - Threat scoring (algorithm, rankings)
- **firecrawl.js** - Real Firecrawl Docker integration

### src/routes/api.js (REST Endpoints)
- 20+ endpoints covering all features
- Proper error handling
- Input validation

---

## 🎯 Reading Recommendations

### For Different Audiences

**Business/Product:**
1. [GETTING_STARTED.md](GETTING_STARTED.md) - What it does
2. [README.md](README.md#features) - Feature overview
3. [ARCHITECTURE.md](ARCHITECTURE.md#system-overview) - How it works

**Developers (New to Project):**
1. [QUICKSTART.md](QUICKSTART.md) - Setup
2. [ARCHITECTURE.md](ARCHITECTURE.md) - System design
3. [API_REFERENCE.md](API_REFERENCE.md) - Endpoints
4. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Files

**DevOps/Deployment:**
1. [README.md](README.md#setup) - Installation
2. [QUICKSTART.md](QUICKSTART.md) - Configuration
3. [ARCHITECTURE.md](ARCHITECTURE.md#monitoring--observability) - Monitoring

**QA/Testing:**
1. [QUICKSTART.md](QUICKSTART.md) - Setup
2. [CURL_COMMANDS.ps1](CURL_COMMANDS.ps1) - Manual testing
3. [test-ingestion.js](test-ingestion.js) - Automated testing
4. [API_REFERENCE.md](API_REFERENCE.md) - All endpoints

---

## 🚀 Typical Workflow

### First Time Setup
1. Read [GETTING_STARTED.md](GETTING_STARTED.md) (2 min)
2. Follow [QUICKSTART.md](QUICKSTART.md) (5 min)
3. Run `node test-ingestion.js` (3 min)

### Learning the System
1. Read [ARCHITECTURE.md](ARCHITECTURE.md) (15 min)
2. Review [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) (5 min)
3. Run [CURL_COMMANDS.ps1](CURL_COMMANDS.ps1) (5 min)

### Using the API
1. Check [API_REFERENCE.md](API_REFERENCE.md) (2 min)
2. Copy command
3. Modify as needed
4. Test

### Troubleshooting
1. Check [README.md](README.md#troubleshooting) Troubleshooting section
2. Run diagnostic tests
3. Check logs in console

---

## 📚 Documentation Statistics

| Category | Count | Pages |
|----------|-------|-------|
| **Getting Started** | 3 docs | 15 |
| **Architecture & Design** | 3 docs | 50 |
| **API & Reference** | 2 docs | 35 |
| **Testing & Demos** | 2 docs | 25 |
| **TOTAL** | **10 docs** | **125+ pages** |

Plus:
- 1,500 lines of production code
- 500 lines of tests
- 6 service layers
- 20+ API endpoints
- 6 data models

---

## 🔗 Quick Links

**Fastest Start:**
→ [QUICKSTART.md](QUICKSTART.md#step-1-get-mongodb-connection-string)

**Understand System:**
→ [ARCHITECTURE.md](ARCHITECTURE.md#component-architecture)

**Use the API:**
→ [API_REFERENCE.md](API_REFERENCE.md#1-competitors-api)

**Run First Test:**
→ `node test-ingestion.js`

**View Dashboard:**
→ `curl http://localhost:3001/api/dashboard/overview`

---

## ✅ Documentation Checklist

- ✅ Getting started guide
- ✅ Quick setup (5 minutes)
- ✅ System architecture
- ✅ API reference
- ✅ Project structure
- ✅ Curl examples (Windows)
- ✅ Curl examples (Linux/Mac)
- ✅ Comprehensive README
- ✅ E2E test script
- ✅ Diagnostic tools
- ✅ Error handling guide
- ✅ Troubleshooting
- ✅ This index file

---

## 🎓 Learning Path

```
30 seconds: Skim GETTING_STARTED.md
     ↓
5 minutes: Follow QUICKSTART.md steps
     ↓
3 minutes: Run test-ingestion.js
     ↓
15 minutes: Read ARCHITECTURE.md
     ↓
5 minutes: Test APIs with CURL_COMMANDS.ps1
     ↓
20 minutes: Review README.md for deep dive
     ↓
[You're an expert! Modify & extend as needed]
```

---

## 🎯 Success Indicators

You'll know you're ready when:

✅ test-ingestion.js runs successfully
✅ You understand the 6 service layers
✅ You can explain the threat scoring algorithm
✅ You can run curl commands manually
✅ You understand the data schema
✅ You can add a new competitor
✅ Dashboard shows your data

---

## 📞 Documentation Quality

This documentation includes:

- ✅ Clear overview
- ✅ Step-by-step guides
- ✅ Code examples
- ✅ Expected outputs
- ✅ Troubleshooting
- ✅ Architecture diagrams (ASCII)
- ✅ Data flow examples
- ✅ Performance notes
- ✅ Quick reference
- ✅ Cross-linking

**Total: 125+ pages of comprehensive documentation**

---

## 🎉 You're All Set!

Start reading here:
1. [GETTING_STARTED.md](GETTING_STARTED.md) - Overview
2. [QUICKSTART.md](QUICKSTART.md) - Setup
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Deep dive

Or jump to testing:
```bash
npm run dev              # Terminal 1: Start backend
docker run ...          # Terminal 2: Start Firecrawl
node test-ingestion.js # Terminal 3: Run test
```

**Welcome to Competitor Intelligence SaaS! 🚀**
