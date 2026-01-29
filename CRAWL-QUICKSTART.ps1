#!/usr/bin/env powershell

# Firecrawl Crawler Quick Start - PowerShell Version
# Crawls ONLY Naukri, Indeed, Apna for telecalling jobs

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔" + ("═" * 78) + "╗" -ForegroundColor Cyan
Write-Host "║" + (" " * 15) + "FIRECRAWL JOB LEADS EXTRACTOR (PowerShell)" + (" " * 18) + "║" -ForegroundColor Cyan
Write-Host "╚" + ("═" * 78) + "╝" -ForegroundColor Cyan

Write-Host "`n📋 QUICK START GUIDE" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n1️⃣  Ensure Firecrawl Docker is Running:" -ForegroundColor White
Write-Host "    docker-compose -f firecrawl-selfhost/docker-compose.yml up" -ForegroundColor Gray

Write-Host "`n2️⃣  Run the crawler (Node.js version):" -ForegroundColor White
Write-Host "    node crawl-jobs.js" -ForegroundColor Gray

Write-Host "`n3️⃣  Run the crawler (PowerShell version):" -ForegroundColor White
Write-Host "    .\crawl-jobs.ps1" -ForegroundColor Gray

Write-Host "`n4️⃣  Check Firecrawl health:" -ForegroundColor White
Write-Host "    # Test the crawl endpoint" -ForegroundColor Gray
Write-Host '    $body = ''{"url":"https://example.com"}''' -ForegroundColor Gray
Write-Host '    Invoke-WebRequest -Uri "http://localhost:3002/v1/crawl"...' -ForegroundColor Gray

Write-Host "`n════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📊 WHAT THE SCRIPT DOES:" -ForegroundColor Yellow

Write-Host "`n  ✅ Crawls ONLY 3 portals:" -ForegroundColor Green
Write-Host "     • Naukri (naukri.com)" -ForegroundColor Gray
Write-Host "     • Indeed (indeed.com)" -ForegroundColor Gray
Write-Host "     • Apna (apnaapp.com)" -ForegroundColor Gray

Write-Host "`n  ✅ Filters for telecalling jobs using keywords:" -ForegroundColor Green
Write-Host "     • telecaller, voice process, call executive" -ForegroundColor Gray
Write-Host "     • customer support (voice), inbound/outbound calls" -ForegroundColor Gray

Write-Host "`n  ✅ Restricts to India locations only:" -ForegroundColor Green
Write-Host "     • Bangalore, Delhi, Mumbai, Pune, etc." -ForegroundColor Gray

Write-Host "`n  ✅ Extracts 7 fields from each job:" -ForegroundColor Green
Write-Host "     • Company name" -ForegroundColor Gray
Write-Host "     • Job title" -ForegroundColor Gray
Write-Host "     • Location" -ForegroundColor Gray
Write-Host "     • Job description" -ForegroundColor Gray
Write-Host "     • Phone number (null if missing)" -ForegroundColor Gray
Write-Host "     • Email ID (null if missing)" -ForegroundColor Gray
Write-Host "     • Source portal" -ForegroundColor Gray

Write-Host "`n  ✅ Saves results as:" -ForegroundColor Green
Write-Host "     • jobs-output.json (structured data)" -ForegroundColor Gray
Write-Host "     • jobs-output.csv (spreadsheet-ready)" -ForegroundColor Gray

Write-Host "`n════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n🔧 USING THE SCRIPTS:" -ForegroundColor Yellow

Write-Host "`n NODE.JS VERSION:" -ForegroundColor White
Write-Host "   First install axios:" -ForegroundColor Gray
Write-Host "   npm install axios" -ForegroundColor Cyan
Write-Host "`n   Then run:" -ForegroundColor Gray
Write-Host "   node crawl-jobs.js" -ForegroundColor Cyan

Write-Host "`n POWERSHELL VERSION:" -ForegroundColor White
Write-Host "   Run directly (no dependencies):" -ForegroundColor Gray
Write-Host "   .\crawl-jobs.ps1" -ForegroundColor Cyan
Write-Host "   .\crawl-jobs.ps1 -OutputFormat ""json""" -ForegroundColor Cyan
Write-Host "   .\crawl-jobs.ps1 -OutputFormat ""csv""" -ForegroundColor Cyan

Write-Host "`n════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n🔗 API ENDPOINTS USED:" -ForegroundColor Yellow
Write-Host "   POST http://localhost:3002/v1/crawl" -ForegroundColor White
Write-Host "   Body: JSON with url parameter" -ForegroundColor Gray

Write-Host "`n════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📁 OUTPUT FILES:" -ForegroundColor Yellow
Write-Host "   jobs-output.json  - Structured JSON data" -ForegroundColor White
Write-Host "   jobs-output.csv   - CSV for spreadsheets (Excel, Google Sheets)" -ForegroundColor White

Write-Host "`n════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n KEY FEATURES:" -ForegroundColor Yellow
Write-Host "   * Zero backend server (100 percent client-side)" -ForegroundColor Green
Write-Host "   * Direct Firecrawl API calls" -ForegroundColor Green
Write-Host "   * Automatic phone/email extraction" -ForegroundColor Green
Write-Host "   * Null-safe field handling" -ForegroundColor Green
Write-Host "   * Console + file output" -ForegroundColor Green
Write-Host "   * Structured JSON + spreadsheet CSV" -ForegroundColor Green

Write-Host "`n════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n READY TO USE!" -ForegroundColor Green
Write-Host "`n   Next step: Run one of the scripts above" -ForegroundColor Yellow
Write-Host "             Node.js: node crawl-jobs.js" -ForegroundColor Yellow
Write-Host "             PowerShell: .\crawl-jobs.ps1" -ForegroundColor Yellow

Write-Host "`n════════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
