const axios = require('axios');
const logger = require('../utils/logger');

class CloudflareMonitor {
  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID;
    this.email = process.env.CLOUDFLARE_EMAIL;
    this.baseUrl = 'https://api.cloudflare.com/client/v4';
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getZoneAnalytics(period = '24h') {
    try {
      const periodMap = {
        '1h': -60,
        '24h': -1440,
        '7d': -10080,
        '30d': -43200
      };

      const since = periodMap[period] || -1440;

      const response = await axios.get(
        `${this.baseUrl}/zones/${this.zoneId}/analytics/dashboard`,
        {
          headers: this.getAuthHeaders(),
          params: { since },
          timeout: 10000
        }
      );

      const data = response.data.result;
      const totals = data.totals;
      const timeseries = data.timeseries;

      return {
        requests: {
          all: totals.requests.all,
          cached: totals.requests.cached,
          uncached: totals.requests.uncached,
          cachHitRatio: totals.requests.cached / totals.requests.all * 100
        },
        bandwidth: {
          all: totals.bandwidth.all,
          cached: totals.bandwidth.cached,
          uncached: totals.bandwidth.uncached
        },
        threats: totals.threats.all,
        pageViews: totals.pageviews.all,
        uniques: totals.uniques.all,
        timeseries: timeseries.slice(-24), // Last 24 data points
        period
      };
    } catch (error) {
      logger.error('Cloudflare analytics fetch failed:', error.message);
      return null;
    }
  }

  async getSecurityEvents() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/zones/${this.zoneId}/security/events`,
        {
          headers: this.getAuthHeaders(),
          timeout: 10000
        }
      );

      const events = response.data.result;

      return {
        total: events.length,
        events: events.slice(0, 10).map(event => ({
          action: event.action,
          source: event.source,
          country: event.country,
          timestamp: event.occurred_at
        }))
      };
    } catch (error) {
      logger.error('Cloudflare security events fetch failed:', error.message);
      return null;
    }
  }

  async getCacheStats() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/zones/${this.zoneId}/analytics/dashboard`,
        {
          headers: this.getAuthHeaders(),
          params: { since: -1440 }, // Last 24 hours
          timeout: 10000
        }
      );

      const totals = response.data.result.totals;

      return {
        requests: totals.requests.all,
        cached: totals.requests.cached,
        uncached: totals.requests.uncached,
        cacheHitRatio: (totals.requests.cached / totals.requests.all * 100).toFixed(2),
        bandwidthSaved: totals.bandwidth.cached
      };
    } catch (error) {
      logger.error('Cloudflare cache stats fetch failed:', error.message);
      return null;
    }
  }

  async getDNSRecords() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/zones/${this.zoneId}/dns_records`,
        {
          headers: this.getAuthHeaders(),
          timeout: 10000
        }
      );

      const records = response.data.result;

      return {
        total: records.length,
        byType: records.reduce((acc, record) => {
          acc[record.type] = (acc[record.type] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Cloudflare DNS records fetch failed:', error.message);
      return null;
    }
  }

  async checkHealth() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/zones/${this.zoneId}`,
        {
          headers: this.getAuthHeaders(),
          timeout: 10000
        }
      );

      const zone = response.data.result;

      return {
        isHealthy: zone.status === 'active',
        status: zone.status,
        name: zone.name,
        nameServers: zone.name_servers,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Cloudflare health check failed:', error.message);
      return {
        isHealthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async getFirewallEvents(period = '24h') {
    try {
      const periodMap = {
        '1h': new Date(Date.now() - 60 * 60 * 1000),
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };

      const since = periodMap[period] || periodMap['24h'];

      const response = await axios.get(
        `${this.baseUrl}/zones/${this.zoneId}/firewall/events`,
        {
          headers: this.getAuthHeaders(),
          params: {
            since: since.toISOString()
          },
          timeout: 10000
        }
      );

      const events = response.data.result;

      return {
        total: events.length,
        byAction: events.reduce((acc, event) => {
          acc[event.action] = (acc[event.action] || 0) + 1;
          return acc;
        }, {}),
        recentEvents: events.slice(0, 10)
      };
    } catch (error) {
      logger.error('Cloudflare firewall events fetch failed:', error.message);
      return null;
    }
  }
}

module.exports = CloudflareMonitor;
