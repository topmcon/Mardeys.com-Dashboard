const cron = require('node-cron');
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');
const WordPressMonitor = require('./wordpressMonitor');
const WooCommerceMonitor = require('./woocommerceMonitor');
const DigitalOceanMonitor = require('./digitaloceanMonitor');
const CloudflareMonitor = require('./cloudflareMonitor');
const PerformanceMonitor = require('./performanceMonitor');
const SSLMonitor = require('./sslMonitor');
const CronMonitor = require('./cronMonitor');
const PluginMonitor = require('./pluginMonitor');
const DatabaseMonitor = require('./databaseMonitor');
const APIEndpointMonitor = require('./apiEndpointMonitor');
const NotificationService = require('./notificationService');
const logger = require('../utils/logger');

class MonitoringService {
  constructor(wss) {
    this.wss = wss;
    this.wpMonitor = new WordPressMonitor();
    this.wcMonitor = new WooCommerceMonitor();
    this.doMonitor = new DigitalOceanMonitor();
    this.cfMonitor = new CloudflareMonitor();
    this.perfMonitor = new PerformanceMonitor();
    this.sslMonitor = new SSLMonitor();
    this.cronMonitor = new CronMonitor();
    this.pluginMonitor = new PluginMonitor();
    this.dbMonitor = new DatabaseMonitor();
    this.apiMonitor = new APIEndpointMonitor();
    this.notificationService = new NotificationService();
    this.jobs = [];
    
    // Alert thresholds from environment (lowered for earlier detection)
    this.thresholds = {
      cpu: parseFloat(process.env.ALERT_CPU_THRESHOLD) || 70,           // Was 80
      memory: parseFloat(process.env.ALERT_MEMORY_THRESHOLD) || 75,     // Was 85
      disk: parseFloat(process.env.ALERT_DISK_THRESHOLD) || 80,         // Was 90
      responseTime: parseFloat(process.env.ALERT_RESPONSE_TIME_THRESHOLD) || 2000, // Was 3000
      errorRate: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD) || 3, // Was 5
      // New thresholds
      dbResponseTime: parseFloat(process.env.ALERT_DB_RESPONSE_TIME) || 100, // ms
      apiResponseTime: parseFloat(process.env.ALERT_API_RESPONSE_TIME) || 1500, // ms
      sslExpiryDays: parseFloat(process.env.ALERT_SSL_EXPIRY_DAYS) || 14, // days
      consecutiveFailures: parseInt(process.env.ALERT_CONSECUTIVE_FAILURES) || 3
    };
    
