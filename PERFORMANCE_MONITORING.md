# Performance Monitoring Features

## 🚀 New Performance-Focused Modules Added

I've enhanced your dashboard with **4 new performance monitoring services** focused on system health and speed:

---

## 📊 1. Performance Monitor

**File**: `backend/services/performanceMonitor.js`

### What It Monitors:
- ✅ **Core Web Vitals** (using Google PageSpeed Insights API)
  - LCP (Largest Contentful Paint) - Target: < 2.5s
  - FCP (First Contentful Paint) - Target: < 1.8s
  - CLS (Cumulative Layout Shift) - Target: < 0.1
  - TBT (Total Blocking Time)
  - Overall Performance Score (0-100)

- ✅ **Page Load Times** for critical pages:
  - Homepage
  - Shop Page
  - Cart Page
  - Checkout Page

- ✅ **API Performance**:
  - WordPress REST API response time
  - WooCommerce REST API response time

- ✅ **TTFB (Time to First Byte)**:
  - Measures server response time
  - Target: < 600ms (good), < 1000ms (acceptable)

### Alerts Created:
- Page load time > 3000ms (warning), > 5000ms (critical)
- API response time exceeds thresholds
- LCP > 4000ms
- FCP > 3000ms
- CLS > 0.25
- Performance score < 50

### Schedule:
**Runs every 30 minutes**

---

## 🔒 2. SSL Certificate Monitor

**File**: `backend/services/sslMonitor.js`

### What It Monitors:
- ✅ SSL certificate expiration dates
- ✅ Days until expiration
- ✅ Certificate validity periods
- ✅ Self-signed certificate detection
- ✅ Certificate issuer verification

### Alerts Created:
- Certificate expired (critical)
- Expiring within 15 days (critical)
- Expiring within 30 days (warning)
- Self-signed certificate detected (warning)
- Certificate not yet valid (warning)
- SSL check failures (error)

### Monitored Domains:
- Your WordPress site
- Cloudflare domain (if different)

### Schedule:
**Runs daily at 3:00 AM**

---

## ⏰ 3. WordPress Cron Monitor

**File**: `backend/services/cronMonitor.js`

### What It Monitors:
- ✅ WordPress cron system status
- ✅ Cron job execution (wp-cron or system cron)
- ✅ Scheduled events status
- ✅ Site activity to detect cron issues
- ✅ Hours since last WordPress activity

### Alerts Created:
- WordPress cron check failed (warning)
- No site activity in 24+ hours (warning)
- Multiple missed cron events (warning)
- Cron may not be running (warning)

### Schedule:
**Runs every hour**

---

## 🔌 4. WordPress Plugin Monitor

**File**: `backend/services/pluginMonitor.js`

### What It Monitors:
- ✅ Total plugin count
- ✅ Active vs inactive plugins
- ✅ Plugins needing updates
- ✅ Critical plugin status (WooCommerce, security plugins, etc.)
- ✅ Security plugin update needs

### Critical Plugins Tracked:
- Wordfence / Sucuri (security)
- WooCommerce (ecommerce)
- WP Rocket / Cloudflare (performance)
- Jetpack (features)
- Yoast SEO (SEO)
- Elementor (page builder)
- Contact Form 7 (forms)

### Alerts Created:
- Plugin updates available (info/warning)
- Security plugin updates available (warning)
- Critical plugin inactive (warning)
- Critical plugin needs update (warning)
- Many inactive plugins (info)
- Plugin check failed (warning)

### Schedule:
**Runs daily at 4:00 AM**

---

## 🔧 Configuration

### Required Environment Variables:

```env
# Performance Monitoring
PAGESPEED_API_KEY=your_google_pagespeed_api_key_here
# Get free API key: https://developers.google.com/speed/docs/insights/v5/get-started

# SSL Monitoring
SSL_WARNING_DAYS=30        # Warn when cert expires in X days
SSL_CRITICAL_DAYS=15       # Critical alert when cert expires in X days
CLOUDFLARE_DOMAIN=yourdomain.com

# Existing WordPress credentials used for cron/plugin monitoring
WORDPRESS_URL=https://your-site.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APP_PASSWORD=your-app-password
```

### Getting a PageSpeed API Key (FREE):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable "PageSpeed Insights API"
4. Create credentials → API Key
5. Copy the key to `.env` file

---

## 📈 Monitoring Schedule Summary

| Service | Frequency | Description |
|---------|-----------|-------------|
| Health Checks | Every 5 minutes | WordPress, WooCommerce, DigitalOcean, Cloudflare |
| Detailed Metrics | Every 15 minutes | Orders, revenue, resource usage, traffic |
| **Performance** | **Every 30 minutes** | **Core Web Vitals, page load, API speed** |
| **Cron Check** | **Every hour** | **WordPress cron system status** |
| **SSL Check** | **Daily at 3 AM** | **Certificate expiration & health** |
| **Plugin Check** | **Daily at 4 AM** | **Plugin updates & critical plugin status** |
| Data Cleanup | Daily at 2 AM | Remove old metrics (30 days) |

---

## 📊 Metrics Collected

