# Mardeys E-commerce Monitoring Dashboard

A comprehensive, real-time monitoring dashboard for headless WordPress/WooCommerce e-commerce websites. Monitor your complete infrastructure including WordPress, WooCommerce, DigitalOcean droplets, and Cloudflare CDN - all from one unified dashboard.

## 🚀 Features

### Monitoring Capabilities
- **WordPress Health Checks**: Site availability, response time, API status, plugin monitoring
- **WooCommerce Analytics**: Order stats, revenue tracking, inventory alerts, customer metrics
- **DigitalOcean Monitoring**: Droplet health, CPU/memory/disk usage, resource alerts
- **Cloudflare Analytics**: Traffic statistics, cache performance, security events, firewall monitoring

### Alert System
- **Multi-Channel Notifications**: Email, Slack, and webhook support
- **Smart Alerting**: Configurable thresholds with severity levels (info, warning, error, critical)
- **Alert Management**: Acknowledge and resolve alerts directly from dashboard
- **Real-time Updates**: WebSocket integration for instant notifications

### Dashboard Features
- **Real-time Metrics**: Live system health score and performance indicators
- **Interactive Charts**: Beautiful visualizations using Recharts
- **Historical Data**: Track trends over time (hourly, daily, weekly, monthly)
- **User Authentication**: Secure login with JWT tokens and role-based access
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 7+
- Docker & Docker Compose (optional, for containerized deployment)
- API tokens/credentials for:
  - WordPress (Application Password)
  - WooCommerce (Consumer Key & Secret)
  - DigitalOcean (API Token)
  - Cloudflare (API Token & Zone ID)

## 🛠️ Installation & Deployment

### Option 1: Cloud Deployment (Production - Easiest)

🚀 **Deploy to Render + Vercel in 5 minutes** - Perfect for production!

**See [DEPLOYMENT_CLOUD.md](./DEPLOYMENT_CLOUD.md)** for complete guide

Quick overview:
- **Backend**: Render (free tier available, auto-sleep after 15min)
- **Frontend**: Vercel (free tier, global CDN)
- **Database**: MongoDB Atlas (free tier, 512MB)
- **Cost**: $0/month (free) or $36/month (production without sleep)

Files included:
- `render.yaml` - Backend deployment blueprint
- `vercel.json` - Frontend deployment config
- `.env.production.example` - Production environment template

---

### Option 2: Docker Deployment (Local/VPS)

1. **Clone the repository**
   ```bash
   git clone https://github.com/topmcon/Mardeys.com-Dashboard.git
   cd Mardeys.com-Dashboard
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your actual credentials
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

4. **Access the dashboard**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

---

### Option 3: Manual Installation (Development)

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/topmcon/Mardeys.com-Dashboard.git
   cd Mardeys.com-Dashboard
   npm run install:all
   ```

2. **Set up MongoDB**
   ```bash
   # Install and start MongoDB locally or use MongoDB Atlas
   # Update MONGODB_URI in .env
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   # Edit both files with your credentials
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start backend
   npm run server:dev

   # Terminal 2: Start frontend
   npm run client:dev
   ```

   Or use the combined script:
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Required Environment Variables

Edit `.env` file with your credentials:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/mardeys-dashboard

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# WordPress
WORDPRESS_URL=https://your-site.com
WORDPRESS_API_URL=https://your-site.com/wp-json
WORDPRESS_USERNAME=your-wp-username
WORDPRESS_APP_PASSWORD=your-application-password

# WooCommerce
WC_CONSUMER_KEY=ck_your_consumer_key
WC_CONSUMER_SECRET=cs_your_consumer_secret

# DigitalOcean
DO_API_TOKEN=your-digitalocean-api-token
DO_DROPLET_ID=your-droplet-id

# Cloudflare
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_EMAIL=your-cloudflare-email

# Email Notifications (Gmail SMTP example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=notifications@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com

# Slack (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Alert Thresholds
ALERT_CPU_THRESHOLD=80
ALERT_MEMORY_THRESHOLD=85
ALERT_DISK_THRESHOLD=90
ALERT_RESPONSE_TIME_THRESHOLD=3000
ALERT_ERROR_RATE_THRESHOLD=5

# Monitoring Intervals (minutes)
HEALTH_CHECK_INTERVAL=5
METRICS_COLLECTION_INTERVAL=15
CLEANUP_OLD_DATA_DAYS=30
```

### Getting API Credentials

#### WordPress Application Password
1. Log in to WordPress admin
2. Go to Users → Profile
3. Scroll to "Application Passwords"
4. Create new password with name "Dashboard"
5. Copy the generated password

#### WooCommerce API Keys
1. Go to WooCommerce → Settings → Advanced → REST API
2. Click "Add key"
3. Description: "Monitoring Dashboard"
4. Permissions: Read
5. Copy Consumer Key and Consumer Secret

#### DigitalOcean API Token
1. Log in to DigitalOcean
2. Go to API → Tokens/Keys
3. Generate New Token with Read scope
4. Copy the token
5. Find your Droplet ID in the Droplets page URL

#### Cloudflare API Token
1. Log in to Cloudflare dashboard
2. Go to My Profile → API Tokens
3. Create Token with Analytics:Read and Zone:Read permissions
4. Copy Zone ID from your domain's overview page

#### Gmail SMTP (for Email Notifications)
1. Enable 2-Factor Authentication on your Google account
2. Go to Security → App Passwords
3. Generate app password for "Mail"
4. Use this password in EMAIL_PASSWORD

## 👤 User Management

### Create Initial Admin User

After starting the application, create your first admin user:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourdomain.com",
    "password": "your-secure-password",
    "role": "admin"
  }'
```

