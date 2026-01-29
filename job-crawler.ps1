# Firecrawl Direct Job Crawler - Telecalling Jobs Only
# No backend server - uses Firecrawl directly on localhost:3002
# Target websites: Naukri, Apna, Indeed (India only)

param(
    [string]$FirecrawlURL = "http://localhost:3002",
    [int]$TimeoutSeconds = 180,
    [int]$PollIntervalSeconds = 2,
    [switch]$ExportJSON,
    [switch]$ExportCSV,
    [switch]$VerboseOutput
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$Config = @{
    FirecrawlURL = $FirecrawlURL
    TimeoutSeconds = $TimeoutSeconds
    PollIntervalSeconds = $PollIntervalSeconds
    
    # Job search terms for telecalling roles
    SearchTerms = @(
        'telecaller',
        'telecalling',
        'voice process',
        'call executive',
        'customer support voice',
        'BPOS',
        'inbound call'
    )
    
    # Website configurations
    Websites = @(
        @{
            Name = 'Naukri'
            BaseURL = 'https://www.naukri.com'
            SearchPath = '/jobs-bangalore-telecaller-jobs'
            Identifier = 'naukri'
        },
        @{
            Name = 'Apna'
            BaseURL = 'https://www.apnaapp.com'
            SearchPath = '/jobs?q=telecaller'
            Identifier = 'apna'
        },
        @{
            Name = 'Indeed'
            BaseURL = 'https://www.indeed.com'
            SearchPath = '/jobs?q=telecaller&l=India'
            Identifier = 'indeed'
        }
    )
}

$Results = @()
$JobsFound = 0

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

function Write-Status {
    param([string]$Message, [string]$Status = 'INFO')
    
    $timestamp = Get-Date -Format 'HH:mm:ss'
    $color = switch($Status) {
        'SUCCESS' { 'Green' }
        'ERROR' { 'Red' }
        'WARN' { 'Yellow' }
        'INFO' { 'Cyan' }
        default { 'White' }
    }
    
    Write-Host "[$timestamp] [$Status] $Message" -ForegroundColor $color
}

function Test-FirecrawlHealth {
    Write-Status 'Checking Firecrawl health...' 'INFO'
    
    try {
        # Try the status endpoint
        $response = Invoke-WebRequest -Uri "$($Config.FirecrawlURL)/" -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Status 'Firecrawl is running' 'SUCCESS'
        return $true
    }
    catch {
        Write-Status "Firecrawl health check failed: $_" 'ERROR'
        return $false
    }
}

function Invoke-FirecrawlCrawl {
    param(
        [string]$URL,
        [int]$TimeoutSec = $Config.TimeoutSeconds,
        [int]$PollInterval = $Config.PollIntervalSeconds
    )
    
    Write-Status "Initiating crawl: $URL" 'INFO'
    
    try {
        # Step 1: Submit crawl job
        $body = @{
            url = $URL
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$($Config.FirecrawlURL)/v1/crawl" `
            -Method POST `
            -ContentType 'application/json' `
            -Body $body `
            -TimeoutSec 30 `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $jobData = $response.Content | ConvertFrom-Json
        
        if (-not $jobData.success) {
            Write-Status "Crawl initiation failed: $($jobData.error)" 'WARN'
            return $null
        }
        
        $jobID = $jobData.id
        $jobURL = $jobData.url
        Write-Status "Job initiated: $jobID" 'INFO'
        
        # Step 2: Poll for results
        $elapsed = 0
        $startTime = Get-Date
        
        while ($elapsed -lt $TimeoutSec) {
            Start-Sleep -Seconds $PollInterval
            
            try {
                $resultResponse = Invoke-WebRequest -Uri $jobURL `
                    -Method GET `
                    -TimeoutSec 30 `
                    -UseBasicParsing `
                    -ErrorAction Stop
                
                $resultData = $resultResponse.Content | ConvertFrom-Json
                
                if ($resultData.status -eq 'completed') {
                    Write-Status "Crawl completed: $($resultData.data.length) pages retrieved" 'SUCCESS'
                    return $resultData.data
                }
                elseif ($resultData.status -eq 'failed') {
                    Write-Status "Crawl failed: $($resultData.error)" 'ERROR'
                    return $null
                }
            }
            catch {
                # Still polling
            }
            
            $elapsed = [int]((Get-Date) - $startTime).TotalSeconds
            Write-Status "Polling... ($elapsed/$TimeoutSec sec)" 'INFO'
        }
        
        Write-Status "Crawl timeout after $TimeoutSec seconds" 'WARN'
        return $null
    }
    catch {
        Write-Status "Crawl error: $_" 'ERROR'
        return $null
    }
}

function Extract-JobData {
    param([string]$Content, [string]$Source)
    
    # Pattern 1: Look for phone numbers
    $phonePattern = '(?<!\d)\d{10}(?!\d)|\+91\s?\d{10}'
    $phoneMatches = [regex]::Matches($Content, $phonePattern)
    $phones = @($phoneMatches | ForEach-Object { $_.Value })
    
    # Pattern 2: Look for emails
    $emailPattern = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    $emailMatches = [regex]::Matches($Content, $emailPattern)
    $emails = @($emailMatches | ForEach-Object { $_.Value })
    
    # Try to extract structured data
    $companyPattern = '(?i)(?:company|employer)[\s:]*([^<\n]+)'
    $companyMatch = [regex]::Match($Content, $companyPattern)
    
    $titlePattern = '(?i)(?:job title|title|position)[\s:]*([^<\n]+)'
    $titleMatch = [regex]::Match($Content, $titlePattern)
    
    $locationPattern = '(?i)(?:location|city|place)[\s:]*([^<\n]+)'
    $locationMatch = [regex]::Match($Content, $locationPattern)
    
    $job = @{
        Source = $Source
        CompanyName = if ($companyMatch.Success) { $companyMatch.Groups[1].Value.Trim() } else { $null }
        JobTitle = if ($titleMatch.Success) { $titleMatch.Groups[1].Value.Trim() } else { $null }
        Location = if ($locationMatch.Success) { $locationMatch.Groups[1].Value.Trim() } else { $null }
        Description = $Content.Substring(0, [Math]::Min(500, $Content.Length)).Trim()
        Phone = if ($phones.Count -gt 0) { $phones[0] } else { $null }
        Email = if ($emails.Count -gt 0) { $emails[0] } else { $null }
        ExtractedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    }
    
    return $job
}

function Process-CrawlResults {
    param([array]$Pages, [string]$Source)
    
    Write-Status "Processing $($Pages.Count) pages from $Source" 'INFO'
    
    foreach ($page in $Pages) {
        if ($page.markdown) {
            $content = $page.markdown
            
            # Filter for telecalling-related keywords
            $hasTelecallingKeyword = $Config.SearchTerms | Where-Object { $content -match $_ } | Measure-Object | Select-Object -ExpandProperty Count
            
            if ($hasTelecallingKeyword -gt 0) {
                $jobData = Extract-JobData -Content $content -Source $Source
                
                # Validate job entry has at least some data
                if ($jobData.JobTitle -or $jobData.CompanyName) {
                    $Results += $jobData
                    $global:JobsFound++
                    
                    Write-Status "Found: $($jobData.JobTitle) @ $($jobData.CompanyName)" 'SUCCESS'
                }
            }
        }
    }
}

function Display-Results {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  EXTRACTED JOB DATA - TELECALLING POSITIONS" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    
    if ($Results.Count -eq 0) {
        Write-Host "No jobs found matching criteria." -ForegroundColor Yellow
        return
    }
    
    foreach ($i in 0..($Results.Count - 1)) {
        $job = $Results[$i]
        
        Write-Host ""
        Write-Host "[Job $($i+1)]" -ForegroundColor Yellow
        Write-Host "  Source........: $($job.Source)" -ForegroundColor White
        $companyDisplay = if ($job.CompanyName) { $job.CompanyName } else { 'N/A' }
        Write-Host "  Company.......: $companyDisplay" -ForegroundColor White
        $titleDisplay = if ($job.JobTitle) { $job.JobTitle } else { 'N/A' }
        Write-Host "  Title.........: $titleDisplay" -ForegroundColor White
        $locationDisplay = if ($job.Location) { $job.Location } else { 'N/A' }
        Write-Host "  Location......: $locationDisplay" -ForegroundColor White
        $phoneDisplay = if ($job.Phone) { $job.Phone } else { 'N/A' }
        Write-Host "  Phone.........: $phoneDisplay" -ForegroundColor White
        $emailDisplay = if ($job.Email) { $job.Email } else { 'N/A' }
        Write-Host "  Email.........: $emailDisplay" -ForegroundColor White
        Write-Host "  Description...: $($job.Description.Substring(0, [Math]::Min(100, $job.Description.Length)))..." -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  Total Jobs Found: $($Results.Count)" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
}

function Export-Results {
    if ($Results.Count -eq 0) {
        Write-Status 'No results to export' 'WARN'
        return
    }
    
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    
    if ($ExportJSON) {
        $jsonFile = "jobs_$timestamp.json"
        $Results | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonFile
        Write-Status "Exported JSON: $jsonFile" 'SUCCESS'
    }
    
    if ($ExportCSV) {
        $csvFile = "jobs_$timestamp.csv"
        $Results | Select-Object Source, CompanyName, JobTitle, Location, Phone, Email, ExtractedAt | Export-Csv -Path $csvFile -NoTypeInformation
        Write-Status "Exported CSV: $csvFile" 'SUCCESS'
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Main {
    Write-Host ""
    Write-Host "===========================================================" -ForegroundColor Cyan
    Write-Host "  FIRECRAWL DIRECT JOB CRAWLER (Backend-less)" -ForegroundColor Cyan
    Write-Host "  Target: Telecalling Jobs in India" -ForegroundColor Cyan
    Write-Host "  Websites: Naukri, Apna, Indeed" -ForegroundColor Cyan
    Write-Host "===========================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Step 1: Health Check
    if (-not (Test-FirecrawlHealth)) {
        Write-Status 'CRITICAL: Firecrawl is not running. Cannot proceed.' 'ERROR'
        Write-Host ""
        Write-Host "To start Firecrawl:" -ForegroundColor Yellow
        Write-Host "  docker-compose -f firecrawl-selfhost/docker-compose.yml up -d" -ForegroundColor Gray
        exit 1
    }
    
    Write-Host ""
    
    # Step 2: Crawl each website
    foreach ($website in $Config.Websites) {
        Write-Host ""
        Write-Host "-----------------------------------------------------------" -ForegroundColor Magenta
        Write-Host "  Crawling: $($website.Name)" -ForegroundColor Magenta
        Write-Host "-----------------------------------------------------------" -ForegroundColor Magenta
        Write-Host ""
        
        $crawlURL = $website.BaseURL + $website.SearchPath
        $pages = Invoke-FirecrawlCrawl -URL $crawlURL -TimeoutSec $Config.TimeoutSeconds
        
        if ($pages) {
            Process-CrawlResults -Pages $pages -Source $website.Name
        }
        
        Start-Sleep -Seconds 3
    }
    
    # Step 3: Display Results
    Display-Results
    
    # Step 4: Export if requested
    if ($ExportJSON -or $ExportCSV) {
        Export-Results
    }
    
    Write-Host ""
}

# ============================================================================
# RUN
# ============================================================================

Main
