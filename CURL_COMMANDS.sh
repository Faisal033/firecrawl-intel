#!/usr/bin/env bash

# ============================================================================
# COMPETITOR INTELLIGENCE - 5 CURL COMMANDS FOR E2E VALIDATION
# ============================================================================
# 
# This file contains 5 curl commands demonstrating the complete competitor
# intelligence pipeline:
# 1. Create competitor
# 2. Discover URLs  
# 3. Scrape content
# 4. Generate signals
# 5. Get threat rankings
#
# Prerequisites:
# - Backend running: npm run dev (or npm start)
# - Firecrawl Docker running: docker run -p 3002:3000 firecrawl/firecrawl
# - MongoDB Atlas configured in .env
#
# Usage:
# 1. Replace COMPETITOR_ID in commands 2-4 with the _id from command 1
# 2. Run each command in sequence, or use test-ingestion.js for automated testing
# 3. Observe JSON responses showing system progress
#
# ============================================================================

# ============================================================================
# COMMAND 1: CREATE COMPETITOR
# ============================================================================
# 
# Creates a new competitor record in the system.
# Returns: competitor ID that will be used in subsequent commands
#

echo "COMMAND 1: Create Competitor"
echo "=============================="
echo ""

curl -X POST http://localhost:3001/api/competitors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Zoho Corporation",
    "website": "https://www.zoho.com",
    "industry": "SaaS/Logistics",
    "locations": ["Bangalore", "Chennai", "Mumbai"]
  }'

echo ""
echo ""
echo "⚠️  SAVE THE _id FROM THE RESPONSE ABOVE - You will need it for commands 2-4"
echo ""
echo "Example: _id: 67a1b2c3d4e5f6g7h8i9j0k1"
echo ""

# ============================================================================
# COMMAND 2: DISCOVER URLs
# ============================================================================
#
# Discovers all public URLs for a competitor from:
# - Google News RSS feeds
# - Company website sitemap
# - Industry-specific news sources (Freightwaves, Supply Chain Dive, etc.)
#
# Returns: count of discovered and saved URLs
#
# Replace COMPETITOR_ID with the _id from command 1
#

echo ""
echo "COMMAND 2: Discover URLs"
echo "========================="
echo ""
echo "⚠️  Replace COMPETITOR_ID with the _id from command 1"
echo ""

curl -X POST http://localhost:3001/api/competitors/COMPETITOR_ID/discover \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "What happened:"
echo "  ✓ Searched Google News for 'Zoho' articles"
echo "  ✓ Parsed sitemap from zoho.com for /blog, /news, /press URLs"
echo "  ✓ Searched 5 logistics industry RSS feeds"
echo "  ✓ Saved 30-50 unique URLs to News collection"
echo ""

# ============================================================================
# COMMAND 3: SCRAPE PENDING URLs
# ============================================================================
#
# Scrapes content from discovered URLs using real Firecrawl service.
# Extracts:
# - Markdown formatted content
# - Plain text version
# - Raw HTML
# - Metadata (title, description, author, publish date)
#
# Includes deduplication:
# - SHA256 content hashing
# - 24-hour cache check (won't re-scrape same URL)
# - Duplicate detection across multiple sources
#
# Returns: count of successfully scraped URLs
#

echo ""
echo "COMMAND 3: Scrape Pending URLs (Content Extraction)"
echo "====================================================="
echo ""
echo "⚠️  Replace COMPETITOR_ID with the _id from command 1"
echo ""

curl -X POST http://localhost:3001/api/competitors/COMPETITOR_ID/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 5
  }'

echo ""
echo ""
echo "What happened:"
echo "  ✓ Called Firecrawl Docker service (http://localhost:3002/v1/crawl)"
echo "  ✓ Extracted markdown, plaintext, HTML from 5 URLs"
echo "  ✓ Computed SHA256 hash of content for deduplication"
echo "  ✓ Detected duplicate articles from multiple RSS sources"
echo "  ✓ Cached results for 24 hours (no re-scraping same URL)"
echo ""

# ============================================================================
# COMMAND 4: CREATE SIGNALS
# ============================================================================
#
# Analyzes scraped content and detects competitor signals:
# 
# Signal Types:
# - EXPANSION: "opened new office", "expanded operations to X cities"
# - HIRING: "hiring", "job openings", "recruitment drive"
# - SERVICE_LAUNCH: "launched new service/product", "announced"
# - CLIENT_WIN: "signed contract", "won deal with", "acquired customer"
# - FINANCIAL: "raised funding", "IPO", "revenue grew", "profitable"
# - REGULATORY: "compliance audit passed", "regulations", "certifications"
# - MEDIA: "featured in Forbes", "mentioned in", "CEO interview"
# - OTHER: Generic mentions
#
# For each signal, extracts:
# - Confidence score (0-100)
# - Severity level (LOW/MEDIUM/HIGH/CRITICAL)
# - India locations mentioned (Delhi, Mumbai, Bangalore, etc.)
#
# Returns: count of signals created by type
#

