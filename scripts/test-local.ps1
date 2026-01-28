#Requires -Version 5.1
<#
.SYNOPSIS
    Windows PowerShell Test Script for Competitor Intelligence System
    
.DESCRIPTION
    Tests local development environment for Node.js backend, Firecrawl, and MongoDB.
    - Checks if required ports are listening
    - Tests API endpoints with PowerShell-native commands
    - Handles JSON responses and displays first 5 items
    
.EXAMPLE
    .\scripts\test-local.ps1
    
.NOTES
    Requirements:
    - Backend running on port 3001 (npm run dev)
    - Firecrawl running on port 3002 (docker run -p 3002:3000 firecrawl/firecrawl)
    - MongoDB Atlas configured in .env
    
    Compatible with PowerShell 5.1+ on Windows 10/11
#>

# ============================================================================
# CONFIGURATION
# ============================================================================
$BackendUrl = "http://localhost:3001"
$FirecrawlUrl = "http://localhost:3002"
$BackendPort = 3001
$FirecrawlPort = 3002
$UIPort = 3000

# Colors for output
$Colors = @{
    Title = 'Cyan'
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'White'
    Separator = 'DarkCyan'
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Title {
    param([string]$Text)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Separator
    Write-Host "║ $($Text.PadRight(62)) ║" -ForegroundColor $Colors.Separator
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Separator
    Write-Host ""
}

function Write-Section {
    param([string]$Text)
    Write-Host ""
    Write-Host "▶ $Text" -ForegroundColor $Colors.Title
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor $Colors.Separator
}

function Write-Success {
    param([string]$Text)
    Write-Host "  ✓ $Text" -ForegroundColor $Colors.Success
}

function Write-Error-Message {
    param([string]$Text)
    Write-Host "  ✗ $Text" -ForegroundColor $Colors.Error
}

function Write-Info {
    param([string]$Text)
    Write-Host "  ℹ $Text" -ForegroundColor $Colors.Info
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

function Invoke-SafeRestMethod {
    param([string]$Uri, [string]$Method = "Get", [object]$Body)
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 10
        }
        if ($Body) {
            $params["Body"] = $Body | ConvertTo-Json -Depth 10
        }
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Error-Message "Failed to call $Uri - $($_.Exception.Message)"
        return $null
    }
}

function Display-JsonTruncated {
    param([object]$Data, [int]$MaxItems = 5)
    
    if ($null -eq $Data) {
        Write-Info "No data returned"
        return
    }
    
    # If it's an array, show first N items
    if ($Data -is [System.Collections.IEnumerable] -and $Data -isnot [string]) {
        $count = @($Data).Count
        if ($count -gt $MaxItems) {
            Write-Host ($Data | Select-Object -First $MaxItems | ConvertTo-Json -Depth 5) -ForegroundColor $Colors.Info
            Write-Info "... and $(($count - $MaxItems)) more items (showing first $MaxItems)"
        }
        else {
            Write-Host ($Data | ConvertTo-Json -Depth 5) -ForegroundColor $Colors.Info
        }
    }
    else {
        # Single object
        Write-Host ($Data | ConvertTo-Json -Depth 5) -ForegroundColor $Colors.Info
    }
}

# ============================================================================
# MAIN TESTS
# ============================================================================

Write-Title "COMPETITOR INTELLIGENCE - LOCAL ENVIRONMENT TEST"

# ============================================================================
# TEST 1: PORT AVAILABILITY
# ============================================================================

Write-Section "1. Checking Port Availability"

Write-Host "  Checking port $BackendPort (Backend)..." -ForegroundColor $Colors.Info
if (Test-PortListening -Port $BackendPort) {
    Write-Success "Backend is listening on port $BackendPort"
}
else {
    Write-Error-Message "Backend NOT listening on port $BackendPort"
    Write-Info "Start with: npm run dev"
}

