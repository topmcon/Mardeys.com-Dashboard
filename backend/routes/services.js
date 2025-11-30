const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Import monitors
const WordPressMonitor = require('../services/wordpressMonitor');
const WooCommerceMonitor = require('../services/woocommerceMonitor');
const DigitalOceanMonitor = require('../services/digitaloceanMonitor');
const CloudflareMonitor = require('../services/cloudflareMonitor');

// Initialize monitors
const wpMonitor = new WordPressMonitor();
const wcMonitor = new WooCommerceMonitor();
const doMonitor = new DigitalOceanMonitor();
const cfMonitor = new CloudflareMonitor();

// ============== WORDPRESS ==============
router.get('/wordpress', auth, async (req, res) => {
  try {
    const [health, pluginStatus] = await Promise.all([
      wpMonitor.checkHealth(),
      wpMonitor.getPluginStatus().catch(() => null)
    ]);

    res.json({
      service: 'wordpress',
      url: process.env.WORDPRESS_URL,
      health: {
        isUp: health.isUp,
        responseTime: health.responseTime,
        statusCode: health.statusCode,
        apiHealthy: health.apiHealthy
      },
      plugins: pluginStatus,
      lastChecked: new Date()
    });
  } catch (error) {
    logger.error('WordPress service data error:', error);
    res.json({
      service: 'wordpress',
      url: process.env.WORDPRESS_URL,
      health: { isUp: false, error: error.message },
      lastChecked: new Date()
    });
  }
});

// ============== WOOCOMMERCE ==============
router.get('/woocommerce', auth, async (req, res) => {
  try {
    const [health, orderStats, productStats, customerStats, recentActivity] = await Promise.all([
      wcMonitor.checkHealth(),
      wcMonitor.getOrderStats('24h').catch(() => null),
      wcMonitor.getProductStats().catch(() => null),
      wcMonitor.getCustomerStats().catch(() => null),
      wcMonitor.getRecentActivity().catch(() => null)
    ]);

    res.json({
      service: 'woocommerce',
      url: process.env.WORDPRESS_URL,
      health: {
        isUp: health.isUp,
        responseTime: health.responseTime,
        productsAvailable: health.productsAvailable
      },
      orders: orderStats,
      products: productStats,
      customers: customerStats,
      recentOrders: recentActivity?.recentOrders || [],
      lastChecked: new Date()
    });
  } catch (error) {
    logger.error('WooCommerce service data error:', error);
    res.json({
      service: 'woocommerce',
      url: process.env.WORDPRESS_URL,
      health: { isUp: false, error: error.message },
      lastChecked: new Date()
    });
  }
});

// ============== DIGITALOCEAN ==============
router.get('/digitalocean', auth, async (req, res) => {
  try {
    const [dropletInfo, health, metrics, billing] = await Promise.all([
      doMonitor.getDropletInfo(),
      doMonitor.checkDropletHealth(),
      doMonitor.getDropletMetrics('1h').catch(() => null),
      doMonitor.getBillingInfo().catch(() => null)
    ]);

    res.json({
      service: 'digitalocean',
      droplet: dropletInfo,
      health: {
        isHealthy: health.isHealthy,
        status: health.status
      },
      metrics: {
        cpu: metrics?.cpu,
        memory: metrics?.memory,
        disk: metrics?.disk,
        bandwidth: metrics?.bandwidth
      },
      billing: billing,
      lastChecked: new Date()
    });
  } catch (error) {
    logger.error('DigitalOcean service data error:', error);
    res.json({
      service: 'digitalocean',
      health: { isHealthy: false, error: error.message },
      lastChecked: new Date()
    });
  }
});

// ============== CLOUDFLARE ==============
router.get('/cloudflare', auth, async (req, res) => {
  try {
    const [health, analytics, cacheStats, dnsRecords, securityEvents] = await Promise.all([
      cfMonitor.checkHealth(),
      cfMonitor.getZoneAnalytics('24h').catch(() => null),
      cfMonitor.getCacheStats().catch(() => null),
      cfMonitor.getDNSRecords().catch(() => null),
      cfMonitor.getSecurityEvents().catch(() => null)
    ]);

    res.json({
      service: 'cloudflare',
      zone: health.name,
      health: {
        isHealthy: health.isHealthy,
        status: health.status,
        nameServers: health.nameServers
      },
      analytics: {
        requests: analytics?.requests,
        bandwidth: analytics?.bandwidth,
        threats: analytics?.threats,
        pageViews: analytics?.pageViews,
        uniqueVisitors: analytics?.uniques
      },
      cache: cacheStats,
      dns: dnsRecords,
      security: securityEvents,
      lastChecked: new Date()
    });
  } catch (error) {
    logger.error('Cloudflare service data error:', error);
    res.json({
      service: 'cloudflare',
      health: { isHealthy: false, error: error.message },
      lastChecked: new Date()
    });
  }
});

module.exports = router;
