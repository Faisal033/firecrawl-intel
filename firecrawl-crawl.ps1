#!/usr/bin/env powershell
#requires -Version 5.1

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
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  FIRECRAWL DIRECT API CRAWLER" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# === 1. CHECK IF FIRECRAWL IS RUNNING ===
Write-Host "`n[1/4] Checking Firecrawl status..." -ForegroundColor Yellow

try {
    $testResponse = Invoke-WebRequest -Uri $FirecrawlUrl -Method POST `
        -ContentType "application/json" `
        -Body '{"url":"https://example.com"}' `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "OK Firecrawl is running on port 3002" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Firecrawl is not responding!" -ForegroundColor Red
    Write-Host "  Make sure Docker is running:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f firecrawl-selfhost/docker-compose.yml up -d" -ForegroundColor White
    exit 1
}

# === 2. BUILD REQUEST BODY ===
Write-Host "`n[2/4] Preparing crawl request..." -ForegroundColor Yellow

$requestBody = @{
    url = $Url
}

# Add options for JS-heavy pages
if ($Scroll) {
    $requestBody.screenshot = $true
    Write-Host "  - Screenshot enabled for verification" -ForegroundColor Gray
}

if ($IncludeHtml) {
    Write-Host "  - HTML output will be included" -ForegroundColor Gray
}

$body = $requestBody | ConvertTo-Json
Write-Host "  URL: $Url" -ForegroundColor Gray

# === 3. SEND CRAWL REQUEST ===
Write-Host "`n[3/4] Sending crawl request..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $FirecrawlUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $jobResponse = $response.Content | ConvertFrom-Json
    Write-Host "OK Job created: $($jobResponse.id)" -ForegroundColor Green
    
    $statusUrl = $jobResponse.url
}
catch {
    Write-Host "ERROR: Request failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# === POLLING FOR RESULTS ===
Write-Host "`nPolling for results (max ${Timeout}s)..." -ForegroundColor Yellow

$startTime = Get-Date
$pollInterval = 2  # Poll every 2 seconds

while ($true) {
    $elapsed = ((Get-Date) - $startTime).TotalSeconds
    
    if ($elapsed -gt $Timeout) {
        Write-Host "ERROR: Timeout waiting for crawl results" -ForegroundColor Red
        exit 1
    }
    
    try {
        $statusResponse = Invoke-WebRequest -Uri $statusUrl `
            -Method GET `
            -TimeoutSec 10 `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $statusData = $statusResponse.Content | ConvertFrom-Json
        
        if ($statusData.status -eq "completed") {
            Write-Host "OK Crawl completed (${elapsed}s)" -ForegroundColor Green
            $data = $statusData
            break
        }
        elseif ($statusData.status -eq "scraping") {
            Write-Host "  [${elapsed}s] Scraping..." -ForegroundColor Gray
        }
        else {
            Write-Host "  [${elapsed}s] Status: $($statusData.status)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "ERROR: Status check failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        exit 1
    }
    
    Start-Sleep -Seconds $pollInterval
}

# === 4. PARSE AND DISPLAY RESULTS ===
Write-Host "`n[4/4] Processing results..." -ForegroundColor Yellow

try {
    if ($data.success) {
        Write-Host "OK Results retrieved" -ForegroundColor Green
        Write-Host "`n" -ForegroundColor Cyan
        Write-Host "-------------------------------------------" -ForegroundColor Cyan
        Write-Host "METADATA" -ForegroundColor Cyan
        Write-Host "-------------------------------------------" -ForegroundColor Cyan
        
        # Handle both single item and array response formats
        $content = if ($data.data -is [array]) { $data.data[0] } else { $data.data }
        
        Write-Host "URL:              $($content.url)" -ForegroundColor White
        Write-Host "Status Code:      $($content.statusCode)" -ForegroundColor White
        Write-Host "Content Length:   $($content.markdown.Length) characters" -ForegroundColor White
        Write-Host "Word Count:       ~$([Math]::Round($content.markdown.Length / 5))" -ForegroundColor White
        
        if ($content.metadata) {
            Write-Host "Title:            $($content.metadata.title)" -ForegroundColor White
            Write-Host "Description:      $($content.metadata.description)" -ForegroundColor White
        }
        
        # Display scraped content
        Write-Host "`n" -ForegroundColor Cyan
        Write-Host "-------------------------------------------" -ForegroundColor Cyan
        Write-Host "SCRAPED CONTENT (Markdown)" -ForegroundColor Cyan
        Write-Host "-------------------------------------------" -ForegroundColor Cyan
        Write-Host $content.markdown -ForegroundColor White
        
        # Display HTML if requested
        if ($IncludeHtml -and $content.html) {
            Write-Host "`n" -ForegroundColor Cyan
            Write-Host "-------------------------------------------" -ForegroundColor Cyan
            Write-Host "HTML (First 2000 chars)" -ForegroundColor Cyan
            Write-Host "-------------------------------------------" -ForegroundColor Cyan
            Write-Host $content.html.Substring(0, [Math]::Min(2000, $content.html.Length)) -ForegroundColor Gray
        }
        
        Write-Host "`n" -ForegroundColor Cyan
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host "OK CRAWL COMPLETE" -ForegroundColor Green
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host "`n" -ForegroundColor Cyan
    }
    else {
        Write-Host "ERROR: Crawl failed" -ForegroundColor Red
        Write-Host "Error: $($data.error)" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "ERROR: Failed to parse response!" -ForegroundColor Red
    Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}
