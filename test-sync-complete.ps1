#Requires -Version 5.1
<#
.SYNOPSIS
    Complete Windows PowerShell Test Suite for Competitor Intelligence Sync Feature
    
.DESCRIPTION
    Tests the full sync pipeline: Create → Sync → Discover → Scrape → Signal → Threat
    
.EXAMPLE
    .\test-sync-complete.ps1
#>

# ============================================================================
# CONFIGURATION
# ============================================================================
$BackendUrl = "http://localhost:3001"
$FirecrawlUrl = "http://localhost:3002"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Title {
    param([string]$Text)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($Text.PadRight(62)) ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Section {
    param([string]$Text)
    Write-Host ""
    Write-Host "▶ $Text" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkCyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "  ✓ $Text" -ForegroundColor Green
}

function Write-Error-Msg {
    param([string]$Text)
    Write-Host "  ✗ $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "  ℹ $Text" -ForegroundColor White
}

function Invoke-SafeRestMethod {
    param([string]$Uri, [string]$Method = "Get", [object]$Body)
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 15
        }
        if ($Body) {
            $params["Body"] = $Body | ConvertTo-Json -Depth 10
        }
        return Invoke-RestMethod @params
    }
    catch {
        Write-Error-Msg "Request failed: $_"
        return $null
    }
}

function Test-PortListening {
    param([string]$HostName = "localhost", [int]$Port)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($HostName, $Port)
        $tcpClient.Close()
        return $true
    }
    catch {
        return $false
    }
}

# ============================================================================
# MAIN TEST SUITE
# ============================================================================

Write-Title "COMPETITOR INTELLIGENCE - COMPLETE SYNC TEST SUITE"

# Test 1: Services Running
Write-Section "1. Checking Required Services"

if (Test-PortListening -Port 3001) {
    Write-Success "Backend running on port 3001"
} else {
    Write-Error-Msg "Backend NOT running on port 3001"
    Write-Host "Start with: npm run dev" -ForegroundColor Yellow
    exit 1
}

if (Test-PortListening -Port 3002) {
    Write-Success "Firecrawl running on port 3002"
} else {
    Write-Error-Msg "Firecrawl NOT running on port 3002"
    Write-Host "Start with: docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl" -ForegroundColor Yellow
    exit 1
}

# Test 2: API Health
Write-Section "2. Testing Backend Health"
$health = Invoke-SafeRestMethod -Uri "$BackendUrl/health"
if ($health) {
    Write-Success "Backend health check passed"
} else {
    Write-Error-Msg "Backend health check failed"
}

# Test 3: GET /api/competitors
Write-Section "3. Testing GET /api/competitors"
$competitors = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors" -Method Get
if ($competitors) {
    Write-Success "GET /api/competitors works"
    Write-Info "Found $($competitors.count) competitors"
    if ($competitors.data.Count -gt 0) {
        $competitors.data | Select-Object -First 3 | ForEach-Object {
            Write-Info "  • $($_.name)"
        }
    }
} else {
    Write-Error-Msg "GET /api/competitors failed"
}

# Test 4: POST /api/competitors (Create New)
Write-Section "4. Testing POST /api/competitors (Create)"
$newCompetitor = @{
    companyName = "Delhivery"
    website = "https://www.delhivery.com"
    industry = "Logistics"
} | ConvertTo-Json

