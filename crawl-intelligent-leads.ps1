#!/usr/bin/env pwsh

<#
.SYNOPSIS
Intelligent Job Leads Crawler - Two-Stage Approach

.DESCRIPTION
Stage 1: Extract job metadata from portals (company, title, location)
Stage 2: Find company websites and extract contact info
Merge: Combine into complete leads with full contact information

NO portal bypassing - ethical crawling respecting anti-bot protections

.EXAMPLE
.\crawl-intelligent-leads.ps1

.NOTES
Requires:
- PowerShell 5.1+
- Firecrawl running on http://localhost:3002
- No external dependencies
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('json', 'csv', 'both')]
    [string]$OutputFormat = 'both'
)

# Configuration
$FirecrawlBase = 'http://localhost:3002'
$FirecrawlCrawl = "$FirecrawlBase/v1/crawl"

# Job portals - Stage 1 sources
$Portals = @(
    @{ Name = 'Naukri'; Url = 'https://www.naukri.com/jobs-in-india-for-telecaller'; Source = 'Naukri' }
    @{ Name = 'Indeed'; Url = 'https://in.indeed.com/jobs?q=telecaller&l=India'; Source = 'Indeed' }
    @{ Name = 'Apna'; Url = 'https://www.apnaapp.com/jobs?title=telecaller&location=India'; Source = 'Apna' }
)

# Telecalling keywords
$TelecallingKeywords = @(
    'telecaller', 'telecalling', 'voice process', 'call executive',
    'customer support', 'inbound calls', 'outbound calls',
    'tele-calling', 'call center', 'phone based', 'bpo'
)

# India locations
$IndiaLocations = @(
    'india', 'bangalore', 'delhi', 'mumbai', 'pune', 'hyderabad',
    'gurgaon', 'noida', 'chennai', 'kolkata', 'jaipur', 'lucknow'
)

