const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const notificationService = new NotificationService();

// Get alerts with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { 
      status, 
      severity, 
      source, 
      limit = 50, 
      page = 1 
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (source) query.source = source;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments(query)
    ]);

    res.json({
      alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    logger.error('Alert fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Acknowledge alert
router.patch('/:id/acknowledge', auth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedBy: req.user.username,
        acknowledgedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    logger.info(`Alert ${alert._id} acknowledged by ${req.user.username}`);
    res.json(alert);
  } catch (error) {
    logger.error('Alert acknowledge error:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Resolve alert
router.patch('/:id/resolve', auth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    logger.info(`Alert ${alert._id} resolved by ${req.user.username}`);
    res.json(alert);
  } catch (error) {
    logger.error('Alert resolve error:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Get alert statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    const periodMap = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeRange = periodMap[period] || periodMap['24h'];
    const startDate = new Date(Date.now() - timeRange);

    const stats = await Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const sourceStats = await Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      bySeverity: stats,
      bySource: sourceStats,
      period
    });
  } catch (error) {
    logger.error('Alert stats error:', error);
    res.status(500).json({ error: 'Failed to fetch alert statistics' });
  }
});

// Test notification channels
router.post('/test-notification', auth, async (req, res) => {
  try {
    const { channel, severity = 'info' } = req.body;
    
    const testAlert = {
      title: 'Test Notification',
      message: 'This is a test notification from your Mardeys Dashboard. If you received this, notifications are working correctly!',
      severity,
      source: 'system',
      category: 'test',
      createdAt: new Date()
    };

    let results;
    
    if (channel === 'all') {
      results = await notificationService.sendAlert(testAlert);
    } else {
      // Test specific channel
      switch (channel) {
        case 'email':
          results = [await notificationService.sendEmailAlert(testAlert)];
          break;
        case 'slack':
          results = [await notificationService.sendSlackAlert(testAlert)];
          break;
        case 'discord':
          results = [await notificationService.sendDiscordAlert(testAlert)];
          break;
        case 'webhook':
          results = [await notificationService.sendWebhookAlert(testAlert)];
          break;
        default:
          return res.status(400).json({ error: 'Invalid channel. Use: email, slack, discord, webhook, or all' });
      }
    }

    logger.info(`Test notification sent via ${channel}`);
    res.json({ 
      success: true, 
      channel,
      results,
      activeChannels: notificationService.getActiveChannels()
    });
  } catch (error) {
    logger.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification', details: error.message });
  }
});

// Get notification configuration status
router.get('/notification-config', auth, async (req, res) => {
  try {
    const channels = notificationService.getActiveChannels();
    
    res.json({
      configured: channels.length > 0,
      channels: {
        email: {
          enabled: channels.includes('email'),
          configured: !!process.env.EMAIL_HOST
        },
        slack: {
          enabled: channels.includes('slack'),
          configured: !!process.env.SLACK_WEBHOOK_URL
        },
        discord: {
          enabled: channels.includes('discord'),
          configured: !!process.env.DISCORD_WEBHOOK_URL
        },
        webhook: {
          enabled: channels.includes('webhook'),
          configured: !!process.env.CUSTOM_WEBHOOK_URL
        }
      },
      preferences: notificationService.preferences,
      rateLimitMinutes: notificationService.rateLimitMinutes
    });
  } catch (error) {
    logger.error('Notification config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notification config' });
  }
});

module.exports = router;
