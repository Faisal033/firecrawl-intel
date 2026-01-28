# Windows PowerShell Quick Reference Card

## One-Page Cheat Sheet for Windows Users

### ⚠️ Important: PowerShell vs Bash

| Feature | Bash | PowerShell | Status |
|---------|------|-----------|--------|
| Line continuation | `\` | `` ` `` | ✓ Use backtick |
| List first 5 | `head -5` | `Select-Object -First 5` | ✓ Use Select-Object |
| JSON format | `jq '.'` | `ConvertTo-Json` | ✓ Use ConvertTo-Json |
| Port check | `lsof -i :3001` | `Test-NetConnection localhost -Port 3001` | ✓ Use Test-NetConnection |
| curl | `curl -X POST` | `curl.exe -X POST` | ✓ Use curl.exe |

---

## Quick Test (30 seconds)

```powershell
# Run automated test
.\scripts\test-local.ps1
```

---

## API Calls Template

### GET Request
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/ENDPOINT" -Method Get
$response.data | ConvertTo-Json
```

### POST Request
```powershell
$body = @{
    key = "value"
    nested = @{ field = "data" }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/ENDPOINT" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json
```

---

## Common Commands (Copy-Paste Ready)

### 1. Check Ports
```powershell
Test-NetConnection -ComputerName localhost -Port 3001
Test-NetConnection -ComputerName localhost -Port 3002
```

### 2. Create Competitor
```powershell
$body = @{
    name = "Company Name"
    website = "https://example.com"
    industry = "Tech"
    locations = @("Bangalore", "Mumbai")
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response.data._id  # Save this ID
```

### 3. Get All Competitors
```powershell
(Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" -Method Get).data | ConvertTo-Json
```

### 4. Get News (replace COMPETITOR_ID)
```powershell
$cid = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$cid/news?limit=5" -Method Get
$response.data | ConvertTo-Json
```

### 5. Get Signals (replace COMPETITOR_ID)
```powershell
$cid = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$cid/signals" -Method Get
$response.data | ConvertTo-Json
```

### 6. Get Threat Score (replace COMPETITOR_ID)
```powershell
$cid = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$cid/threat" -Method Get
$response.data | ConvertTo-Json
```

### 7. Get Threat Rankings
```powershell
(Invoke-RestMethod -Uri "http://localhost:3001/api/threat/rankings?limit=10" -Method Get).data | ConvertTo-Json
```

### 8. Dashboard Overview
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard/overview" -Method Get
$response.data | ConvertTo-Json
```

### 9. Geographic Hotspots
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/geography/hotspots?days=30" -Method Get
$response.data | ConvertTo-Json
```

### 10. Trigger Discovery (replace COMPETITOR_ID)
```powershell
$cid = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$cid/discover" `
    -Method POST -ContentType "application/json"
$response | ConvertTo-Json
```

### 11. Trigger Scraping (replace COMPETITOR_ID)
```powershell
$cid = "YOUR_COMPETITOR_ID"
$body = @{ limit = 5 } | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$cid/scrape" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json
```

### 12. Trigger Signals (replace COMPETITOR_ID)
```powershell
$cid = "YOUR_COMPETITOR_ID"
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/competitors/$cid/signals/create" `
    -Method POST -ContentType "application/json"
$response | ConvertTo-Json
```

---

## Setup Commands (First Time)

```powershell
# Terminal 1: Firecrawl
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl

# Terminal 2: Backend
npm install
npm run dev

# Terminal 3: Test
.\scripts\test-local.ps1
```

---

## Troubleshooting

### Error: "curl: command not found"
Use `curl.exe` instead:
```powershell
curl.exe -X GET http://localhost:3001/api/competitors
```

### Error: "Port 3001 already in use"
```powershell
# Kill process on port 3001
Stop-NetStatPort -Port 3001
# Or restart Node.js
npm run dev
```

### Error: "MongoDB connection failed"
```powershell
# Test connection directly
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✓')).catch(err => console.log('✗', err.message))"
```

### Error: "Firecrawl not responding"
```powershell
# Check if running
docker ps | Select-String firecrawl

# Restart
docker stop firecrawl
docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl
```

---

## Tips & Tricks

### Save Competitor ID to Variable
```powershell
$cid = "PASTE_ID_HERE"
# Now use: $cid in commands
```

### Format JSON Pretty
```powershell
$response | ConvertTo-Json -Depth 10
```

### Filter Results
```powershell
# Get only names
(Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" -Method Get).data | Select-Object name

# Get top 5 only
(Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" -Method Get).data | Select-Object -First 5
```

### Loop Through Results
```powershell
$competitors = (Invoke-RestMethod -Uri "http://localhost:3001/api/competitors" -Method Get).data
foreach ($competitor in $competitors) {
    Write-Host "Competitor: $($competitor.name)"
}
```

---

## Documentation Links

- **README.md** → Full feature overview + Windows PowerShell section
- **QUICKSTART.md** → 5-minute setup guide
- **API_REFERENCE.md** → Detailed endpoint documentation
- **ENGINEERING_SUMMARY.md** → Technical architecture
- **scripts/test-local.ps1** → Automated testing

---

**Last Updated:** January 28, 2026
**Compatibility:** PowerShell 5.1+ | Windows 10/11
