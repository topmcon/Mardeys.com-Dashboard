const express = require('express');
const router = express.Router();
const Metric = require('../models/Metric');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Get metrics by type and time range
router.get('/', auth, async (req, res) => {
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
router.get('/latest', auth, async (req, res) => {
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
router.get('/stats', auth, async (req, res) => {
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

module.exports = router;
