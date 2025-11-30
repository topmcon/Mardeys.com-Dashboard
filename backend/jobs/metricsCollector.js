const Metric = require('../models/Metric');
const logger = require('../utils/logger');

// Import monitors
const WordPressMonitor = require('../services/wordpressMonitor');
const WooCommerceMonitor = require('../services/woocommerceMonitor');
const DigitalOceanMonitor = require('../services/digitaloceanMonitor');
const CloudflareMonitor = require('../services/cloudflareMonitor');

const wpMonitor = new WordPressMonitor();
const wcMonitor = new WooCommerceMonitor();
const doMonitor = new DigitalOceanMonitor();
const cfMonitor = new CloudflareMonitor();

class MetricsCollector {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  async collectWordPressMetrics() {
    try {
      const health = await wpMonitor.checkHealth();
      
      const metrics = [
        {
          type: 'wordpress',
          category: 'health',
          name: 'response_time',
          value: health.responseTime || 0,
          unit: 'ms',
          status: health.responseTime < 500 ? 'normal' : health.responseTime < 1000 ? 'warning' : 'critical'
        },
        {
          type: 'wordpress',
          category: 'health',
          name: 'is_up',
          value: health.isUp ? 1 : 0,
          status: health.isUp ? 'normal' : 'critical'
        },
        {
          type: 'wordpress',
          category: 'health',
          name: 'status_code',
          value: health.statusCode || 0
        }
      ];

      await Metric.insertMany(metrics);
      logger.info(`Collected ${metrics.length} WordPress metrics`);
      return metrics;
    } catch (error) {
      logger.error('WordPress metrics collection failed:', error.message);
      return [];
    }
  }

  async collectWooCommerceMetrics() {
    try {
      const [health, orderStats] = await Promise.all([
        wcMonitor.checkHealth(),
        wcMonitor.getOrderStats('24h').catch(() => null)
      ]);
      
      const metrics = [
        {
          type: 'woocommerce',
          category: 'health',
          name: 'is_up',
          value: health.isHealthy ? 1 : 0,
          status: health.isHealthy ? 'normal' : 'critical'
        }
      ];

      if (orderStats) {
        metrics.push(
          {
            type: 'woocommerce',
            category: 'orders',
            name: 'total_orders',
            value: orderStats.totalOrders || 0
          },
          {
            type: 'woocommerce',
            category: 'orders',
            name: 'total_revenue',
            value: orderStats.totalRevenue || 0,
            unit: 'USD'
          },
          {
            type: 'woocommerce',
            category: 'orders',
            name: 'average_order_value',
            value: orderStats.averageOrderValue || 0,
            unit: 'USD'
          }
        );
      }

      await Metric.insertMany(metrics);
      logger.info(`Collected ${metrics.length} WooCommerce metrics`);
      return metrics;
    } catch (error) {
      logger.error('WooCommerce metrics collection failed:', error.message);
      return [];
    }
  }

  async collectDigitalOceanMetrics() {
    try {
      const [health, metrics] = await Promise.all([
        doMonitor.checkDropletHealth(),
        doMonitor.getDropletMetrics('1h').catch(() => null)
      ]);
      
      const metricsData = [
        {
          type: 'digitalocean',
          category: 'health',
          name: 'is_healthy',
          value: health.isHealthy ? 1 : 0,
          status: health.isHealthy ? 'normal' : 'critical'
        }
      ];

      if (metrics) {
        if (metrics.cpu?.current !== undefined) {
          metricsData.push({
            type: 'digitalocean',
            category: 'performance',
            name: 'cpu_usage',
            value: metrics.cpu.current,
            unit: '%',
            status: metrics.cpu.current < 70 ? 'normal' : metrics.cpu.current < 90 ? 'warning' : 'critical'
          });
        }
        if (metrics.memory?.current !== undefined) {
          metricsData.push({
            type: 'digitalocean',
            category: 'performance',
            name: 'memory_usage',
            value: metrics.memory.current,
            unit: '%',
            status: metrics.memory.current < 70 ? 'normal' : metrics.memory.current < 90 ? 'warning' : 'critical'
          });
        }
        if (metrics.disk?.current !== undefined) {
          metricsData.push({
            type: 'digitalocean',
            category: 'performance',
            name: 'disk_usage',
            value: metrics.disk.current,
            unit: '%',
            status: metrics.disk.current < 80 ? 'normal' : metrics.disk.current < 95 ? 'warning' : 'critical'
          });
        }
      }

      await Metric.insertMany(metricsData);
      logger.info(`Collected ${metricsData.length} DigitalOcean metrics`);
      return metricsData;
    } catch (error) {
      logger.error('DigitalOcean metrics collection failed:', error.message);
      return [];
    }
  }

  async collectCloudflareMetrics() {
    try {
      const [health, analytics] = await Promise.all([
        cfMonitor.checkHealth(),
        cfMonitor.getZoneAnalytics('24h').catch(() => null)
      ]);
      
      const metrics = [
        {
          type: 'cloudflare',
          category: 'health',
          name: 'is_healthy',
          value: health.isHealthy ? 1 : 0,
          status: health.isHealthy ? 'normal' : 'critical'
        }
      ];

      if (analytics) {
        metrics.push(
          {
            type: 'cloudflare',
            category: 'traffic',
            name: 'requests',
            value: analytics.requests || 0
          },
          {
            type: 'cloudflare',
            category: 'traffic',
            name: 'bandwidth',
            value: analytics.bandwidth || 0,
            unit: 'bytes'
          },
          {
            type: 'cloudflare',
            category: 'security',
            name: 'threats',
            value: analytics.threats || 0
          },
          {
            type: 'cloudflare',
            category: 'traffic',
            name: 'page_views',
            value: analytics.pageViews || 0
          }
        );
      }

      await Metric.insertMany(metrics);
      logger.info(`Collected ${metrics.length} Cloudflare metrics`);
      return metrics;
    } catch (error) {
      logger.error('Cloudflare metrics collection failed:', error.message);
      return [];
    }
  }

  async collectAll() {
    if (this.isRunning) {
      logger.warn('Metrics collection already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting metrics collection...');
      
      const results = await Promise.allSettled([
        this.collectWordPressMetrics(),
        this.collectWooCommerceMetrics(),
        this.collectDigitalOceanMetrics(),
        this.collectCloudflareMetrics()
      ]);

      const totalMetrics = results.reduce((sum, r) => {
        return sum + (r.status === 'fulfilled' ? r.value.length : 0);
      }, 0);

      const duration = Date.now() - startTime;
      logger.info(`Metrics collection completed: ${totalMetrics} metrics in ${duration}ms`);
    } catch (error) {
      logger.error('Metrics collection error:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  start(intervalMs = 60000) {
    // Collect immediately
    this.collectAll();
    
    // Then collect at interval (default: every 1 minute)
    this.intervalId = setInterval(() => {
      this.collectAll();
    }, intervalMs);

    logger.info(`Metrics collector started with ${intervalMs / 1000}s interval`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Metrics collector stopped');
    }
  }
}

module.exports = new MetricsCollector();