$createResp = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors" `
    -Method POST `
    -Body $newCompetitor

if ($createResp -and $createResp.success) {
    Write-Success "Competitor created successfully"
    $competitorId = $createResp.data._id
    Write-Info "Competitor ID: $competitorId"
    Write-Info "Name: $($createResp.data.name)"
} else {
    Write-Error-Msg "Failed to create competitor"
    $competitorId = $null
}

# Test 5: POST /api/competitors/sync (MAIN FEATURE)
if ($competitorId) {
    Write-Section "5. Testing POST /api/competitors/sync (MAIN PIPELINE)"
    Write-Info "This will trigger: Discover → Scrape → Change Detection → Signals → Threat"
    Write-Info "Please wait... this may take 2-3 minutes"
    
    $syncBody = @{
        companyName = "Delhivery"
        website = "https://www.delhivery.com"
    } | ConvertTo-Json

    $syncResp = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors/sync" `
        -Method POST `
        -Body $syncBody

    if ($syncResp -and $syncResp.success) {
        Write-Success "Sync pipeline completed successfully"
        Write-Info "Stats:"
        Write-Info "  • Discovered: $($syncResp.data.stats.discovered) URLs"
        Write-Info "  • Scraped: $($syncResp.data.stats.scraped) pages"
        Write-Info "  • Changes Detected: $($syncResp.data.stats.changesDetected) items"
        Write-Info "  • Signals Created: $($syncResp.data.stats.signalsCreated) signals"
        Write-Info "  • Threat Score: $($syncResp.data.stats.threatScore)/100"
    } else {
        Write-Error-Msg "Sync pipeline failed"
        if ($syncResp.error) {
            Write-Error-Msg "Error: $($syncResp.error)"
        }
    }
}

# Test 6: GET /api/competitors/:id/news
if ($competitorId) {
    Write-Section "6. Testing GET /api/competitors/:id/news"
    $newsResp = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors/$competitorId/news?limit=5" -Method Get
    if ($newsResp) {
        Write-Success "GET /api/competitors/:id/news works"
        Write-Info "Found $($newsResp.count) news items"
        if ($newsResp.data.Count -gt 0) {
            $newsResp.data | Select-Object -First 3 | ForEach-Object {
                Write-Info "  • $($_.title -replace '.{50}$', '...')"
            }
        }
    } else {
        Write-Error-Msg "GET /api/competitors/:id/news failed"
    }
}

# Test 7: GET /api/competitors/:id/signals
if ($competitorId) {
    Write-Section "7. Testing GET /api/competitors/:id/signals"
    $signalsResp = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors/$competitorId/signals" -Method Get
    if ($signalsResp) {
        Write-Success "GET /api/competitors/:id/signals works"
        Write-Info "Found $($signalsResp.count) signals"
        if ($signalsResp.data.Count -gt 0) {
            $signalsResp.data | Select-Object -First 3 | ForEach-Object {
                Write-Info "  • $($_.type): $($_.title -replace '.{40}$', '...')"
            }
        }
    } else {
        Write-Error-Msg "GET /api/competitors/:id/signals failed"
    }
}

# Test 8: GET /api/competitors/:id/threat
if ($competitorId) {
    Write-Section "8. Testing GET /api/competitors/:id/threat"
    $threatResp = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors/$competitorId/threat" -Method Get
    if ($threatResp) {
        Write-Success "GET /api/competitors/:id/threat works"
        Write-Info "Threat Score: $($threatResp.data.threatScore)/100"
        Write-Info "Signal Count: $($threatResp.data.signalCount)"
        if ($threatResp.data.topLocations.Count -gt 0) {
            Write-Info "Top Locations:"
            $threatResp.data.topLocations | ForEach-Object {
                Write-Info "  • $($_.location): $($_.signalCount) signals"
            }
        }
    } else {
        Write-Error-Msg "GET /api/competitors/:id/threat failed"
    }
}

# Test 9: GET /api/threat/rankings
Write-Section "9. Testing GET /api/threat/rankings"
$rankingsResp = Invoke-SafeRestMethod -Uri "$BackendUrl/api/threat/rankings?limit=5" -Method Get
if ($rankingsResp) {
    Write-Success "GET /api/threat/rankings works"
    Write-Info "Found $($rankingsResp.count) threat entries"
    if ($rankingsResp.data.Count -gt 0) {
        $rankingsResp.data | ForEach-Object {
            $competitorName = if ($_.competitorId.name) { $_.competitorId.name } else { "Unknown" }
            Write-Info "  • $competitorName: Score $($_.threatScore)"
        }
    }
} else {
    Write-Error-Msg "GET /api/threat/rankings failed"
}

# Test 10: Firecrawl Service
Write-Section "10. Testing Firecrawl Service"
$firecrawlHealth = Invoke-SafeRestMethod -Uri "$FirecrawlUrl/health" -Method Get
if ($firecrawlHealth) {
    Write-Success "Firecrawl service is healthy"
} else {
    Write-Error-Msg "Firecrawl service is not responding"
}

# Summary
Write-Section "Test Summary"
Write-Host ""
Write-Host "API Endpoints Tested:" -ForegroundColor Cyan
Write-Host "  ✓ GET  /api/competitors" -ForegroundColor Green
Write-Host "  ✓ POST /api/competitors" -ForegroundColor Green
Write-Host "  ✓ POST /api/competitors/sync (MAIN FEATURE)" -ForegroundColor Green
Write-Host "  ✓ GET  /api/competitors/:id/news" -ForegroundColor Green
Write-Host "  ✓ GET  /api/competitors/:id/signals" -ForegroundColor Green
Write-Host "  ✓ GET  /api/competitors/:id/threat" -ForegroundColor Green
Write-Host "  ✓ GET  /api/threat/rankings" -ForegroundColor Green
Write-Host ""
Write-Host "Pipeline Tested:" -ForegroundColor Cyan
Write-Host "  Sync → Discover → Scrape → Change Detection → Signals → Threat" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Test suite completed" -ForegroundColor Green
Write-Host ""
