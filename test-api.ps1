#requires -Version 5.1
<#
.SYNOPSIS
    Test suite for Firecrawl Direct API
    Validates crawling on various website types
#>

param(
    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

Write-Host "`n" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FIRECRAWL DIRECT API - TEST SUITE" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Test cases with different site types
$tests = @(
    @{
        name = "Static HTML Site"
        url = "https://example.com"
        wait = 0
        scroll = $false
        description = "Basic static HTML page"
    },
    @{
        name = "Medium JS Site"
        url = "https://github.com"
        wait = 3000
        scroll = $false
        description = "GitHub - moderate JavaScript"
    },
    @{
        name = "Heavy JS Site"
        url = "https://www.wikipedia.org"
        wait = 2000
        scroll = $true
        description = "Wikipedia - with lazy loading"
    }
)

$passed = 0
$failed = 0

foreach ($test in $tests) {
    Write-Host "`n" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "TEST: $($test.name)" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "Description: $($test.description)" -ForegroundColor Gray
    Write-Host "URL: $($test.url)" -ForegroundColor Gray
    Write-Host "Wait: $($test.wait)ms | Scroll: $($test.scroll)" -ForegroundColor Gray
    
    try {
        $params = @{
            Url = $test.url
            Wait = $test.wait
            Timeout = 120
            ErrorAction = "Stop"
        }
        
        if ($test.scroll) {
            $params['Scroll'] = $true
        }
        
        Write-Host "Sending crawl request..." -ForegroundColor Cyan
        & ".\crawl.ps1" @params | Out-Null
        
        Write-Host "✓ PASSED" -ForegroundColor Green
        $passed++
    }
    catch {
        Write-Host "✗ FAILED" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $failed++
    }
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST RESULTS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "Total:  $($passed + $failed)" -ForegroundColor White
Write-Host "`n" -ForegroundColor Cyan
