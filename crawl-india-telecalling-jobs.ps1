#!/usr/bin/env pwsh
<#
.SYNOPSIS
    India-ONLY Telecalling Jobs Crawler with Strict Location Filtering
    
.DESCRIPTION
    Crawls Indian job websites for telecalling positions using Firecrawl Docker API.
    Applies strict India location filtering - ONLY keeps jobs explicitly in India.
    
.PARAMETER OutputFormat
    Output format: "json", "csv", or "both" (default: "both")
    
.EXAMPLE
    .\crawl-india-telecalling-jobs.ps1
#>

param(
    [ValidateSet("json", "csv", "both")]
    [string]$OutputFormat = "both"
)

$ErrorActionPreference = "Stop"

# Configuration
$FIRECRAWL_BASE = "http://localhost:3002"
$FIRECRAWL_CRAWL = "$FIRECRAWL_BASE/v1/crawl"

# India cities and states
$INDIA_CITIES = @(
    'bangalore', 'bengaluru', 'delhi', 'new delhi', 'mumbai', 'pune', 'hyderabad',
    'gurgaon', 'noida', 'kolkata', 'chennai', 'jaipur', 'lucknow', 'chandigarh',
    'indore', 'ahmedabad', 'surat', 'nagpur', 'bhopal', 'visakhapatnam', 'coimbatore',
    'kochi', 'thrissur', 'ernakulam', 'mysore', 'salem', 'tiruchirappalli'
)

$INDIA_STATES = @(
    'andhra pradesh', 'telangana', 'karnataka', 'tamil nadu', 'maharashtra',
    'delhi', 'uttar pradesh', 'west bengal', 'haryana', 'punjab', 'kerala',
    'rajasthan', 'madhya pradesh', 'bihar', 'jharkhand', 'odisha', 'assam'
)

