#!/usr/bin/env pwsh
<#
.SYNOPSIS
Call Firecrawl Docker API directly without Node.js backend
#>

param(
    [string]$Url = "https://redingtongroup.com/",
    [int]$MaxWaitSeconds = 120
)

Write-Host "`n=== DIRECT FIRECRAWL API (No Backend) ===" -ForegroundColor Cyan
Write-Host "URL: $Url" -ForegroundColor Yellow
Write-Host "Firecrawl: http://localhost:3002/v1/crawl`n" -ForegroundColor Yellow

# STEP 1: Initiate crawl
Write-Host "STEP 1: Initiating crawl job..." -ForegroundColor Cyan

try {
    $body = @{ url = $Url; limit = 1 } | ConvertTo-Json
    
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3002/v1/crawl" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 30 `
        -UseBasicParsing `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json

    if ($null -eq $data.id) {
        Write-Host "ERROR: No job ID returned" -ForegroundColor Red
        exit 1
    }

    Write-Host "OK: Job initiated" -ForegroundColor Green
    Write-Host "  Job ID: $($data.id)" -ForegroundColor Gray
    
    $jobUrl = $data.url
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

# STEP 2: Poll job
Write-Host "`nSTEP 2: Polling job..." -ForegroundColor Cyan

$startTime = Get-Date
$pollCount = 0

while ((Get-Date) - $startTime -lt (New-TimeSpan -Seconds $MaxWaitSeconds)) {
    $pollCount++
    
    try {
        $response = Invoke-WebRequest `
            -Uri $jobUrl `
            -Method GET `
            -TimeoutSec 10 `
            -UseBasicParsing

        $result = $response.Content | ConvertFrom-Json
        $status = $result.status

        Write-Host "  Poll $pollCount`: $status" -ForegroundColor Gray

        if ($status -eq "completed" -or $status -eq "done") {
            Write-Host "OK: Job completed" -ForegroundColor Green
            break
        }

        if ($status -eq "failed") {
            Write-Host "ERROR: Job failed - $($result.error)" -ForegroundColor Red
            exit 1
        }

        Start-Sleep -Seconds 2
    } catch {
        Write-Host "  Waiting..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

# STEP 3: Extract content
Write-Host "`nSTEP 3: Extracting content..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $jobUrl -Method GET -TimeoutSec 10 -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($null -eq $result.data -or $result.data.Length -eq 0) {
        Write-Host "ERROR: No content" -ForegroundColor Red
        exit 1
    }

    $markdown = $result.data[0].markdown
    $html = $result.data[0].html
    $metadata = $result.data[0].metadata

    Write-Host "OK: Content extracted" -ForegroundColor Green

    # Display results
    Write-Host "`n=== RESULTS ===" -ForegroundColor Cyan
    Write-Host "Markdown: $($markdown.Length) chars" -ForegroundColor Green
    Write-Host "HTML: $($html.Length) chars" -ForegroundColor Green
    Write-Host "Polls: $pollCount" -ForegroundColor Green

    if ($metadata) {
        Write-Host "`nMetadata:" -ForegroundColor Yellow
        if ($metadata.title) { Write-Host "  Title: $($metadata.title)" -ForegroundColor White }
        if ($metadata.description) { Write-Host "  Desc: $($metadata.description)" -ForegroundColor White }
    }

    # Preview
    Write-Host "`nPreview (300 chars):" -ForegroundColor Yellow
    Write-Host "---" -ForegroundColor Gray
    $preview = $markdown.Substring(0, [Math]::Min(300, $markdown.Length))
    Write-Host $preview -ForegroundColor White
    Write-Host "---" -ForegroundColor Gray

    # Save
    $fileName = "crawl_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    $markdown | Out-File $fileName -Encoding UTF8
    Write-Host "`nSaved to: $fileName" -ForegroundColor Green
    Write-Host "`nSUCCESS! Crawl completed.`n" -ForegroundColor Green

} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}
