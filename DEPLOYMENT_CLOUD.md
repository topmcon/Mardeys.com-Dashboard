# Cloud Platform Deployment Guide

## Quick Overview

This guide covers deployment to **Render** (backend) and **Vercel** (frontend).

**Recommended Setup:**
- **Frontend**: Vercel (free tier, excellent for React)
- **Backend**: Render (free tier available)
- **Database**: MongoDB Atlas (free tier available)

---

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│   Vercel    │──────▶│    Render    │──────▶│ MongoDB Atlas  │
│  (Frontend) │      │   (Backend)  │      │   (Database)   │
└─────────────┘      └──────────────┘      └────────────────┘
      │                     │
      │                     ├──────▶ WordPress/WooCommerce
      │                     ├──────▶ DigitalOcean API
      │                     └──────▶ Cloudflare API
```

---

## Part 1: MongoDB Atlas Setup (Database)

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new project: "Mardeys Dashboard"

### Step 2: Create Database Cluster

1. Click **"Build a Database"**
2. Choose **M0 Free** tier
3. Select closest region to your users
4. Cluster Name: `mardeys-cluster`
5. Click **"Create"**

### Step 3: Configure Database Access

1. **Database Access** → **Add New Database User**
   - Authentication Method: Password
   - Username: `mardeys_admin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: **Read and write to any database**
   - Click **Add User**

2. **Network Access** → **Add IP Address**
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is needed for Render to connect
   - Click **Confirm**

### Step 4: Get Connection String

1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy the connection string:
   ```
   mongodb+srv://mardeys_admin:<password>@mardeys-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `mardeys-dashboard`
   ```
   mongodb+srv://mardeys_admin:YOUR_PASSWORD@mardeys-cluster.xxxxx.mongodb.net/mardeys-dashboard?retryWrites=true&w=majority
   ```

**Save this connection string** - you'll need it for Render!

---

## Part 2: Render Setup (Backend API)

### Method A: Deploy with Blueprint (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Render configuration"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to [https://dashboard.render.com](https://dashboard.render.com)
   - Sign up/Login with GitHub
   - Click **"New +"** → **"Blueprint"**
   - Connect your repository: `topmcon/Mardeys.com-Dashboard`
   - Render will detect `render.yaml`
   - Click **"Apply"**

3. **Configure Environment Variables**
   
   Render will prompt for these variables (marked as `sync: false` in render.yaml):
   
   ```env
   # Database
   MONGODB_URI=mongodb+srv://mardeys_admin:YOUR_PASSWORD@mardeys-cluster.xxxxx.mongodb.net/mardeys-dashboard?retryWrites=true&w=majority
   
   # WordPress
   WORDPRESS_URL=https://your-wordpress-site.com
   WORDPRESS_USERNAME=your-username
   WORDPRESS_APP_PASSWORD=your-app-password
   
   # WooCommerce
   WOOCOMMERCE_URL=https://your-wordpress-site.com
   WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
   WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx
   
   # DigitalOcean
   DIGITALOCEAN_API_TOKEN=dop_v1_xxxxxxxxxxxxx
   DIGITALOCEAN_DROPLET_ID=123456789
   
   # Cloudflare
   CLOUDFLARE_API_TOKEN=your-cloudflare-token
   CLOUDFLARE_ZONE_ID=your-zone-id
   
   # Email (Gmail)
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   EMAIL_FROM=Mardeys Dashboard <your-email@gmail.com>
   
   # Slack (optional)
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

4. **Update Frontend URL**
   - After backend deploys, you'll get a URL like:
     `https://mardeys-dashboard-api.onrender.com`
   - Update the `FRONTEND_URL` environment variable to your actual Vercel URL (do this after Step 3)

### Method B: Manual Deployment

1. **Create Web Service**
   - Dashboard → **"New +"** → **"Web Service"**
   - Connect GitHub repository
   - Configure:
     - Name: `mardeys-dashboard-api`
     - Region: Choose closest to you
     - Branch: `main`
     - Root Directory: Leave empty
     - Environment: **Node**
     - Build Command: `npm install`
     - Start Command: `node backend/server.js`
     - Plan: **Free** (or Starter)

2. **Add Environment Variables** (same as Method A, step 3)

