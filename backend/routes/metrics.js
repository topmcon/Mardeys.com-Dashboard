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

module.exports = router;
