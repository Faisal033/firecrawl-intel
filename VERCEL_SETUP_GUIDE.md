# 🚀 Vercel Production Deployment - Complete Setup

## Quick Summary
Your project is **ready for Vercel deployment**! Follow these steps to get your production URL in **5 minutes**.

---

## What You Need

✅ **Already completed:**
- ✅ Express.js backend (src/app.js)
- ✅ India job crawler (crawl-india-jobs.js)
- ✅ vercel.json configuration
- ✅ GitHub repository (https://github.com/Faisal033/firecrawl-intel.git)

❌ **Still need:**
- ❌ Firecrawl API key (free from https://www.firecrawl.dev)
- ❌ Vercel account (free at https://vercel.com)

---

## Step 1: Get Firecrawl API Key (2 minutes)

### Option A: Firecrawl Cloud (Recommended - Easy)
```
1. Visit https://www.firecrawl.dev
2. Click "Get Started" → Sign Up
3. Create account (GitHub or email)
4. Go to Dashboard → API Keys
5. Copy your API key (starts with "sk_")
6. Keep this for later! ⭐
```

### Option B: Self-Host Firecrawl (Advanced - Free)
Skip to Step 2 if you want to use Firecrawl Cloud above.

Deploy to Railway (free tier):
```bash
1. Visit https://railway.app
2. Sign in with GitHub
3. Create new project → Deploy from repo
4. Select: https://github.com/Faisal033/firecrawl
5. Set environment: PLAYWRIGHT_BROWSER_PATH=/usr/bin/chromium
6. Deploy (takes ~5 min)
7. Get your Railway URL (e.g., https://firecrawl-prod.up.railway.app)
8. Use this as FIRECRAWL_API_URL
```

---

## Step 2: Push Latest Code to GitHub

Run these commands in PowerShell:
```powershell
cd c:\Users\535251\OneDrive\Documents\competitor-intelligence

# Stage all changes
git add .

# Commit with message
git commit -m "Add Vercel deployment configuration and environment setup"

# Push to GitHub
git push origin main

# Verify push succeeded (should show branch is up to date)
```

Expected output:
```
[main xxxxx] Add Vercel deployment configuration...
 5 files changed, 200 insertions(+)
 create mode 100644 vercel.json
 create mode 100644 VERCEL_DEPLOYMENT.md
 ...
```

---

## Step 3: Create Vercel Account (1 minute)

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose: **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub account
5. Click **"Authorize"**

---

## Step 4: Import Project to Vercel (2 minutes)

1. After signing in, you'll see **Vercel Dashboard**
2. Click **"New Project"** button (top right)
3. Click **"Import Git Repository"**
4. Find **"firecrawl-intel"** in the list
   - If not visible, search for it
5. Click the repository to select it
6. Click **"Import"**

---

## Step 5: Configure Environment Variables (1 minute)

After clicking Import, you'll see **"Configure Project"** page:

1. **Find "Environment Variables"** section
2. Click **"Add New Environment Variable"**
3. Add these variables (one by one):

### Variable 1: Firecrawl API URL
```
Name: FIRECRAWL_API_URL
Value: https://api.firecrawl.dev
```
Click ✅ to save

### Variable 2: Firecrawl API Key
```
Name: FIRECRAWL_API_KEY
Value: [PASTE YOUR API KEY FROM STEP 1]
```
Click ✅ to save

### Variable 3: Node Environment
```
Name: NODE_ENV
Value: production
```
Click ✅ to save

### Variable 4: Port
```
Name: PORT
Value: 3000
```
Click ✅ to save

**Screenshot:** Your environment variables should look like this:
```
FIRECRAWL_API_URL = https://api.firecrawl.dev
FIRECRAWL_API_KEY = sk_xxxxxxxxxxxxxxxx (your actual key)
NODE_ENV = production
PORT = 3000
```

---

## Step 6: Deploy! (2 minutes)

1. Click the **"Deploy"** button (blue button, bottom right)
2. **Wait for deployment to complete** (you'll see a spinning loader)
3. You'll see: **✅ "Congratulations! Your project has been deployed"**
4. Your **production URL** will be displayed at the top

Example output:
```
✅ Deployment successful!
🔗 Production URL: https://competitor-intelligence.vercel.app
```

---

## Step 7: Verify Your Deployment

### Test 1: Visit Dashboard
```
Open in browser: https://YOUR_VERCEL_URL
```
You should see the **Competitor Intelligence Dashboard**

### Test 2: Check API Health
```
curl https://YOUR_VERCEL_URL/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "backend": "operational",
  "timestamp": "2026-01-29..."
}
```

### Test 3: Test Crawl Endpoint
```
curl -X POST https://YOUR_VERCEL_URL/api/v1/crawl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Should return crawl results with markdown content.

---

## 🎉 Success! Your Production URL

**Your project is now live!**

Share this URL:
```
https://YOUR_VERCEL_URL
```

Example (yours will be different):
```
https://firecrawl-intel.vercel.app
https://competitor-intelligence.vercel.app
https://my-crawler-123.vercel.app
```

---

## Troubleshooting

### Problem: "502 Bad Gateway" Error
**Fix:**
1. Check Vercel dashboard → Deployments
2. Click your deployment → "View Logs"
3. Look for error messages
4. Common causes:
   - Environment variables not set correctly
   - Firecrawl API key is invalid
   - API endpoint is unreachable

### Problem: "Cannot find module 'express'"
**Fix:**
- This shouldn't happen, but if it does:
  1. Go to Vercel dashboard
  2. Settings → General → Redeploy
  3. Click "Redeploy"
  4. Vercel will reinstall dependencies

### Problem: Crawl endpoint returns error
**Fix:**
1. Verify `FIRECRAWL_API_KEY` is correct
   - Check Firecrawl dashboard for actual key
   - Make sure it's not expired
2. Verify `FIRECRAWL_API_URL` is `https://api.firecrawl.dev`
3. Test Firecrawl directly:
   ```bash
   curl https://api.firecrawl.dev/health
   ```

### Problem: "Vercel can't find my GitHub repository"
**Fix:**
1. Make sure you pushed the code:
   ```bash
   git push origin main
   ```
2. Verify at GitHub: https://github.com/Faisal033/firecrawl-intel
3. Disconnect and reconnect Vercel:
   - Settings → Git
   - Disconnect and reconnect

---

## Optional: Add Custom Domain

If you have a custom domain:

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Settings"** → **"Domains"**
3. Enter your domain (e.g., `mysite.com`)
4. Follow DNS setup instructions
5. Domain will be active in 5-30 minutes

---

## After Deployment: Next Steps

✅ **Deployment complete!**

Now you can:

1. **Share your URL:**
   ```
   "My crawler is live at: https://YOUR_VERCEL_URL"
   ```

2. **Use the API programmatically:**
   ```javascript
   const response = await fetch('https://YOUR_VERCEL_URL/api/v1/crawl', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ url: 'https://example.com' })
   });
   ```

3. **Schedule crawls:**
   - Use `node-cron` to schedule crawls at specific times
   - Edit: `src/app.js` to add cron jobs

4. **Add MongoDB (Optional):**
   - Get free MongoDB Atlas cluster
   - Set `MONGODB_URI` environment variable
   - Data will persist automatically

5. **Monitor in Vercel Dashboard:**
   - View logs and errors
   - Check deployment history
   - See performance metrics
   - View analytics

---

## File Reference

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel build configuration |
| `.env.example` | Environment variables template |
| `src/app.js` | Main Express server |
| `package.json` | Dependencies (with Vercel scripts) |
| `api/index.js` | Vercel serverless function entry |
| `crawl-india-jobs.js` | India job crawler script |

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Firecrawl Docs:** https://docs.firecrawl.dev
- **GitHub Repo:** https://github.com/Faisal033/firecrawl-intel
- **Express.js:** https://expressjs.com

---

## Quick Checklist

Before deploying:
- [ ] Firecrawl API key obtained
- [ ] Code pushed to GitHub (`git push origin main`)
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables set (4 variables)
- [ ] Deploy button clicked
- [ ] Deployment successful (check logs)
- [ ] Health endpoint tested
- [ ] Production URL noted

---

**Status: Ready for Production 🚀**

Once you complete these steps, **your project will be live and accessible from anywhere in the world!**
