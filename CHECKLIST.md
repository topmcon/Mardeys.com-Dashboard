# Getting Started Checklist

Use this checklist to set up your Mardeys E-commerce Dashboard from scratch.

## 📋 Pre-Installation Checklist

### System Requirements
- [ ] Node.js 18+ installed (`node -v`)
- [ ] npm installed (`npm -v`)
- [ ] MongoDB 7+ installed OR MongoDB Atlas account
- [ ] Git installed (`git --version`)
- [ ] Text editor (VS Code, nano, vim)

### API Credentials Ready
- [ ] WordPress URL
- [ ] WordPress username
- [ ] WordPress Application Password
- [ ] WooCommerce Consumer Key
- [ ] WooCommerce Consumer Secret
- [ ] DigitalOcean API Token
- [ ] DigitalOcean Droplet ID
- [ ] Cloudflare API Token
- [ ] Cloudflare Zone ID
- [ ] Cloudflare Email
- [ ] Gmail app password (for notifications)
- [ ] Slack webhook URL (optional)

## 🚀 Installation Steps

### 1. Clone Repository
- [ ] `git clone https://github.com/topmcon/Mardeys.com-Dashboard.git`
- [ ] `cd Mardeys.com-Dashboard`
- [ ] Verify files with `ls -la`

### 2. Backend Setup
- [ ] Copy `.env.example` to `.env`: `cp .env.example .env`
- [ ] Edit `.env` with your credentials: `nano .env`
- [ ] Install dependencies: `npm install`
- [ ] Verify no errors in installation

### 3. Frontend Setup
- [ ] Navigate to frontend: `cd frontend`
- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.example` to `.env`: `cp .env.example .env`
- [ ] Edit frontend `.env` if needed
- [ ] Return to root: `cd ..`

### 4. MongoDB Setup

#### Option A: Local MongoDB
- [ ] Start MongoDB: `sudo systemctl start mongod`
- [ ] Verify running: `sudo systemctl status mongod`
- [ ] Test connection: `mongosh`
- [ ] Create database: `use mardeys-dashboard`
- [ ] Update `.env` with: `MONGODB_URI=mongodb://localhost:27017/mardeys-dashboard`

#### Option B: MongoDB Atlas (Cloud)
- [ ] Create account at mongodb.com/cloud/atlas
- [ ] Create free cluster
- [ ] Get connection string
- [ ] Update `.env` with connection string
- [ ] Whitelist your IP address

### 5. Environment Configuration

Edit `.env` file with these critical settings:

#### Required Settings
- [ ] `NODE_ENV=development`
- [ ] `PORT=5000`
- [ ] `MONGODB_URI=<your-mongodb-connection>`
- [ ] `JWT_SECRET=<generate-strong-random-string>`
- [ ] `WORDPRESS_URL=https://your-site.com`
- [ ] `WORDPRESS_USERNAME=<your-username>`
- [ ] `WORDPRESS_APP_PASSWORD=<your-app-password>`
- [ ] `WC_CONSUMER_KEY=ck_<your-key>`
- [ ] `WC_CONSUMER_SECRET=cs_<your-secret>`

#### Optional but Recommended
- [ ] `DO_API_TOKEN=<digitalocean-token>`
- [ ] `DO_DROPLET_ID=<droplet-id>`
- [ ] `CLOUDFLARE_API_TOKEN=<cf-token>`
- [ ] `CLOUDFLARE_ZONE_ID=<zone-id>`
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_USER=<your-email>`
- [ ] `EMAIL_PASSWORD=<app-password>`
- [ ] `ALERT_EMAIL_TO=<admin-email>`

#### Alert Thresholds (Optional - defaults provided)
- [ ] `ALERT_CPU_THRESHOLD=80`
- [ ] `ALERT_MEMORY_THRESHOLD=85`
- [ ] `ALERT_DISK_THRESHOLD=90`
- [ ] `ALERT_RESPONSE_TIME_THRESHOLD=3000`

### 6. Start the Application

#### Development Mode (Recommended for testing)
- [ ] Start both servers: `npm run dev`
  OR
- [ ] Terminal 1: `npm run server:dev`
- [ ] Terminal 2: `npm run client:dev`

#### Verify Running
- [ ] Backend accessible: `curl http://localhost:5000/api/health`
- [ ] Frontend accessible: Open http://localhost:3000
- [ ] No errors in console logs

### 7. Create Admin User

Choose one method:

#### Method A: cURL
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!",
    "role": "admin"
  }'
```
- [ ] Command executed successfully
- [ ] Response shows user created

#### Method B: MongoDB Shell
```javascript
mongosh
use mardeys-dashboard
db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2b$10$hashedpassword", // Use bcrypt to hash
  role: "admin",
  isActive: true,
  createdAt: new Date()
})
```
- [ ] User document inserted

#### Method C: Postman/Insomnia
- [ ] Import API collection
- [ ] Send POST request to `/api/auth/register`
- [ ] Verify 201 response

### 8. First Login
- [ ] Open http://localhost:3000
- [ ] See login page
- [ ] Enter admin credentials
- [ ] Successfully logged in
- [ ] Dashboard loads

### 9. Verify Monitoring

#### Initial Checks (Wait 5-10 minutes)
- [ ] Dashboard shows system health score
- [ ] Service status indicators appear
- [ ] No critical errors in logs

#### Check Backend Logs
- [ ] Monitor logs: `tail -f logs/combined.log`
- [ ] See health check messages
- [ ] See metrics collection messages
- [ ] No error messages

#### Test API Endpoints
- [ ] GET `/api/dashboard/overview` returns data
- [ ] GET `/api/metrics/latest` returns metrics
- [ ] GET `/api/alerts` returns alerts (may be empty)

### 10. Test Notifications

#### Email Test
- [ ] Trigger test alert OR wait for real alert
- [ ] Check email inbox
- [ ] Verify email received
- [ ] Email formatting looks good

#### Slack Test (if configured)
- [ ] Trigger test alert
- [ ] Check Slack channel
- [ ] Verify message received
- [ ] Formatting looks good

### 11. Dashboard Features Test

- [ ] View health score
- [ ] See active alerts (if any)
- [ ] Check service status indicators
- [ ] View recent activity
- [ ] Acknowledge an alert (if any)
- [ ] WebSocket connection working (real-time updates)

## 🐳 Docker Installation Checklist

### Prerequisites
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`

