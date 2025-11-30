const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const metricsRoutes = require('./routes/metrics');
const alertsRoutes = require('./routes/alerts');
const settingsRoutes = require('./routes/settings');
const servicesRoutes = require('./routes/services');

// Import monitoring services
const MonitoringService = require('./services/monitoringService');
const metricsCollector = require('./jobs/metricsCollector');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('MongoDB connected successfully'))
.catch((err) => logger.error('MongoDB connection error:', err));

// WebSocket connection handler
wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');
  
  ws.on('message', (message) => {
    logger.debug('Received WebSocket message:', message);
  });
  
  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });
});

// Store WebSocket server instance for broadcasting
app.set('wss', wss);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/services', servicesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStates[mongoState] || 'unknown'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start monitoring services
const monitoringService = new MonitoringService(wss);
monitoringService.start();

// Start metrics collector (collects every 5 minutes)
metricsCollector.start(5 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    monitoringService.stop();
    metricsCollector.stop();
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;