$GLOBAL_KEYWORDS = @(
    'global', 'worldwide', 'international', 'remote - global', 'usa', 'uk', 'us',
    'australia', 'canada', 'europe', 'middle east', 'uae', 'dubai', 'singapore'
)

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   INDIA-ONLY TELECALLING JOBS CRAWLER (Firecrawl)             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test Firecrawl
Write-Host "`n[CHECK] Testing Firecrawl health..." -ForegroundColor Yellow
try {
    $body = @{ url = "https://example.com" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri $FIRECRAWL_CRAWL -Method POST `
        -ContentType "application/json" -Body $body `
        -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Firecrawl is running at $FIRECRAWL_BASE" -ForegroundColor Green
} catch {
    Write-Host "✗ Firecrawl is NOT responding at $FIRECRAWL_BASE" -ForegroundColor Red
    Write-Host "  Start it with: docker-compose -f firecrawl-selfhost/docker-compose.yml up -d" -ForegroundColor Yellow
    exit 1
}

# Function to check if location is in India
function Test-IsIndiaLocation {
    param([string]$LocationText)
    
    if ([string]::IsNullOrWhiteSpace($LocationText)) { return $false }
    
    $location = $LocationText.ToLower()
    
    # Reject global keywords
    foreach ($keyword in $GLOBAL_KEYWORDS) {
        if ($location -like "*$keyword*") { return $false }
    }
    
    # Check for India
    if ($location -like "*india*") { return $true }
    
    # Check for Indian cities
    foreach ($city in $INDIA_CITIES) {
        if ($location -like "*$city*") { return $true }
    }
    
    # Check for Indian states
    foreach ($state in $INDIA_STATES) {
        if ($location -like "*$state*") { return $true }
    }
    
    return $false
}

# Crawl portals
Write-Host "`n[CRAWL] Crawling job portals..." -ForegroundColor Cyan

$portals = @(
    @{ Name = "Indeed India"; Url = "https://in.indeed.com/jobs?q=telecaller&l=India"; Source = "Indeed" },
    @{ Name = "Naukri"; Url = "https://www.naukri.com/jobs-in-india-for-telecaller"; Source = "Naukri" }
)

$allJobs = @()

foreach ($portal in $portals) {
    Write-Host "`n   [→] Processing $($portal.Name)..." -ForegroundColor Yellow
    Write-Host "       URL: $($portal.Url)" -ForegroundColor Gray
    
    try {
        $body = @{ url = $portal.Url; limit = 5 } | ConvertTo-Json
        
        Write-Host "       Sending request..." -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri $FIRECRAWL_CRAWL -Method POST `
            -ContentType "application/json" -Body $body `
            -TimeoutSec 120 -UseBasicParsing -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success -or $data.id) {
            $jobId = $data.id
            Write-Host "       ✓ Crawl initiated: $jobId" -ForegroundColor Green
            
            Start-Sleep -Seconds 3
            
            $resultUrl = "$FIRECRAWL_BASE/v1/crawl/$jobId"
            $resultResponse = Invoke-WebRequest -Uri $resultUrl -Method GET `
                -TimeoutSec 120 -UseBasicParsing -ErrorAction Stop
            
            $resultData = $resultResponse.Content | ConvertFrom-Json
            
            if ($resultData.success -and $resultData.data) {
                $markdown = if ($resultData.data.markdown) { $resultData.data.markdown } else { "" }
                Write-Host "       ✓ Retrieved $($markdown.Length) characters" -ForegroundColor Green
                
                # Parse jobs from markdown
                $lines = $markdown -split "`n"
                foreach ($line in $lines) {
                    if ($line.Trim().Length -gt 10) {
                        $allJobs += @{
                            Title = $line.Trim().SubString(0, [Math]::Min(100, $line.Trim().Length))
                            Location = ""
                            Source = $portal.Source
                            ScrapedDate = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
                        }
                    }
                }
            } else {
                Write-Host "       ⚠ Status: $($resultData.status)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "       ✗ Crawl failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "       ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n[FILTER] Applying India-only filter..." -ForegroundColor Yellow

$indiaJobs = @()
$rejectedCount = 0

foreach ($job in $allJobs) {
    if (Test-IsIndiaLocation $job.Title) {
        $indiaJobs += $job
    } else {
        $rejectedCount++
    }
}

Write-Host "   ✓ India jobs: $($indiaJobs.Count)" -ForegroundColor Green
Write-Host "   ✗ Rejected: $rejectedCount" -ForegroundColor Yellow

# Export results
Write-Host "`n[EXPORT] Saving results..." -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

if ($OutputFormat -in ("json", "both")) {
    $jsonData = @{
        metadata = @{
            extractedAt = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            totalJobs = $indiaJobs.Count
            filterApplied = "India-only"
        }
        jobs = $indiaJobs
    }
    
    $jsonFile = "india_telecalling_jobs_$timestamp.json"
    $jsonData | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonFile -Encoding UTF8 -Force
    Write-Host "   ✓ JSON: $jsonFile" -ForegroundColor Green
}

if ($OutputFormat -in ("csv", "both")) {
    $csvFile = "india_telecalling_jobs_$timestamp.csv"
    $indiaJobs | Select-Object -Property Title, Location, Source, ScrapedDate | 
        Export-Csv -Path $csvFile -NoTypeInformation -Encoding UTF8 -Force
    Write-Host "   ✓ CSV: $csvFile" -ForegroundColor Green
}

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Total jobs scraped:         $($allJobs.Count)" -ForegroundColor White
Write-Host "India-only jobs:            $($indiaJobs.Count)" -ForegroundColor Green
Write-Host "Rejected (non-India):       $rejectedCount" -ForegroundColor Yellow

if ($allJobs.Count -gt 0) {
    $successRate = [math]::Round(($indiaJobs.Count / $allJobs.Count) * 100, 2)
    Write-Host "Success rate:               $successRate`%" -ForegroundColor Cyan
}

Write-Host "`n✓ Process complete!" -ForegroundColor Green
Write-Host ""
