const express = require('express');
const router = express.Router();
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Get dashboard overview
router.get('/overview', auth, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    // Get active alerts
    const activeAlerts = await Alert.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent metrics summary
    const recentMetrics = await Metric.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo } } },
      { 
        $group: {
          _id: { type: '$type', category: '$category' },
          latestValue: { $last: '$value' },
          latestStatus: { $last: '$status' },
          timestamp: { $last: '$timestamp' }
        }
      }
    ]);

    // Alert summary
    const alertSummary = await Alert.aggregate([
      { $match: { status: 'active' } },
      { 
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // System health score calculation
    const criticalAlerts = alertSummary.find(a => a._id === 'critical')?.count || 0;
    const errorAlerts = alertSummary.find(a => a._id === 'error')?.count || 0;
    const warningAlerts = alertSummary.find(a => a._id === 'warning')?.count || 0;
    
    let healthScore = 100;
    healthScore -= criticalAlerts * 20;
    healthScore -= errorAlerts * 10;
    healthScore -= warningAlerts * 5;
    healthScore = Math.max(0, healthScore);

    res.json({
      healthScore,
      activeAlerts: activeAlerts.length,
      alertSummary: {
        critical: criticalAlerts,
        error: errorAlerts,
        warning: warningAlerts
      },
      recentAlerts: activeAlerts,
      metrics: recentMetrics,
      timestamp: now
    });
  } catch (error) {
    logger.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get system status
router.get('/status', auth, async (req, res) => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

    // Get latest metrics for each service
    const services = ['wordpress', 'woocommerce', 'digitalocean', 'cloudflare'];
    const statusData = {};

    for (const service of services) {
      const latestMetric = await Metric.findOne({
        type: service,
        timestamp: { $gte: fiveMinutesAgo }
      }).sort({ timestamp: -1 });

      statusData[service] = {
        status: latestMetric ? latestMetric.status : 'unknown',
        lastChecked: latestMetric ? latestMetric.timestamp : null
      };
    }

    res.json(statusData);
  } catch (error) {
    logger.error('System status error:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

module.exports = router;
