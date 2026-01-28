#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verify all Sync feature implementation files are in place
    
.DESCRIPTION
    Checks that all required code changes and documentation are properly committed
#>

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SYNC FEATURE IMPLEMENTATION - VERIFICATION REPORT            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Helper function
function Check-File {
    param([string]$Path, [string]$Description)
    if (Test-Path $Path) {
        $file = Get-Item $Path
        $size = $file.Length / 1KB
        Write-Host "  ✓ $Description" -ForegroundColor Green
        Write-Host "    → $Path" -ForegroundColor DarkCray
        Write-Host "    → Size: $([Math]::Round($size)) KB" -ForegroundColor DarkGray
        return $true
    } else {
        Write-Host "  ✗ $Description" -ForegroundColor Red
        Write-Host "    → NOT FOUND: $Path" -ForegroundColor Red
        return $false
    }
}

function Check-CodeSnippet {
    param([string]$FilePath, [string]$SearchText, [string]$Description)
    if (Select-String -Path $FilePath -Pattern $SearchText -Quiet) {
        Write-Host "  ✓ $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ✗ $Description - NOT FOUND" -ForegroundColor Red
        return $false
    }
}

# ============================================================================
# Check Implementation Files
# ============================================================================

Write-Host "📋 IMPLEMENTATION FILES" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkCyan

$checksPassed = 0
$checksFailed = 0

# Check 1: Sync service
if (Check-File "./src/services/sync.js" "Sync orchestration service") {
    $checksPassed++
} else {
    $checksFailed++
}

# Check 2: Change model in models
if (Check-File "./src/models/index.js" "Models file with Change schema") {
    $checksPassed++
} else {
    $checksFailed++
}

# Check 3: API routes
if (Check-File "./src/routes/api.js" "API routes with sync endpoint") {
    $checksPassed++
} else {
    $checksFailed++
}

# Check 4: Test script
if (Check-File "./test-sync-complete.ps1" "PowerShell test suite") {
    $checksPassed++
} else {
    $checksFailed++
}

Write-Host ""
Write-Host "📚 DOCUMENTATION FILES" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkCyan

# Check 5: Implementation docs
if (Check-File "./SYNC_IMPLEMENTATION.md" "Complete implementation guide") {
    $checksPassed++
} else {
    $checksFailed++
}

# Check 6: Quick reference
if (Check-File "./SYNC_QUICK_REFERENCE.md" "Quick reference card") {
    $checksPassed++
} else {
    $checksFailed++
}

# Check 7: Code changes detailed
if (Check-File "./CODE_CHANGES_DETAILED.md" "Detailed code changes") {
    $checksPassed++
} else {
    $checksFailed++
}

# ============================================================================
# Verify Code Changes
# ============================================================================

Write-Host ""
Write-Host "🔍 CODE VERIFICATION" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkCyan

# Check models
if (Check-CodeSnippet "./src/models/index.js" "changeSchema" "Change schema defined") {
    $checksPassed++
} else {
    $checksFailed++
}

if (Check-CodeSnippet "./src/models/index.js" "Change: mongoose.model" "Change model exported") {
    $checksPassed++
} else {
    $checksFailed++
}

# Check sync service
if (Check-CodeSnippet "./src/services/sync.js" "syncCompetitor" "syncCompetitor function") {
    $checksPassed++
} else {
    $checksFailed++
}

if (Check-CodeSnippet "./src/services/sync.js" "detectChanges" "detectChanges function") {
    $checksPassed++
} else {
    $checksFailed++
}

if (Check-CodeSnippet "./src/services/sync.js" "detectChangeType" "detectChangeType function") {
    $checksPassed++
} else {
    $checksFailed++
}

# Check routes
if (Check-CodeSnippet "./src/routes/api.js" "syncCompetitor" "syncCompetitor imported") {
    $checksPassed++
} else {
    $checksFailed++
}

if (Check-CodeSnippet "./src/routes/api.js" "/competitors/sync" "Sync endpoint defined") {
    $checksPassed++
} else {
    $checksFailed++
}

# Check signals
if (Check-CodeSnippet "./src/services/signals.js" "Change" "Change model imported") {
    $checksPassed++
} else {
    $checksFailed++
}

if (Check-CodeSnippet "./src/services/signals.js" "createSignalFromChange" "createSignalFromChange function") {
    $checksPassed++
} else {
    $checksFailed++
}

# ============================================================================
# Pipeline Check
# ============================================================================

Write-Host ""
Write-Host "🔗 PIPELINE STAGES" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkCyan

$stages = @(
    @{ name = "Discovery"; file = "./src/services/discovery.js"; pattern = "discoverCompetitorUrls" },
    @{ name = "Scraping"; file = "./src/services/scraping.js"; pattern = "scrapePendingUrls" },
    @{ name = "Change Detection"; file = "./src/services/sync.js"; pattern = "detectChanges" },
    @{ name = "Signal Generation"; file = "./src/services/signals.js"; pattern = "createSignalsForPendingNews" },
    @{ name = "Threat Computation"; file = "./src/services/threat.js"; pattern = "computeThreatForCompetitor" }
)

foreach ($stage in $stages) {
    if (Check-CodeSnippet $stage.file $stage.pattern "$($stage.name) stage") {
        $checksPassed++
    } else {
        $checksFailed++
    }
}

# ============================================================================
# Summary
# ============================================================================

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$totalChecks = $checksPassed + $checksFailed
$passPercentage = [Math]::Round(($checksPassed / $totalChecks) * 100)

Write-Host ""
Write-Host "Tests Passed:  $checksPassed/$totalChecks" -ForegroundColor Green
Write-Host "Tests Failed:  $checksFailed/$totalChecks" -ForegroundColor $(if ($checksFailed -gt 0) { "Red" } else { "Green" })
Write-Host "Pass Rate:     $passPercentage%" -ForegroundColor $(if ($passPercentage -eq 100) { "Green" } else { "Yellow" })
Write-Host ""

if ($checksFailed -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED - IMPLEMENTATION COMPLETE" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Start services (Firecrawl, Backend, MongoDB)" -ForegroundColor White
    Write-Host "  2. Run: .\test-sync-complete.ps1" -ForegroundColor White
    Write-Host "  3. Test with: POST /api/competitors/sync" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  SOME CHECKS FAILED - PLEASE REVIEW" -ForegroundColor Red
    Write-Host ""
}

Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