3. **Add Health Check**
   - Path: `/api/health`
   - This prevents service from sleeping

### Important Render Notes

⚠️ **Free Tier Limitations:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free (enough for one service 24/7)

💡 **Recommendations:**
- Use **Starter plan ($7/month)** for production to prevent sleeping
- Enable **auto-deploy** from GitHub for CI/CD
- Set up **monitoring alerts** in Render dashboard

---

## Part 3: Vercel Setup (Frontend)

### Step 1: Prepare Frontend

1. **Update API URL**
   
   Edit `frontend/src/services/api.js`:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   ```

2. **Create Environment File**
   
   Create `frontend/.env.production`:
   ```env
   REACT_APP_API_URL=https://mardeys-dashboard-api.onrender.com
   ```
   Replace with your actual Render backend URL!

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI (Quick)**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: mardeys-dashboard
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

**Option B: Using Vercel Dashboard**

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import `topmcon/Mardeys.com-Dashboard`
5. Configure:
   - Framework Preset: **Create React App**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
6. **Environment Variables**:
   ```
   REACT_APP_API_URL = https://mardeys-dashboard-api.onrender.com
   ```
7. Click **"Deploy"**

### Step 3: Update Backend CORS

After Vercel deployment, update Render environment variables:

```env
FRONTEND_URL=https://mardeys-dashboard.vercel.app
```

This allows your frontend to make API requests to the backend.

### Step 4: Configure Custom Domain (Optional)

1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your domain: `dashboard.mardeys.com`
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` in Render to match

---

## Part 4: Post-Deployment Configuration

### Create Admin User

Once both services are deployed:

```bash
# Use your Render backend URL
curl -X POST https://mardeys-dashboard-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@mardeys.com",
    "password": "YourSecurePassword123!",
    "role": "admin"
  }'
```

### Test the Deployment

1. **Frontend**: Visit your Vercel URL
   - https://mardeys-dashboard.vercel.app
   
2. **Login**: Use credentials from above

3. **Check Monitoring**:
   - Wait 5-10 minutes for first metrics
   - Verify services are being monitored
   - Check alerts are working

### Enable WebSocket (if needed)

Vercel doesn't support WebSocket on free tier. For real-time updates:

**Option 1**: Disable WebSocket, use polling
- Frontend will automatically fall back to HTTP polling

**Option 2**: Deploy frontend on Render too
- Use the static site service in `render.yaml`
- Both frontend and backend on same platform

**Option 3**: Use Vercel Pro
- Upgrade to enable WebSocket support

---

## Part 5: Monitoring & Maintenance

### Check Backend Logs (Render)

1. Render Dashboard → Your Service
2. Click **"Logs"** tab
3. View real-time logs

### Check Frontend Logs (Vercel)

1. Vercel Dashboard → Your Project
2. Click **"Deployments"** → Select deployment
3. View **"Function Logs"** (if using serverless functions)

### Set Up Uptime Monitoring