<#
.FUNCTION Test-FirecrawlHealth
#>
function Test-FirecrawlHealth {
    Write-Host "`n🔍 Checking Firecrawl health..." -ForegroundColor Cyan
    try {
        $body = @{ url = 'https://example.com' } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri $FirecrawlCrawl -Method POST `
            -ContentType 'application/json' -Body $body -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        
        Write-Host "✅ Firecrawl is running!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Firecrawl not running at $FirecrawlBase" -ForegroundColor Red
        return $false
    }
}

<#
.FUNCTION Test-IsTelecallingJob
#>
function Test-IsTelecallingJob {
    param([string]$Text)
    
    $lowerText = $Text.ToLower()
    return ($TelecallingKeywords | Where-Object { $lowerText.Contains($_) }).Count -gt 0
}

<#
.FUNCTION Test-IsIndiaLocation
#>
function Test-IsIndiaLocation {
    param([string]$Text)
    
    if ([string]::IsNullOrWhiteSpace($Text)) { return $true }
    $lowerText = $Text.ToLower()
    return ($IndiaLocations | Where-Object { $lowerText.Contains($_) }).Count -gt 0
}

<#
.FUNCTION Extract-JobMetadata
Stage 1: Extract job metadata from portal content
#>
function Extract-JobMetadata {
    param(
        [string]$Content,
        [string]$Source
    )
    
    $jobs = @()
    $jobBlocks = $Content -split '\n\n+' | Where-Object { $_.Trim().Length -gt 30 }
    
    foreach ($block in $jobBlocks) {
        if (-not (Test-IsTelecallingJob $block)) { continue }
        
        $lines = @($block -split '\n' | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 0 })
        
        $title = if ($lines.Count -gt 0) { $lines[0] } else { $null }
        $company = if ($lines.Count -gt 1) { $lines[1] } else { $null }
        $location = if ($lines.Count -gt 2) { $lines[2] } else { 'India' }
        
        if (-not (Test-IsIndiaLocation $location)) { continue }
        
        if ($company) {
            $job = @{
                company = $company
                title = $title ?? 'Telecalling Job'
                location = $location ?? 'India'
                source = $Source
                discoveredAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
                companyWebsite = $null
                phone = $null
                email = $null
            }
            $jobs += $job
        }
    }
    
    return $jobs
}

<#
.FUNCTION Find-CompanyWebsite
Stage 2: Find company website
#>
function Find-CompanyWebsite {
    param([string]$CompanyName)
    
    $cleanName = $CompanyName.ToLower() -replace '\s+', ''
    $patterns = @(
        "https://www.$cleanName.com"
        "https://$cleanName.com"
        "https://www.$cleanName.in"
        "https://$cleanName.in"
    )
    
    foreach ($url in $patterns) {
        try {
            $body = @{ url = $url } | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $FirecrawlCrawl -Method POST `
                -ContentType 'application/json' -Body $body -TimeoutSec 15 `
                -UseBasicParsing -ErrorAction Stop
            
            $data = $response.Content | ConvertFrom-Json
            if ($data.success -and $data.id) {
                return $url
            }
        } catch {
            # Continue to next pattern
        }
    }
    
    return $null
}

<#
.FUNCTION Extract-PhoneNumber
#>
function Extract-PhoneNumber {
    param([string]$Text)
    
    if ([string]::IsNullOrWhiteSpace($Text)) { return $null }
    
    $patterns = @(
        '\+91[\s.-]?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}'
        '\b[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b'
        '\b(0\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4})\b'
    )
    
    foreach ($pattern in $patterns) {
        if ($Text -match $pattern) {
            return ($matches[0] -replace '[\s.-]', '')
        }
    }
    
    return $null
}

<#
.FUNCTION Extract-Email
#>
function Extract-Email {
    param([string]$Text)
    
    if ([string]::IsNullOrWhiteSpace($Text)) { return $null }
    
    $pattern = '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
    if ($Text -match $pattern) {
        return $matches[0]
    }
    
    return $null
}

<#
.FUNCTION Get-ContactInfoAsync
Stage 2: Extract contact info from company website
#>
function Get-ContactInfoAsync {
    param([string]$WebsiteUrl)
    
    if ([string]::IsNullOrWhiteSpace($WebsiteUrl)) {
        return @{ phone = $null; email = $null }
    }
    
    try {
        $body = @{ url = $WebsiteUrl } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri $FirecrawlCrawl -Method POST `
            -ContentType 'application/json' -Body $body -TimeoutSec 15 `
            -UseBasicParsing -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if (-not ($data.success -and $data.id)) {
            return @{ phone = $null; email = $null }
        }
        
        # Wait for job completion
        $maxWait = 30000
        $startTime = [DateTime]::Now.Ticks
        $interval = 2000
        
        while (([DateTime]::Now.Ticks - $startTime) -lt $maxWait * 10000) {
            try {
                Start-Sleep -Milliseconds $interval
                $resultResponse = Invoke-WebRequest -Uri $data.url -Method GET `
                    -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
                
                $resultData = $resultResponse.Content | ConvertFrom-Json
                
                if ($resultData.status -eq 'completed' -and $resultData.data.Count -gt 0) {
                    $markdown = $resultData.data[0].markdown
                    return @{
                        phone = Extract-PhoneNumber $markdown
                        email = Extract-Email $markdown
                    }
                }
            } catch {
                # Retry
            }
        }
        
        return @{ phone = $null; email = $null }
    } catch {
        return @{ phone = $null; email = $null }
    }
}

