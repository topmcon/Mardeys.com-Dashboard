const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['wordpress', 'woocommerce', 'digitalocean', 'cloudflare', 'database', 'system']
  },
  category: String,
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active'
  },
  metricValue: mongoose.Schema.Types.Mixed,
  threshold: mongoose.Schema.Types.Mixed,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationChannels: [{
    type: String,
    enum: ['email', 'slack', 'webhook']
  }],
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient querying
alertSchema.index({ status: 1, severity: 1, createdAt: -1 });
alertSchema.index({ source: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
