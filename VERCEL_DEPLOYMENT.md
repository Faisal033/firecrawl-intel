# 🚀 Vercel Deployment Guide

## Overview
This guide will help you deploy your Competitor Intelligence crawler to Vercel with a production URL.

---

## ⚠️ IMPORTANT: Firecrawl API Configuration

Before deploying to Vercel, you **MUST** configure a publicly accessible Firecrawl API endpoint. Your current setup uses `localhost:3002`, which **will NOT work** on Vercel.

### Option 1: Use Firecrawl Cloud (Recommended for Beginners)
```bash
1. Visit: https://www.firecrawl.dev
2. Sign up for free account
3. Get your API Key from dashboard
4. Use endpoint: https://api.firecrawl.dev
```

### Option 2: Self-Host Firecrawl (Advanced)
Deploy Firecrawl to a cloud service:
- **Railway.app** (free tier available)
- **Render.com** (free tier available)
- **AWS** or **Google Cloud**
- **DigitalOcean**

---

## Step-by-Step Vercel Deployment

### Step 1: Prepare Repository
```bash
cd c:\Users\535251\OneDrive\Documents\competitor-intelligence
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### Step 2: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended) or email
3. Link your GitHub account

### Step 3: Import Project
1. Click **"New Project"** in Vercel dashboard
2. Select **"Import Git Repository"**
3. Search for: `firecrawl-intel`
4. Click **Import**

### Step 4: Configure Environment Variables
In the Vercel Project Settings → **Environment Variables**, add:

```
FIRECRAWL_API_URL=https://api.firecrawl.dev
FIRECRAWL_API_KEY=your_actual_api_key_here
NODE_ENV=production
PORT=3000
```

**To find your API key:**
- Firecrawl Cloud: Dashboard → API Keys
- Self-hosted: Check your deployment settings

### Step 5: Deploy
1. Click **"Deploy"** button
2. Wait for deployment to complete (usually 1-2 minutes)
3. You'll see a message: **"Deployment Complete"**
4. Your production URL will be displayed (e.g., `https://competitor-intelligence.vercel.app`)

---

## Verify Deployment

### Test API Health Check
```bash
curl https://YOUR_VERCEL_URL/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T10:30:00.000Z",
  "backend": "operational",
  "firecrawl": "checking..."
}
```

### Test Crawl Endpoint
```bash
curl -X POST https://YOUR_VERCEL_URL/api/v1/crawl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

---

## Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Dashboard UI |
| `/api/v1/health` | GET | Health check |
| `/api/v1/crawl` | POST | Crawl any URL |
| `/api/v1/crawl-india-jobs` | POST | Crawl India jobs |

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `FIRECRAWL_API_URL` | Firecrawl API endpoint | `https://api.firecrawl.dev` |
| `FIRECRAWL_API_KEY` | Your Firecrawl API key | `sk_... (from dashboard)` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Port (Vercel assigns) | `3000` |
| `MONGODB_URI` | MongoDB (optional) | `mongodb+srv://...` |

---

## Troubleshooting

### Issue: "Firecrawl API not responding"
**Solution:** 
- Check `FIRECRAWL_API_URL` is correct
- Verify `FIRECRAWL_API_KEY` is valid
- Test API directly: `curl https://api.firecrawl.dev/health`

### Issue: "502 Bad Gateway"
**Solution:**
- Check Vercel logs: Dashboard → Deployments → View Logs
- Ensure all environment variables are set
- Restart deployment from dashboard

### Issue: "Cannot find module 'express'"
**Solution:**
- Run locally: `npm install`
- Push `node_modules` is in `.gitignore` (should be)
- Vercel will auto-install from `package.json`

### Issue: "Connection timeout to Firecrawl"
**Solution:**
- Check if Firecrawl service is operational
- Try a different Firecrawl endpoint (https://api.firecrawl.dev)
- Check firewall/CORS settings

---

## Production URL Format

Your production URL will be:
```
https://YOUR_PROJECT_NAME.vercel.app
```

Example:
```
https://competitor-intelligence.vercel.app
https://firecrawl-intel.vercel.app
```

---

## Next Steps

After successful deployment:

1. **Share your production URL:**
   ```
   https://YOUR_VERCEL_URL
   ```

2. **Use the crawler:**
   - Visit dashboard: `https://YOUR_VERCEL_URL`
   - Run India job crawler: `curl -X POST https://YOUR_VERCEL_URL/api/v1/crawl-india-jobs`
   - Check crawl history and results

3. **Monitor deployments:**
   - Check Vercel dashboard for logs and analytics
   - View deployment history
   - Rollback if needed

4. **Update DNS (Optional):**
   - Add custom domain in Vercel Settings
   - Point domain to Vercel nameservers

---

## Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Firecrawl Documentation: https://docs.firecrawl.dev
- Railway.app (for self-hosted Firecrawl): https://railway.app
- Project Repository: https://github.com/Faisal033/firecrawl-intel

---

## Quick Checklist

- [ ] Firecrawl API endpoint configured
- [ ] Vercel account created
- [ ] GitHub repository linked to Vercel
- [ ] Environment variables set in Vercel
- [ ] Deployment successful (green checkmark)
- [ ] Health check endpoint responding
- [ ] Crawl endpoint tested
- [ ] Production URL noted and shared

---

**Status:** Ready for Production Deployment 🚀
