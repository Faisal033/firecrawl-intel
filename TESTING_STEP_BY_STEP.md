# TESTING INSTRUCTIONS - STEP BY STEP

## Prerequisites Check

```powershell
# 1. Check Node.js installed
node --version                    # Should be 14+

# 2. Check npm installed
npm --version                     # Should be 6+

# 3. Check Docker installed
docker --version                  # Should be 20+

# 4. Check .env file exists
Test-Path .\.env                  # Should be True

# 5. Check MongoDB URI in .env
$env = Get-Content .\.env; $env | Select-String "MONGODB_URI"  # Should show connection string
```

---

## Step 1: Start Firecrawl (Terminal 1)

```powershell
# Start Firecrawl Docker container on port 3002
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl

# Wait 10 seconds for startup
Start-Sleep -Seconds 10

# Verify Firecrawl is running
Invoke-RestMethod -Uri "http://localhost:3002/health" -Method Get
# Expected: { "status": "success" } or similar
```

---

## Step 2: Start Backend (Terminal 2)

```powershell
# Start the backend server on port 3001
npm run dev

# Wait for "Server listening on port 3001" message
# You should see green checkmark when connected to MongoDB
```

---

## Step 3: Run Full Test Suite (Terminal 3)

```powershell
# Run the complete test suite (10 tests)
.\test-sync-complete.ps1

# Expected output:
# ✓ Services running
# ✓ GET /api/competitors
# ✓ POST /api/competitors
# ✓ POST /api/competitors/sync (MAIN)
# ✓ GET /api/competitors/:id/news
# ✓ GET /api/competitors/:id/signals
# ✓ GET /api/competitors/:id/threat
# ✓ GET /api/threat/rankings
# ✓ Firecrawl health
# ✓ All tests passed
```

---

## Step 4: Manual Sync Test

```powershell
# Create the sync request
$body = @{
    companyName = "Delhivery"
    website = "https://www.delhivery.com"
} | ConvertTo-Json

# Call the sync endpoint
$response = Invoke-RestMethod `
    -Uri "http://localhost:3001/api/competitors/sync" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Display the response
$response | ConvertTo-Json -Depth 10

# Expected output:
# {
#   "success": true,
#   "data": {
#     "discovered": 45,
#     "scraped": 20,
#     "changesDetected": 5,
#     "signalsCreated": 18,
#     "threatScore": 72
#   }
# }
```

---

## Step 5: Verify MongoDB Data

```powershell
# Connect to MongoDB and check collections
# You can do this via:
# 1. MongoDB Atlas UI (cloud)
# 2. MongoDB Compass (GUI)
# 3. mongo shell command line

# Check Competitor collection
db.competitors.findOne()

# Check News collection
db.news.countDocuments()           # Should be > 0

# Check Changes collection
db.changes.countDocuments()        # Should be >= 0

# Check Signals collection
db.signals.countDocuments()        # Should be > 0

# Check Threat collection
db.threats.findOne()
```

---

## Step 6: Test Each Endpoint Individually

### Get All Competitors
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" -Method Get | ConvertTo-Json
```

### Get Competitor News
```powershell
# First, get a competitor ID from the above
$competitorId = "PASTE_ID_HERE"

Invoke-RestMethod `
    -Uri "http://localhost:3001/api/competitors/$competitorId/news?limit=5" `
    -Method Get | ConvertTo-Json -Depth 5
```

### Get Competitor Signals
```powershell
Invoke-RestMethod `
    -Uri "http://localhost:3001/api/competitors/$competitorId/signals" `
    -Method Get | ConvertTo-Json -Depth 5
```

### Get Competitor Threat
```powershell
Invoke-RestMethod `
    -Uri "http://localhost:3001/api/competitors/$competitorId/threat" `
    -Method Get | ConvertTo-Json -Depth 5
```

### Get Threat Rankings (Top 10)
```powershell
Invoke-RestMethod `
    -Uri "http://localhost:3001/api/threat/rankings?limit=10" `
    -Method Get | ConvertTo-Json -Depth 5
```

---

## Step 7: Verify Implementation

```powershell
# Run the verification script
.\verify-implementation.ps1

# Expected output:
# ✓ IMPLEMENTATION FILES
#   ✓ Sync orchestration service
#   ✓ Models file with Change schema
#   ✓ API routes with sync endpoint
#   ✓ PowerShell test suite
# ✓ DOCUMENTATION FILES
#   ✓ Complete implementation guide
#   ✓ Quick reference card
#   ✓ Detailed code changes
# ✓ CODE VERIFICATION
#   ✓ Change schema defined
#   ✓ Change model exported
#   ✓ syncCompetitor function
#   ✓ detectChanges function
#   ✓ detectChangeType function
#   ✓ syncCompetitor imported
#   ✓ Sync endpoint defined
#   ✓ Change model imported
#   ✓ createSignalFromChange function
# ✓ PIPELINE STAGES
#   ✓ Discovery stage
#   ✓ Scraping stage
#   ✓ Change Detection stage
#   ✓ Signal Generation stage
#   ✓ Threat Computation stage
#
# SUMMARY
# Tests Passed: 23/23
# Tests Failed: 0/23
# Pass Rate: 100%
# ✅ ALL CHECKS PASSED - IMPLEMENTATION COMPLETE
```

