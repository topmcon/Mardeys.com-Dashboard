const express = require('express');
const router = express.Router();
// Auth removed for demo mode - services are read-only monitoring data
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
router.get('/wordpress', async (req, res) => {
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
router.get('/woocommerce', async (req, res) => {
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
        isUp: health.isHealthy,
        productsAvailable: health.productsAvailable,
        responseTime: health.responseTime || null
      },
      orders: {
        totalOrders: orderStats?.totalOrders || 0,
        totalRevenue: orderStats?.totalRevenue || 0,
        averageOrderValue: orderStats?.averageOrderValue || 0,
        byStatus: orderStats?.statusBreakdown || {},
        period: orderStats?.period || '24h'
      },
      products: {
        total: productStats?.total || 0,
        lowStock: productStats?.lowStock || 0,
        outOfStock: productStats?.outOfStock || 0,
        byType: productStats?.byType || {},
        byStatus: {
          publish: productStats?.total || 0,
          draft: 0,
          private: 0
        }
      },
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
router.get('/digitalocean', async (req, res) => {
  try {
    const [dropletInfo, health, metrics, account] = await Promise.all([
      doMonitor.getDropletInfo(),
      doMonitor.checkDropletHealth(),
      doMonitor.getDropletMetrics('1h').catch(() => null),
      doMonitor.getAccountInfo().catch(() => null)
    ]);

    res.json({
      service: 'digitalocean',
      name: dropletInfo?.name || 'Unknown',
      region: dropletInfo?.region || 'Unknown',
      image: dropletInfo?.image || 'Unknown',
      health: {
        isHealthy: health.isHealthy,
        status: health.status
      },
      specs: {
        vcpus: dropletInfo?.vcpus || 0,
        memory: dropletInfo?.memory || 0,
        disk: dropletInfo?.disk || 0,
        priceMonthly: dropletInfo?.priceMonthly || 0
      },
      network: {
        publicIp: dropletInfo?.ipAddress || null,
        privateIp: dropletInfo?.privateIp || null,
        gateway: dropletInfo?.gateway || null,
        vpc: !!dropletInfo?.vpcUuid
      },
      metrics: {
        cpu: metrics?.cpu?.current || 0,
        memory: metrics?.memory?.current || 0,
        disk: metrics?.disk?.current || 0,
        bandwidth: metrics?.bandwidth?.current || 0
      },
      uptime: {
        hours: dropletInfo?.uptimeHours || null,
        since: dropletInfo?.created || null
      },
      features: dropletInfo?.features || [],
      tags: dropletInfo?.tags || [],
      account: account,
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
router.get('/cloudflare', async (req, res) => {
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
