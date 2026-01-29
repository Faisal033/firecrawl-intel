# Job Leads Crawler - Direct Firecrawl Integration (PowerShell)
# Crawls ONLY Naukri, Indeed, and Apna for telecalling jobs
# Uses Firecrawl directly at http://localhost:3002

param(
    [string]$OutputFormat = "both"  # "json", "csv", or "both"
)

# Configuration
$FIRECRAWL_BASE = "http://localhost:3002"
$FIRECRAWL_CRAWL = "$FIRECRAWL_BASE/v1/crawl"

# Job portals
$PORTALS = @(
    @{
        Name = "Naukri"
        Url = "https://www.naukri.com/jobs-in-india-for-telecaller"
        Source = "Naukri"
    },
    @{
        Name = "Indeed"
        Url = "https://in.indeed.com/jobs?q=telecaller&l=India"
        Source = "Indeed"
    },
    @{
        Name = "Apna"
        Url = "https://www.apnaapp.com/jobs?title=telecaller&location=India"
        Source = "Apna"
    }
)

# Telecalling keywords
$TELECALLING_KEYWORDS = @(
    'telecaller', 'telecalling', 'voice process', 'call executive', 
    'customer support (voice)', 'inbound calls', 'outbound calls',
    'tele-calling', 'call center', 'phone based'
)

# India locations
$INDIA_LOCATIONS = @(
    'india', 'bangalore', 'delhi', 'mumbai', 'pune', 'hyderabad', 
    'gurgaon', 'noida', 'chennai', 'kolkata', 'jaipur', 'lucknow', 
    'chandigarh', 'indore', 'ahmedabad'
)

# ============================================================================
# FUNCTION: Check Firecrawl Health
# ============================================================================
function Test-FirecrawlHealth {
    Write-Host "`n🔍 Checking Firecrawl health..." -ForegroundColor Cyan
    try {
        # Test the crawl endpoint with a simple URL
        $body = @{ url = "https://example.com" } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri $FIRECRAWL_CRAWL -Method POST `
            -ContentType "application/json" -Body $body `
            -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ Firecrawl is running!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Firecrawl not running at $FIRECRAWL_BASE" -ForegroundColor Red
        Write-Host "   Make sure Docker is running and Firecrawl is started" -ForegroundColor Yellow
        return $false
    }
}