### Performance Metrics:
```javascript
{
  type: 'performance',
  category: 'lcp' | 'fcp' | 'cls' | 'tbt' | 'score' | 'page_load_time' | 'api_response_time' | 'ttfb',
  value: number (milliseconds or score),
  source: 'Homepage' | 'Shop Page' | 'Cart Page' | 'Checkout Page' | 'WordPress API' | 'WooCommerce API'
}
```

### SSL Metrics:
```javascript
{
  type: 'ssl',
  category: 'days_until_expiration' | 'certificate_valid',
  value: number (days or 1/0),
  source: 'yourdomain.com'
}
```

### Cron Metrics:
```javascript
{
  type: 'cron',
  category: 'status' | 'last_run' | 'hours_since_last_activity' | 'missed_events' | 'pending_events',
  value: number,
  source: 'wordpress' | 'system' | 'trigger' | 'scheduled'
}
```

### Plugin Metrics:
```javascript
{
  type: 'plugins',
  category: 'total' | 'active' | 'updates_available' | 'inactive',
  value: number,
  source: 'wordpress'
}
```

---

## 🎯 Performance Thresholds

### Core Web Vitals:
| Metric | Good | Needs Improvement | Poor | Alert Level |
|--------|------|-------------------|------|-------------|
| LCP | < 2.5s | 2.5s - 4.0s | > 4.0s | Warning @ 4s |
| FCP | < 1.8s | 1.8s - 3.0s | > 3.0s | Warning @ 3s |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 | Warning @ 0.25 |
| TTFB | < 600ms | 600ms - 1000ms | > 1000ms | Warning @ 1s |

### Page Load Times:
- **Good**: < 3 seconds
- **Warning**: 3-5 seconds
- **Critical**: > 5 seconds

### API Response Times:
- **WordPress API**: Warning @ 1000ms
- **WooCommerce API**: Warning @ 2000ms

---

## 🔔 Alert Examples

### Performance Alert:
```
Title: "Poor LCP Performance"
Message: "Checkout Page LCP: 4200ms (threshold: 2500ms)"
Severity: warning
Metadata: { page: 'Checkout Page', lcp: 4200, threshold: 2500 }
```

### SSL Alert:
```
Title: "SSL Certificate Expiring Soon"
Message: "SSL certificate for WordPress Site (mardeys.com) expires in 12 days (Dec 11, 2025)"
Severity: critical
Metadata: {
  domain: 'mardeys.com',
  daysUntilExpiration: 12,
  validTo: '2025-12-11T00:00:00.000Z',
  issuer: 'Let's Encrypt',
  serialNumber: '...'
}
```

### Plugin Alert:
```
Title: "Security Plugin Updates Available"
Message: "2 security plugin(s) need updating: Wordfence Security, Sucuri Security"
Severity: warning
Metadata: {
  count: 2,
  plugins: ['Wordfence Security', 'Sucuri Security']
}
```

---

## 🚀 What's Next?

Your dashboard now monitors:
1. ✅ **Website Performance** - Core Web Vitals, page load times
2. ✅ **SSL Security** - Certificate expiration and health
3. ✅ **Backend Health** - WordPress cron and plugins
4. ✅ **API Performance** - REST API response times

### Future Enhancements (if needed):
- DNS health monitoring
- Payment gateway performance tracking
- Enhanced bot detection
- File integrity monitoring
- Database performance metrics

---

## 📚 Related Documentation

- [README.md](./README.md) - Main documentation
- [DEPLOYMENT_CLOUD.md](./DEPLOYMENT_CLOUD.md) - Cloud deployment guide
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference

---

## 🔍 Testing the New Features

### 1. Get PageSpeed API Key (required for performance monitoring)
```bash
# Visit: https://console.cloud.google.com/
# Enable PageSpeed Insights API
# Create API Key
# Add to .env file
```

### 2. Update Environment Variables
```bash
# Edit .env file
nano .env

# Add:
PAGESPEED_API_KEY=your_key_here
SSL_WARNING_DAYS=30
SSL_CRITICAL_DAYS=15
CLOUDFLARE_DOMAIN=yourdomain.com
```

### 3. Restart the Server
```bash
# If using npm
npm run server

# If using Docker
docker-compose restart backend

# If using PM2
pm2 restart mardeys-dashboard
```

### 4. Verify Monitoring is Running
Check logs for:
```
[INFO] Starting performance checks...
[INFO] Core Web Vitals checked for Homepage: LCP=1850ms, FCP=950ms, CLS=0.05
[INFO] SSL certificate for WordPress Site is valid (expires in 45 days)
[INFO] WordPress cron is enabled
[INFO] Plugins: 23 total, 20 active, 3 updates available
```

---

## 💡 Tips

1. **PageSpeed API has rate limits** - 25,000 queries/day (free tier), so 30-minute intervals are safe
2. **SSL checks run daily** to avoid unnecessary API calls
3. **Plugin checks require authentication** - ensure WordPress Application Password is set up correctly
4. **Alerts are deduplicated** - same alert won't trigger multiple times within 24 hours
5. **All metrics are stored** - check `/api/metrics` endpoint to see historical data

---

**Your dashboard is now monitoring performance, security, and system health comprehensively!** 🎉
