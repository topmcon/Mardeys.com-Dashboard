const axios = require('axios');
const logger = require('../utils/logger');

class WordPressMonitor {
  constructor() {
    this.baseUrl = process.env.WORDPRESS_URL;
    this.apiUrl = process.env.WORDPRESS_API_URL;
    this.username = process.env.WORDPRESS_USERNAME;
    this.appPassword = process.env.WORDPRESS_APP_PASSWORD;
  }

  async checkHealth() {
    try {
      const startTime = Date.now();
      
      // Check site availability
      const siteResponse = await axios.get(this.baseUrl, { 
        timeout: 10000,
        validateStatus: () => true 
      });
      
      const responseTime = Date.now() - startTime;
      const isUp = siteResponse.status === 200;

      // Check REST API
      let apiHealthy = false;
      try {
        const apiResponse = await axios.get(`${this.apiUrl}/wp/v2/posts?per_page=1`, {
          timeout: 5000
        });
        apiHealthy = apiResponse.status === 200;
      } catch (error) {
        logger.warn('WordPress API check failed:', error.message);
      }

      return {
        isUp,
        responseTime,
        statusCode: siteResponse.status,
        apiHealthy,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('WordPress health check failed:', error);
      return {
        isUp: false,
        responseTime: null,
        statusCode: null,
        apiHealthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async getSystemInfo() {
    try {
      // Requires a custom WordPress plugin endpoint or using WP CLI
      const response = await axios.get(`${this.apiUrl}/custom/v1/system-info`, {
        auth: {
          username: this.username,
          password: this.appPassword
        },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      logger.error('WordPress system info fetch failed:', error.message);
      return null;
    }
  }

  async getPluginStatus() {
    try {
      const response = await axios.get(`${this.apiUrl}/wp/v2/plugins`, {
        auth: {
          username: this.username,
          password: this.appPassword
        },
        timeout: 5000
      });

      const plugins = response.data;
      const activePlugins = plugins.filter(p => p.status === 'active');
      const needsUpdate = plugins.filter(p => p.update_available);

      return {
        total: plugins.length,
        active: activePlugins.length,
        needsUpdate: needsUpdate.length,
        plugins: plugins.map(p => ({
          name: p.name,
          version: p.version,
          status: p.status,
          updateAvailable: p.update_available
        }))
      };
    } catch (error) {
      logger.error('WordPress plugin status fetch failed:', error.message);
      return null;
    }
  }

  async getDatabaseStats() {
    try {
      // This would require a custom WordPress endpoint
      const response = await axios.get(`${this.apiUrl}/custom/v1/database-stats`, {
        auth: {
          username: this.username,
          password: this.appPassword
        },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      logger.error('WordPress database stats fetch failed:', error.message);
      return null;
    }
  }
}

module.exports = WordPressMonitor;