---

## Troubleshooting

### Port 3001 Not Listening
```powershell
# Check if process is running
Get-Process | Where-Object { $_.ProcessName -eq "node" }

# Check if port is in use
netstat -ano | findstr :3001

# Kill any process on port 3001
Stop-Process -Name node -Force

# Restart backend
npm run dev
```

### Port 3002 Not Listening
```powershell
# Check if Docker container is running
docker ps | grep firecrawl

# If not running, start it
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl

# If already exists, restart it
docker restart firecrawl

# Check logs
docker logs firecrawl
```

### MongoDB Connection Fails
```powershell
# Test connection directly
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(()=>console.log('✓ Connected')).catch(e=>console.log('✗',e.message))"

# Check .env file
Get-Content .\.env | Select-String "MONGODB_URI"

# Verify connection string format
# Should be: mongodb+srv://user:pass@cluster.mongodb.net/database
```

### Test Suite Fails
```powershell
# Run with more debugging
$VerbosePreference = "Continue"
.\test-sync-complete.ps1

# Check individual service status
Test-NetConnection -ComputerName localhost -Port 3001
Test-NetConnection -ComputerName localhost -Port 3002
```

---

## Success Checklist

Run these checks to confirm everything works:

```powershell
# 1. Services running?
Write-Host "Services:"
Test-NetConnection -ComputerName localhost -Port 3001  # Should be True
Test-NetConnection -ComputerName localhost -Port 3002  # Should be True

# 2. API responding?
Write-Host "API Health:"
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get

# 3. Firecrawl responding?
Write-Host "Firecrawl Health:"
Invoke-RestMethod -Uri "http://localhost:3002/health" -Method Get

# 4. MongoDB connected?
Write-Host "MongoDB:"
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(()=>console.log('✓')).catch(e=>console.log('✗',e.message))"

# 5. Sync endpoint works?
Write-Host "Sync Endpoint:"
$body = @{ companyName="Test"; website="https://test.com" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/sync" `
    -Method POST -ContentType "application/json" -Body $body

# All should pass!
```

---

## Performance Test

```powershell
# Time a full sync
$startTime = Get-Date

$body = @{
    companyName = "Delhivery"
    website = "https://www.delhivery.com"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3001/api/competitors/sync" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host "Sync completed in: $duration seconds"
Write-Host "URLs discovered: $($response.data.discovered)"
Write-Host "Pages scraped: $($response.data.scraped)"
Write-Host "Changes detected: $($response.data.changesDetected)"
Write-Host "Signals created: $($response.data.signalsCreated)"
Write-Host "Threat score: $($response.data.threatScore)/100"

# Expected: 120-180 seconds (2-3 minutes)
```

---

## Full Test Flow (Copy-Paste Ready)

```powershell
# === SETUP ===
Write-Host "Starting full test flow..." -ForegroundColor Green

# === START SERVICES ===
Write-Host "1. Starting Firecrawl..." -ForegroundColor Yellow
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl 2>$null
Start-Sleep -Seconds 5

# === RUN TESTS ===
Write-Host "2. Running full test suite..." -ForegroundColor Yellow
.\test-sync-complete.ps1

# === VERIFY ===
Write-Host "3. Verifying implementation..." -ForegroundColor Yellow
.\verify-implementation.ps1

Write-Host ""
Write-Host "✅ Full test flow complete!" -ForegroundColor Green
```

---

## When Everything Works

You'll see:

```
✅ IMPLEMENTATION FILES
✅ DOCUMENTATION FILES
✅ CODE VERIFICATION
✅ PIPELINE STAGES
✅ Tests Passed: 23/23
✅ Pass Rate: 100%
✅ ALL CHECKS PASSED - IMPLEMENTATION COMPLETE
```

MongoDB will contain:
- ✅ Competitor collection (1 record)
- ✅ News collection (45+ records)
- ✅ Page collection (20+ records)
- ✅ Change collection (5+ records)
- ✅ Signal collection (18+ records)
- ✅ Threat collection (1 record)

---

## Documentation Reference

- **Quick reference**: [SYNC_QUICK_REFERENCE.md](SYNC_QUICK_REFERENCE.md)
- **Full guide**: [SYNC_IMPLEMENTATION.md](SYNC_IMPLEMENTATION.md)
- **Code review**: [CODE_CHANGES_DETAILED.md](CODE_CHANGES_DETAILED.md)
- **Troubleshooting**: [SYNC_QUICK_REFERENCE.md#troubleshooting](SYNC_QUICK_REFERENCE.md)

---

**Ready to test!** Start with Terminal 1, then Terminal 2, then Terminal 3.
