const axios = require('axios');
const logger = require('../utils/logger');
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');

/**
 * WordPress Plugin Monitoring Service
 * Monitors plugin status, updates, and health
 */
class PluginMonitor {
  constructor() {
    this.wpUrl = process.env.WORDPRESS_URL;
    this.wpApiUrl = process.env.WORDPRESS_API_URL || `${this.wpUrl}/wp-json`;
    this.wpUsername = process.env.WORDPRESS_USERNAME;
    this.wpPassword = process.env.WORDPRESS_APP_PASSWORD;
  }

  /**
   * Run plugin monitoring checks
   */
  async runChecks() {
    try {
      logger.info('Starting WordPress plugin monitoring...');

      await Promise.allSettled([
        this.checkPluginUpdates(),
        this.checkInactivePlugins(),
        this.checkCriticalPlugins()
      ]);

      logger.info('WordPress plugin monitoring completed');
    } catch (error) {
      logger.error('Error in plugin monitoring:', error);
    }
  }

  /**
   * Check for available plugin updates
   */
  async checkPluginUpdates() {
    try {
      // Try to get plugin information
      // Note: This requires the Application Passwords plugin or JWT authentication
      const response = await axios.get(`${this.wpApiUrl}/wp/v2/plugins`, {
        auth: {
          username: this.wpUsername,
          password: this.wpPassword
        },
        timeout: 10000
      });

      if (!response.data || !Array.isArray(response.data)) {
        logger.warn('No plugin data returned from WordPress API');
        return;
      }

      const plugins = response.data;
      const activePlugins = plugins.filter(p => p.status === 'active');
      const pluginsNeedingUpdate = plugins.filter(p => p.update_available === true);
      const inactivePlugins = plugins.filter(p => p.status === 'inactive');

      // Store metrics
      await this.storeMetric('plugins', 'total', plugins.length, 'wordpress');
      await this.storeMetric('plugins', 'active', activePlugins.length, 'wordpress');
      await this.storeMetric('plugins', 'updates_available', pluginsNeedingUpdate.length, 'wordpress');
      await this.storeMetric('plugins', 'inactive', inactivePlugins.length, 'wordpress');

      // Log results
      logger.info(`Plugins: ${plugins.length} total, ${activePlugins.length} active, ${pluginsNeedingUpdate.length} updates available`);

      // Create alerts for updates
      if (pluginsNeedingUpdate.length > 0) {
        const pluginNames = pluginsNeedingUpdate.map(p => p.name || p.plugin).slice(0, 5);
        const moreCount = pluginsNeedingUpdate.length > 5 ? ` and ${pluginsNeedingUpdate.length - 5} more` : '';

        await this.createAlert(
          'Plugin Updates Available',
          `${pluginsNeedingUpdate.length} plugin(s) need updating: ${pluginNames.join(', ')}${moreCount}`,
          pluginsNeedingUpdate.length > 5 ? 'warning' : 'info',
          { 
            count: pluginsNeedingUpdate.length,
            plugins: pluginsNeedingUpdate.map(p => ({
              name: p.name || p.plugin,
              version: p.version,
              newVersion: p.new_version || 'unknown'
            }))
          }
        );
      }

      // Check for security-critical plugins needing updates
      await this.checkSecurityPlugins(pluginsNeedingUpdate);

    } catch (error) {
      if (error.response?.status === 401) {
        logger.error('WordPress API authentication failed - check credentials');
      } else if (error.response?.status === 404) {
        logger.warn('WordPress plugins endpoint not available - may require REST API authentication');
      } else {
        logger.error('Error checking plugin updates:', error.message);
      }

      await this.createAlert(
        'Plugin Check Failed',
        `Failed to check WordPress plugins: ${error.message}`,
        'warning',
        { error: error.message }
      );
    }
  }