Write-Host "  Checking port $FirecrawlPort (Firecrawl)..." -ForegroundColor $Colors.Info
if (Test-PortListening -Port $FirecrawlPort) {
    Write-Success "Firecrawl is listening on port $FirecrawlPort"
}
else {
    Write-Error-Message "Firecrawl NOT listening on port $FirecrawlPort"
    Write-Info "Start with: docker run -d -p 3002:3000 --name firecrawl firecrawl/firecrawl"
}

# ============================================================================
# TEST 2: BACKEND HEALTH
# ============================================================================

Write-Section "2. Testing Backend Health Check"

$health = Invoke-SafeRestMethod -Uri "$BackendUrl/health"
if ($health) {
    Write-Success "Backend health check passed"
    Display-JsonTruncated -Data $health
}
else {
    Write-Error-Message "Backend health check failed"
}

# ============================================================================
# TEST 3: API ENDPOINTS
# ============================================================================

Write-Section "3. Testing API Endpoints"

# 3A: Get Competitors
Write-Host "  Testing: GET /api/competitors" -ForegroundColor $Colors.Info
$competitors = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors"
if ($competitors) {
    Write-Success "GET /api/competitors - Success"
    Write-Info "Found $($competitors.count) competitors"
    if ($competitors.data.Count -gt 0) {
        Display-JsonTruncated -Data $competitors.data -MaxItems 3
        $firstCompetitor = $competitors.data[0]
    }
}
else {
    Write-Error-Message "GET /api/competitors - Failed"
}

# 3B: Get Threat Rankings
Write-Host "  Testing: GET /api/threat/rankings" -ForegroundColor $Colors.Info
$rankings = Invoke-SafeRestMethod -Uri "$BackendUrl/api/threat/rankings?limit=5"
if ($rankings) {
    Write-Success "GET /api/threat/rankings - Success"
    Write-Info "Found $($rankings.count) threat entries"
    if ($rankings.data.Count -gt 0) {
        Display-JsonTruncated -Data $rankings.data -MaxItems 3
    }
}
else {
    Write-Error-Message "GET /api/threat/rankings - Failed"
}

# 3C: Get Dashboard Overview
Write-Host "  Testing: GET /api/dashboard/overview" -ForegroundColor $Colors.Info
$dashboard = Invoke-SafeRestMethod -Uri "$BackendUrl/api/dashboard/overview"
if ($dashboard) {
    Write-Success "GET /api/dashboard/overview - Success"
    if ($dashboard.data.kpis) {
        Write-Host "  KPIs:" -ForegroundColor $Colors.Info
        Write-Host "    • Competitors: $($dashboard.data.kpis.competitors)" -ForegroundColor $Colors.Info
        Write-Host "    • News Items: $($dashboard.data.kpis.newsItems)" -ForegroundColor $Colors.Info
        Write-Host "    • Signals: $($dashboard.data.kpis.signals)" -ForegroundColor $Colors.Info
        Write-Host "    • High Threats: $($dashboard.data.kpis.highThreats)" -ForegroundColor $Colors.Info
    }
}
else {
    Write-Error-Message "GET /api/dashboard/overview - Failed"
}

# 3D: Geographic Hotspots
Write-Host "  Testing: GET /api/geography/hotspots" -ForegroundColor $Colors.Info
$hotspots = Invoke-SafeRestMethod -Uri "$BackendUrl/api/geography/hotspots?days=30"
if ($hotspots) {
    Write-Success "GET /api/geography/hotspots - Success"
    Write-Info "Found $($hotspots.data.Count) geographic hotspots"
    if ($hotspots.data.Count -gt 0) {
        Display-JsonTruncated -Data $hotspots.data -MaxItems 3
    }
}
else {
    Write-Error-Message "GET /api/geography/hotspots - Failed"
}

# ============================================================================
# TEST 4: DETAILED COMPETITOR TESTS (if competitors exist)
# ============================================================================

