const axios = require('axios');
const logger = require('../utils/logger');
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');

/**
 * WordPress Cron Job Monitoring Service
 * Monitors WordPress cron jobs and scheduled tasks
 */
class CronMonitor {
  constructor() {
    this.wpUrl = process.env.WORDPRESS_URL;
    this.wpApiUrl = process.env.WORDPRESS_API_URL || `${this.wpUrl}/wp-json`;
    this.wpUsername = process.env.WORDPRESS_USERNAME;
    this.wpPassword = process.env.WORDPRESS_APP_PASSWORD;
  }

  /**
   * Run cron monitoring checks
   */
  async runChecks() {
    try {
      logger.info('Starting WordPress cron monitoring...');

      await Promise.allSettled([
        this.checkCronStatus(),
        this.checkScheduledEvents(),
        this.checkFailedJobs()
      ]);

      logger.info('WordPress cron monitoring completed');
    } catch (error) {
      logger.error('Error in cron monitoring:', error);
    }
  }

  /**
   * Check if WordPress cron is running
   */
  async checkCronStatus() {
    try {
      // Try to get WordPress site health
      const response = await axios.get(`${this.wpApiUrl}/wp/v2/posts`, {
        params: { per_page: 1 },
        auth: {
          username: this.wpUsername,
          password: this.wpPassword
        },
        timeout: 10000
      });

      // Check if cron is disabled in the response headers or site health
      const cronDisabled = process.env.DISABLE_WP_CRON === 'true';

      if (cronDisabled) {
        logger.info('WordPress cron is disabled (using system cron)');
        await this.storeMetric('cron', 'status', 2, 'system'); // 2 = system cron
      } else {
        logger.info('WordPress cron is enabled');
        await this.storeMetric('cron', 'status', 1, 'wordpress'); // 1 = wp-cron
      }

      // Try to trigger cron
      await this.triggerCron();

    } catch (error) {
      logger.error('Error checking cron status:', error.message);
      
      await this.createAlert(
        'WordPress Cron Check Failed',
        `Failed to check WordPress cron status: ${error.message}`,
        'warning',
        { error: error.message }
      );
    }
  }

  /**
   * Trigger WordPress cron
   */
  async triggerCron() {
    try {
      // Call wp-cron.php
      await axios.get(`${this.wpUrl}/wp-cron.php`, {
        params: { doing_wp_cron: Date.now() },
        timeout: 30000
      });

      logger.info('WordPress cron triggered successfully');
      await this.storeMetric('cron', 'last_run', Date.now(), 'trigger');
    } catch (error) {
      logger.warn('Failed to trigger WordPress cron:', error.message);
    }
  }

  /**
   * Check scheduled events (requires plugin or custom endpoint)
   */
  async checkScheduledEvents() {
    try {
      // This would require a custom endpoint or plugin like WP Crontrol
      // For now, we'll log that this feature requires additional setup
      logger.debug('Scheduled events check requires WP Crontrol plugin or custom endpoint');

      // Example of what this would look like with a custom endpoint:
      // const response = await axios.get(`${this.wpApiUrl}/custom/v1/cron-events`, {
      //   auth: { username: this.wpUsername, password: this.wpPassword }
      // });
      // const events = response.data;
      // await this.analyzeScheduledEvents(events);

    } catch (error) {
      logger.error('Error checking scheduled events:', error.message);
    }
  }

  /**
   * Check for failed cron jobs
   */
  async checkFailedJobs() {
    try {
      // This would typically check error logs or a custom endpoint
      // For demonstration, we'll check if cron has run recently by checking site updates

      const response = await axios.get(`${this.wpApiUrl}/wp/v2/posts`, {
        params: { 
          per_page: 1,
          orderby: 'modified',
          order: 'desc'
        },
        auth: {
          username: this.wpUsername,
          password: this.wpPassword
        },
        timeout: 10000
      });

      if (response.data && response.data.length > 0) {
        const lastModified = new Date(response.data[0].modified);
        const hoursSinceUpdate = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60);

        // If no updates in 24 hours, might indicate cron issues
        if (hoursSinceUpdate > 24) {
          await this.createAlert(
            'WordPress Cron May Not Be Running',
            `No content updates detected in the last ${Math.round(hoursSinceUpdate)} hours. This may indicate cron job issues.`,
            'warning',
            { hoursSinceUpdate: Math.round(hoursSinceUpdate) }
          );
        }

        await this.storeMetric('cron', 'hours_since_last_activity', hoursSinceUpdate, 'wordpress');
        logger.info(`WordPress last activity: ${Math.round(hoursSinceUpdate)} hours ago`);
      }

    } catch (error) {
      logger.error('Error checking failed jobs:', error.message);
    }
  }

  /**
   * Analyze scheduled events for issues
   */
  async analyzeScheduledEvents(events) {
    if (!events || !Array.isArray(events)) return;

    // Count events by status
    const missedEvents = events.filter(e => e.status === 'missed').length;
    const pendingEvents = events.filter(e => e.status === 'pending').length;

    await this.storeMetric('cron', 'missed_events', missedEvents, 'scheduled');
    await this.storeMetric('cron', 'pending_events', pendingEvents, 'scheduled');

    // Alert if many missed events
    if (missedEvents > 10) {
      await this.createAlert(
        'Multiple Missed Cron Events',
        `${missedEvents} WordPress cron events were missed. This may indicate performance issues or cron misconfiguration.`,
        'warning',
        { missedEvents, pendingEvents }
      );
    }

    logger.info(`Cron events: ${missedEvents} missed, ${pendingEvents} pending`);
  }

  /**
   * Store cron metric
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
      logger.error('Error storing cron metric:', error);
    }
  }

  /**
   * Create cron alert
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
        logger.debug(`Similar cron alert already exists: ${title}`);
        return;
      }

      await Alert.create({
        title,
        message,
        severity,
        source: 'cron_monitor',
        status: 'active',
        metadata
      });

      logger.info(`Cron alert created: ${title}`);
    } catch (error) {
      logger.error('Error creating cron alert:', error);
    }
  }
}

module.exports = CronMonitor;
