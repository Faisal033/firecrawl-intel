#!/usr/bin/env pwsh
param(
  [string]$Url = "https://redingtongroup.com/",
  [switch]$DebugMode,
  [int]$MaxRetries = 3
)

$ErrorActionPreference = "Continue"

function Write-Success { param([string]$msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error-Red { param([string]$msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Warning-Yellow { param([string]$msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Info-Cyan { param([string]$msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Debug-Gray { param([string]$msg) if ($DebugMode) { Write-Host "[DEBUG] $msg" -ForegroundColor Gray } }

function Test-HealthCheck {
  Write-Info-Cyan "Checking backend health..."
  
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
      Write-Success "Backend is healthy"
      return $true
    } else {
      Write-Error-Red "Backend returned status: $($response.StatusCode)"
      return $false
    }
  }
  catch {
    Write-Error-Red "Cannot connect to backend"
    Write-Info-Cyan "Start server: cd c:\Users\535251\OneDrive\Documents\competitor-intelligence; node src/app.js"
    return $false
  }
}

function Invoke-CrawlWithRetry {
  param([string]$Url, [int]$MaxAttempts = 3)
  
  $attempt = 1
  
  while ($attempt -le $MaxAttempts) {
    Write-Info-Cyan "Attempt $attempt of $MaxAttempts"
    
    try {
      $body = @{ url = $Url } | ConvertTo-Json
      Write-Debug-Gray "Sending request to http://localhost:3005/api/v1/crawl"
      
      $response = Invoke-WebRequest -Uri "http://localhost:3005/api/v1/crawl" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 120 -UseBasicParsing -ErrorAction Stop
      
      if ($null -eq $response.Content -or $response.Content.Length -eq 0) {
        Write-Error-Red "Empty response body"
        $attempt++
        if ($attempt -le $MaxAttempts) { Start-Sleep -Seconds 3 }
        continue
      }
      
      $data = $response.Content | ConvertFrom-Json -ErrorAction Stop
      
      if ($null -eq $data.success) {
        Write-Error-Red "Missing success field in response"
        $attempt++
        if ($attempt -le $MaxAttempts) { Start-Sleep -Seconds 3 }
        continue
      }
      
      if ($data.success -eq $true) {
        Write-Success "Crawl succeeded"
        return $data
      }
      
      if ($data.success -eq $false) {
        Write-Error-Red "Crawl failed: $($data.error)"
        if ($data.error -like "*blocked*") {
          Write-Warning-Yellow "Website blocked the crawler - not retrying"
          return $data
        }
        $attempt++
        if ($attempt -le $MaxAttempts) { Start-Sleep -Seconds 3 }
        continue
      }
    }
    catch [System.Net.WebException] {
      Write-Error-Red "Network error: $($_.Exception.Message)"
      $attempt++
      if ($attempt -le $MaxAttempts) { Start-Sleep -Seconds 5 }
    }
    catch {
      Write-Error-Red "Error: $($_.Exception.Message)"
      $attempt++
      if ($attempt -le $MaxAttempts) { Start-Sleep -Seconds 5 }
    }
  }
  
  Write-Error-Red "All $MaxAttempts attempts failed"
  return $null
}

function Extract-Content {
  param([object]$Response)
  
  if ($null -eq $Response -or $Response.success -ne $true) {
    return $null
  }
  
  $markdown = $null
  
  if ($null -ne $Response.data -and $null -ne $Response.data.markdown) {
    $markdown = $Response.data.markdown
  }
  elseif ($null -ne $Response.markdown) {
    $markdown = $Response.markdown
  }
  elseif ($Response.data -is [array] -and $Response.data.Length -gt 0 -and $null -ne $Response.data[0].markdown) {
    $markdown = $Response.data[0].markdown
  }
  
  if ($null -eq $markdown -or $markdown.Length -eq 0) {
    Write-Error-Red "No content found"
    return $null
  }
  
  return $markdown
}

# MAIN
Write-Host ""
Write-Host "Web Crawler Client" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-HealthCheck)) {
  exit 1
}

if ([string]::IsNullOrWhiteSpace($Url)) {
  Write-Error-Red "URL is required"
  exit 1
}

Write-Info-Cyan "Crawling: $Url"

$result = Invoke-CrawlWithRetry -Url $Url -MaxAttempts $MaxRetries

Write-Host ""
Write-Host ("=" * 80)
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host ("=" * 80)

if ($null -eq $result) {
  Write-Error-Red "No response"
  exit 1
}

Write-Host "Success: $($result.success)" -ForegroundColor (if ($result.success) { "Green" } else { "Red" })
Write-Host "Status: $($result.status)" -ForegroundColor Cyan

if ($result.success -eq $true) {
  Write-Host "Content Length: $($result.stats.contentLength) chars" -ForegroundColor Green
  
  $content = Extract-Content -Response $result
  if ($null -ne $content) {
    Write-Host "`nPreview (first 400 chars):" -ForegroundColor Cyan
    Write-Host "---"
    Write-Host $content.Substring(0, [Math]::Min(400, $content.Length))
    Write-Host "---"
  }
} else {
  Write-Error-Red "Error: $($result.error)"
}

Write-Host ("=" * 80)
Write-Host ""

if ($result.success -eq $true) { exit 0 } else { exit 1 }
