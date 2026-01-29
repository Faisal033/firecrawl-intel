#!/usr/bin/env pwsh

<#
.SYNOPSIS
Test the job scraper on a simple website first
#>

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Job Scraper Test (Single Website)    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Configuration
$FirecrawlUrl = "http://localhost:3002/v1/crawl"

# Test URL (Fresher.com with telecaller search)
$TestUrl = "https://fresher.com?search=telecaller"

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "   Firecrawl: $FirecrawlUrl" -ForegroundColor Gray
Write-Host "   Test URL: $TestUrl" -ForegroundColor Gray
Write-Host ""

# Step 1: Check Firecrawl
Write-Host "Step 1: Checking Firecrawl..." -ForegroundColor Cyan
try {
    $TestBody = @{ url = "https://example.com" } | ConvertTo-Json
    $TestResponse = Invoke-WebRequest -Uri $FirecrawlUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $TestBody `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ Firecrawl is running`n" -ForegroundColor Green
}
catch {
    Write-Host "❌ Cannot connect to Firecrawl`n" -ForegroundColor Red
    Write-Host "Start Docker: docker-compose up -d`n" -ForegroundColor Yellow
    exit 1
}

# Step 2: Submit crawl job
Write-Host "Step 2: Submitting crawl job..." -ForegroundColor Cyan
try {
    $Body = @{
        url = $TestUrl
        wait_for_loading_delay = 3000
    } | ConvertTo-Json
    
    $CrawlResponse = Invoke-WebRequest -Uri $FirecrawlUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $Body `
        -TimeoutSec 30 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $CrawlData = $CrawlResponse.Content | ConvertFrom-Json
    
    if ($CrawlData.success) {
        $JobId = $CrawlData.id
        $StatusUrl = $CrawlData.url
        Write-Host "✅ Job submitted`n   ID: $JobId`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Job submission failed`n" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Step 3: Poll for results
Write-Host "Step 3: Polling for results..." -ForegroundColor Cyan
$Attempts = 0
$MaxAttempts = 90
$Result = $null

while ($Attempts -lt $MaxAttempts) {
    $Attempts++
    
    try {
        Start-Sleep -Milliseconds 2000
        
        $StatusResponse = Invoke-WebRequest -Uri $StatusUrl `
            -Method GET `
            -TimeoutSec 10 `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $StatusData = $StatusResponse.Content | ConvertFrom-Json
        
        if ($StatusData.status -eq "completed") {
            $Result = $StatusData
            Write-Host "`n✅ Crawl completed in $([Math]::Round($Attempts * 2, 1))s`n" -ForegroundColor Green
            break
        } elseif ($StatusData.status -eq "failed") {
            Write-Host "`n❌ Crawl failed`n" -ForegroundColor Red
            exit 1
        }
        
        Write-Host -NoNewline "." -ForegroundColor Cyan
    }
    catch {
        Write-Host -NoNewline "!" -ForegroundColor Yellow
    }
}

if ($null -eq $Result) {
    Write-Host "❌ Polling timeout`n" -ForegroundColor Red
    exit 1
}

# Step 4: Display results
Write-Host "Step 4: Analyzing content..." -ForegroundColor Cyan
Write-Host "   Pages retrieved: $($Result.data.length)" -ForegroundColor Gray

if ($Result.data.length -gt 0) {
    $Page = $Result.data[0]
    $Markdown = $Page.markdown
    
    Write-Host "   Content length: $($Markdown.length) characters" -ForegroundColor Gray
    Write-Host ""
    
    # Look for job indicators
    $Indicators = @(
        @{ pattern = "telecaller"; name = "Telecaller mentions" },
        @{ pattern = "company|employer"; name = "Company mentions" },
        @{ pattern = "location|city|mumbai|delhi|bangalore"; name = "Location mentions" },
        @{ pattern = "\b[0-9]{10}\b"; name = "Phone numbers" },
        @{ pattern = "[a-z]+@[a-z]+\.[a-z]+"; name = "Email addresses" }
    )
    
    Write-Host "Content Analysis:" -ForegroundColor Yellow
    foreach ($Indicator in $Indicators) {
        $Count = ([regex]::Matches($Markdown, $Indicator.pattern, [Text.RegexOptions]::IgnoreCase)).Count
        Write-Host "   $($Indicator.name): $Count found" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "First 400 characters of content:" -ForegroundColor Yellow
    Write-Host "$('─' * 60)" -ForegroundColor Gray
    Write-Host $Markdown.Substring(0, [Math]::Min(400, $Markdown.Length)) -ForegroundColor White
    Write-Host "$('─' * 60)" -ForegroundColor Gray
    
    # Save sample
    $SampleFile = "test-crawl-sample.json"
    $Result | ConvertTo-Json -Depth 3 | Out-File $SampleFile
    
    Write-Host "`n✅ Sample data saved to: $SampleFile`n" -ForegroundColor Green
}

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        ✅ Test Successful!                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the full scraper: .\job-leads-scraper.ps1" -ForegroundColor Gray
Write-Host "2. Check results in generated JSON/CSV files" -ForegroundColor Gray
Write-Host "3. Review extracted data in Excel or any text editor`n" -ForegroundColor Gray
