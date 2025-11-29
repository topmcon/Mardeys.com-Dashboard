# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/register
Create a new user account (admin only in production)

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "admin|viewer"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "string"
}
```

#### POST /auth/login
Authenticate user and receive JWT token

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### GET /auth/verify
Verify JWT token validity

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

### Dashboard

#### GET /dashboard/overview
Get comprehensive dashboard overview

**Response:**
```json
{
  "healthScore": 95,
  "activeAlerts": 3,
  "alertSummary": {
    "critical": 0,
    "error": 1,
    "warning": 2
  },
  "recentAlerts": [...],
  "metrics": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /dashboard/status
Get current status of all monitored services

**Response:**
```json
{
  "wordpress": {
    "status": "normal",
    "lastChecked": "2024-01-01T00:00:00.000Z"
  },
  "woocommerce": {...},
  "digitalocean": {...},
  "cloudflare": {...}
}
```

### Metrics

#### GET /metrics
Query metrics with filters

**Query Parameters:**
- `type` (optional): wordpress, woocommerce, digitalocean, cloudflare
- `category` (optional): health, performance, traffic, sales, etc.
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `limit` (optional): number of results (default: 100)
- `interval` (optional): minute, hour, day (default: hour)

**Response:**
```json
{
  "metrics": [
    {
      "_id": {...},
      "avgValue": 50.5,
      "minValue": 20,
      "maxValue": 80,
      "count": 10,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "query": {...}
}
```

#### GET /metrics/latest
Get latest metric values

**Query Parameters:**
- `type` (optional): filter by service type

**Response:**
```json
[
  {
    "_id": {
      "type": "wordpress",
      "category": "performance",
      "name": "response_time"
    },
    "latestValue": 250,
    "status": "normal",
    "unit": "ms",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /metrics/stats
Get statistical summary of metrics

**Query Parameters:**
- `type` (optional): service type
- `category` (optional): metric category
- `period` (optional): 1h, 24h, 7d, 30d (default: 24h)

**Response:**
```json
{
  "avgValue": 45.5,
  "minValue": 10,
  "maxValue": 90,
  "count": 144
}
```

### Alerts

#### GET /alerts
Get alerts with filtering and pagination

**Query Parameters:**
- `status` (optional): active, acknowledged, resolved
- `severity` (optional): info, warning, error, critical
- `source` (optional): wordpress, woocommerce, digitalocean, cloudflare
- `limit` (optional): results per page (default: 50)
- `page` (optional): page number (default: 1)

**Response:**
```json
{
  "alerts": [
    {
      "_id": "string",
      "title": "High CPU Usage",
      "message": "CPU usage is 85%",
      "severity": "warning",
      "source": "digitalocean",
      "category": "performance",
      "status": "active",
      "metricValue": 85,
      "threshold": 80,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

#### GET /alerts/:id
Get specific alert by ID

**Response:**
```json
{
  "_id": "string",
  "title": "string",
  "message": "string",
  "severity": "string",
  "source": "string",
  "status": "string",
  "createdAt": "string"
}
```

#### PATCH /alerts/:id/acknowledge
Acknowledge an alert

**Response:**
```json
{
  "_id": "string",
  "status": "acknowledged",
  "acknowledgedBy": "username",
  "acknowledgedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PATCH /alerts/:id/resolve
Mark alert as resolved

**Response:**
```json
{
  "_id": "string",
  "status": "resolved",
  "resolvedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /alerts/stats/summary
Get alert statistics

**Query Parameters:**
- `period` (optional): 1h, 24h, 7d, 30d (default: 24h)

**Response:**
```json
{
  "bySeverity": [
    { "_id": "critical", "count": 2 },
    { "_id": "warning", "count": 5 }
  ],
  "bySource": [
    { "_id": "wordpress", "count": 3 },
    { "_id": "digitalocean", "count": 4 }
  ],
  "period": "24h"
}
```

### Settings

#### GET /settings
Get all settings or filter by category

**Query Parameters:**
- `category` (optional): general, monitoring, notifications, thresholds, integrations

**Response:**
```json
[
  {
    "_id": "string",
    "key": "alert_cpu_threshold",
    "value": 80,
    "category": "thresholds",
    "description": "CPU usage alert threshold",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /settings/:key
Get specific setting by key

#### PUT /settings/:key
Update or create setting (admin only)

**Request Body:**
```json
{
  "value": "any type",
  "category": "string",
  "description": "string"
}
```

#### DELETE /settings/:key
Delete setting (admin only)

## WebSocket Events

Connect to: `ws://localhost:5000`

### Events Received

#### health_check
```json
{
  "type": "health_check",
  "data": {
    "wordpress": {...},
    "woocommerce": {...},
    "digitalocean": {...},
    "cloudflare": {...}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### new_alert
```json
{
  "type": "new_alert",
  "data": {
    "title": "string",
    "message": "string",
    "severity": "string",
    "source": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### metrics_update
```json
{
  "type": "metrics_update",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to 100 requests per 15 minutes per IP address.

## Data Models

### Metric
```javascript
{
  type: String,      // wordpress, woocommerce, digitalocean, cloudflare, database, custom
  category: String,  // health, performance, traffic, sales, inventory, security
  name: String,      // metric name
  value: Mixed,      // metric value
  unit: String,      // measurement unit
  status: String,    // normal, warning, critical
  metadata: Map,     // additional data
  timestamp: Date
}
```

### Alert
```javascript
{
  title: String,
  message: String,
  severity: String,           // info, warning, error, critical
  source: String,             // service that triggered alert
  category: String,
  status: String,             // active, acknowledged, resolved
  metricValue: Mixed,
  threshold: Mixed,
  metadata: Map,
  notificationSent: Boolean,
  notificationChannels: Array,
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolvedAt: Date,
  createdAt: Date
}
```

### User
```javascript
{
  username: String,
  email: String,
  password: String,          // hashed
  role: String,              // admin, viewer
  notificationPreferences: {
    email: Boolean,
    slack: Boolean,
    severityFilter: Array
  },
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date
}
```