### Setup Steps
1. [ ] Clone repository
2. [ ] Copy `.env.example` to `.env`
3. [ ] Edit `.env` with credentials
4. [ ] Start containers: `docker-compose up -d`
5. [ ] Check containers: `docker-compose ps`
6. [ ] View logs: `docker-compose logs -f`
7. [ ] Create admin user (see Docker method in QUICKSTART.md)
8. [ ] Access http://localhost:3000
9. [ ] Login and verify

### Docker Verification
- [ ] All 3 containers running (mongodb, backend, frontend)
- [ ] No container errors in logs
- [ ] Backend connects to MongoDB
- [ ] Frontend loads correctly

## ✅ Post-Installation Checklist

### Monitoring Verification
- [ ] WordPress monitor working (check logs)
- [ ] WooCommerce monitor working
- [ ] DigitalOcean monitor working (if configured)
- [ ] Cloudflare monitor working (if configured)
- [ ] Metrics being saved to database
- [ ] Alerts being generated when appropriate

### Database Verification
```bash
mongosh
use mardeys-dashboard
db.metrics.countDocuments()  // Should be > 0 after 5-10 minutes
db.alerts.countDocuments()   // May be 0 if no issues
db.users.countDocuments()    // Should be >= 1
```
- [ ] Collections exist
- [ ] Data being written

### Security Checklist
- [ ] `.env` file is in `.gitignore`
- [ ] JWT_SECRET is strong (64+ characters)
- [ ] MongoDB password is strong (if using auth)
- [ ] Default passwords changed
- [ ] API credentials are correct
- [ ] CORS configured properly

### Performance Checklist
- [ ] Dashboard loads in < 3 seconds
- [ ] API responses < 500ms
- [ ] No memory leaks (check with `top` or `htop`)
- [ ] MongoDB queries optimized
- [ ] Logs not growing too large

### Backup Checklist
- [ ] MongoDB backup strategy planned
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] `.env` file backed up securely

## 🎯 Next Steps After Setup

### Immediate (Day 1)
- [ ] Monitor for 1 hour, check for issues
- [ ] Review all alert thresholds
- [ ] Test notification channels
- [ ] Add team members (if needed)
- [ ] Bookmark dashboard URL

### Short Term (Week 1)
- [ ] Review collected metrics
- [ ] Fine-tune alert thresholds
- [ ] Set up automated backups
- [ ] Document any custom configurations
- [ ] Train team on dashboard usage

### Medium Term (Month 1)
- [ ] Analyze historical data
- [ ] Optimize monitoring intervals
- [ ] Review and resolve all alerts
- [ ] Set up additional monitoring (if needed)
- [ ] Consider production deployment

### Long Term (Ongoing)
- [ ] Regular security updates: `npm audit fix`
- [ ] Monitor disk space for logs/database
- [ ] Review and archive old alerts
- [ ] Optimize database queries
- [ ] Add new monitoring services

## 🆘 Troubleshooting Checklist

### Backend Won't Start
- [ ] Check MongoDB is running
- [ ] Verify `.env` file exists and is correct
- [ ] Check port 5000 is not in use
- [ ] Review logs: `npm run server:dev`
- [ ] Verify all environment variables set

### Frontend Won't Start
- [ ] Check backend is running first
- [ ] Verify frontend dependencies installed
- [ ] Check port 3000 is not in use
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Delete node_modules and reinstall

### No Metrics Appearing
- [ ] Wait 5-10 minutes for first collection
- [ ] Check API credentials in `.env`
- [ ] Review backend logs for errors
- [ ] Test API endpoints manually with curl
- [ ] Verify external APIs are accessible

### Alerts Not Sending
- [ ] Check email/Slack credentials
- [ ] Review notification service logs
- [ ] Test with manual alert creation
- [ ] Verify SMTP settings
- [ ] Check firewall/network issues

### MongoDB Connection Issues
- [ ] Verify MongoDB is running
- [ ] Check connection string format
- [ ] Test with mongosh CLI
- [ ] Verify credentials (if using auth)
- [ ] Check network/firewall rules

### WebSocket Not Working
- [ ] Check backend WebSocket server running
- [ ] Verify frontend WebSocket URL correct
- [ ] Check browser console for errors
- [ ] Test with different browser
- [ ] Verify no proxy/firewall blocking

## 📞 Getting Help

If you're stuck:
1. [ ] Review error messages carefully
2. [ ] Check all documentation files
3. [ ] Verify environment variables
4. [ ] Test each component separately
5. [ ] Review logs for specific errors
6. [ ] Search for error messages online
7. [ ] Open GitHub issue with details

## ✨ Success Criteria

You're fully set up when:
- ✅ Dashboard loads without errors
- ✅ Can login successfully
- ✅ Health score is displayed
- ✅ At least one service shows metrics
- ✅ Alerts appear when issues occur
- ✅ Notifications are received
- ✅ WebSocket updates work in real-time
- ✅ No critical errors in logs

---

**Congratulations! 🎉**

Once all items are checked, your dashboard is ready to monitor your e-commerce platform 24/7!
