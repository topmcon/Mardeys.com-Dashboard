# System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MARDEYS DASHBOARD                            │
│                  E-commerce Monitoring Platform                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES (YOUR STACK)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │  WordPress   │  │ WooCommerce  │  │ DigitalOcean │  │Cloudflare││
│  │   Headless   │  │   REST API   │  │     API      │  │   API   ││
│  │     Site     │  │              │  │   (Droplet)  │  │  (CDN)  ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘│
│         │                 │                  │                 │     │
└─────────┼─────────────────┼──────────────────┼─────────────────┼─────┘
          │                 │                  │                 │
          │                 │                  │                 │
┌─────────┼─────────────────┼──────────────────┼─────────────────┼─────┐
│         │   MONITORING SERVICES (Node.js Backend)              │     │
│         │                 │                  │                 │     │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐  ┌─────▼────┐│
│  │  WordPress   │  │ WooCommerce  │  │ DigitalOcean │  │Cloudflare││
│  │   Monitor    │  │   Monitor    │  │   Monitor    │  │ Monitor  ││
│  │              │  │              │  │              │  │          ││
│  │ • Health     │  │ • Orders     │  │ • CPU Usage  │  │ • Traffic││
│  │ • Response   │  │ • Revenue    │  │ • Memory     │  │ • Cache  ││
│  │ • API Status │  │ • Inventory  │  │ • Disk       │  │ • Security│
│  │ • Plugins    │  │ • Customers  │  │ • Bandwidth  │  │ • Firewall│
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬────┘│
│         │                 │                  │                 │     │
│         └─────────────────┴──────────────────┴─────────────────┘     │
│                                    │                                  │
│                         ┌──────────▼──────────┐                      │
│                         │  Monitoring Service │                      │
│                         │   (Orchestrator)    │                      │
│                         │                     │                      │
│                         │ • Cron Jobs         │                      │
│                         │ • Health Checks     │                      │
│                         │ • Metrics Collection│                      │
│                         │ • Alert Generation  │                      │
│                         │ • Data Cleanup      │                      │
│                         └──────────┬──────────┘                      │
│                                    │                                  │
└────────────────────────────────────┼──────────────────────────────────┘
                                     │
                                     │
