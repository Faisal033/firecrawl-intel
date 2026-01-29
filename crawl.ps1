#requires -Version 5.1
<#
.SYNOPSIS
    Direct Firecrawl API crawler - Scrapes websites without backend
    
.DESCRIPTION
    Sends crawl requests directly to Firecrawl Docker API on localhost:3002
    Supports JavaScript-heavy pages with options for waiting and scrolling
    
.PARAMETER Url
    Website URL to crawl (required)
    Example: -Url "https://example.com"
    
.PARAMETER Wait
    Time to wait for page load in milliseconds (default: 0)
    Use 3000-5000 for JS-heavy pages
    Example: -Wait 5000
    
.PARAMETER Scroll
    Enable scrolling to load lazy content (default: $false)
    Example: -Scroll
    
.PARAMETER IncludeHtml
    Return HTML in addition to markdown (default: $false)
    Example: -IncludeHtml
    
.PARAMETER Timeout
    Request timeout in seconds (default: 120)
    Example: -Timeout 180
    
.EXAMPLE
    .\crawl.ps1 -Url "https://example.com"
    
.EXAMPLE
    .\crawl.ps1 -Url "https://example.com" -Wait 3000 -Scroll
    
.EXAMPLE
    .\crawl.ps1 -Url "https://example.com" -Wait 5000 -IncludeHtml
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Url,
    
    [Parameter(Mandatory = $false)]
    [int]$Wait = 0,
    
    [Parameter(Mandatory = $false)]
    [switch]$Scroll,
    
    [Parameter(Mandatory = $false)]
    [switch]$IncludeHtml,
    
    [Parameter(Mandatory = $false)]
    [int]$Timeout = 120
)

$ErrorActionPreference = "Stop"
$FirecrawlUrl = "http://localhost:3002/v1/crawl"

Write-Host "`n" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FIRECRAWL DIRECT API CRAWLER" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

# === 1. CHECK IF FIRECRAWL IS RUNNING ===
Write-Host "`n[1/4] Checking Firecrawl status..." -ForegroundColor Yellow

try {
    $testResponse = Invoke-WebRequest -Uri $FirecrawlUrl -Method POST `
        -ContentType "application/json" `
        -Body '{"url":"https://example.com"}' `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✓ Firecrawl is running on port 3002" -ForegroundColor Green
}
catch {
    Write-Host "✗ ERROR: Firecrawl is not responding!" -ForegroundColor Red
    Write-Host "  Make sure Docker is running with:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f firecrawl-selfhost/docker-compose.yml up -d" -ForegroundColor White
    Write-Host "  Or check: http://localhost:3002" -ForegroundColor Gray
    exit 1
}

# === 2. BUILD REQUEST BODY ===
Write-Host "`n[2/4] Preparing crawl request..." -ForegroundColor Yellow

$requestBody = @{
    url = $Url
}

# Add wait time if specified
if ($Wait -gt 0) {
    $requestBody.waitFor = "//*"  # Wait for any element
    Write-Host "  → Waiting $($Wait)ms for page load" -ForegroundColor Gray
}

# Add scroll option if specified
if ($Scroll) {
    $requestBody.scroll = $true
    Write-Host "  → Scrolling enabled for lazy-loaded content" -ForegroundColor Gray
}

# Add HTML option if specified
if ($IncludeHtml) {
    $requestBody.includeHtml = $true
    Write-Host "  -> HTML output enabled" -ForegroundColor Gray
}

$body = $requestBody | ConvertTo-Json
Write-Host "  URL: $Url" -ForegroundColor Gray

# === 3. SEND CRAWL REQUEST ===
Write-Host "`n[3/4] Sending request to Firecrawl..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $FirecrawlUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec $Timeout `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✓ Request successful (HTTP $($response.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "✗ Request failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# === 4. PARSE AND DISPLAY RESULTS ===
Write-Host "`n[4/4] Processing results..." -ForegroundColor Yellow

try {
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "✓ Crawl completed successfully" -ForegroundColor Green
        Write-Host "`n" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "METADATA" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        
        Write-Host "URL:              $($data.data.url)" -ForegroundColor White
        Write-Host "Status Code:      $($data.data.statusCode)" -ForegroundColor White
        Write-Host "Content Length:   $($data.data.markdown.Length) characters" -ForegroundColor White
        Write-Host "Word Count:       ~$([Math]::Round($data.data.markdown.Length / 5))" -ForegroundColor White
        
        if ($data.data.metadata) {
            Write-Host "Title:            $($data.data.metadata.title)" -ForegroundColor White
            Write-Host "Description:      $($data.data.metadata.description)" -ForegroundColor White
        }
        
        # Display scraped content
        Write-Host "`n" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "SCRAPED CONTENT (Markdown)" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host $data.data.markdown -ForegroundColor White
        
        # Display HTML if requested
        if ($IncludeHtml -and $data.data.html) {
            Write-Host "`n" -ForegroundColor Cyan
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
            Write-Host "HTML (First 2000 chars)" -ForegroundColor Cyan
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
            Write-Host $data.data.html.Substring(0, [Math]::Min(2000, $data.data.html.Length)) -ForegroundColor Gray
        }
        
        Write-Host "`n" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✓ CRAWL COMPLETE" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "`n" -ForegroundColor Cyan
    }
    else {
        Write-Host "✗ Crawl failed" -ForegroundColor Red
        Write-Host "Error: $($data.error)" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "✗ Failed to parse response!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}
