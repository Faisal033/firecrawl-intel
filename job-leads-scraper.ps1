#!/usr/bin/env pwsh

<#
.SYNOPSIS
Telecalling Job Leads Scraper using Firecrawl API directly (localhost:3002)

.DESCRIPTION
Crawls multiple Indian job websites for telecalling positions and extracts structured data.

.PARAMETER Websites
Job websites to crawl (default: all configured websites)

.PARAMETER MaxJobs
Maximum number of jobs to extract per website (default: 20)

.PARAMETER WaitTime
Wait time for JavaScript rendering in milliseconds (default: 3000)

.EXAMPLE
.\job-leads-scraper.ps1
.\job-leads-scraper.ps1 -MaxJobs 50
.\job-leads-scraper.ps1 -WaitTime 5000
#>

param(
    [int]$MaxJobs = 20,
    [int]$WaitTime = 3000,
    [int]$Timeout = 180,
    [switch]$SkipCSV
)

# Configuration
$FirecrawlUrl = "http://localhost:3002/v1/crawl"
$PollingInterval = 2000  # milliseconds
$MaxPolls = 90           # ~3 minutes max

# Job websites and keywords
$Websites = @(
    @{
        Name      = "Indeed India"
        BaseUrl   = "https://in.indeed.com/jobs"
        SearchTerms = @("telecaller", "telecalling", "voice process", "call executive")
        QueryParam = "q"
    },
    @{
        Name      = "LinkedIn Jobs"
        BaseUrl   = "https://www.linkedin.com/jobs/search"
        SearchTerms = @("telecaller India", "voice process India", "call executive India")
        QueryParam = "keywords"
    },
    @{
        Name      = "Fresher.com"
        BaseUrl   = "https://fresher.com"
        SearchTerms = @("telecaller", "voice process")
        QueryParam = "search"
    },
    @{
        Name      = "Naukri Jobs"
        BaseUrl   = "https://www.naukri.com/jobs"
        SearchTerms = @("telecaller", "telecalling")
        QueryParam = "k"
    }
)

$AllJobs = @()
$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Text)
    Write-Host "`n$('=' * 70)" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "$('=' * 70)" -ForegroundColor Cyan
}