┌────────────────────────────────────▼──────────────────────────────────┐
│                        MONGODB DATABASE                               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Metrics    │  │   Alerts    │  │    Users    │  │  Settings   │ │
│  │ Collection  │  │ Collection  │  │ Collection  │  │ Collection  │ │
│  │             │  │             │  │             │  │             │ │
│  │ • Type      │  │ • Title     │  │ • Username  │  │ • Key       │ │
│  │ • Category  │  │ • Severity  │  │ • Email     │  │ • Value     │ │
│  │ • Value     │  │ • Status    │  │ • Role      │  │ • Category  │ │
│  │ • Timestamp │  │ • Source    │  │ • Password  │  │ • Updated   │ │
│  │ • Status    │  │ • Threshold │  │ • Active    │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     │
┌────────────────────────────────────▼──────────────────────────────────┐
│                    EXPRESS API SERVER (Node.js)                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                      REST API ENDPOINTS                        │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │                                                                 │  │
│  │  /api/auth/*         │  Authentication & Authorization         │  │
│  │  /api/dashboard/*    │  Dashboard Overview & Status           │  │
│  │  /api/metrics/*      │  Query Metrics & Statistics            │  │
│  │  /api/alerts/*       │  Alert Management & History            │  │
│  │  /api/settings/*     │  Configuration Management              │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    WEBSOCKET SERVER                            │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │                                                                 │  │
│  │  • Real-time health check updates                              │  │
│  │  • New alert broadcasts                                        │  │
│  │  • Metrics update notifications                                │  │
│  │  • Bi-directional communication                                │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                       MIDDLEWARE                               │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │                                                                 │  │
│  │  • JWT Authentication    • Rate Limiting                       │  │
│  │  • CORS                  • Compression                         │  │
│  │  • Helmet Security       • Error Handling                      │  │
│  │  • Logging              • Admin-Only Routes                   │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                  │
                    │                                  │
┌───────────────────▼─────────┐    ┌─────────────────▼────────────────┐
│  NOTIFICATION CHANNELS      │    │    REACT FRONTEND (SPA)          │
├─────────────────────────────┤    ├──────────────────────────────────┤
│                             │    │                                   │
│  ┌────────────────────────┐ │    │  ┌─────────────────────────────┐ │
│  │   Email (SMTP)         │ │    │  │     Dashboard View          │ │
│  │                        │ │    │  │                             │ │
│  │ • HTML Templates       │ │    │  │ • Health Score Display      │ │
│  │ • Severity Colors      │ │    │  │ • Active Alerts List        │ │
│  │ • Detailed Metrics     │ │    │  │ • Service Status Grid       │ │
│  └────────────────────────┘ │    │  │ • Real-time Charts          │ │
│                             │    │  │ • Alert Management          │ │
│  ┌────────────────────────┐ │    │  └─────────────────────────────┘ │
│  │   Slack Webhooks       │ │    │                                   │
│  │                        │ │    │  ┌─────────────────────────────┐ │
│  │ • Rich Formatting      │ │    │  │     Authentication          │ │
│  │ • Emoji Indicators     │ │    │  │                             │ │
│  │ • Color Attachments    │ │    │  │ • JWT Token Management      │ │
│  └────────────────────────┘ │    │  │ • Role-based Access         │ │
│                             │    │  │ • Secure Login              │ │
│  ┌────────────────────────┐ │    │  └─────────────────────────────┘ │
│  │   Custom Webhooks      │ │    │                                   │
│  │                        │ │    │  ┌─────────────────────────────┐ │
│  │ • PagerDuty            │ │    │  │    WebSocket Client         │ │
│  │ • Opsgenie             │ │    │  │                             │ │
│  │ • Custom Integrations  │ │    │  │ • Real-time Updates         │ │
│  └────────────────────────┘ │    │  │ • Alert Notifications       │ │
│                             │    │  │ • Auto-refresh Data         │ │
└─────────────────────────────┘    │  └─────────────────────────────┘ │
                                   │                                   │
                                   │  ┌─────────────────────────────┐ │
                                   │  │    UI Components            │ │
                                   │  │                             │ │
                                   │  │ • Tailwind CSS              │ │
                                   │  │ • Recharts Visualizations   │ │
                                   │  │ • Responsive Design         │ │
                                   │  │ • Toast Notifications       │ │
                                   │  └─────────────────────────────┘ │
                                   │                                   │
                                   └───────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT OPTIONS                              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Docker Compose          │  VPS (PM2)           │  Cloud Platforms    │
│  ─────────────────       │  ─────────────────   │  ─────────────────  │
│  • MongoDB Container     │  • Manual Setup      │  • Heroku           │
│  • Backend Container     │  • Nginx Proxy       │  • DigitalOcean App │
│  • Frontend Container    │  • PM2 Process Mgr   │  • AWS/Azure/GCP    │
│  • Network Config        │  • SSL with Certbot  │  • Managed Database │
│  • Volume Management     │  • Systemd Services  │  • Auto-scaling     │
│                          │                      │                     │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                         MONITORING FLOW                                │
└───────────────────────────────────────────────────────────────────────┘

                      ┌─────────────────────┐
                      │   Cron Scheduler    │
                      │  (node-cron)        │
                      └──────────┬──────────┘
                                 │
                   ┌─────────────┼─────────────┐
                   │                           │
            ┌──────▼──────┐            ┌──────▼──────┐
            │ Health Check│            │   Metrics   │
            │  (5 minutes)│            │ Collection  │
            │             │            │ (15 minutes)│
            └──────┬──────┘            └──────┬──────┘
                   │                           │
                   └─────────────┬─────────────┘
                                 │
                        ┌────────▼────────┐
                        │  Save to MongoDB│
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Check Thresholds│
                        └────────┬────────┘
                                 │
                          ┌──────▼──────┐
                          │Alert Needed?│
                          └──────┬──────┘
                                 │
                        ┌────────▼────────┐
                        │ Create Alert    │
                        │ Send Notification│
                        │ Broadcast WebSocket│
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Update Dashboard│
                        └─────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                         DATA RETENTION                                 │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Metrics:    30 days (configurable)  → Auto-cleanup daily            │
│  Alerts:     Permanent (resolved alerts cleaned after 30 days)       │
│  Users:      Permanent                                                │
│  Settings:   Permanent                                                │
│                                                                        │
│  Indexes:    Optimized for time-based queries                        │
│  Backup:     Recommended: Daily MongoDB dumps                        │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Layer 1: Network        │  • Firewall rules                         │
│                          │  • VPC/Private networks                   │
│                          │  • SSL/TLS encryption                     │
│  ─────────────────────────────────────────────────────────────────────│
│  Layer 2: Application    │  • JWT Authentication                     │
│                          │  • Rate Limiting (100/15min)              │
│                          │  • CORS Configuration                     │
│  ─────────────────────────────────────────────────────────────────────│
│  Layer 3: Data           │  • Password Hashing (bcrypt)              │
│                          │  • MongoDB Authentication                 │
│                          │  • Environment Variables                  │
│  ─────────────────────────────────────────────────────────────────────│
│  Layer 4: Code           │  • Input Validation                       │
│                          │  • Error Handling                         │
│                          │  • Security Headers (Helmet)              │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                     SCALING STRATEGY                                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Horizontal:  • Load Balancer (Nginx/HAProxy)                        │
│               • Multiple Backend Instances                            │
│               • Session Store (Redis)                                 │
│               • Message Queue (RabbitMQ)                              │
│                                                                        │
│  Vertical:    • Increase server resources                            │
│               • Optimize database queries                             │
│               • Add caching layer                                     │
│                                                                        │
│  Database:    • MongoDB Replica Sets                                 │
│               • Read Replicas                                         │
│               • Sharding for large datasets                          │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

## Key Interactions

### 1. Monitoring Cycle
```
External APIs → Monitors → Metrics → Database → Thresholds → Alerts → Notifications
```

### 2. User Request Flow
```
Browser → React App → API Request → Express → MongoDB → Response → UI Update
```

### 3. Real-time Updates
```
Backend Event → WebSocket → Frontend → UI Refresh → User Notification
```

### 4. Alert Flow
```
Threshold Exceeded → Alert Created → Database Saved → 
Notification Sent (Email/Slack) → WebSocket Broadcast → Dashboard Updated
```