if ($firstCompetitor) {
    Write-Section "4. Testing Competitor-Specific Endpoints"
    
    $competitorId = $firstCompetitor._id
    Write-Info "Using competitor: $($firstCompetitor.name) ($competitorId)"
    
    # 4A: Get News
    Write-Host "  Testing: GET /api/competitors/:id/news" -ForegroundColor $Colors.Info
    $news = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors/$competitorId/news?limit=5"
    if ($news) {
        Write-Success "GET /api/competitors/:id/news - Success"
        Write-Info "Found $($news.count) news items"
        if ($news.data.Count -gt 0) {
            Display-JsonTruncated -Data $news.data -MaxItems 3
        }
    }
    else {
        Write-Error-Message "GET /api/competitors/:id/news - Failed"
    }
    
    # 4B: Get Signals
    Write-Host "  Testing: GET /api/competitors/:id/signals" -ForegroundColor $Colors.Info
    $signals = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors/$competitorId/signals"
    if ($signals) {
        Write-Success "GET /api/competitors/:id/signals - Success"
        Write-Info "Found $($signals.count) signals"
        if ($signals.data.Count -gt 0) {
            Display-JsonTruncated -Data $signals.data -MaxItems 3
        }
    }
    else {
        Write-Error-Message "GET /api/competitors/:id/signals - Failed"
    }
    
    # 4C: Get Threat
    Write-Host "  Testing: GET /api/competitors/:id/threat" -ForegroundColor $Colors.Info
    $threat = Invoke-SafeRestMethod -Uri "$BackendUrl/api/competitors/$competitorId/threat"
    if ($threat) {
        Write-Success "GET /api/competitors/:id/threat - Success"
        Write-Host "  Threat Score: $($threat.data.threatScore)/100" -ForegroundColor $Colors.Info
        Write-Host "  Signal Count: $($threat.data.signalCount)" -ForegroundColor $Colors.Info
        if ($threat.data.topLocations) {
            Write-Host "  Top Locations:" -ForegroundColor $Colors.Info
            $threat.data.topLocations | ForEach-Object {
                Write-Host "    • $($_.location): $($_.signalCount) signals" -ForegroundColor $Colors.Info
            }
        }
    }
    else {
        Write-Error-Message "GET /api/competitors/:id/threat - Failed"
    }
}
else {
    Write-Section "4. Competitor-Specific Tests (Skipped)"
    Write-Info "No competitors found. Create one first and re-run this test."
}

# ============================================================================
# TEST 5: FIRECRAWL SERVICE
# ============================================================================

Write-Section "5. Testing Firecrawl Service"

$firecrawlHealth = Invoke-SafeRestMethod -Uri "$FirecrawlUrl/health"
if ($firecrawlHealth) {
    Write-Success "Firecrawl health check passed"
    Display-JsonTruncated -Data $firecrawlHealth
}
else {
    Write-Error-Message "Firecrawl health check failed - service may not be running"
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Section "Test Complete"

Write-Host "Next Steps:" -ForegroundColor $Colors.Title
Write-Host "  1. Create a competitor: POST /api/competitors" -ForegroundColor $Colors.Info
Write-Host "  2. Discover URLs:      POST /api/competitors/:id/discover" -ForegroundColor $Colors.Info
Write-Host "  3. Scrape content:     POST /api/competitors/:id/scrape" -ForegroundColor $Colors.Info
Write-Host "  4. Create signals:     POST /api/competitors/:id/signals/create" -ForegroundColor $Colors.Info
Write-Host "  5. Compute threat:     POST /api/competitors/:id/threat/compute" -ForegroundColor $Colors.Info

Write-Host ""
Write-Host "Documentation:" -ForegroundColor $Colors.Title
Write-Host "  • README.md - Feature overview and setup" -ForegroundColor $Colors.Info
Write-Host "  • API_REFERENCE.md - Complete endpoint documentation" -ForegroundColor $Colors.Info
Write-Host "  • QUICKSTART.md - 5-minute quick start" -ForegroundColor $Colors.Info
Write-Host "  • CURL_COMMANDS.ps1 - Interactive example commands" -ForegroundColor $Colors.Info

Write-Host ""
Write-Host "✓ Test script completed" -ForegroundColor $Colors.Success
Write-Host ""
