# Project Structure

```
Mardeys.com-Dashboard/
├── backend/                          # Backend Node.js/Express server
│   ├── middleware/                   # Express middleware
│   │   ├── auth.js                  # JWT authentication middleware
│   │   └── adminOnly.js             # Admin-only route protection
│   ├── models/                      # MongoDB/Mongoose models
│   │   ├── Alert.js                 # Alert schema
│   │   ├── Metric.js                # Metric schema
│   │   ├── Setting.js               # Settings schema
│   │   └── User.js                  # User schema
│   ├── routes/                      # API route handlers
│   │   ├── alerts.js                # Alert management endpoints
│   │   ├── auth.js                  # Authentication endpoints
│   │   ├── dashboard.js             # Dashboard data endpoints
│   │   ├── metrics.js               # Metrics query endpoints
│   │   └── settings.js              # Settings management
│   ├── services/                    # Business logic & monitoring services
│   │   ├── cloudflareMonitor.js     # Cloudflare API integration
│   │   ├── digitaloceanMonitor.js   # DigitalOcean API integration
│   │   ├── monitoringService.js     # Main monitoring orchestrator
│   │   ├── notificationService.js   # Email/Slack notifications
│   │   ├── woocommerceMonitor.js    # WooCommerce API integration
│   │   └── wordpressMonitor.js      # WordPress health checks
│   ├── utils/                       # Utility functions
│   │   └── logger.js                # Winston logger configuration
│   └── server.js                    # Express app entry point
│
├── frontend/                         # React frontend application
│   ├── public/                      # Static assets
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   └── Layout.js            # Main layout wrapper
│   │   ├── contexts/                # React Context providers
│   │   │   └── AuthContext.js       # Authentication context
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.js         # Main dashboard page
│   │   │   └── Login.js             # Login page
│   │   ├── services/                # API & WebSocket services
│   │   │   └── api.js               # Axios API client
│   │   ├── App.js                   # Root component
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Global styles (Tailwind)
│   ├── .env.example                 # Frontend environment template
│   ├── Dockerfile                   # Frontend Docker configuration
│   ├── nginx.conf                   # Nginx configuration for Docker
│   ├── package.json                 # Frontend dependencies
│   └── tailwind.config.js           # Tailwind CSS configuration
│
├── logs/                            # Application logs (generated)
│   ├── error.log                    # Error logs
│   ├── combined.log                 # All logs
│   └── README.md
│
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── API_DOCUMENTATION.md             # Complete API documentation
├── DEPLOYMENT.md                    # Production deployment guide
├── docker-compose.yml               # Docker Compose configuration
├── Dockerfile.backend               # Backend Docker image
├── package.json                     # Root package.json
├── QUICKSTART.md                    # Quick start guide
├── README.md                        # Main documentation
└── setup.sh                         # Automated setup script
```

## File Descriptions

### Backend Files

#### `/backend/server.js`
- Express application setup
- Middleware configuration
- Route mounting
- MongoDB connection
- WebSocket server setup
- Graceful shutdown handling

#### `/backend/models/`
- **Alert.js**: Alert records with severity, status, notifications
- **Metric.js**: Time-series monitoring data
- **Setting.js**: Configurable application settings
- **User.js**: User authentication with bcrypt password hashing

#### `/backend/routes/`
- **auth.js**: Login, registration, token verification
- **dashboard.js**: Overview data, system status
- **metrics.js**: Query, aggregate, and retrieve metrics
- **alerts.js**: Alert CRUD operations, acknowledgment, resolution
- **settings.js**: Configuration management (admin only)

#### `/backend/services/`
- **monitoringService.js**: 
  - Orchestrates all monitoring services
  - Scheduled health checks (cron jobs)
  - Alert creation and management
  - Data cleanup
  - WebSocket broadcasting

- **wordpressMonitor.js**:
  - Site availability checks
  - Response time monitoring
  - REST API health
  - Plugin status

- **woocommerceMonitor.js**:
  - Order statistics
  - Revenue tracking
  - Inventory monitoring
  - Customer metrics

- **digitaloceanMonitor.js**:
  - Droplet health
  - CPU/Memory/Disk metrics
  - Bandwidth tracking

- **cloudflareMonitor.js**:
  - Zone analytics
  - Cache statistics
  - Security events
  - Firewall monitoring

- **notificationService.js**:
  - Email notifications (nodemailer)
  - Slack webhooks
  - Alert formatting

#### `/backend/middleware/`
- **auth.js**: JWT token verification for protected routes
- **adminOnly.js**: Role-based access control

#### `/backend/utils/`
- **logger.js**: Winston logging configuration

### Frontend Files

#### `/frontend/src/App.js`
- React Router setup
- Authentication provider
- Private route wrapper
- Toast notifications

