#!/usr/bin/env pwsh

<#
.SYNOPSIS
Job Scraper Configuration Helper - Add more websites/keywords easily

.DESCRIPTION
This script helps you customize the job scraper by adding new websites
and search terms without editing the main script.
#>

# Save this as configuration that the main script can use
# Or use it as a template to add new websites

$JobScraperConfig = @{
    # Firecrawl connection
    FirecrawlUrl = "http://localhost:3002/v1/crawl"
    
    # Crawling parameters
    DefaultWaitTime = 3000      # JS rendering wait (milliseconds)
    DefaultMaxJobs = 20         # Jobs per website
    PollingInterval = 2000      # Check status every 2 seconds
    MaxTimeout = 180            # 3 minutes max
    
    # Websites to crawl
    Websites = @(
        # ==========================================
        # PRIMARY JOB SITES
        # ==========================================
        
        @{
            Name      = "Indeed India"
            BaseUrl   = "https://in.indeed.com/jobs"
            SearchTerms = @(
                "telecaller"
                "telecalling"
                "voice process"
                "call executive"
                "customer service"
            )
            QueryParam = "q"
            Location   = "India"
            Enabled    = $true
            Comment    = "Largest job site in India"
        }
        
        @{
            Name      = "LinkedIn Jobs"
            BaseUrl   = "https://www.linkedin.com/jobs/search"
            SearchTerms = @(
                "telecaller India"
                "voice process India"
                "call executive India"
                "inbound calling India"
            )
            QueryParam = "keywords"
            Enabled    = $true
            Comment    = "Professional network with premium jobs"
        }
        
        @{
            Name      = "Naukri.com"
            BaseUrl   = "https://www.naukri.com/jobs"
            SearchTerms = @(
                "telecaller"
                "telecalling"
                "voice process executive"
            )
            QueryParam = "k"
            Enabled    = $true
            Comment    = "Indian job portal - strong telecom/BPO presence"
        }
        
        @{
            Name      = "Fresher.com"
            BaseUrl   = "https://fresher.com"
            SearchTerms = @(
                "telecaller"
                "voice process"
                "telemarketing"
            )
            QueryParam = "search"
            Enabled    = $true
            Comment    = "Fresher jobs portal"
        }
        
        # ==========================================
        # OPTIONAL - ADD THESE IF NEEDED
        # ==========================================
        
        @{
            Name      = "TimesJobs"
            BaseUrl   = "https://www.timesjobs.com"
            SearchTerms = @(
                "telecaller"
                "voice process"
            )
            QueryParam = "searchProfile"
            Enabled    = $false
            Comment    = "Times of India jobs site - may need customization"
        }
        
        @{
            Name      = "Quikr Jobs"
            BaseUrl   = "https://www.quikr.com/jobs"
            SearchTerms = @(
                "telecaller"
            )
            QueryParam = "q"
            Enabled    = $false
            Comment    = "Classified ads with jobs section"
        }
        
        @{
            Name      = "JobIndia"
            BaseUrl   = "https://www.jobsindia.com"
            SearchTerms = @(
                "telecaller"
                "voice process"
            )
            QueryParam = "s"
            Enabled    = $false
            Comment    = "Dedicated Indian jobs site"
        }
        
        @{
            Name      = "OLX Jobs"
            BaseUrl   = "https://www.olx.in/jobs"
            SearchTerms = @(
                "telecaller"
            )
            QueryParam = "q"
            Enabled    = $false
            Comment    = "Classifieds with jobs category"
        }
    )
    
    # ==========================================
    # DATA EXTRACTION PATTERNS
    # ==========================================
    
    ExtractionPatterns = @{
        # Phone number formats to search
        PhonePatterns = @(
            '\b([0-9]{10})\b'              # 10-digit number
            '\b(\+91[0-9]{10})\b'          # +91 format
            '\b([0-9]{3}-[0-9]{3}-[0-9]{4})\b'  # XXX-XXX-XXXX
            '\b([0-9]{2}\s[0-9]{4}\s[0-9]{4})\b'  # XX XXXX XXXX
        )
        
        # Email patterns
        EmailPattern = '[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        
        # Job title indicators
        JobTitleKeywords = @(
            "telecaller"
            "voice process"
            "call executive"
            "customer care"
            "customer service"
            "inbound calling"
            "outbound calling"
            "bpo"
            "back office"
        )
        
        # Company name indicators
        CompanyPatterns = @(
            'Company[:\s]+(.+?)[\n$]'
            'Employer[:\s]+(.+?)[\n$]'
            'Posted by[:\s]+(.+?)[\n$]'
        )
        
        # Location indicators - Indian cities
        IndianCities = @(
            "Mumbai", "Delhi", "Bangalore", "Bengaluru"
            "Pune", "Hyderabad", "Chennai", "Kolkata"
            "Ahmedabad", "Jaipur", "Chandigarh", "Lucknow"
            "Gurgaon", "Noida", "Indore", "Thane"
            "Bhopal", "Visakhapatnam", "Surat", "Vadodara"
            "Nagpur", "Kochi", "Coimbatore", "Ludhiana"
            "Mysore", "Guwahati", "Nashik", "Aurangabad"
            "Vadodara", "Ranchi", "Patna", "Dhanbad"
        )
    }
    
    # ==========================================
    # OUTPUT SETTINGS
    # ==========================================
    
    Output = @{
        # File naming
        FilePrefix      = "job-leads"
        IncludeTimestamp = $true
        TimestampFormat = "yyyy-MM-dd_HHmmss"
        
        # Formats to export
        ExportJSON      = $true
        ExportCSV       = $true
        
        # CSV settings
        CSVEncoding     = "UTF8"
        CSVDelimiter    = ","
        
        # Display settings
        ShowSampleCount = 10  # Show first N jobs in console
        SaveSampleData  = $true
    }
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Show-Configuration {
    Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║    Job Scraper Configuration               ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    Write-Host "Firecrawl URL: " -NoNewline -ForegroundColor Yellow
    Write-Host $JobScraperConfig.FirecrawlUrl -ForegroundColor White
    
    Write-Host "`nDefault Parameters:" -ForegroundColor Yellow
    Write-Host "  - JS Wait Time: $($JobScraperConfig.DefaultWaitTime)ms" -ForegroundColor Gray
    Write-Host "  - Max Jobs Per Site: $($JobScraperConfig.DefaultMaxJobs)" -ForegroundColor Gray
    Write-Host "  - Max Timeout: $($JobScraperConfig.MaxTimeout)s" -ForegroundColor Gray
    
    Write-Host "`nWebsites Configured:" -ForegroundColor Yellow
    $Websites = $JobScraperConfig.Websites | Where-Object { $_.Enabled }
    $DisabledWebsites = $JobScraperConfig.Websites | Where-Object { -not $_.Enabled }
    
    Write-Host "  Enabled: $($Websites.Count)" -ForegroundColor Green
    foreach ($Site in $Websites) {
        Write-Host "    ✓ $($Site.Name) - $($Site.SearchTerms.Count) keywords" -ForegroundColor Gray
    }
    
    if ($DisabledWebsites.Count -gt 0) {
        Write-Host "  Disabled: $($DisabledWebsites.Count)" -ForegroundColor Yellow
        foreach ($Site in $DisabledWebsites) {
            Write-Host "    ○ $($Site.Name)" -ForegroundColor Gray
        }
    }
    
    Write-Host "`nTotal Search Terms: $($JobScraperConfig.Websites.SearchTerms.Count)" -ForegroundColor Yellow
}

function Add-Website {
    param(
        [string]$Name,
        [string]$BaseUrl,
        [string[]]$SearchTerms,
        [string]$QueryParam,
        [string]$Comment = ""
    )
    
    $NewWebsite = @{
        Name        = $Name
        BaseUrl     = $BaseUrl
        SearchTerms = $SearchTerms
        QueryParam  = $QueryParam
        Enabled     = $true
        Comment     = $Comment
    }
    
    $JobScraperConfig.Websites += $NewWebsite
    Write-Host "✅ Added website: $Name" -ForegroundColor Green
}

function Remove-Website {
    param([string]$Name)
    
    $JobScraperConfig.Websites = $JobScraperConfig.Websites | 
        Where-Object { $_.Name -ne $Name }
    
    Write-Host "✅ Removed website: $Name" -ForegroundColor Green
}

function Enable-Website {
    param([string]$Name)
    
    $Website = $JobScraperConfig.Websites | Where-Object { $_.Name -eq $Name }
    if ($Website) {
        $Website.Enabled = $true
        Write-Host "✅ Enabled: $Name" -ForegroundColor Green
    } else {
        Write-Host "❌ Website not found: $Name" -ForegroundColor Red
    }
}

function Disable-Website {
    param([string]$Name)
    
    $Website = $JobScraperConfig.Websites | Where-Object { $_.Name -eq $Name }
    if ($Website) {
        $Website.Enabled = $false
        Write-Host "⚠️  Disabled: $Name" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Website not found: $Name" -ForegroundColor Red
    }
}

function Add-SearchTerm {
    param(
        [string]$WebsiteName,
        [string[]]$Terms
    )
    
    $Website = $JobScraperConfig.Websites | Where-Object { $_.Name -eq $WebsiteName }
    if ($Website) {
        $Website.SearchTerms += $Terms
        Write-Host "✅ Added $($Terms.Count) search terms to $WebsiteName" -ForegroundColor Green
    } else {
        Write-Host "❌ Website not found: $WebsiteName" -ForegroundColor Red
    }
}

function Export-Configuration {
    param([string]$FilePath = "job-scraper-config.json")
    
    $JobScraperConfig | ConvertTo-Json -Depth 5 | Out-File $FilePath
    Write-Host "✅ Configuration saved to: $FilePath" -ForegroundColor Green
}

function Import-Configuration {
    param([string]$FilePath = "job-scraper-config.json")
    
    if (Test-Path $FilePath) {
        $script:JobScraperConfig = Get-Content $FilePath | ConvertFrom-Json
        Write-Host "✅ Configuration loaded from: $FilePath" -ForegroundColor Green
    } else {
        Write-Host "❌ Configuration file not found: $FilePath" -ForegroundColor Red
    }
}

# ============================================================================
# INTERACTIVE MENU
# ============================================================================

function Show-Menu {
    Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║    Job Scraper Configuration Menu          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    Write-Host "1. Show current configuration" -ForegroundColor Yellow
    Write-Host "2. Enable a website" -ForegroundColor Yellow
    Write-Host "3. Disable a website" -ForegroundColor Yellow
    Write-Host "4. Add new website" -ForegroundColor Yellow
    Write-Host "5. Add search term to website" -ForegroundColor Yellow
    Write-Host "6. Export configuration to JSON" -ForegroundColor Yellow
    Write-Host "7. Import configuration from JSON" -ForegroundColor Yellow
    Write-Host "8. List all websites" -ForegroundColor Yellow
    Write-Host "9. Exit" -ForegroundColor Yellow
    
    Write-Host ""
}

# ============================================================================
# DEFAULT MAIN EXECUTION
# ============================================================================

# Show configuration on load
Show-Configuration

Write-Host "`n💡 Tip: Use functions to customize:
  - Add-Website -Name 'MyJobSite' -BaseUrl '...' -SearchTerms @('...') -QueryParam 'q'
  - Enable-Website 'TimesJobs'
  - Export-Configuration
  - Show-Configuration`n" -ForegroundColor Cyan

# Export default configuration
Export-Configuration

Write-Host "`n✅ Default configuration exported to: job-scraper-config.json`n" -ForegroundColor Green