<#
.FUNCTION Invoke-CrawlPortal
Stage 1: Crawl portal for job metadata
#>
function Invoke-CrawlPortal {
    param(
        [string]$PortalUrl,
        [string]$PortalName
    )
    
    Write-Host "`n🔄 Stage 1: Crawling $PortalName..." -ForegroundColor Yellow
    Write-Host "   URL: $PortalUrl" -ForegroundColor Gray
    
    try {
        $body = @{ url = $PortalUrl } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri $FirecrawlCrawl -Method POST `
            -ContentType 'application/json' -Body $body -TimeoutSec 20 `
            -UseBasicParsing -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if (-not ($data.success -and $data.id)) {
            Write-Host "   ⚠️  Failed to start crawl job" -ForegroundColor Yellow
            return $null
        }
        
        Write-Host "   📋 Job started: $($data.id.Substring(0, 8))..." -ForegroundColor Gray
        Write-Host "   ⏳ Waiting for results..." -ForegroundColor Gray
        
        # Wait for results
        $maxWait = 60000
        $startTime = [DateTime]::Now.Ticks
        $interval = 3000
        
        while (([DateTime]::Now.Ticks - $startTime) -lt $maxWait * 10000) {
            try {
                Start-Sleep -Milliseconds $interval
                $resultResponse = Invoke-WebRequest -Uri $data.url -Method GET `
                    -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
                
                $resultData = $resultResponse.Content | ConvertFrom-Json
                
                if ($resultData.status -eq 'completed' -and $resultData.data.Count -gt 0) {
                    $markdown = $resultData.data[0].markdown
                    Write-Host "   ✓ Got $($markdown.Length) characters" -ForegroundColor Green
                    return $markdown
                }
            } catch {
                # Retry
            }
        }
        
        Write-Host "   ⚠️  Timeout waiting for results" -ForegroundColor Yellow
        return $null
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

<#
.FUNCTION Print-Leads
#>
function Print-Leads {
    param([array]$Leads)
    
    Write-Host ("`n" + ('=' * 100)) -ForegroundColor Cyan
    Write-Host "📋 EXTRACTED $($Leads.Count) COMPLETE LEADS WITH CONTACT INFO" -ForegroundColor Green
    Write-Host ('=' * 100) -ForegroundColor Cyan
    
    $Leads | ForEach-Object -Begin { $i = 1 } {
        Write-Host "`n[$i] $($_.title)" -ForegroundColor White
        Write-Host "    Company: $($_.company)" -ForegroundColor Gray
        Write-Host "    Location: $($_.location)" -ForegroundColor Gray
        Write-Host "    Source: $($_.source)" -ForegroundColor Gray
        Write-Host "    Website: $($_.companyWebsite ?? 'Not found')" -ForegroundColor Gray
        Write-Host "    Phone: $($_.phone ?? 'Not found')" -ForegroundColor Gray
        Write-Host "    Email: $($_.email ?? 'Not found')" -ForegroundColor Gray
        $i++
    }
    
    Write-Host ("`n" + ('=' * 100) + "`n") -ForegroundColor Cyan
}

<#
.FUNCTION Save-LeadsToJSON
#>
function Save-LeadsToJSON {
    param(
        [array]$Leads,
        [string]$Filename = 'leads-complete.json'
    )
    
    $Leads | ConvertTo-Json -Depth 10 | Set-Content -Path $Filename
    Write-Host "`n📄 Saved $($Leads.Count) leads to: $Filename" -ForegroundColor Green
    return (Resolve-Path $Filename).Path
}

<#
.FUNCTION Save-LeadsToCSV
#>
function Save-LeadsToCSV {
    param(
        [array]$Leads,
        [string]$Filename = 'leads-complete.csv'
    )
    
    $Leads | Select-Object -Property @(
        @{ Name = 'Company'; Expression = { $_.company } }
        @{ Name = 'Title'; Expression = { $_.title } }
        @{ Name = 'Location'; Expression = { $_.location } }
        @{ Name = 'Source'; Expression = { $_.source } }
        @{ Name = 'Website'; Expression = { $_.companyWebsite ?? '' } }
        @{ Name = 'Phone'; Expression = { $_.phone ?? '' } }
        @{ Name = 'Email'; Expression = { $_.email ?? '' } }
        @{ Name = 'Discovered'; Expression = { $_.discoveredAt } }
    ) | Export-Csv -Path $Filename -NoTypeInformation -Encoding UTF8
    
    Write-Host "📊 Saved $($Leads.Count) leads to: $Filename" -ForegroundColor Green
    return (Resolve-Path $Filename).Path
}

<#
.FUNCTION Invoke-Main
#>
function Invoke-Main {
    Write-Host "`n╔$(('═' * 98))╗" -ForegroundColor Cyan
    Write-Host "║$(' ' * 20)INTELLIGENT TELECALLING LEADS EXTRACTOR$(' ' * 38)║" -ForegroundColor Cyan
    Write-Host "║$(' ' * 10)Stage 1: Portal Discovery | Stage 2: Company Contact Extraction$(' ' * 24)║" -ForegroundColor Cyan
    Write-Host "╚$(('═' * 98))╝`n" -ForegroundColor Cyan
    
    # Check health
    if (-not (Test-FirecrawlHealth)) {
        exit 1
    }
    
    $allLeads = @()
    $discoveredJobs = @()
    
    # STAGE 1: Job discovery
    Write-Host ("`n" + ('=' * 100)) -ForegroundColor Cyan
    Write-Host "STAGE 1: JOB DISCOVERY FROM PORTALS (Respecting Anti-Bot)" -ForegroundColor Yellow
    Write-Host ('=' * 100) -ForegroundColor Cyan
    
    foreach ($portal in $Portals) {
        $content = Invoke-CrawlPortal -PortalUrl $portal.Url -PortalName $portal.Name
        
        if ($content) {
            $jobs = Extract-JobMetadata -Content $content -Source $portal.Source
            Write-Host "   Found $($jobs.Count) telecalling jobs" -ForegroundColor Green
            $discoveredJobs += $jobs
        }
    }
    
    # STAGE 2: Contact extraction
    Write-Host ("`n" + ('=' * 100)) -ForegroundColor Cyan
    Write-Host "STAGE 2: COMPANY WEBSITE EXTRACTION ($($discoveredJobs.Count) companies)" -ForegroundColor Yellow
    Write-Host ('=' * 100) -ForegroundColor Cyan
    
    for ($i = 0; $i -lt $discoveredJobs.Count; $i++) {
        $job = $discoveredJobs[$i]
        $progress = "[$($i + 1)/$($discoveredJobs.Count)]"
        
        Write-Host "`n$progress Processing: $($job.company)" -ForegroundColor Cyan
        
        # Find website
        Write-Host "   🔍 Finding website..." -ForegroundColor Gray
        $website = Find-CompanyWebsite -CompanyName $job.company
        $job.companyWebsite = $website
        
        if ($website) {
            Write-Host "   ✓ Found: $website" -ForegroundColor Green
            Write-Host "   📧 Extracting contact info..." -ForegroundColor Gray
            
            # Extract contact info
            $contactInfo = Get-ContactInfoAsync -WebsiteUrl $website
            $job.phone = $contactInfo.phone
            $job.email = $contactInfo.email
            
            if ($job.phone -or $job.email) {
                Write-Host "   ✓ Phone: $($job.phone ?? 'Not found')" -ForegroundColor Green
                Write-Host "   ✓ Email: $($job.email ?? 'Not found')" -ForegroundColor Green
                $allLeads += $job
            } else {
                Write-Host "   ⚠️  No contact info found" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ⚠️  Website not found" -ForegroundColor Yellow
        }
        
        # Rate limiting
        Start-Sleep -Seconds 2
    }
    
    # Results
    if ($allLeads.Count -gt 0) {
        Print-Leads $allLeads
        
        if ($OutputFormat -in 'json', 'both') { Save-LeadsToJSON $allLeads }
        if ($OutputFormat -in 'csv', 'both') { Save-LeadsToCSV $allLeads }
        
        Write-Host "✅ Lead extraction completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  No complete leads found with contact information." -ForegroundColor Yellow
    }
    
    Write-Host "`n"
}

# Execute
Invoke-Main