# ============================================================================
# FUNCTION: Crawl Portal
# ============================================================================
function Invoke-CrawlPortal {
    param(
        [string]$PortalUrl,
        [string]$PortalName
    )
    
    Write-Host "`n🔄 Crawling $PortalName..." -ForegroundColor Cyan
    Write-Host "   URL: $PortalUrl" -ForegroundColor Gray
    
    try {
        $body = @{ url = $PortalUrl } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri $FIRECRAWL_CRAWL -Method POST `
            -ContentType "application/json" -Body $body `
            -TimeoutSec 60 -UseBasicParsing -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if (-not $data.success) {
            Write-Host "   ⚠️  Crawl returned success: false" -ForegroundColor Yellow
            return $null
        }

        $markdown = if ($data.data.markdown) { $data.data.markdown } else { $data.markdown }
        Write-Host "   ✓ Got $($markdown.Length) characters of content" -ForegroundColor Green
        
        return $markdown
    }
    catch {
        Write-Host "   ❌ Error crawling $PortalName`: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ============================================================================
# FUNCTION: Check if Telecalling Job
# ============================================================================
function Test-IsTelecallingJob {
    param([string]$Text)
    
    $lowerText = $Text.ToLower()
    foreach ($keyword in $TELECALLING_KEYWORDS) {
        if ($lowerText.Contains($keyword)) {
            return $true
        }
    }
    return $false
}

# ============================================================================
# FUNCTION: Check if India Location
# ============================================================================
function Test-IsIndiaLocation {
    param([string]$Text)
    
    if ([string]::IsNullOrEmpty($Text)) { return $true }
    
    $lowerText = $Text.ToLower()
    foreach ($location in $INDIA_LOCATIONS) {
        if ($lowerText.Contains($location)) {
            return $true
        }
    }
    return $false
}

# ============================================================================
# FUNCTION: Extract Phone Number
# ============================================================================
function Extract-PhoneNumber {
    param([string]$Text)
    
    if ([string]::IsNullOrEmpty($Text)) { return $null }
    
    $patterns = @(
        '\+91\s?[6-9]\d{2}\s?\d{3}\s?\d{4}',      # +91 format
        '[6-9]\d{2}\s?\d{3}\s?\d{4}',              # 10 digit
        '0\d{2,4}\s?\d{3,4}\s?\d{3,4}'             # Landline
    )

    foreach ($pattern in $patterns) {
        if ($Text -match $pattern) {
            return $matches[0]
        }
    }
    
    return $null
}

# ============================================================================
# FUNCTION: Extract Email
# ============================================================================
function Extract-Email {
    param([string]$Text)
    
    if ([string]::IsNullOrEmpty($Text)) { return $null }
    
    $emailPattern = '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
    
    if ($Text -match $emailPattern) {
        return $matches[0]
    }
    
    return $null
}

# ============================================================================
# FUNCTION: Parse Jobs from Content
# ============================================================================
function Parse-JobsFromContent {
    param(
        [string]$Content,
        [string]$Source
    )
    
    $jobs = @()
    
    # Split by blank lines
    $jobBlocks = $Content -split "`n`n+" | Where-Object { $_.Trim().Length -gt 50 }
    
    foreach ($block in $jobBlocks) {
        # Check if telecalling job
        if (-not (Test-IsTelecallingJob $block)) {
            continue
        }

        # Split into lines
        $lines = @($block -split "`n" | Where-Object { $_.Trim().Length -gt 0 })
        
        # Extract details
        $title = if ($lines.Count -gt 0) { $lines[0].Trim() } else { $null }
        $company = if ($lines.Count -gt 1) { $lines[1].Trim() } else { $null }
        $location = if ($lines.Count -gt 2) { $lines[2].Trim() } else { "India" }
        
        # Check location
        if (-not (Test-IsIndiaLocation $location)) {
            continue
        }

        # Extract contact info
        $phone = Extract-PhoneNumber $block
        $email = Extract-Email $block

        # Create job object
        $job = @{
            Company = $company
            Title = $title ?? "Telecalling Job"
            Location = $location ?? "India"
            Description = $block.Substring(0, [Math]::Min(500, $block.Length))
            Phone = $phone
            Email = $email
            Source = $Source
            CrawledAt = (Get-Date).ToUniversalTime().ToString("o")
        }

        $jobs += $job
    }
    
    return $jobs
}

# ============================================================================
# FUNCTION: Save to JSON
# ============================================================================
function Save-JobsToJSON {
    param(
        [array]$Jobs,
        [string]$Filename = "jobs-output.json"
    )
    
    $filepath = Join-Path (Get-Location) $Filename
    $Jobs | ConvertTo-Json | Out-File -FilePath $filepath -Encoding UTF8
    Write-Host "`n📄 Saved $($Jobs.Count) jobs to: $Filename" -ForegroundColor Green
    return $filepath
}

# ============================================================================
# FUNCTION: Save to CSV
# ============================================================================
function Save-JobsToCSV {
    param(
        [array]$Jobs,
        [string]$Filename = "jobs-output.csv"
    )
    
    $filepath = Join-Path (Get-Location) $Filename
    
    # Create CSV header
    $csvContent = '"Company","Job Title","Location","Description","Phone","Email","Source","Crawled At"' + "`n"
    
    # Add rows
    foreach ($job in $Jobs) {
        $company = ($job.Company -replace '"', '""') ?? ""
        $title = ($job.Title -replace '"', '""') ?? ""
        $location = ($job.Location -replace '"', '""') ?? ""
        $description = (($job.Description -replace '"', '""').Substring(0, 100)) ?? ""
        $phone = ($job.Phone) ?? ""
        $email = ($job.Email) ?? ""
        $source = ($job.Source) ?? ""
        $crawledAt = ($job.CrawledAt) ?? ""
        
        $csvContent += "`"$company`",`"$title`",`"$location`",`"$description`",`"$phone`",`"$email`",`"$source`",`"$crawledAt`"`n"
    }
    
    $csvContent | Out-File -FilePath $filepath -Encoding UTF8
    Write-Host "📊 Saved $($Jobs.Count) jobs to: $Filename" -ForegroundColor Green
    return $filepath
}

# ============================================================================
# FUNCTION: Print Jobs
# ============================================================================
function Print-Jobs {
    param([array]$Jobs)
    
    Write-Host "`n" -ForegroundColor Cyan
    Write-Host ('=' * 80) -ForegroundColor Cyan
    Write-Host "📋 EXTRACTED $($Jobs.Count) TELECALLING JOBS" -ForegroundColor Cyan
    Write-Host ('=' * 80) -ForegroundColor Cyan
    
    for ($i = 0; $i -lt $Jobs.Count; $i++) {
        $job = $Jobs[$i]
        Write-Host "`n[$($i+1)] $($job.Title ?? 'N/A')" -ForegroundColor White
        Write-Host "    Company: $($job.Company ?? 'N/A')" -ForegroundColor Gray
        Write-Host "    Location: $($job.Location ?? 'N/A')" -ForegroundColor Gray
        Write-Host "    Phone: $($job.Phone ?? 'N/A')" -ForegroundColor Gray
        Write-Host "    Email: $($job.Email ?? 'N/A')" -ForegroundColor Gray
        Write-Host "    Source: $($job.Source)" -ForegroundColor Gray
        Write-Host "    Description: $($job.Description.Substring(0, [Math]::Min(80, $job.Description.Length)))..." -ForegroundColor Gray
    }
    
    Write-Host "`n" -ForegroundColor Cyan
    Write-Host ('=' * 80) -ForegroundColor Cyan
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host "`n╔" + ("═" * 78) + "╗" -ForegroundColor Cyan
Write-Host "║" + (" " * 15) + "FIRECRAWL JOB LEADS EXTRACTOR" + (" " * 33) + "║" -ForegroundColor Cyan
Write-Host "║" + (" " * 20) + "Naukri, Indeed, Apna" + (" " * 38) + "║" -ForegroundColor Cyan
Write-Host "╚" + ("═" * 78) + "╝" -ForegroundColor Cyan

# Check health
if (-not (Test-FirecrawlHealth)) {
    exit 1
}

# Crawl all portals
$allJobs = @()

foreach ($portal in $PORTALS) {
    $content = Invoke-CrawlPortal -PortalUrl $portal.Url -PortalName $portal.Name
    
    if ($content) {
        $jobs = Parse-JobsFromContent -Content $content -Source $portal.Source
        Write-Host "   Found $($jobs.Count) telecalling jobs" -ForegroundColor Green
        $allJobs += $jobs
    }
}

# Print and save results
if ($allJobs.Count -gt 0) {
    Print-Jobs -Jobs $allJobs
    
    if ($OutputFormat -in @("json", "both")) {
        Save-JobsToJSON -Jobs $allJobs
    }
    
    if ($OutputFormat -in @("csv", "both")) {
        Save-JobsToCSV -Jobs $allJobs
    }
    
    Write-Host "✅ Crawling completed successfully!`n" -ForegroundColor Green
}
else {
    Write-Host "`n⚠️  No telecalling jobs found.`n" -ForegroundColor Yellow
}