Free options:
- [UptimeRobot](https://uptimerobot.com) - Monitor both URLs
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

Monitor:
- Frontend: `https://mardeys-dashboard.vercel.app`
- Backend health: `https://mardeys-dashboard-api.onrender.com/api/health`

### Database Backups

MongoDB Atlas (free tier):
1. Dashboard → Clusters → **"..."** → **Backup**
2. Enable **Cloud Backup** (available on free tier)
3. Automatic snapshots every 24 hours

---

## Troubleshooting

### Backend Issues

**Problem**: Service won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Check MongoDB connection string is correct

**Problem**: MongoDB connection fails
- Verify IP whitelist includes `0.0.0.0/0`
- Check username/password in connection string
- Ensure database user has proper permissions

**Problem**: Service sleeps (free tier)
- Upgrade to Starter plan ($7/month)
- Or use cron-job.org to ping every 10 minutes

### Frontend Issues

**Problem**: Can't connect to backend
- Check `REACT_APP_API_URL` is correct
- Verify CORS settings in backend
- Check browser console for errors

**Problem**: WebSocket not working
- Expected on Vercel free tier
- App will use HTTP polling as fallback
- Or deploy frontend on Render

**Problem**: Build fails
- Check Node.js version compatibility
- Verify all dependencies installed
- Check build logs in Vercel dashboard

### API Connection Issues

**Problem**: WordPress/WooCommerce monitoring fails
- Test API credentials locally first
- Verify application password is correct
- Check WooCommerce API keys have read permissions

**Problem**: DigitalOcean monitoring fails
- Verify API token has read permissions
- Check droplet ID is correct
- Test API token using DigitalOcean API explorer

**Problem**: Cloudflare monitoring fails
- Verify API token has Analytics:Read permission
- Check zone ID is correct
- Test in Cloudflare API docs

---

## Cost Breakdown

### Free Tier (Perfect for Testing)

- **MongoDB Atlas**: Free M0 (512MB storage)
- **Render Backend**: Free (750 hours/month, sleeps after 15min)
- **Vercel Frontend**: Free (100GB bandwidth)
- **Total**: $0/month

**Limitations**:
- Backend sleeps when inactive
- Limited to 750 hours/month on Render
- No custom domains on some services

### Production Tier (Recommended)

- **MongoDB Atlas**: M2 Shared ($9/month) or M10 Dedicated ($57/month)
- **Render Backend**: Starter ($7/month) - No sleeping
- **Vercel Frontend**: Hobby ($20/month) - Custom domains
- **Total**: ~$36-86/month

**Benefits**:
- 24/7 uptime
- Better performance
- More storage/bandwidth
- Custom domains
- Better support

---

## Environment Variables Checklist

Use this checklist when setting up Render:

```bash
# ✅ Required Variables
□ MONGODB_URI
□ JWT_SECRET (auto-generated by Render)
□ FRONTEND_URL
□ NODE_ENV=production
□ PORT=5000

# ✅ WordPress Monitoring
□ WORDPRESS_URL
□ WORDPRESS_USERNAME
□ WORDPRESS_APP_PASSWORD

# ✅ WooCommerce Monitoring
□ WOOCOMMERCE_URL
□ WOOCOMMERCE_CONSUMER_KEY
□ WOOCOMMERCE_CONSUMER_SECRET

# ✅ DigitalOcean Monitoring
□ DIGITALOCEAN_API_TOKEN
□ DIGITALOCEAN_DROPLET_ID

# ✅ Cloudflare Monitoring
□ CLOUDFLARE_API_TOKEN
□ CLOUDFLARE_ZONE_ID

# ✅ Email Notifications
□ SMTP_HOST
□ SMTP_PORT
□ SMTP_USER
□ SMTP_PASS
□ EMAIL_FROM

# ⚠️ Optional
□ SLACK_WEBHOOK_URL (if using Slack)
□ ALERT_THRESHOLD_* (use defaults if not specified)
```

---

## Quick Deploy Summary

**5-Minute Deployment**:

1. **MongoDB Atlas** (2 min):
   - Create free cluster
   - Create database user
   - Whitelist 0.0.0.0/0
   - Copy connection string

2. **Render** (2 min):
   - New Blueprint
   - Connect GitHub repo
   - Paste environment variables
   - Deploy

3. **Vercel** (1 min):
   - Import GitHub repo
   - Set root directory: `frontend`
   - Add `REACT_APP_API_URL`
   - Deploy

**Done!** 🎉

---

## Next Steps

After deployment:

1. ✅ Test login at your Vercel URL
2. ✅ Wait 10 minutes for first metrics
3. ✅ Verify all monitoring services working
4. ✅ Test alert notifications
5. ✅ Set up uptime monitoring
6. ✅ Configure custom domain (optional)
7. ✅ Review logs regularly
8. ✅ Consider upgrading for production

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **This Project**: Check `README.md` and other docs

---

## Security Checklist

Before going to production:

- ✅ Use strong JWT_SECRET (64+ characters)
- ✅ Enable HTTPS (automatic on Render/Vercel)
- ✅ Rotate API keys regularly
- ✅ Review MongoDB access controls
- ✅ Enable two-factor auth on all platforms
- ✅ Set up monitoring alerts
- ✅ Keep dependencies updated
- ✅ Review application logs weekly

---

**You're ready to deploy!** 🚀

The cloud setup gives you:
- 🌍 Global CDN delivery
- 📊 Automatic scaling
- 🔒 Built-in SSL/HTTPS
- 🚀 CI/CD from GitHub
- 💰 Free tier to start
- 📈 Easy upgrades

Happy monitoring!
