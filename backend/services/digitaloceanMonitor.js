const axios = require('axios');
const logger = require('../utils/logger');

class DigitalOceanMonitor {
  constructor() {
    this.apiToken = process.env.DO_API_TOKEN;
    this.dropletId = process.env.DO_DROPLET_ID;
    this.baseUrl = 'https://api.digitalocean.com/v2';
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getDropletInfo() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/droplets/${this.dropletId}`,
        { headers: this.getAuthHeaders(), timeout: 10000 }
      );

      const droplet = response.data.droplet;

      return {
        id: droplet.id,
        name: droplet.name,
        status: droplet.status,
        region: droplet.region.name,
        size: droplet.size.slug,
        vcpus: droplet.vcpus,
        memory: droplet.memory,
        disk: droplet.disk,
        ipAddress: droplet.networks.v4[0]?.ip_address,
        created: droplet.created_at
      };
    } catch (error) {
      logger.error('DigitalOcean droplet info fetch failed:', error.message);
      return null;
    }
  }

  async getDropletMetrics(period = '1h') {
    try {
      const periodMap = {
        '1h': 3600,
        '24h': 86400,
        '7d': 604800
      };

      const duration = periodMap[period] || 3600;
      const end = Math.floor(Date.now() / 1000);
      const start = end - duration;

      // Get CPU, Memory, Disk, Bandwidth metrics
      const [cpuMetrics, memoryMetrics, diskMetrics, bandwidthMetrics] = await Promise.all([
        this.getMetric('cpu', start, end),
        this.getMetric('memory_utilization_percent', start, end),
        this.getMetric('filesystem_free', start, end),
        this.getMetric('bandwidth', start, end)
      ]);

      return {
        cpu: cpuMetrics,
        memory: memoryMetrics,
        disk: diskMetrics,
        bandwidth: bandwidthMetrics,
        period
      };
    } catch (error) {
      logger.error('DigitalOcean metrics fetch failed:', error.message);
      return null;
    }
  }

  async getMetric(metricType, start, end) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/monitoring/metrics/droplet/${metricType}`,
        {
          headers: this.getAuthHeaders(),
          params: {
            host_id: this.dropletId,
            start: start,
            end: end
          },
          timeout: 10000
        }
      );

      const data = response.data.data.result[0];
      if (!data || !data.values) {
        return null;
      }

      // Calculate average, min, max
      const values = data.values.map(v => parseFloat(v[1]));
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const current = values[values.length - 1];

      return {
        current,
        average: avg,
        min,
        max,
        dataPoints: data.values.length
      };
    } catch (error) {
      logger.warn(`DigitalOcean ${metricType} metric fetch failed:`, error.message);
      return null;
    }
  }

  async checkDropletHealth() {
    try {
      const info = await this.getDropletInfo();
      
      if (!info) {
        return {
          isHealthy: false,
          status: 'unknown',
          error: 'Failed to fetch droplet info'
        };
      }

      const isHealthy = info.status === 'active';

      return {
        isHealthy,
        status: info.status,
        name: info.name,
        region: info.region,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('DigitalOcean health check failed:', error.message);
      return {
        isHealthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async getAccountInfo() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/account`,
        { headers: this.getAuthHeaders(), timeout: 10000 }
      );

      return {
        status: response.data.account.status,
        dropletLimit: response.data.account.droplet_limit,
        email: response.data.account.email
      };
    } catch (error) {
      logger.error('DigitalOcean account info fetch failed:', error.message);
      return null;
    }
  }
}

module.exports = DigitalOceanMonitor;