    // Track consecutive failures for smarter alerting
    this.failureCounters = {
      wordpress: 0,
      woocommerce: 0,
      digitalocean: 0,
      cloudflare: 0,
      database: 0
    };
  }

  start() {
    logger.info('Starting monitoring services...');

    // Health checks every 5 minutes
    const healthCheckJob = cron.schedule('*/5 * * * *', async () => {
      await this.runHealthChecks();
    });

    // Detailed metrics every 15 minutes
    const metricsJob = cron.schedule('*/15 * * * *', async () => {
      await this.collectDetailedMetrics();
    });

    // Performance monitoring every 30 minutes
    const perfCheckJob = cron.schedule('*/30 * * * *', async () => {
      await this.runPerformanceChecks();
    });

    // SSL monitoring daily at 3 AM
    const sslCheckJob = cron.schedule('0 3 * * *', async () => {
      await this.runSSLChecks();
    });

    // Cron monitoring every hour
    const cronCheckJob = cron.schedule('0 * * * *', async () => {
      await this.runCronChecks();
    });

    // Plugin monitoring daily at 4 AM
    const pluginCheckJob = cron.schedule('0 4 * * *', async () => {
      await this.runPluginChecks();
    });

    // Database monitoring every 5 minutes
    const dbCheckJob = cron.schedule('*/5 * * * *', async () => {
      await this.runDatabaseChecks();
    });

    // API endpoint monitoring every 10 minutes
    const apiCheckJob = cron.schedule('*/10 * * * *', async () => {
      await this.runAPIEndpointChecks();
    });

    // Cleanup old data daily at 2 AM
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldData();
    });

    this.jobs.push(healthCheckJob, metricsJob, perfCheckJob, sslCheckJob, cronCheckJob, pluginCheckJob, dbCheckJob, apiCheckJob, cleanupJob);

    // Run initial health check
    this.runHealthChecks();
    
    logger.info('Monitoring services started successfully');
  }

  stop() {
    logger.info('Stopping monitoring services...');
    this.jobs.forEach(job => job.stop());
    logger.info('Monitoring services stopped');
  }

  async runHealthChecks() {
    logger.info('Running health checks...');

    try {
      // WordPress health check
      const wpHealth = await this.wpMonitor.checkHealth();
      await this.saveMetric({
        type: 'wordpress',
        category: 'health',
        name: 'site_status',
        value: wpHealth.isUp ? 1 : 0,
        status: wpHealth.isUp ? 'normal' : 'critical',
        metadata: new Map(Object.entries(wpHealth))
      });

      if (!wpHealth.isUp) {
        await this.createAlert({
          title: 'WordPress Site Down',
          message: `WordPress site is not responding. Status code: ${wpHealth.statusCode || 'N/A'}`,
          severity: 'critical',
          source: 'wordpress',
          category: 'availability'
        });
      }

      // Response time check
      if (wpHealth.responseTime) {
        await this.saveMetric({
          type: 'wordpress',
          category: 'performance',
          name: 'response_time',
          value: wpHealth.responseTime,
          unit: 'ms',
          status: wpHealth.responseTime > this.thresholds.responseTime ? 'warning' : 'normal'
        });

        if (wpHealth.responseTime > this.thresholds.responseTime) {
          await this.createAlert({
            title: 'Slow Response Time',
            message: `WordPress response time is ${wpHealth.responseTime}ms (threshold: ${this.thresholds.responseTime}ms)`,
            severity: 'warning',
            source: 'wordpress',
            category: 'performance',
            metricValue: wpHealth.responseTime,
            threshold: this.thresholds.responseTime
          });
        }
      }

      // WooCommerce health check
      const wcHealth = await this.wcMonitor.checkHealth();
      if (wcHealth) {
        await this.saveMetric({
          type: 'woocommerce',
          category: 'health',
          name: 'api_status',
          value: wcHealth.isHealthy ? 1 : 0,
          status: wcHealth.isHealthy ? 'normal' : 'critical',
          metadata: new Map(Object.entries(wcHealth))
        });
      }

      // DigitalOcean health check
      const doHealth = await this.doMonitor.checkDropletHealth();
      if (doHealth) {
        await this.saveMetric({
          type: 'digitalocean',
          category: 'health',
          name: 'droplet_status',
          value: doHealth.isHealthy ? 1 : 0,
          status: doHealth.isHealthy ? 'normal' : 'critical',
          metadata: new Map(Object.entries(doHealth))
        });

        if (!doHealth.isHealthy) {
          await this.createAlert({
            title: 'DigitalOcean Droplet Issue',
            message: `Droplet status: ${doHealth.status}`,
            severity: 'critical',
            source: 'digitalocean',
            category: 'infrastructure'
          });
        }
      }

      // Cloudflare health check
      const cfHealth = await this.cfMonitor.checkHealth();
      if (cfHealth) {
        await this.saveMetric({
          type: 'cloudflare',
          category: 'health',
          name: 'zone_status',
          value: cfHealth.isHealthy ? 1 : 0,
          status: cfHealth.isHealthy ? 'normal' : 'critical',
          metadata: new Map(Object.entries(cfHealth))
        });
      }

      // Broadcast health update via WebSocket
      this.broadcast({
        type: 'health_check',
        data: {
          wordpress: wpHealth,
          woocommerce: wcHealth,
          digitalocean: doHealth,
          cloudflare: cfHealth
        },
        timestamp: new Date()
      });

      logger.info('Health checks completed');
    } catch (error) {
      logger.error('Health check error:', error);
    }
  }

  async collectDetailedMetrics() {
    logger.info('Collecting detailed metrics...');

    try {
      // DigitalOcean metrics
      const doMetrics = await this.doMonitor.getDropletMetrics('1h');
      if (doMetrics) {
        // CPU
        if (doMetrics.cpu) {
          await this.saveMetric({
            type: 'digitalocean',
            category: 'performance',
            name: 'cpu_usage',
            value: doMetrics.cpu.current,
            unit: '%',
            status: doMetrics.cpu.current > this.thresholds.cpu ? 'warning' : 'normal'
          });

          if (doMetrics.cpu.current > this.thresholds.cpu) {
            await this.createAlert({
              title: 'High CPU Usage',
              message: `CPU usage is ${doMetrics.cpu.current.toFixed(2)}% (threshold: ${this.thresholds.cpu}%)`,
              severity: doMetrics.cpu.current > 95 ? 'critical' : 'warning',
              source: 'digitalocean',
              category: 'performance',
              metricValue: doMetrics.cpu.current,
              threshold: this.thresholds.cpu
            });
          }
        }

        // Memory
        if (doMetrics.memory) {
          await this.saveMetric({
            type: 'digitalocean',
            category: 'performance',
            name: 'memory_usage',
            value: doMetrics.memory.current,
            unit: '%',
            status: doMetrics.memory.current > this.thresholds.memory ? 'warning' : 'normal'
          });

          if (doMetrics.memory.current > this.thresholds.memory) {
            await this.createAlert({
              title: 'High Memory Usage',
              message: `Memory usage is ${doMetrics.memory.current.toFixed(2)}% (threshold: ${this.thresholds.memory}%)`,
              severity: doMetrics.memory.current > 95 ? 'critical' : 'warning',
              source: 'digitalocean',
              category: 'performance',
              metricValue: doMetrics.memory.current,
              threshold: this.thresholds.memory
            });
          }
        }
      }

      // WooCommerce metrics
      const wcOrders = await this.wcMonitor.getOrderStats('24h');
      if (wcOrders) {
        await this.saveMetric({
          type: 'woocommerce',
          category: 'sales',
          name: 'daily_orders',
          value: wcOrders.totalOrders,
          unit: 'orders'
        });

        await this.saveMetric({
          type: 'woocommerce',
          category: 'sales',
          name: 'daily_revenue',
          value: wcOrders.totalRevenue,
          unit: 'currency'
        });
      }

      const wcProducts = await this.wcMonitor.getProductStats();
      if (wcProducts) {
        await this.saveMetric({
          type: 'woocommerce',
          category: 'inventory',
          name: 'out_of_stock',
          value: wcProducts.outOfStock,
          status: wcProducts.outOfStock > 0 ? 'warning' : 'normal'
        });

        if (wcProducts.outOfStock > 5) {
          await this.createAlert({
            title: 'Multiple Products Out of Stock',
            message: `${wcProducts.outOfStock} products are out of stock`,
            severity: 'warning',
            source: 'woocommerce',
            category: 'inventory',
            metricValue: wcProducts.outOfStock
          });
        }
      }

      // Cloudflare analytics
      const cfAnalytics = await this.cfMonitor.getZoneAnalytics('24h');
      if (cfAnalytics) {
        await this.saveMetric({
          type: 'cloudflare',
          category: 'traffic',
          name: 'requests',
          value: cfAnalytics.requests.all,
          unit: 'requests'
        });

        await this.saveMetric({
          type: 'cloudflare',
          category: 'performance',
          name: 'cache_hit_ratio',
          value: cfAnalytics.requests.cachHitRatio,
          unit: '%'
        });

        await this.saveMetric({
          type: 'cloudflare',
          category: 'security',
          name: 'threats_blocked',
          value: cfAnalytics.threats,
          unit: 'threats'
        });
      }

      // Broadcast metrics update
      this.broadcast({
        type: 'metrics_update',
        timestamp: new Date()
      });

      logger.info('Detailed metrics collection completed');
    } catch (error) {
      logger.error('Metrics collection error:', error);
    }
  }

  async saveMetric(metricData) {
    try {
      const metric = new Metric(metricData);
      await metric.save();
      return metric;
    } catch (error) {
      logger.error('Failed to save metric:', error);
    }
  }

  async createAlert(alertData) {
    try {
      // Check if similar alert already exists and is active
      const existingAlert = await Alert.findOne({
        title: alertData.title,
        source: alertData.source,
        status: 'active',
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Within last hour
      });

      if (existingAlert) {
        logger.debug(`Alert "${alertData.title}" already exists, skipping`);
        return existingAlert;
      }

      const alert = new Alert(alertData);
      await alert.save();

      // Send notifications
      await this.notificationService.sendAlert(alert);
      
      // Mark as notification sent
      alert.notificationSent = true;
      alert.notificationChannels = this.notificationService.getActiveChannels();
      await alert.save();

      // Broadcast alert via WebSocket
      this.broadcast({
        type: 'new_alert',
        data: alert,
        timestamp: new Date()
      });

      logger.info(`Alert created: ${alertData.title}`);
      return alert;
    } catch (error) {
      logger.error('Failed to create alert:', error);
    }
  }

  async runPerformanceChecks() {
    try {
      logger.info('Running performance checks...');
      await this.perfMonitor.runChecks();
      this.broadcast({ type: 'performance_check_complete', timestamp: new Date() });
    } catch (error) {
      logger.error('Performance checks failed:', error);
    }
  }

  async runSSLChecks() {
    try {
      logger.info('Running SSL certificate checks...');
      await this.sslMonitor.runChecks();
      this.broadcast({ type: 'ssl_check_complete', timestamp: new Date() });
    } catch (error) {
      logger.error('SSL checks failed:', error);
    }
  }

  async runCronChecks() {
    try {
      logger.info('Running WordPress cron checks...');
      await this.cronMonitor.runChecks();
      this.broadcast({ type: 'cron_check_complete', timestamp: new Date() });
    } catch (error) {
      logger.error('Cron checks failed:', error);
    }
  }

  async runPluginChecks() {
    try {
      logger.info('Running WordPress plugin checks...');
      await this.pluginMonitor.runChecks();
      this.broadcast({ type: 'plugin_check_complete', timestamp: new Date() });
    } catch (error) {
      logger.error('Plugin checks failed:', error);
    }
  }

  async runDatabaseChecks() {
    try {
      logger.info('Running database health checks...');
      const dbHealth = await this.dbMonitor.checkHealth();
      
      // Save database metrics
      await this.saveMetric({
        type: 'database',
        category: 'health',
        name: 'is_healthy',
        value: dbHealth.isHealthy ? 1 : 0,
        status: dbHealth.isHealthy ? 'normal' : 'critical'
      });

      await this.saveMetric({
        type: 'database',
        category: 'performance',
        name: 'response_time',
        value: dbHealth.responseTime,
        unit: 'ms',
        status: dbHealth.responseTime < this.thresholds.dbResponseTime ? 'normal' : 
                dbHealth.responseTime < this.thresholds.dbResponseTime * 2 ? 'warning' : 'critical'
      });

      // Alert on database issues
      if (!dbHealth.isHealthy) {
        this.failureCounters.database++;
        
        if (this.failureCounters.database >= this.thresholds.consecutiveFailures) {
          await this.createAlert({
            title: 'Database Connection Failed',
            message: `MongoDB connection is unhealthy. State: ${dbHealth.state}. Error: ${dbHealth.error || 'Unknown'}`,
            severity: 'critical',
            source: 'database',
            category: 'availability'
          });
        }
      } else {
        this.failureCounters.database = 0;
        
        // Alert on slow database response
        if (dbHealth.responseTime > this.thresholds.dbResponseTime * 2) {
          await this.createAlert({
            title: 'Database Response Slow',
            message: `MongoDB response time is ${dbHealth.responseTime}ms (threshold: ${this.thresholds.dbResponseTime}ms)`,
            severity: 'warning',
            source: 'database',
            category: 'performance',
            metricValue: dbHealth.responseTime,
            threshold: this.thresholds.dbResponseTime
          });
        }
      }

      // Get and store database stats periodically
      const stats = await this.dbMonitor.getStats();
      if (stats) {
        await this.saveMetric({
          type: 'database',
          category: 'storage',
          name: 'data_size_mb',
          value: parseFloat(stats.dataSizeMB),
          unit: 'MB'
        });

        await this.saveMetric({
          type: 'database',
          category: 'storage',
          name: 'collections_count',
          value: stats.collections
        });

        await this.saveMetric({
          type: 'database',
          category: 'storage',
          name: 'documents_count',
          value: stats.objects
        });
      }

      this.broadcast({ 
        type: 'database_check_complete', 
        data: dbHealth,
        timestamp: new Date() 
      });
    } catch (error) {
      logger.error('Database checks failed:', error);
    }
  }

  async runAPIEndpointChecks() {
    try {
      logger.info('Running API endpoint checks...');
      const results = await this.apiMonitor.checkAllEndpoints();
      
      // Save metrics for each endpoint
      for (const endpoint of results.endpoints) {
        await this.saveMetric({
          type: 'api',
          category: endpoint.category,
          name: `${endpoint.name.toLowerCase().replace(/\s+/g, '_')}_status`,
          value: endpoint.isHealthy ? 1 : 0,
          status: endpoint.isHealthy ? 'normal' : 'critical'
        });

        await this.saveMetric({
          type: 'api',
          category: endpoint.category,
          name: `${endpoint.name.toLowerCase().replace(/\s+/g, '_')}_response_time`,
          value: endpoint.responseTime,
          unit: 'ms',
          status: endpoint.responseTime < this.thresholds.apiResponseTime ? 'normal' : 'warning'
        });

        // Alert on endpoint failures
        if (!endpoint.isHealthy) {
          await this.createAlert({
            title: `API Endpoint Down: ${endpoint.name}`,
            message: `Endpoint ${endpoint.url} returned ${endpoint.statusCode || 'error'} (expected: ${endpoint.expectedStatus}). ${endpoint.error || ''}`,
            severity: endpoint.category === 'frontend' || endpoint.category === 'api' ? 'critical' : 'warning',
            source: endpoint.category,
            category: 'availability',
            metricValue: endpoint.statusCode,
            threshold: endpoint.expectedStatus
          });
        }

        // Alert on slow endpoints
        if (endpoint.isHealthy && endpoint.responseTime > this.thresholds.apiResponseTime) {
          await this.createAlert({
            title: `Slow API Response: ${endpoint.name}`,
            message: `Endpoint ${endpoint.url} responded in ${endpoint.responseTime}ms (threshold: ${this.thresholds.apiResponseTime}ms)`,
            severity: 'warning',
            source: endpoint.category,
            category: 'performance',
            metricValue: endpoint.responseTime,
            threshold: this.thresholds.apiResponseTime
          });
        }
      }

      // Save summary metrics
      await this.saveMetric({
        type: 'api',
        category: 'summary',
        name: 'endpoints_healthy',
        value: results.summary.healthy
      });

      await this.saveMetric({
        type: 'api',
        category: 'summary',
        name: 'avg_response_time',
        value: results.summary.avgResponseTime,
        unit: 'ms'
      });

      this.broadcast({ 
        type: 'api_check_complete', 
        data: results.summary,
        timestamp: new Date() 
      });
    } catch (error) {
      logger.error('API endpoint checks failed:', error);
    }
  }

  async cleanupOldData() {
    try {
      const daysToKeep = parseInt(process.env.CLEANUP_OLD_DATA_DAYS) || 30;
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      // Cleanup old metrics (except critical ones)
      const metricsDeleted = await Metric.deleteMany({
        timestamp: { $lt: cutoffDate },
        status: { $ne: 'critical' }
      });

      // Cleanup resolved alerts
      const alertsDeleted = await Alert.deleteMany({
        status: 'resolved',
        resolvedAt: { $lt: cutoffDate }
      });

      logger.info(`Cleanup completed: ${metricsDeleted.deletedCount} metrics, ${alertsDeleted.deletedCount} alerts deleted`);
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  }

  broadcast(message) {
    if (!this.wss) return;

    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }
}

module.exports = MonitoringService;