#### `/frontend/src/pages/`
- **Dashboard.js**: 
  - Main dashboard view
  - Health score display
  - Active alerts list
  - Service status grid
  - WebSocket integration
  - Real-time updates

- **Login.js**: 
  - User authentication form
  - JWT token handling

#### `/frontend/src/components/`
- **Layout.js**: 
  - Navigation header
  - User menu
  - Footer
  - Responsive design

#### `/frontend/src/contexts/`
- **AuthContext.js**: 
  - Global authentication state
  - User management
  - Token persistence

#### `/frontend/src/services/`
- **api.js**: 
  - Axios HTTP client
  - API endpoint methods
  - Request/response interceptors
  - WebSocket connection handler

### Configuration Files

#### `.env.example`
Complete template for all environment variables:
- Server configuration
- Database connection
- API credentials (WordPress, WooCommerce, DigitalOcean, Cloudflare)
- Email/Slack settings
- Alert thresholds
- Monitoring intervals

#### `docker-compose.yml`
Multi-container setup:
- MongoDB database service
- Backend API service
- Frontend web service
- Network configuration
- Volume management

#### `Dockerfile.backend`
- Node.js 18 Alpine image
- Production dependencies only
- Multi-stage build optimization

#### `frontend/Dockerfile`
- Build stage: React build
- Production stage: Nginx
- Optimized for minimal size

#### `frontend/nginx.conf`
- SPA routing configuration
- Gzip compression
- Static asset caching
- Security headers

### Documentation Files

#### `README.md`
- Complete project overview
- Feature descriptions
- Installation instructions
- Configuration guide
- API credentials setup
- User management
- Troubleshooting

#### `QUICKSTART.md`
- 5-minute setup guide
- Docker quick start
- Common issues
- First tasks after setup

#### `API_DOCUMENTATION.md`
- All API endpoints
- Request/response examples
- Authentication
- WebSocket events
- Data models
- Error responses

#### `DEPLOYMENT.md`
- Production deployment options
- Docker deployment
- VPS deployment with PM2
- Cloud platform guides
- Security hardening
- Backup strategies
- Scaling considerations

### Scripts

#### `setup.sh`
Automated setup script:
- Dependency checks
- Environment file creation
- Package installation
- Setup verification

#### `package.json` (root)
- Development scripts
- Concurrently run frontend/backend
- Docker commands
- Install scripts

#### `frontend/package.json`
- React dependencies
- Chart libraries (Recharts)
- UI components (Headless UI, Heroicons)
- Routing (React Router)
- API client (Axios)
- Notifications (React Toastify)
- Build scripts

## Data Flow

```
┌─────────────────┐
│  External APIs  │
│  (WP, WC, DO,   │
│   Cloudflare)   │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│  Monitoring Services    │
│  (Cron Jobs)            │
│  - Health Checks        │
│  - Metrics Collection   │
│  - Alert Generation     │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  MongoDB Database       │
│  - Metrics Collection   │
│  - Alerts Collection    │
│  - Users Collection     │
│  - Settings Collection  │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  Express API Server     │
│  - REST Endpoints       │
│  - WebSocket Server     │
│  - Authentication       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  React Frontend         │
│  - Dashboard UI         │
│  - Real-time Updates    │
│  - Charts & Graphs      │
└─────────────────────────┘
         │
         ↓
┌─────────────────────────┐
│  Notification Channels  │
│  - Email (SMTP)         │
│  - Slack (Webhooks)     │
└─────────────────────────┘
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB 7+ (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken)
- **Scheduling**: node-cron
- **Logging**: Winston
- **Email**: Nodemailer
- **HTTP Client**: Axios
- **WebSocket**: ws
- **Security**: Helmet, bcrypt, express-rate-limit

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **State Management**: Context API
- **HTTP Client**: Axios
- **Charts**: Recharts
- **UI Components**: Headless UI, Heroicons
- **Styling**: Tailwind CSS
- **Notifications**: React Toastify
- **Date Handling**: date-fns

### DevOps
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (for frontend)
- **Process Manager**: PM2 (optional)
- **Version Control**: Git

## Key Features by Component

### Monitoring Services
- Scheduled health checks (every 5 minutes)
- Detailed metrics collection (every 15 minutes)
- Automatic alert generation based on thresholds
- Data cleanup (retains 30 days by default)
- Real-time broadcasting via WebSocket

### Alert System
- Multi-severity levels (info, warning, error, critical)
- Deduplication (prevents spam)
- Multi-channel notifications (Email, Slack)
- Alert lifecycle (active → acknowledged → resolved)
- Historical tracking

### Dashboard
- Real-time health score calculation
- Service status indicators
- Active alerts display
- Trend visualization
- WebSocket integration for live updates

### Security
- JWT authentication
- Password hashing (bcrypt)
- Role-based access control (admin/viewer)
- Rate limiting (100 req/15min)
- Security headers (Helmet)
- CORS configuration
