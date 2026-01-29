#!/usr/bin/env pwsh
<#
.SYNOPSIS
Test script for Firecrawl crawling functionality
.DESCRIPTION
Tests the Firecrawl Docker API with health checks and error handling
#>

param(
    [string]$Url = "https://www.iplt20.com",
    [int]$TimeoutSec = 120
)

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "FIRECRAWL CRAWL TEST SCRIPT" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

# Constants
$FIRECRAWL_URL = "http://localhost:3002"
$FIRECRAWL_CRAWL = "$FIRECRAWL_URL/v1/crawl"

# ============================================================
# STEP 1: Check Docker Containers
# ============================================================
Write-Host "`nSTEP 1: Checking Docker Containers..." -ForegroundColor Yellow
try {
    $containers = docker-compose -f "firecrawl-selfhost/docker-compose.yml" ps --services --filter "status=running" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker containers found" -ForegroundColor Green
        docker-compose -f "firecrawl-selfhost/docker-compose.yml" ps --no-trunc 2>&1 | Select-Object -Skip 2 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "[WARN] Could not check Docker containers" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Docker check skipped: $_" -ForegroundColor Yellow
}

# ============================================================
# STEP 2: Crawl Website
# ============================================================
Write-Host "`nSTEP 2: Starting Website Crawl..." -ForegroundColor Yellow
Write-Host "   Target URL: $Url" -ForegroundColor Gray
Write-Host "   Timeout: $TimeoutSec seconds" -ForegroundColor Gray

try {
    $body = @{
        url = $Url
        limit = 1
    } | ConvertTo-Json
    
    Write-Host "`n   Sending POST request to: $FIRECRAWL_CRAWL" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri $FIRECRAWL_CRAWL `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec $TimeoutSec `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "`n[OK] CRAWL SUCCESSFUL!" -ForegroundColor Green
    
    # Parse response
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success -and $null -ne $data.id) {
        Write-Host "`nJob initiated successfully" -ForegroundColor Green
        Write-Host "   Job ID: $($data.id)" -ForegroundColor Gray
        Write-Host "   Fetching results from: $($data.url)" -ForegroundColor Gray
        
        # Wait a bit for the job to process
        Write-Host "`n   Waiting for crawl to complete..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Fetch the result
        try {
            $resultResponse = Invoke-WebRequest -Uri $data.url `
                -Method GET `
                -TimeoutSec $TimeoutSec `
                -UseBasicParsing `
                -ErrorAction Stop
            
            $resultData = $resultResponse.Content | ConvertFrom-Json
            
            if ($resultData.success) {
                Write-Host "[OK] Results retrieved successfully!" -ForegroundColor Green
                Write-Host "`nRESPONSE DATA:" -ForegroundColor Cyan
                Write-Host "   Success: $($resultData.success)" -ForegroundColor Green
                Write-Host "   Status Code: $($resultResponse.StatusCode)" -ForegroundColor Gray
                Write-Host "   Content Type: $($resultResponse.Headers['Content-Type'])" -ForegroundColor Gray
                
                if ($null -ne $resultData.data -and $null -ne $resultData.data.markdown) {
                    Write-Host "   Markdown Length: $($resultData.data.markdown.length) characters" -ForegroundColor Cyan
                    
                    if ($resultData.data.markdown.length -gt 0) {
                        Write-Host "`nCONTENT PREVIEW (First 600 characters):" -ForegroundColor Cyan
                        Write-Host "   =================================================================" -ForegroundColor Gray
                        Write-Host ($resultData.data.markdown.substring(0, [Math]::Min(600, $resultData.data.markdown.length))) -ForegroundColor White
                        Write-Host "   =================================================================" -ForegroundColor Gray
                    } else {
                        Write-Host "[WARN] Markdown content is empty" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "[WARN] No markdown data in response" -ForegroundColor Yellow
                    Write-Host "   Response: $($resultResponse.Content | ConvertTo-Json)" -ForegroundColor Gray
                }
                
                Write-Host "`n[OK] Test completed successfully!`n" -ForegroundColor Green
            } else {
                Write-Host "[ERROR] Job did not complete successfully" -ForegroundColor Red
                Write-Host "   Response: $($resultResponse.Content)" -ForegroundColor Red
            }
        } catch {
            Write-Host "[WARN] Could not fetch results yet (job may still be processing)" -ForegroundColor Yellow
            Write-Host "   Job URL: $($data.url)" -ForegroundColor Gray
            Write-Host "   You can check the result later with:" -ForegroundColor Gray
            Write-Host "   curl http://localhost:3002/v1/crawl/$($data.id)" -ForegroundColor Cyan
        }
    } elseif ($data.success) {
        Write-Host "`n[OK] CRAWL SUCCESSFUL!" -ForegroundColor Green
        Write-Host "`nRESPONSE DATA:" -ForegroundColor Cyan
        Write-Host "   Success: $($data.success)" -ForegroundColor Green
        Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "   Content Type: $($response.Headers['Content-Type'])" -ForegroundColor Gray
        
        if ($null -ne $data.data -and $null -ne $data.data.markdown) {
            Write-Host "   Markdown Length: $($data.data.markdown.length) characters" -ForegroundColor Cyan
            
            if ($data.data.markdown.length -gt 0) {
                Write-Host "`nCONTENT PREVIEW (First 600 characters):" -ForegroundColor Cyan
                Write-Host "   =================================================================" -ForegroundColor Gray
                Write-Host ($data.data.markdown.substring(0, [Math]::Min(600, $data.data.markdown.length))) -ForegroundColor White
                Write-Host "   =================================================================" -ForegroundColor Gray
            } else {
                Write-Host "[WARN] Markdown content is empty" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[WARN] No markdown data in response" -ForegroundColor Yellow
            Write-Host "   Full Response: $($response.Content | ConvertTo-Json)" -ForegroundColor Gray
        }
        
        Write-Host "`n[OK] Test completed successfully!`n" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Crawl failed" -ForegroundColor Red
        Write-Host "   Response: $($response.Content)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "`n[ERROR] CRAWL FAILED!" -ForegroundColor Red
    Write-Host "`nError Details:" -ForegroundColor Red
    Write-Host "   Type: $($_.Exception.GetType().Name)" -ForegroundColor Red
    Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.InnerException) {
        Write-Host "   Inner: $($_.Exception.InnerException.Message)" -ForegroundColor Red
    }
    
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check Docker containers: docker-compose ps" -ForegroundColor Yellow
    Write-Host "   2. Check Firecrawl logs: docker-compose logs api" -ForegroundColor Yellow
    Write-Host "   3. Test health endpoint: curl http://localhost:3002/health" -ForegroundColor Yellow
    Write-Host "   4. Verify port 3002 is open: netstat -ano | findstr :3002" -ForegroundColor Yellow
    
    exit 1
}

Write-Host ""
