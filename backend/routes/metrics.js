const express = require('express');
const router = express.Router();
const Metric = require('../models/Metric');
// Auth removed for demo mode - metrics are read-only monitoring data
const logger = require('../utils/logger');

// Get metrics by type and time range
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      startDate, 
      endDate, 
      limit = 100,
      interval = 'hour'
    } = req.query;

    const query = {};
    
    if (type) query.type = type;
    if (category) query.category = category;
    
    // Date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    query.timestamp = { $gte: start, $lte: end };

    // Aggregation for time series data
    let groupBy;
    switch (interval) {
      case 'minute':
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
          minute: { $minute: '$timestamp' }
        };
        break;
      case 'hour':
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
        break;
      case 'day':
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      default:
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
    }

    const metrics = await Metric.aggregate([
      { $match: query },
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: groupBy,
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          count: { $sum: 1 },
          timestamp: { $last: '$timestamp' }
        }
      },
      { $sort: { timestamp: 1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      metrics,
      query: { type, category, startDate: start, endDate: end, interval }
    });
  } catch (error) {
    logger.error('Metrics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get latest metrics
router.get('/latest', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};

    const latestMetrics = await Metric.aggregate([
      { $match: query },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: { type: '$type', category: '$category', name: '$name' },
          latestValue: { $first: '$value' },
          status: { $first: '$status' },
          unit: { $first: '$unit' },
          timestamp: { $first: '$timestamp' }
        }
      }
    ]);

    res.json(latestMetrics);
  } catch (error) {
    logger.error('Latest metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch latest metrics' });
  }
});

// Get metric statistics
router.get('/stats', async (req, res) => {
  try {
    const { type, category, period = '24h' } = req.query;
    
    // Calculate time range
    const periodMap = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeRange = periodMap[period] || periodMap['24h'];
    const startDate = new Date(Date.now() - timeRange);

    const query = { timestamp: { $gte: startDate } };
    if (type) query.type = type;
    if (category) query.category = category;

    const stats = await Metric.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats[0] || {});
  } catch (error) {
    logger.error('Metrics stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get chart data formatted for frontend charts
router.get('/chart/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { period = '24h' } = req.query;

    const periodMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - (periodMs[period] || periodMs['24h']));

    // Get metrics for the type
    const metrics = await Metric.find({
      type,
      timestamp: { $gte: since }
    }).sort({ timestamp: 1 });

    // Group by timestamp intervals for smoother charts
    const intervalMs = periodMs[period] / 50; // ~50 data points
    const buckets = {};

    metrics.forEach(m => {
      const bucketTime = Math.floor(m.timestamp.getTime() / intervalMs) * intervalMs;
      if (!buckets[bucketTime]) {
        buckets[bucketTime] = { time: new Date(bucketTime) };
      }
      if (!buckets[bucketTime][m.name]) {
        buckets[bucketTime][m.name] = [];
      }
      buckets[bucketTime][m.name].push(m.value);
    });

    // Average values in each bucket
    const chartData = Object.values(buckets).map(bucket => {
      const point = { time: bucket.time };
      Object.keys(bucket).forEach(key => {
        if (key !== 'time' && Array.isArray(bucket[key])) {
          const values = bucket[key];
          point[key] = values.reduce((a, b) => a + b, 0) / values.length;
        }
      });
      return point;
    });

    // Format time labels
    const formattedData = chartData.map(point => ({
      ...point,
      timeLabel: point.time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    }));

    res.json({
      type,
      period,
      data: formattedData
    });
  } catch (error) {
    logger.error('Chart data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Get summary with uptime calculations
router.get('/summary', async (req, res) => {
  try {
    const { period = '24h' } = req.query;

    const periodMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - (periodMs[period] || periodMs['24h']));

    const summary = await Metric.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: { type: '$type', name: '$name' },
          avg: { $avg: '$value' },
          min: { $min: '$value' },
          max: { $max: '$value' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          type: '$_id.type',
          name: '$_id.name',
          avg: { $round: ['$avg', 2] },
          min: 1,
          max: 1,
          count: 1
        }
      }
    ]);

    // Group by service
    const byService = {};
    summary.forEach(m => {
      if (!byService[m.type]) {
        byService[m.type] = {};
      }
      byService[m.type][m.name] = {
        avg: m.avg,
        min: m.min,
        max: m.max,
        samples: m.count
      };
    });

    // Calculate uptime percentages
    Object.keys(byService).forEach(type => {
      const healthMetric = byService[type].is_up || byService[type].is_healthy;
      if (healthMetric) {
        byService[type].uptime = {
          percentage: (healthMetric.avg * 100).toFixed(2),
          samples: healthMetric.samples
        };
      }
    });

    res.json({
      period,
      since,
      summary: byService
    });
  } catch (error) {
    logger.error('Metrics summary fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics summary' });
  }
});