function Write-JobInfo {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Error_ {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Warning_ {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Progress_ {
    param([string]$Text)
    Write-Host "📡 $Text" -ForegroundColor Cyan
}

<#
.SYNOPSIS
Crawl a URL using Firecrawl API
#>
function Invoke-FirecrawlCrawl {
    param(
        [string]$Url,
        [int]$Wait = 3000
    )
    
    Write-Progress_ "Sending crawl request..."
    Write-Host "   URL: $Url" -ForegroundColor Gray
    
    try {
        # Submit crawl job
        $Body = @{
            url = $Url
            wait_for_loading_delay = $Wait
        } | ConvertTo-Json
        
        $CrawlResponse = Invoke-WebRequest -Uri $FirecrawlUrl `
            -Method POST `
            -ContentType "application/json" `
            -Body $Body `
            -TimeoutSec 30 `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $CrawlData = $CrawlResponse.Content | ConvertFrom-Json
        
        if (-not $CrawlData.success -or -not $CrawlData.id) {
            Write-Error_ "Failed to create crawl job"
            return $null
        }
        
        $JobId = $CrawlData.id
        $StatusUrl = $CrawlData.url
        Write-Success "Job created: $JobId"
        
        # Poll for results
        $Attempts = 0
        $MaxAttempts = $MaxPolls
        $Result = $null
        
        Write-Host "   Polling for results..." -ForegroundColor Gray
        
        while ($Attempts -lt $MaxAttempts) {
            $Attempts++
            
            try {
                Start-Sleep -Milliseconds $PollingInterval
                
                $StatusResponse = Invoke-WebRequest -Uri $StatusUrl `
                    -Method GET `
                    -TimeoutSec 10 `
                    -UseBasicParsing `
                    -ErrorAction Stop
                
                $StatusData = $StatusResponse.Content | ConvertFrom-Json
                
                if ($StatusData.status -eq "completed") {
                    $Result = $StatusData
                    Write-Success "Crawl completed in $([Math]::Round($Attempts * 2, 1))s"
                    break
                } elseif ($StatusData.status -eq "failed") {
                    Write-Error_ "Crawl failed: $($StatusData.error)"
                    break
                }
                
                Write-Host -NoNewline "." -ForegroundColor Cyan
            }
            catch {
                Write-Host -NoNewline "!" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        
        if ($null -eq $Result) {
            Write-Error_ "Polling timeout after $Attempts attempts"
            return $null
        }
        
        Write-Success "Retrieved $($Result.data.length) page(s)"
        return $Result.data
        
    }
    catch {
        Write-Error_ "Crawl error: $($_.Exception.Message)"
        return $null
    }
}

<#
.SYNOPSIS
Extract structured job data from markdown content
#>
function Extract-JobData {
    param(
        [string]$Markdown,
        [string]$SourceUrl,
        [string]$WebsiteName
    )
    
    $Jobs = @()
    
    # Split content into potential job blocks
    $JobBlocks = $Markdown -split "`n(?=[A-Z]|\d+\.)" | Where-Object { $_.Length -gt 20 }
    
    foreach ($Block in $JobBlocks) {
        $Job = [PSCustomObject]@{
            source_website   = $WebsiteName
            source_url       = $SourceUrl
            company_name     = $null
            job_title        = $null
            location         = $null
            description      = $null
            phone            = $null
            email            = $null
            extracted_at     = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        }
        
        # Extract phone number
        if ($Block -match '\b([0-9]{10}|\+91[0-9]{10})\b') {
            $Job.phone = $matches[1]
        }
        
        # Extract email
        if ($Block -match '([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})') {
            $Job.email = $matches[1]
        }
        
        # Extract job title
        if ($Block -match 'Job[:\s]+(.+?)[\n$]') {
            $Job.job_title = $matches[1].Trim()
        }
        elseif ($Block -match '(?:telecaller|voice.*?process|call.*?executive).+?[\n]' -or 
                $Block -match '(.*?(?:telecaller|voice|call).*?)[\n]') {
            $Candidate = $matches[1].Trim()
            if ($Candidate.Length -lt 100) {
                $Job.job_title = $Candidate
            }
        }
        
        # Extract company name
        if ($Block -match '(?:Company|Employer)[:\s]+(.+?)[\n]') {
            $Job.company_name = $matches[1].Trim()
        }
        
        # Extract location
        if ($Block -match '(?:Location|Place|City)[:\s]+(.+?)[\n]') {
            $Job.location = $matches[1].Trim()
        }
        else {
            # Look for Indian cities
            $Cities = @("Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", 
                       "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh", "Lucknow", "Gurgaon", "Noida")
            
            foreach ($City in $Cities) {
                if ($Block -match "\b$City\b") {
                    $Job.location = $City
                    break
                }
            }
        }
        
        # Extract description (first 200 chars)
        $DescLines = $Block -split "`n" | 
            Where-Object { $_.Length -gt 10 -and $_ -notmatch "Click|Apply|button" } | 
            Select-Object -First 3 | 
            Join-String -Separator " "
        
        if ($DescLines) {
            $Job.description = $DescLines.Substring(0, [Math]::Min(200, $DescLines.Length))
        }
        
        # Only add if we have job title or company
        if ($Job.job_title -or $Job.company_name) {
            $Jobs += $Job
        }
    }
    
    return $Jobs | Select-Object -First $MaxJobs
}

<#
.SYNOPSIS
Build search URLs for a website
#>
function Get-SearchUrls {
    param([hashtable]$Website)
    
    $Urls = @()
    
    foreach ($Term in $Website.SearchTerms) {
        $EncodedTerm = [System.Web.HttpUtility]::UrlEncode($Term)
        
        $Url = switch ($Website.Name) {
            "Indeed India" {
                "$($Website.BaseUrl)?$($Website.QueryParam)=$EncodedTerm&location=India"
            }
            "LinkedIn Jobs" {
                "$($Website.BaseUrl)?$($Website.QueryParam)=$EncodedTerm&location=India"
            }
            "Fresher.com" {
                "$($Website.BaseUrl)?$($Website.QueryParam)=$EncodedTerm&location=India"
            }
            "Naukri Jobs" {
                "$($Website.BaseUrl)?$($Website.QueryParam)=$EncodedTerm"
            }
            default {
                "$($Website.BaseUrl)?$($Website.QueryParam)=$EncodedTerm"
            }
        }
        
        $Urls += $Url
    }
    
    return $Urls
}

<#
.SYNOPSIS
Export jobs to CSV format
#>
function Export-ToCSV {
    param(
        [PSCustomObject[]]$Jobs,
        [string]$FilePath
    )
    
    if ($Jobs.Count -eq 0) {
        Write-Warning_ "No jobs to export"
        return
    }
    
    # Create CSV header
    $CSV = "Website,Company,Job Title,Location,Description,Phone,Email,Source URL,Extracted At`n"
    
    foreach ($Job in $Jobs) {
        $Company = $Job.company_name -replace ',', ';'
        $Title = $Job.job_title -replace ',', ';'
        $Desc = $Job.description -replace ',', ';'
        
        $CSV += "`"$($Job.source_website)`",`"$Company`",`"$Title`",`"$($Job.location)`",`"$Desc`",`"$($Job.phone)`",`"$($Job.email)`",`"$($Job.source_url)`",`"$($Job.extracted_at)`"`n"
    }
    
    $CSV | Out-File -FilePath $FilePath -Encoding UTF8 -Force
    Write-Success "Exported to CSV: $FilePath"
}

<#
.SYNOPSIS
Display job results in console
#>
function Show-JobResults {
    param([PSCustomObject[]]$Jobs)
    
    Write-Header "RESULTS SUMMARY"
    Write-Host "`nTotal jobs extracted: " -NoNewline -ForegroundColor White
    Write-Host "$($Jobs.Count)" -ForegroundColor Green -NoNewline
    Write-Host " potential telecalling job listings`n"
    
    if ($Jobs.Count -eq 0) {
        Write-Warning_ "No jobs found"
        return
    }
    
    Write-Header "SAMPLE RESULTS (First 10)"
    
    for ($i = 0; $i -lt [Math]::Min(10, $Jobs.Count); $i++) {
        $Job = $Jobs[$i]
        Write-Host "`n[$($i+1)] $($Job.job_title)" -ForegroundColor Yellow
        Write-Host "    Company  : $($Job.company_name)" -ForegroundColor White
        Write-Host "    Location : $($Job.location)" -ForegroundColor White
        Write-Host "    Website  : $($Job.source_website)" -ForegroundColor Gray
        
        if ($Job.email) {
            Write-Host "    Email    : $($Job.email)" -ForegroundColor Cyan
        }
        if ($Job.phone) {
            Write-Host "    Phone    : $($Job.phone)" -ForegroundColor Cyan
        }
        
        if ($Job.description) {
            Write-Host "    Desc     : $($Job.description.Substring(0, [Math]::Min(60, $Job.description.Length)))..." -ForegroundColor Gray
        }
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Header "TELECALLING JOB LEADS SCRAPER"

# Check Firecrawl status
Write-Progress_ "Checking Firecrawl status on localhost:3002..."
try {
    $TestBody = @{ url = "https://example.com" } | ConvertTo-Json
    $TestResponse = Invoke-WebRequest -Uri $FirecrawlUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $TestBody `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Success "Firecrawl is running`n"
}
catch {
    Write-Error_ "Cannot connect to Firecrawl on localhost:3002"
    Write-Host "Start Docker containers with: docker-compose up -d`n" -ForegroundColor Yellow
    exit 1
}

# Process each website
foreach ($Website in $Websites) {
    Write-Header "SCRAPING: $($Website.Name)"
    
    $SearchUrls = Get-SearchUrls -Website $Website
    $WebsiteJobs = @()
    
    foreach ($SearchUrl in $SearchUrls) {
        Write-JobInfo "Keyword: $($SearchUrl.Split('=') | Select-Object -Last 1)"
        
        $CrawledPages = Invoke-FirecrawlCrawl -Url $SearchUrl -Wait $WaitTime
        
        if ($CrawledPages -and $CrawledPages.Count -gt 0) {
            foreach ($Page in $CrawledPages) {
                $Markdown = $Page.markdown -replace "\\n", "`n"
                $Jobs = Extract-JobData -Markdown $Markdown -SourceUrl $SearchUrl -WebsiteName $Website.Name
                
                if ($Jobs) {
                    $WebsiteJobs += $Jobs
                    Write-Success "Extracted $($Jobs.Count) potential jobs"
                }
            }
        }
        
        Start-Sleep -Milliseconds 2000  # Delay between requests
    }
    
    $AllJobs += $WebsiteJobs
}

# Display and save results
Show-JobResults -Jobs $AllJobs

# Save to JSON
$JsonFile = "job-leads-$Timestamp.json"
$AllJobs | ConvertTo-Json | Out-File -FilePath $JsonFile -Encoding UTF8
Write-Success "Saved JSON: $JsonFile"

# Save to CSV
if (-not $SkipCSV) {
    $CsvFile = "job-leads-$Timestamp.csv"
    Export-ToCSV -Jobs $AllJobs -FilePath $CsvFile
}

Write-Header "SCRAPING COMPLETE"
Write-Host "`n✅ Found $($AllJobs.Count) potential telecalling job listings across Indian job sites`n"
