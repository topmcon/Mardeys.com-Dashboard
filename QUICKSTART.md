# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites Check
- ✅ Node.js 18+ installed
- ✅ MongoDB running (local or cloud)
- ✅ API credentials ready (WordPress, WooCommerce, DigitalOcean, Cloudflare)

### Step 1: Clone and Setup
```bash
git clone https://github.com/topmcon/Mardeys.com-Dashboard.git
cd Mardeys.com-Dashboard
./setup.sh
```

### Step 2: Configure Environment
Edit `.env` file with your credentials:
```bash
nano .env
```

**Minimum required settings:**
```env
MONGODB_URI=mongodb://localhost:27017/mardeys-dashboard
JWT_SECRET=generate-a-random-64-character-string

# Your WordPress/WooCommerce site
WORDPRESS_URL=https://your-site.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APP_PASSWORD=your-app-password
WC_CONSUMER_KEY=ck_your_key
WC_CONSUMER_SECRET=cs_your_secret

# Email for alerts (optional but recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ALERT_EMAIL_TO=admin@yourdomain.com
```

### Step 3: Create Admin User
```bash
# Start the backend first
npm run server:dev

# In another terminal, create admin user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourdomain.com",
    "password": "ChangeThisPassword123!",
    "role": "admin"
  }'
```

### Step 4: Start the Dashboard
```bash
# Development mode (auto-reload)
npm run dev

# Or start services separately
npm run server:dev  # Terminal 1
npm run client:dev  # Terminal 2
```

### Step 5: Access Dashboard
Open your browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

Login with the admin credentials you created!

## 🐳 Quick Start with Docker

Even faster! Just need Docker installed:

```bash
# 1. Clone and configure
git clone https://github.com/topmcon/Mardeys.com-Dashboard.git
cd Mardeys.com-Dashboard
cp .env.example .env
nano .env  # Add your credentials

# 2. Start everything
docker-compose up -d

# 3. Create admin user
docker-compose exec backend node -e "
const User = require('./backend/models/User');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = new User({
    username: 'admin',
    email: 'admin@example.com',
    password: 'ChangeMe123!',
    role: 'admin'
  });
  await user.save();
  console.log('Admin user created!');
  process.exit(0);
});
"

# 4. Access at http://localhost:3000
```

## 📊 What Gets Monitored?

Once running, the dashboard automatically monitors:

### WordPress
- ✓ Site availability (every 5 minutes)
- ✓ Response time
- ✓ API health
- ✓ Plugin updates needed

### WooCommerce
- ✓ Orders (24h, 7d, 30d)
- ✓ Revenue tracking
- ✓ Out of stock products
- ✓ Inventory alerts

### DigitalOcean
- ✓ Droplet status
- ✓ CPU usage
- ✓ Memory usage
- ✓ Disk space
- ✓ Bandwidth

### Cloudflare
- ✓ Traffic statistics
- ✓ Cache hit ratio
- ✓ Security threats
- ✓ Firewall events

## 🔔 Alerts You'll Receive

Automatic alerts when:
- 🚨 Site goes down
- ⚠️ Response time > 3 seconds
- ⚠️ CPU usage > 80%
- ⚠️ Memory usage > 85%
- ⚠️ Disk usage > 90%
- ⚠️ Products out of stock
- 🔒 Security threats detected

## 🎯 First Tasks After Setup

1. **Test Notifications**
   - Send test email alert
   - Configure Slack webhook (optional)
   - Check WebSocket connection

2. **Review Thresholds**
   - Adjust alert thresholds in `.env`
   - Set notification preferences

3. **Monitor Your First Metrics**
   - Wait 5 minutes for first health check
   - Review dashboard overview
   - Check service status

4. **Customize**
   - Add team members (viewers)
   - Set up monitoring intervals
   - Configure cleanup retention

## 🆘 Common Issues

### "Cannot connect to MongoDB"
```bash
# Start MongoDB locally
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### "Port 5000 already in use"
```bash
# Change port in .env
PORT=5001

# Update frontend/.env
REACT_APP_API_URL=http://localhost:5001/api
```

### "API credentials invalid"
- Verify WordPress Application Password
- Check WooCommerce API keys have Read permission
- Ensure API tokens are not expired

### "No metrics appearing"
- Wait 5 minutes for first collection
- Check backend logs: `npm run server:dev`
- Verify API credentials are correct

## 📚 Next Steps

- 📖 Read full [README.md](README.md)
- 🔧 Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- 🚀 Check [DEPLOYMENT.md](DEPLOYMENT.md) for production
- ⚙️ Customize thresholds and intervals
- 👥 Add team members
- 📱 Set up Slack notifications

## 💡 Tips

1. **Keep it secure**: Use strong passwords and change default JWT_SECRET
2. **Monitor production**: Deploy to production and set up real alerts
3. **Regular updates**: Keep dependencies updated with `npm audit fix`
4. **Backup database**: Set up automated MongoDB backups
5. **Test alerts**: Send test notifications to verify setup

## 🤝 Need Help?

- Check existing documentation
- Review environment variables in `.env.example`
- Open GitHub issue for bugs
- Verify API credentials are correct

---

Happy monitoring! 🎉
