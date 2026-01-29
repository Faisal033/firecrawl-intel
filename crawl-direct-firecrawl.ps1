#!/usr/bin/env pwsh
<#
.SYNOPSIS
Call Firecrawl Docker API directly without Node.js backend

.DESCRIPTION
- Direct HTTP calls to localhost:3002 (Firecrawl Docker)
- No Node.js backend needed
- Simple polling for async job results
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Url = "https://redingtongroup.com/",
    
    [Parameter(Mandatory=$false)]
    [int]$MaxWaitSeconds = 120
)

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      DIRECT FIRECRAWL API TEST (No Backend)       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Target URL: $Url" -ForegroundColor Yellow
Write-Host "Firecrawl API: http://localhost:3002/v1/crawl" -ForegroundColor Yellow
Write-Host "Max wait time: ${MaxWaitSeconds}s`n" -ForegroundColor Yellow

# ============================================
# STEP 1: Initiate crawl job
# ============================================
Write-Host "STEP 1️⃣  Initiating crawl job..." -ForegroundColor Cyan

try {
    $payload = @{
        url = $Url
        limit = 1
    } | ConvertTo-Json

    $response = Invoke-WebRequest `
        -Uri "http://localhost:3002/v1/crawl" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -TimeoutSec 30 `
        -UseBasicParsing `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json

    if ($null -eq $data -or $null -eq $data.id) {
        Write-Host "❌ Failed to get job ID" -ForegroundColor Red
        Write-Host "Response: $($response.Content)" -ForegroundColor Red
        exit 1
    }

    $jobId = $data.id
    $jobUrl = $data.url

    Write-Host "✅ Job initiated successfully" -ForegroundColor Green
    Write-Host "   Job ID: $jobId" -ForegroundColor Gray
    Write-Host "   Job URL: $jobUrl" -ForegroundColor Gray

} catch {
    Write-Host "ERROR: Failed to initiate crawl: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 2: Poll job until completion
# ============================================
Write-Host "`nSTEP 2️⃣  Polling job status..." -ForegroundColor Cyan

$startTime = Get-Date
$pollCount = 0
$found = $false

while ((Get-Date) - $startTime -lt (New-TimeSpan -Seconds $MaxWaitSeconds)) {
    $pollCount++
    $elapsed = ((Get-Date) - $startTime).TotalSeconds
    
    try {
        Write-Host "   Poll #$pollCount (${elapsed}s elapsed)..." -ForegroundColor Gray -NoNewline

        $response = Invoke-WebRequest `
            -Uri $jobUrl `
            -Method GET `
            -TimeoutSec 10 `
            -UseBasicParsing `
            -ErrorAction Stop

        $result = $response.Content | ConvertFrom-Json

        if ($null -eq $result.status) {
            Write-Host " [WAITING] No status yet, waiting..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
            continue
        }

        Write-Host " Status: $($result.status)" -ForegroundColor Gray

        # Check completion
        if ($result.status -eq "completed" -or $result.status -eq "done") {
            $found = $true
            Write-Host "[OK] Job completed!" -ForegroundColor Green
            break
        }

        # Check failure
        if ($result.status -eq "failed") {
            Write-Host "[FAILED] Job failed" -ForegroundColor Red
            Write-Host "Error: $($result.error)" -ForegroundColor Red
            exit 1
        }

        # Still processing, wait
        Start-Sleep -Seconds 2

    } catch {
        Write-Host " [WARN] Poll error: $_" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $found) {
    Write-Host "[ERROR] Job polling timeout after ${MaxWaitSeconds}s" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 3: Extract and display results
# ============================================
Write-Host "`nSTEP 3️⃣  Extracting content..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest `
        -Uri $jobUrl `
        -Method GET `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json

    # Safely extract markdown
    if ($null -eq $result.data -or $result.data.Length -eq 0) {
        Write-Host "[ERROR] No data in job result" -ForegroundColor Red
        exit 1
    }

    $page = $result.data[0]
    if ($null -eq $page.markdown) {
        Write-Host "[ERROR] No markdown content in result" -ForegroundColor Red
        exit 1
    }

    $markdown = $page.markdown
    $htmlContent = $page.html
    $metadata = $page.metadata

    Write-Host "[OK] Content extracted successfully" -ForegroundColor Green

    # ============================================
    # STEP 4: Display results
    # ============================================
    Write-Host "`nSTEP 4: CRAWL RESULTS" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

    Write-Host "`n📊 Statistics:" -ForegroundColor Yellow
    Write-Host "   URL: $Url" -ForegroundColor White
    Write-Host "   Markdown length: $($markdown.Length) characters" -ForegroundColor Green
    Write-Host "   HTML length: $($htmlContent.Length) characters" -ForegroundColor Green
    Write-Host "   Total polling time: $('{0:F1}' -f $elapsed) seconds" -ForegroundColor Green
    Write-Host "   Number of polls: $pollCount" -ForegroundColor Green

    if ($null -ne $metadata) {
        Write-Host "`n📋 Metadata:" -ForegroundColor Yellow
        if ($metadata.title) { Write-Host "   Title: $($metadata.title)" -ForegroundColor White }
        if ($metadata.description) { Write-Host "   Description: $($metadata.description)" -ForegroundColor White }
        if ($metadata.keywords) { Write-Host "   Keywords: $($metadata.keywords)" -ForegroundColor White }
        if ($metadata.language) { Write-Host "   Language: $($metadata.language)" -ForegroundColor White }
        if ($metadata.ogImage) { Write-Host "   OG Image: $($metadata.ogImage)" -ForegroundColor White }
    }

    Write-Host "`n📄 Markdown Preview (first 500 chars):" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    $preview = $markdown.Substring(0, [Math]::Min(500, $markdown.Length))
    Write-Host $preview -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

    # Optional: Save full content to file
    $fileName = "crawl_result_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    $filePath = "$PSScriptRoot\$fileName"
    
    $markdown | Out-File -FilePath $filePath -Encoding UTF8
    Write-Host "[OK] Full content saved to: $filePath" -ForegroundColor Green
    Write-Host "`n[SUCCESS] CRAWL COMPLETED!`n" -ForegroundColor Green

} catch {
    Write-Host "[ERROR] Error extracting content: $_" -ForegroundColor Red
    exit 1
}
