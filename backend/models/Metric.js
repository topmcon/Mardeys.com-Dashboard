const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['wordpress', 'woocommerce', 'digitalocean', 'cloudflare', 'database', 'custom']
  },
  category: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  unit: String,
  status: {
    type: String,
    enum: ['normal', 'warning', 'critical'],
    default: 'normal'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient querying
metricSchema.index({ type: 1, category: 1, timestamp: -1 });
metricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

module.exports = mongoose.model('Metric', metricSchema);
