#!/usr/bin/env pwsh
<#
.SYNOPSIS
Comprehensive backend testing script with health checks and error recovery

.DESCRIPTION
- Health checks before crawling
- Retry logic with exponential backoff
- Safe response parsing
- Detailed error reporting
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Url = "https://redingtongroup.com/",
    
    [Parameter(Mandatory=$false)]
    [int]$MaxRetries = 3,
    
    [Parameter(Mandatory=$false)]
    [int]$HealthCheckTimeout = 10,
    
    [Parameter(Mandatory=$false)]
    [int]$CrawlTimeout = 120,
    
    [Parameter(Mandatory=$false)]
    [switch]$DebugMode = $false
)

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Secondary = "Gray"
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    $color = $Colors[$Type] ?? $Colors["Info"]
    Write-Host $Message -ForegroundColor $color
}

function Test-BackendHealth {
    <#
    .SYNOPSIS
    Verify backend is responsive before attempting crawls
    #>
    Write-Status "`n=== HEALTH CHECK ===" -Type "Info"
    
    try {
        Write-Status "Testing http://localhost:3005/health..." -Type "Info"
        
        $response = Invoke-WebRequest `
            -Uri "http://localhost:3005/health" `
            -Method GET `
            -TimeoutSec $HealthCheckTimeout `
            -UseBasicParsing `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Status "✅ Backend is healthy (HTTP 200)" -Type "Success"
            return $true
        } else {
            Write-Status "❌ Backend returned HTTP $($response.StatusCode)" -Type "Error"
            return $false
        }
    } catch [System.Net.Http.HttpRequestException] {
        Write-Status "❌ Unable to connect to backend: $($_.Exception.Message)" -Type "Error"
        return $false
    } catch [System.TimeoutException] {
        Write-Status "❌ Backend health check timed out after ${HealthCheckTimeout}s" -Type "Error"
        return $false
    } catch {
        Write-Status "❌ Health check failed: $_" -Type "Error"
        return $false
    }
}

function Invoke-CrawlWithRetry {
    <#
    .SYNOPSIS
    Attempt to crawl URL with retry logic and exponential backoff
    #>
    param(
        [string]$CrawlUrl,
        [int]$Retries = 3
    )
    
    Write-Status "`n=== CRAWL REQUEST ===" -Type "Info"
    Write-Status "URL: $CrawlUrl" -Type "Secondary"
    Write-Status "Max timeout: ${CrawlTimeout}s" -Type "Secondary"
    
    $attempt = 0
    
    while ($attempt -lt $Retries) {
        $attempt++
        Write-Status "`nAttempt $attempt/$Retries..." -Type "Info"
        
        try {
            $body = @{ url = $CrawlUrl } | ConvertTo-Json
            
            if ($DebugMode) {
                Write-Status "[DEBUG] Request body: $body" -Type "Secondary"
            }
            
            $response = Invoke-WebRequest `
                -Uri "http://localhost:3005/api/v1/crawl" `
                -Method POST `
                -ContentType "application/json" `
                -Body $body `
                -TimeoutSec $CrawlTimeout `
                -UseBasicParsing `
                -ErrorAction Stop
            
            if ($DebugMode) {
                Write-Status "[DEBUG] Response status: $($response.StatusCode)" -Type "Secondary"
            }
            
            # Parse response safely
            try {
                $data = $response.Content | ConvertFrom-Json
            } catch {
                Write-Status "❌ Failed to parse response JSON: $_" -Type "Error"
                return $null
            }
            
            # Check if response structure is valid
            if ($null -eq $data) {
                Write-Status "❌ Response data is null" -Type "Error"
                return $null
            }
            
            # Check success flag
            if ($data.success -ne $true) {
                Write-Status "❌ Crawl failed: $($data.error ?? 'Unknown error')" -Type "Error"
                if ($data.details -and $data.details.possibleCauses) {
                    Write-Status "`nPossible causes:" -Type "Warning"
                    $data.details.possibleCauses | ForEach-Object {
                        Write-Status "  • $_" -Type "Secondary"
                    }
                }
                return $null
            }
            
            # Safely check for content
            if ($null -eq $data.data -or $null -eq $data.data.markdown) {
                Write-Status "❌ Response has success=true but no markdown content" -Type "Error"
                return $null
            }
            
            $markdown = $data.data.markdown
            if ([string]::IsNullOrWhiteSpace($markdown)) {
                Write-Status "⚠️  Content is empty despite success flag" -Type "Warning"
                return $null
            }
            
            # Success!
            Write-Status "`n✅ CRAWL SUCCESSFUL!" -Type "Success"
            Write-Status "Status: $($data.status)" -Type "Success"
            Write-Status "Content length: $($markdown.Length) characters" -Type "Success"
            Write-Status "HTTP Status: $($data.stats.statusCode)" -Type "Success"
            
            # Show preview
            $preview = $markdown.Substring(0, [Math]::Min(300, $markdown.Length))
            Write-Status "`nContent preview:" -Type "Info"
            Write-Status "---" -Type "Secondary"
            Write-Host $preview -ForegroundColor "White"
            Write-Status "---" -Type "Secondary"
            
            return $data
            
        } catch [System.Net.Http.HttpRequestException] {
            $backoffMs = [Math]::Pow(2, $attempt - 1) * 1000
            Write-Status "⚠️  Network error: $($_.Exception.Message)" -Type "Warning"
            
            if ($attempt -lt $Retries) {
                Write-Status "Retrying in $($backoffMs)ms..." -Type "Info"
                Start-Sleep -Milliseconds $backoffMs
            } else {
                Write-Status "❌ Failed after $Retries attempts" -Type "Error"
                return $null
            }
        } catch [System.TimeoutException] {
            $backoffMs = [Math]::Pow(2, $attempt - 1) * 1000
            Write-Status "⚠️  Request timeout after ${CrawlTimeout}s" -Type "Warning"
            
            if ($attempt -lt $Retries) {
                Write-Status "Retrying in $($backoffMs)ms..." -Type "Info"
                Start-Sleep -Milliseconds $backoffMs
            } else {
                Write-Status "❌ Timed out after $Retries attempts" -Type "Error"
                return $null
            }
        } catch {
            $backoffMs = [Math]::Pow(2, $attempt - 1) * 1000
            Write-Status "❌ Error: $_" -Type "Error"
            
            if ($attempt -lt $Retries) {
                Write-Status "Retrying in $($backoffMs)ms..." -Type "Info"
                Start-Sleep -Milliseconds $backoffMs
            } else {
                Write-Status "Failed after $Retries attempts" -Type "Error"
                return $null
            }
        }
    }
    
    return $null
}