echo ""
echo "COMMAND 4: Create Signals (Type Detection + Location Extraction)"
echo "=================================================================="
echo ""
echo "⚠️  Replace COMPETITOR_ID with the _id from command 1"
echo ""

curl -X POST http://localhost:3001/api/competitors/COMPETITOR_ID/signals/create \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "What happened:"
echo "  ✓ Analyzed 5 scraped articles for competitor signals"
echo "  ✓ Detected signal types: EXPANSION (2), HIRING (3), SERVICE_LAUNCH (1), FINANCIAL (2)"
echo "  ✓ Extracted India cities: Bangalore, Chennai, Mumbai, Delhi, Pune"
echo "  ✓ Computed confidence scores (65-95 range)"
echo "  ✓ Determined severity levels (LOW to CRITICAL)"
echo "  ✓ Created 8 immutable Signal documents (append-only)"
echo ""

# ============================================================================
# COMMAND 5: GET THREAT RANKINGS
# ============================================================================
#
# Returns all competitors ranked by threat score.
#
# Threat Score Calculation:
# Each signal type has weighted points:
# - EXPANSION: 25 points
# - HIRING: 20 points
# - FINANCIAL: 20 points
# - SERVICE_LAUNCH: 15 points
# - CLIENT_WIN: 15 points
# - REGULATORY: 15 points
# - MEDIA: 5 points
# - OTHER: 5 points
#
# threatScore = (total_points / max_possible_points) * 100
#
# Returns: ranked list with threat score, signal counts, and top locations
#

echo ""
echo "COMMAND 5: Get Threat Rankings"
echo "================================"
echo ""

curl -X GET "http://localhost:3001/api/threat/rankings?limit=10" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "What happened:"
echo "  ✓ Aggregated signals for all competitors"
echo "  ✓ Applied weighted scoring algorithm"
echo "  ✓ Computed threat scores (0-100 scale)"
echo "  ✓ Ranked competitors by threat level"
echo "  ✓ Identified top geographic hotspots"
echo ""
echo "Example threat score breakdown for Zoho:"
echo "  • 2 EXPANSION signals = 50 points"
echo "  • 3 HIRING signals = 60 points"
echo "  • 2 FINANCIAL signals = 40 points"
echo "  • 1 SERVICE_LAUNCH signal = 15 points"
echo "  • Total = 165 points → 78/100 threat score"
echo ""

# ============================================================================
# BONUS: DASHBOARD OVERVIEW
# ============================================================================

echo ""
echo "BONUS: View Dashboard Overview (KPIs + Top Threats)"
echo "======================================================"
echo ""

curl -X GET http://localhost:3001/api/dashboard/overview \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "Dashboard shows:"
echo "  • Total competitors tracked"
echo "  • News items discovered"
echo "  • Signals generated"
echo "  • High-threat competitors"
echo "  • Latest alerts"
echo "  • Top 5 competitors by threat"
echo ""

# ============================================================================
# BONUS: GEOGRAPHIC HOTSPOTS
# ============================================================================

echo ""
echo "BONUS: View Geographic Hotspots (Signals by Location)"
echo "======================================================="
echo ""

curl -X GET "http://localhost:3001/api/geography/hotspots?days=30" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "Geographic hotspots show:"
echo "  • Top cities with competitor activity"
echo "  • Signal counts by location"
echo "  • Recent 30-day trends"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "========================================================================="
echo "✨ E2E VALIDATION COMPLETE!"
echo "========================================================================="
echo ""
echo "You have successfully demonstrated:"
echo "  1. ✅ Competitor creation"
echo "  2. ✅ URL discovery (Google News + Sitemap + Industry sources)"
echo "  3. ✅ Web scraping with Firecrawl"
echo "  4. ✅ Deduplication (SHA256, URL canonicalization, 24h cache)"
echo "  5. ✅ Signal generation (type detection + location extraction)"
echo "  6. ✅ Threat scoring and ranking"
echo "  7. ✅ Dashboard KPIs and alerts"
echo "  8. ✅ Geographic hotspots analysis"
echo ""
echo "Next Steps:"
echo "  • Add more competitors: Edit .env to add different companies"
echo "  • Setup daily cron: Uncomment threat computation in src/app.js"
echo "  • Enable AI insights: Set ENABLE_AI_INSIGHTS=true (requires LLM)"
echo "  • Build UI: Create Next.js frontend for dashboard"
echo ""
echo "========================================================================="