Or use the MongoDB shell:

```javascript
db.users.insertOne({
  username: "admin",
  email: "admin@yourdomain.com",
  password: "$2b$10$hashedpassword",  // Use bcrypt to hash
  role: "admin",
  isActive: true,
  createdAt: new Date()
})
```

## 📊 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Login with username and password
```json
{
  "username": "admin",
  "password": "your-password"
}
```

#### GET `/api/auth/verify`
Verify JWT token (requires Authorization header)

### Dashboard Endpoints

#### GET `/api/dashboard/overview`
Get dashboard overview with health score and alerts

#### GET `/api/dashboard/status`
Get current status of all services

### Metrics Endpoints

#### GET `/api/metrics`
Query parameters:
- `type`: wordpress, woocommerce, digitalocean, cloudflare
- `category`: health, performance, traffic, etc.
- `startDate`: ISO date string
- `endDate`: ISO date string
- `interval`: minute, hour, day
- `limit`: number of results

#### GET `/api/metrics/latest`
Get latest metrics for each service

#### GET `/api/metrics/stats`
Get statistics for a specific period

### Alerts Endpoints

#### GET `/api/alerts`
Query parameters:
- `status`: active, acknowledged, resolved
- `severity`: info, warning, error, critical
- `source`: wordpress, woocommerce, etc.
- `page`: page number
- `limit`: results per page

#### PATCH `/api/alerts/:id/acknowledge`
Acknowledge an alert

#### PATCH `/api/alerts/:id/resolve`
Resolve an alert

## 🔧 Monitoring Services

### WordPress Monitor
- Site availability (HTTP status)
- Response time tracking
- API health checks
- Plugin status and updates
- Database statistics

### WooCommerce Monitor
- Order statistics (24h, 7d, 30d)
- Revenue tracking
- Product inventory alerts
- Customer metrics
- Recent activity

### DigitalOcean Monitor
- Droplet status and health
- CPU utilization
- Memory usage
- Disk space
- Bandwidth metrics

### Cloudflare Monitor
- Zone analytics
- Cache hit ratio
- Request statistics
- Security events
- Firewall monitoring
- DNS record tracking

## 🔔 Alert Configuration

Alerts are automatically generated when:
- Site goes down (critical)
- Response time exceeds threshold (warning/error)
- CPU usage above threshold (warning/critical)
- Memory usage above threshold (warning/critical)
- Disk space above threshold (warning/critical)
- Multiple products out of stock (warning)
- Security threats detected (error/critical)

Customize thresholds in `.env` file.

## 📱 Notification Channels

### Email Notifications
Sent via SMTP with beautifully formatted HTML emails including:
- Alert severity with color coding
- Detailed message and metrics
- Current values vs thresholds
- Timestamp

### Slack Notifications
Rich formatted messages with:
- Emoji indicators
- Color-coded attachments
- Structured field layout
- Timestamps

### Webhook Support
Send alerts to custom webhooks for integration with:
- PagerDuty
- Opsgenie
- Custom notification systems

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose up -d --build

# View running containers
docker-compose ps
```

## 🔍 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify all required environment variables are set
- Check logs: `docker-compose logs backend`

### Frontend can't connect to backend
- Verify REACT_APP_API_URL in frontend/.env
- Check CORS settings in backend/server.js
- Ensure backend is running on correct port

### No metrics appearing
- Verify API credentials are correct
- Check monitoring service logs
- Test API endpoints manually with curl
- Ensure cron jobs are running

### Alerts not sending
- Verify email/Slack credentials
- Check notification service logs
- Test notification: Use `/api/notifications/test` endpoint

### MongoDB connection issues
- Ensure MongoDB is running
- Check connection string format
- Verify network connectivity
- Check Docker network if using containers

## 📈 Performance Optimization

- Metrics auto-cleanup after 30 days (configurable)
- Database indexes for efficient queries
- Gzip compression for frontend assets
- WebSocket for real-time updates instead of polling
- Aggregated queries for statistics

## 🔒 Security Recommendations

1. **Change default credentials** in `.env`
2. **Use strong JWT secret** (random 64+ characters)
3. **Enable HTTPS** in production
4. **Restrict MongoDB access** (use authentication)
5. **Use environment-specific .env files**
6. **Regular security updates**: `npm audit fix`
7. **Implement rate limiting** (included)
8. **Use read-only API keys** where possible

## 🚦 Production Deployment

### Using Docker (Recommended)

1. Update `.env` for production
2. Set `NODE_ENV=production`
3. Use strong passwords and secrets
4. Deploy with `docker-compose up -d`
5. Set up reverse proxy (nginx/Caddy) for HTTPS
6. Configure domain and SSL certificates

### Manual Deployment

1. Build frontend: `cd frontend && npm run build`
2. Serve frontend with nginx/Apache
3. Run backend with PM2: `pm2 start backend/server.js`
4. Set up MongoDB with authentication
5. Configure SSL/TLS
6. Set up monitoring and backups

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Support

For issues and questions:
- Open a GitHub issue
- Check existing documentation
- Review environment variable configuration

## 🎯 Roadmap

- [ ] Multi-site monitoring support
- [ ] Custom dashboard widgets
- [ ] Advanced analytics and reporting
- [ ] Mobile app
- [ ] SMS notifications
- [ ] Integration with more platforms (Shopify, Magento, etc.)
- [ ] Machine learning for anomaly detection
- [ ] Custom alert rules engine

---

Built with ❤️ for e-commerce monitoring