const axios = require('axios');
const logger = require('../utils/logger');

class APIEndpointMonitor {
  constructor() {
    this.endpoints = this.loadEndpoints();
    this.results = new Map();
  }

  /**
   * Load endpoints to monitor from env or defaults
   */
  loadEndpoints() {
    const defaultEndpoints = [
      {
        name: 'WordPress REST API',
        url: `${process.env.WORDPRESS_URL || 'https://server.mardeys.com'}/wp-json/wp/v2/posts?per_page=1`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000,
        category: 'wordpress'
      },
      {
        name: 'WooCommerce Store API',
        url: `${process.env.WORDPRESS_URL || 'https://server.mardeys.com'}/wp-json/wc/store/v1/products?per_page=1`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000,
        category: 'woocommerce'
      },
      {
        name: 'Main Website',
        url: process.env.MAIN_SITE_URL || 'https://mardeys.com',
        method: 'GET',
        expectedStatus: 200,
        timeout: 15000,
        category: 'frontend'
      },
      {
        name: 'Dashboard API Health',
        url: `${process.env.API_URL || 'https://mardeys-dashboard-api.onrender.com'}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000,
        category: 'api'
      }
    ];

    // Allow custom endpoints via environment variable
    if (process.env.CUSTOM_ENDPOINTS) {
      try {
        const custom = JSON.parse(process.env.CUSTOM_ENDPOINTS);
        return [...defaultEndpoints, ...custom];
      } catch (e) {
        logger.error('Failed to parse CUSTOM_ENDPOINTS:', e.message);
      }
    }

    return defaultEndpoints;
  }

  /**
   * Check a single endpoint
   */
  async checkEndpoint(endpoint) {
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: endpoint.method || 'GET',
        url: endpoint.url,
        timeout: endpoint.timeout || 10000,
        headers: endpoint.headers || {},
        validateStatus: () => true // Don't throw on any status
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === endpoint.expectedStatus;

      const result = {
        name: endpoint.name,
        url: endpoint.url,
        category: endpoint.category,
        isHealthy,
        statusCode: response.status,
        expectedStatus: endpoint.expectedStatus,
        responseTime,
        timestamp: new Date(),
        headers: {
          contentType: response.headers['content-type'],
          server: response.headers['server'],
          cacheControl: response.headers['cache-control']
        }
      };

      // Store result
      this.results.set(endpoint.name, result);
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const result = {
        name: endpoint.name,
        url: endpoint.url,
        category: endpoint.category,
        isHealthy: false,
        error: error.code || error.message,
        responseTime,
        timeout: error.code === 'ECONNABORTED',
        timestamp: new Date()
      };

      this.results.set(endpoint.name, result);
      logger.error(`Endpoint check failed for ${endpoint.name}:`, error.message);
      
      return result;
    }
  }

  /**
   * Check all configured endpoints
   */
  async checkAllEndpoints() {
    logger.info(`Checking ${this.endpoints.length} API endpoints...`);
    
    const results = await Promise.all(
      this.endpoints.map(ep => this.checkEndpoint(ep))
    );

    // Summarize results
    const summary = {
      total: results.length,
      healthy: results.filter(r => r.isHealthy).length,
      unhealthy: results.filter(r => !r.isHealthy).length,
      avgResponseTime: Math.round(
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      ),
      slowest: results.reduce((max, r) => r.responseTime > max.responseTime ? r : max, results[0]),
      byCategory: {}
    };

    // Group by category
    results.forEach(r => {
      if (!summary.byCategory[r.category]) {
        summary.byCategory[r.category] = { healthy: 0, unhealthy: 0, avgResponseTime: 0, count: 0 };
      }
      summary.byCategory[r.category].count++;
      if (r.isHealthy) {
        summary.byCategory[r.category].healthy++;
      } else {
        summary.byCategory[r.category].unhealthy++;
      }
      summary.byCategory[r.category].avgResponseTime += r.responseTime;
    });

    // Calculate averages per category
    Object.keys(summary.byCategory).forEach(cat => {
      summary.byCategory[cat].avgResponseTime = Math.round(
        summary.byCategory[cat].avgResponseTime / summary.byCategory[cat].count
      );
    });

    return {
      timestamp: new Date(),
      summary,
      endpoints: results
    };
  }

  /**
   * Get results for a specific endpoint
   */
  getEndpointResult(name) {
    return this.results.get(name);
  }

  /**
   * Get all cached results
   */
  getAllResults() {
    return Array.from(this.results.values());
  }

  /**
   * Add a custom endpoint to monitor
   */
  addEndpoint(endpoint) {
    if (!endpoint.name || !endpoint.url) {
      throw new Error('Endpoint must have name and url');
    }
    
    this.endpoints.push({
      method: 'GET',
      expectedStatus: 200,
      timeout: 10000,
      category: 'custom',
      ...endpoint
    });
    
    logger.info(`Added endpoint to monitor: ${endpoint.name}`);
  }

  /**
   * Remove an endpoint from monitoring
   */
  removeEndpoint(name) {
    const index = this.endpoints.findIndex(ep => ep.name === name);
    if (index !== -1) {
      this.endpoints.splice(index, 1);
      this.results.delete(name);
      logger.info(`Removed endpoint from monitoring: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Check specific endpoint by name
   */
  async checkByName(name) {
    const endpoint = this.endpoints.find(ep => ep.name === name);
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${name}`);
    }
    return this.checkEndpoint(endpoint);
  }
}

module.exports = APIEndpointMonitor;
