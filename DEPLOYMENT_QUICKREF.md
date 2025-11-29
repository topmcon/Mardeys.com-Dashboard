# Render + Vercel Deployment - Quick Reference

## 🚀 5-Minute Cloud Deployment

This is a quick reference card. For detailed instructions, see **[DEPLOYMENT_CLOUD.md](./DEPLOYMENT_CLOUD.md)**

---

## Prerequisites

✅ GitHub account  
✅ Render account (free): https://render.com  
✅ Vercel account (free): https://vercel.com  
✅ MongoDB Atlas account (free): https://mongodb.com/cloud/atlas  
✅ Your API credentials (WordPress, WooCommerce, DigitalOcean, Cloudflare)

---

## Step 1: MongoDB Atlas (2 min)

1. Create free M0 cluster
2. Create database user
3. Whitelist IP: `0.0.0.0/0`
4. Get connection string:
   ```
   mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/mardeys-dashboard
   ```

---

## Step 2: Deploy Backend to Render (2 min)

### Method A: Blueprint (Automatic)
1. Push code to GitHub
2. Render Dashboard → New → Blueprint
3. Connect repository
4. Paste environment variables (see below)
5. Deploy

### Method B: Manual
1. New → Web Service
2. Connect GitHub repo
3. Settings:
   - Build: `npm install`
   - Start: `node backend/server.js`
   - Environment: Node
4. Add environment variables
5. Deploy

### Required Environment Variables
```env
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://your-app.vercel.app
WORDPRESS_URL=https://...
WORDPRESS_USERNAME=...
WORDPRESS_APP_PASSWORD=...
WOOCOMMERCE_URL=https://...
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
DIGITALOCEAN_API_TOKEN=dop_v1_...
DIGITALOCEAN_DROPLET_ID=123456
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
EMAIL_FROM=Dashboard <your@email.com>
```

**Your backend URL**: `https://mardeys-dashboard-api.onrender.com`

---

## Step 3: Deploy Frontend to Vercel (1 min)

### Method A: CLI
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Method B: Dashboard
1. New Project → Import from GitHub
2. Settings:
   - Framework: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
3. Environment Variables:
   ```
   REACT_APP_API_URL=https://mardeys-dashboard-api.onrender.com
   ```
4. Deploy

**Your frontend URL**: `https://mardeys-dashboard.vercel.app`

---

## Step 4: Update Backend CORS

In Render dashboard, update:
```env
FRONTEND_URL=https://mardeys-dashboard.vercel.app
```

---

## Step 5: Create Admin User

```bash
curl -X POST https://mardeys-dashboard-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'
```

---

## ✅ Done!

Visit: `https://mardeys-dashboard.vercel.app`

---

## 💰 Cost

**Free Tier**:
- MongoDB Atlas: Free (512MB)
- Render: Free (sleeps after 15min)
- Vercel: Free (100GB bandwidth)
- **Total: $0/month**

**Production Tier**:
- MongoDB Atlas: $9-57/month
- Render Starter: $7/month (no sleep)
- Vercel Hobby: $20/month
- **Total: $36-84/month**

---

## 🔧 Files Included

- `render.yaml` - Render blueprint
- `vercel.json` - Vercel config
- `.env.production.example` - Production env template

---

## 📚 Full Guide

See **[DEPLOYMENT_CLOUD.md](./DEPLOYMENT_CLOUD.md)** for:
- Detailed step-by-step instructions
- Screenshots and examples
- Troubleshooting guide
- Custom domain setup
- Security checklist
- Monitoring setup

---

## ⚠️ Common Issues

**Backend won't connect to MongoDB**
- Check connection string format
- Verify IP whitelist includes `0.0.0.0/0`
- Test credentials in MongoDB Compass

**Frontend can't reach backend**
- Verify `REACT_APP_API_URL` in Vercel
- Check `FRONTEND_URL` in Render
- Inspect browser console for CORS errors

**Render service sleeps**
- Expected on free tier
- Upgrade to Starter ($7/month)
- Or use cron-job.org to ping every 10 min

---

## 🎉 Success Checklist

- ✅ MongoDB Atlas cluster created
- ✅ Backend deployed to Render
- ✅ Frontend deployed to Vercel
- ✅ Environment variables configured
- ✅ Admin user created
- ✅ Can login to dashboard
- ✅ Services showing metrics
- ✅ Alerts working

---

**Happy Monitoring!** 🚀