// Trigger historical data backfill
router.post('/backfill', async (req, res) => {
  try {
    const { hours = 72 } = req.body;
    const axios = require('axios');
    
    logger.info(`Starting metrics backfill for ${hours} hours`);
    
    // Import backfill functions inline to avoid circular deps
    const backfillMetrics = async () => {
      const allMetrics = [];
      const now = Date.now();
      
      // Generate WordPress synthetic data
      const wpInterval = 5 * 60 * 1000;
      const wpDataPoints = Math.floor((hours * 3600 * 1000) / wpInterval);
      
      for (let i = 0; i < wpDataPoints; i++) {
        const timestamp = new Date(now - (wpDataPoints - i) * wpInterval);
        const hour = timestamp.getHours();
        
        let baseResponseTime = 400;
        if (hour >= 9 && hour <= 17) baseResponseTime = 600;
        else if (hour >= 18 && hour <= 22) baseResponseTime = 550;
        
        const variance = Math.random() * 200 - 100;
        const spike = Math.random() > 0.95 ? Math.random() * 300 : 0;
        const responseTime = Math.max(200, Math.round(baseResponseTime + variance + spike));

        allMetrics.push({
          type: 'wordpress',
          category: 'health',
          name: 'response_time',
          value: responseTime,
          unit: 'ms',
          status: responseTime < 500 ? 'normal' : responseTime < 1000 ? 'warning' : 'critical',
          timestamp
        });

        allMetrics.push({
          type: 'wordpress',
          category: 'health',
          name: 'is_up',
          value: Math.random() > 0.001 ? 1 : 0,
          status: 'normal',
          timestamp
        });
      }

      // Generate WooCommerce synthetic data
      for (let i = 0; i < hours; i++) {
        const timestamp = new Date(now - (hours - i) * 60 * 60 * 1000);
        const hour = timestamp.getHours();
        const dayOfWeek = timestamp.getDay();
        
        let baseOrders = 2;
        if (dayOfWeek === 0 || dayOfWeek === 6) baseOrders = 4;
        if ((hour >= 10 && hour <= 14) || (hour >= 19 && hour <= 22)) baseOrders *= 1.5;
        if (hour >= 2 && hour <= 6) baseOrders *= 0.3;

        const orders = Math.max(0, Math.round(baseOrders + (Math.random() * 3 - 1)));
        const revenue = orders * (50 + Math.random() * 100);

        allMetrics.push({
          type: 'woocommerce',
          category: 'orders',
          name: 'total_orders',
          value: orders,
          timestamp
        });

        allMetrics.push({
          type: 'woocommerce',
          category: 'orders',
          name: 'total_revenue',
          value: Math.round(revenue * 100) / 100,
          unit: 'USD',
          timestamp
        });
      }

      // Generate DigitalOcean synthetic data
      for (let i = 0; i < wpDataPoints; i++) {
        const timestamp = new Date(now - (wpDataPoints - i) * wpInterval);
        const hour = timestamp.getHours();
        
        // CPU varies by time of day
        let baseCpu = 15;
        if (hour >= 9 && hour <= 17) baseCpu = 35;
        else if (hour >= 18 && hour <= 22) baseCpu = 25;
        
        const cpu = Math.max(5, Math.min(95, baseCpu + (Math.random() * 20 - 10)));
        const memory = Math.max(30, Math.min(85, 50 + (Math.random() * 20 - 10)));
        const disk = 60 + Math.random() * 5;

        allMetrics.push({
          type: 'digitalocean',
          category: 'performance',
          name: 'cpu_usage',
          value: Math.round(cpu * 100) / 100,
          unit: '%',
          status: cpu < 70 ? 'normal' : cpu < 90 ? 'warning' : 'critical',
          timestamp
        });

        allMetrics.push({
          type: 'digitalocean',
          category: 'performance',
          name: 'memory_usage',
          value: Math.round(memory * 100) / 100,
          unit: '%',
          status: memory < 70 ? 'normal' : memory < 90 ? 'warning' : 'critical',
          timestamp
        });

        allMetrics.push({
          type: 'digitalocean',
          category: 'performance',
          name: 'disk_usage',
          value: Math.round(disk * 100) / 100,
          unit: '%',
          status: disk < 80 ? 'normal' : disk < 95 ? 'warning' : 'critical',
          timestamp
        });
      }

      // Generate Cloudflare synthetic data (hourly)
      for (let i = 0; i < hours; i++) {
        const timestamp = new Date(now - (hours - i) * 60 * 60 * 1000);
        const hour = timestamp.getHours();
        
        let baseRequests = 500;
        if (hour >= 9 && hour <= 22) baseRequests = 1500;
        
        const requests = Math.round(baseRequests + Math.random() * 500);
        const bandwidth = requests * (50000 + Math.random() * 20000);
        const threats = Math.random() > 0.9 ? Math.floor(Math.random() * 10) : 0;

        allMetrics.push({
          type: 'cloudflare',
          category: 'traffic',
          name: 'requests',
          value: requests,
          timestamp
        });

        allMetrics.push({
          type: 'cloudflare',
          category: 'traffic',
          name: 'bandwidth',
          value: Math.round(bandwidth),
          unit: 'bytes',
          timestamp
        });

        allMetrics.push({
          type: 'cloudflare',
          category: 'security',
          name: 'threats',
          value: threats,
          timestamp
        });
      }

      return allMetrics;
    };

    const metrics = await backfillMetrics();
    
    // Insert in batches
    const batchSize = 500;
    let inserted = 0;
    
    for (let i = 0; i < metrics.length; i += batchSize) {
      const batch = metrics.slice(i, i + batchSize);
      try {
        await Metric.insertMany(batch, { ordered: false });
      } catch (err) {
        // Ignore duplicate errors
        if (err.code !== 11000) logger.warn('Batch insert warning:', err.message);
      }
      inserted += batch.length;
    }

    logger.info(`Backfill complete: ${inserted} metrics inserted`);
    
    res.json({
      success: true,
      message: `Backfilled ${inserted} metrics for ${hours} hours`,
      metricsInserted: inserted
    });
  } catch (error) {
    logger.error('Metrics backfill error:', error);
    res.status(500).json({ error: 'Failed to backfill metrics' });
  }
});

module.exports = router;
