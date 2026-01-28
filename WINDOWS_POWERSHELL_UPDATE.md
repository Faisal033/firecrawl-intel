# Windows PowerShell Support - Documentation Update Summary

## What Was Added

### 1. README.md - New Section: "Windows PowerShell Guide"

Added comprehensive guide explaining:
- **Port Checking:** Using `Test-NetConnection` instead of bash equivalents
- **Option A: Invoke-RestMethod** - PowerShell-native approach (recommended)
- **Option B: curl.exe** - Bash-style commands using explicit `curl.exe`
- **10 Complete Examples:**
  - Create Competitor
  - Get Competitors
  - Get News
  - Get Signals
  - Get Threat Score
  - Get Threat Rankings
  - Trigger Discovery (POST)
  - Trigger Scraping (POST)
  - Trigger Signal Creation (POST)
  - Trigger Threat Computation (POST)
  - Firecrawl Direct Call
- **Running Test Script:** `.\scripts\test-local.ps1`

**Key emphasis:** The section clearly warns about:
- `curl` is an alias in PowerShell → Use `curl.exe` for bash-style flags
- Use Invoke-RestMethod for native PowerShell approach
- All commands work in PowerShell 5.1+ and PowerShell 7

---

### 2. QUICKSTART.md - Updated Step 5: "Manual Testing"

Replaced generic curl examples with:
- **Three test options:**
  1. Run PowerShell Test Script (automatic)
  2. Use Invoke-RestMethod (recommended)
  3. Use curl.exe (bash-style)

- **Explicit warning section:**
  ```
  ⚠️ IMPORTANT: Windows PowerShell Command Syntax
  PowerShell uses different syntax than bash. Choose ONE method:
  ```

- **6 Complete Code Examples** with proper PowerShell syntax:
  1. Create Competitor
  2. Get Competitors
  3. Discover URLs
  4. Scrape Content
  5. Generate Signals
  6. Get Threat Rankings

All examples use proper backtick line continuation (`) not bash backslash (\)

---

### 3. scripts/test-local.ps1 - New Test Automation Script

**Purpose:** Automated testing that works on Windows 10/11 PowerShell

**Features:**
- ✓ Port availability checks (3001, 3002, 3000) using `Test-NetConnection`
- ✓ Backend health check
- ✓ API endpoint tests (no external tools required)
- ✓ Proper error handling
- ✓ Colored output for readability
- ✓ JSON formatting with "first 5 items" display
- ✓ Companion-specific endpoint testing
- ✓ Firecrawl service verification

**Tested Endpoints:**
1. GET /health
2. GET /api/competitors
3. GET /api/threat/rankings
4. GET /api/dashboard/overview
5. GET /api/geography/hotspots
6. GET /api/competitors/:id/news
7. GET /api/competitors/:id/signals
8. GET /api/competitors/:id/threat
9. GET http://localhost:3002/health (Firecrawl)

**Usage:**
```powershell
.\scripts\test-local.ps1
```

**Output Features:**
- ASCII-art formatted sections with borders
- Color-coded messages (success/error/info)
- KPI display for dashboard
- Location hotspots display
- Next steps guidance
- Documentation links

---

## Key Differences from Bash

### Command Syntax

| Task | Bash | PowerShell |
|------|------|-----------|
| Line continuation | `\` at end | `` ` `` at end |
| JSON conversion | `jq` or `|head` | `ConvertTo-Json` or `Select-Object -First N` |
| Port checking | `netstat` or `lsof` | `Test-NetConnection` |
| REST calls | `curl -X POST -d '{json}'` | `Invoke-RestMethod -Body $body` |
| Pipe to curl | `curl ... \| head -c 500` | `Invoke-RestMethod ... \| Select-Object -First 5` |
| Environment variables | `${VAR}` | `$env:VAR` |

### Common PowerShell Pitfalls (Now Documented)

1. **`curl` alias** → Must use `curl.exe` for bash flags
2. **`head` command** → Use `Select-Object -First N`
3. **`||` operator** → Use `;` or `if` statements
4. **Backslash line continuation** → Use backtick `` ` ``
5. **Raw JSON strings** → Use `ConvertTo-Json` for proper escaping

---

## Testing the Changes

### Quick Test
```powershell
# 1. Ensure backend and Firecrawl are running
npm run dev  # Terminal 1
docker run -d -p 3002:3000 firecrawl/firecrawl  # Terminal 2

# 2. Run the test script (Terminal 3)
.\scripts\test-local.ps1
```

### Expected Output
```
╔════════════════════════════════════════════════════════════════╗
║ COMPETITOR INTELLIGENCE - LOCAL ENVIRONMENT TEST              ║
╚════════════════════════════════════════════════════════════════╝

▶ 1. Checking Port Availability
─────────────────────────────────────────────────────────────────
  ✓ Backend is listening on port 3001
  ✓ Firecrawl is listening on port 3002

▶ 2. Testing Backend Health Check
─────────────────────────────────────────────────────────────────
  ✓ Backend health check passed

▶ 3. Testing API Endpoints
─────────────────────────────────────────────────────────────────
  ℹ Testing: GET /api/competitors
  ✓ GET /api/competitors - Success
  ℹ Found X competitors
  [JSON output...]

[... more tests ...]
```

---

## Files Modified

1. **README.md**
   - Added 250+ lines in new "Windows PowerShell Guide" section
   - Placed after API Documentation section
   - Before E2E Ingestion Test section

2. **QUICKSTART.md**
   - Replaced "Manual Testing" section (100+ lines)
   - Added explicit PowerShell syntax warnings
   - Added 6 complete code examples

3. **scripts/test-local.ps1** (NEW FILE)
   - 350+ lines of PowerShell test automation
   - Compatible with PowerShell 5.1+ and 7+
   - No external dependencies (only built-in cmdlets)

---

## No Backend Changes

✓ All API logic unchanged
✓ No database modifications
✓ No service layer changes
✓ Pure documentation + test script additions

---

## Windows User Workflow

### First Time (5 min)
```powershell
# 1. Read QUICKSTART.md (2 min)
# 2. Run setup (2 min)
npm install
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl
npm run dev

# 3. Run test script (1 min)
.\scripts\test-local.ps1
```

### Testing After Changes (1 min)
```powershell
# Option 1: Quick test
.\scripts\test-local.ps1

# Option 2: Manual command (copy from README Windows PowerShell Guide)
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" -Method Get
$response.data | ConvertTo-Json
```

---

## Validation Checklist

- ✓ All commands tested on Windows PowerShell 5.1
- ✓ All commands tested on PowerShell 7+
- ✓ No bash operators (||, &&, \) used
- ✓ No external CLI tools required (no head, sed, etc.)
- ✓ Proper JSON formatting with ConvertTo-Json
- ✓ Backtick line continuation used throughout
- ✓ Test script runs independently without user input required
- ✓ Colored output for clarity
- ✓ Error handling for failed connections
- ✓ Port availability checks using built-in cmdlets

---

## Next Steps for Users

After reading/running these changes:

1. **Follow QUICKSTART.md** - Windows users now have clear instructions
2. **Run `.\scripts\test-local.ps1`** - Verify environment is working
3. **Copy examples from README** - Use Invoke-RestMethod for API calls
4. **No more bash errors** - All commands native to PowerShell

---

**Status:** Ready for Windows PowerShell users on Windows 10/11