  /**
   * Check for inactive plugins (potential security risk)
   */
  async checkInactivePlugins() {
    try {
      const response = await axios.get(`${this.wpApiUrl}/wp/v2/plugins`, {
        auth: {
          username: this.wpUsername,
          password: this.wpPassword
        },
        timeout: 10000
      });

      if (!response.data) return;

      const inactivePlugins = response.data.filter(p => p.status === 'inactive');

      if (inactivePlugins.length > 5) {
        await this.createAlert(
          'Many Inactive Plugins',
          `${inactivePlugins.length} inactive plugins detected. Consider removing unused plugins to reduce security risks.`,
          'info',
          { count: inactivePlugins.length }
        );
      }

    } catch (error) {
      logger.debug('Could not check inactive plugins:', error.message);
    }
  }

  /**
   * Check critical security/performance plugins
   */
  async checkCriticalPlugins() {
    const criticalPlugins = [
      'wordfence',
      'woocommerce',
      'wp-rocket',
      'cloudflare',
      'sucuri-scanner',
      'jetpack',
      'yoast-seo',
      'elementor',
      'contact-form-7'
    ];

    try {
      const response = await axios.get(`${this.wpApiUrl}/wp/v2/plugins`, {
        auth: {
          username: this.wpUsername,
          password: this.wpPassword
        },
        timeout: 10000
      });

      if (!response.data) return;

      const plugins = response.data;

      for (const criticalSlug of criticalPlugins) {
        const plugin = plugins.find(p => 
          (p.plugin || '').toLowerCase().includes(criticalSlug) ||
          (p.name || '').toLowerCase().includes(criticalSlug)
        );

        if (plugin) {
          // Check if critical plugin is inactive
          if (plugin.status !== 'active') {
            await this.createAlert(
              'Critical Plugin Inactive',
              `Important plugin "${plugin.name || criticalSlug}" is not active`,
              'warning',
              { plugin: plugin.name || criticalSlug, status: plugin.status }
            );
          }

          // Check if critical plugin needs update
          if (plugin.update_available) {
            await this.createAlert(
              'Critical Plugin Update Available',
              `Security/performance plugin "${plugin.name || criticalSlug}" has an update available`,
              'warning',
              { 
                plugin: plugin.name || criticalSlug, 
                currentVersion: plugin.version,
                newVersion: plugin.new_version
              }
            );
          }
        }
      }

    } catch (error) {
      logger.debug('Could not check critical plugins:', error.message);
    }
  }

  /**
   * Check security-related plugins needing updates
   */
  async checkSecurityPlugins(pluginsNeedingUpdate) {
    const securityKeywords = ['security', 'firewall', 'malware', 'wordfence', 'sucuri', 'ithemes'];
    
    const securityPluginsNeedingUpdate = pluginsNeedingUpdate.filter(p => {
      const name = (p.name || p.plugin || '').toLowerCase();
      return securityKeywords.some(keyword => name.includes(keyword));
    });

    if (securityPluginsNeedingUpdate.length > 0) {
      await this.createAlert(
        'Security Plugin Updates Available',
        `${securityPluginsNeedingUpdate.length} security plugin(s) need updating: ${securityPluginsNeedingUpdate.map(p => p.name).join(', ')}`,
        'warning',
        { 
          count: securityPluginsNeedingUpdate.length,
          plugins: securityPluginsNeedingUpdate.map(p => p.name || p.plugin)
        }
      );
    }
  }

  /**
   * Store plugin metric
   */
  async storeMetric(type, category, value, source) {
    try {
      await Metric.create({
        type,
        category,
        value,
        source,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error storing plugin metric:', error);
    }
  }

  /**
   * Create plugin alert
   */
  async createAlert(title, message, severity, metadata) {
    try {
      // Check if similar alert already exists and is active
      const existingAlert = await Alert.findOne({
        title,
        status: 'active',
        createdAt: { $gte: new Date(Date.now() - 86400000) } // Within last 24 hours
      });

      if (existingAlert) {
        logger.debug(`Similar plugin alert already exists: ${title}`);
        return;
      }

      await Alert.create({
        title,
        message,
        severity,
        source: 'plugin_monitor',
        status: 'active',
        metadata
      });

      logger.info(`Plugin alert created: ${title}`);
    } catch (error) {
      logger.error('Error creating plugin alert:', error);
    }
  }
}

module.exports = PluginMonitor;