function Verify-ServerStability {
    <#
    .SYNOPSIS
    Verify server is still running after crawl
    #>
    Write-Status "`n=== STABILITY CHECK ===" -Type "Info"
    
    Start-Sleep -Seconds 2
    
    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:3005/health" `
            -Method GET `
            -TimeoutSec 5 `
            -UseBasicParsing `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Status "✅ Server is still running and healthy" -Type "Success"
            return $true
        } else {
            Write-Status "⚠️  Server returned HTTP $($response.StatusCode)" -Type "Warning"
            return $false
        }
    } catch {
        Write-Status "❌ Server crashed or is not responding: $_" -Type "Error"
        return $false
    }
}

# ============================================
# MAIN TEST FLOW
# ============================================

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor "Cyan"
Write-Host "║     Backend Testing - Comprehensive Validation     ║" -ForegroundColor "Cyan"
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor "Cyan"

Write-Status "Backend: http://localhost:3005" -Type "Secondary"
Write-Status "Target URL: $Url" -Type "Secondary"
if ($DebugMode) {
    Write-Status "Debug mode: ENABLED" -Type "Warning"
}
Write-Status ""

# Step 1: Health check
$healthOk = Test-BackendHealth
if (-not $healthOk) {
    Write-Status "`n💡 Backend is not running. Start it with: npm start" -Type "Warning"
    exit 1
}

# Step 2: Attempt crawl
$crawlResult = Invoke-CrawlWithRetry -CrawlUrl $Url -Retries $MaxRetries
if ($null -eq $crawlResult) {
    Write-Status "`n❌ Crawl failed after all retries" -Type "Error"
    exit 2
}

# Step 3: Verify stability
$stable = Verify-ServerStability
if (-not $stable) {
    Write-Status "`n❌ Server crashed after crawl" -Type "Error"
    exit 3
}

Write-Status "`n╔════════════════════════════════════════════════════╗" -ForegroundColor "Green"
Write-Status "║           ✅ ALL TESTS PASSED ✅                   ║" -ForegroundColor "Green"
Write-Status "╚════════════════════════════════════════════════════╝`n" -ForegroundColor "Green"

exit 0
