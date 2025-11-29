const axios = require('axios');
const logger = require('../utils/logger');
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');

/**
 * Performance Monitoring Service
 * Monitors Core Web Vitals, page load times, and API performance
 */
class PerformanceMonitor {
  constructor() {
    this.pageSpeedApiKey = process.env.PAGESPEED_API_KEY;
    this.sitesToMonitor = [
      { url: process.env.WORDPRESS_URL, name: 'Homepage' },
      { url: `${process.env.WORDPRESS_URL}/shop`, name: 'Shop Page' },
      { url: `${process.env.WORDPRESS_URL}/cart`, name: 'Cart Page' },
      { url: `${process.env.WORDPRESS_URL}/checkout`, name: 'Checkout Page' }
    ];
  }

  /**
   * Run all performance checks
   */
  async runChecks() {
    try {
      logger.info('Starting performance monitoring checks...');

      // Run checks in parallel
      const results = await Promise.allSettled([
        this.checkCoreWebVitals(),
        this.checkPageLoadTimes(),
        this.checkApiPerformance(),
        this.checkTTFB()
      ]);

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.error(`Performance check ${index} failed:`, result.reason);
        }
      });

      logger.info('Performance monitoring checks completed');
    } catch (error) {
      logger.error('Error in performance monitoring:', error);
    }
  }

  /**
   * Check Core Web Vitals using PageSpeed Insights API
   */
  async checkCoreWebVitals() {
    if (!this.pageSpeedApiKey) {
      logger.warn('PageSpeed API key not configured, skipping Core Web Vitals check');
      return;
    }

    for (const site of this.sitesToMonitor) {
      try {
        const response = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
          params: {
            url: site.url,
            key: this.pageSpeedApiKey,
            strategy: 'mobile',
            category: ['performance', 'accessibility']
          },
          timeout: 60000 // 60 second timeout
        });

        const data = response.data;
        const metrics = data.lighthouseResult?.audits;

        if (!metrics) {
          logger.warn(`No metrics returned for ${site.name}`);
          continue;
        }

        // Extract Core Web Vitals
        const lcp = metrics['largest-contentful-paint']?.numericValue || 0;
        const fcp = metrics['first-contentful-paint']?.numericValue || 0;
        const cls = metrics['cumulative-layout-shift']?.numericValue || 0;
        const tbt = metrics['total-blocking-time']?.numericValue || 0;
        const performanceScore = data.lighthouseResult?.categories?.performance?.score * 100 || 0;

        // Store metrics
        await this.storeMetric('performance', 'lcp', lcp, site.name);
        await this.storeMetric('performance', 'fcp', fcp, site.name);
        await this.storeMetric('performance', 'cls', cls, site.name);
        await this.storeMetric('performance', 'tbt', tbt, site.name);
        await this.storeMetric('performance', 'score', performanceScore, site.name);

        // Check thresholds and create alerts
        await this.checkPerformanceThresholds(site.name, {
          lcp,
          fcp,
          cls,
          tbt,
          performanceScore
        });

        logger.info(`Core Web Vitals checked for ${site.name}: LCP=${lcp}ms, FCP=${fcp}ms, CLS=${cls}`);
      } catch (error) {
        logger.error(`Error checking Core Web Vitals for ${site.name}:`, error.message);
      }
    }
  }

  /**
   * Check page load times for critical pages
   */
  async checkPageLoadTimes() {
    for (const site of this.sitesToMonitor) {
      try {
        const startTime = Date.now();
        
        const response = await axios.get(site.url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Mardeys Dashboard Performance Monitor)'
          }
        });

        const loadTime = Date.now() - startTime;

        // Store metric
        await this.storeMetric('performance', 'page_load_time', loadTime, site.name);

        // Check threshold
        if (loadTime > 3000) {
          await this.createAlert(
            'Page Load Time High',
            `${site.name} took ${loadTime}ms to load (threshold: 3000ms)`,
            loadTime > 5000 ? 'critical' : 'warning',
            { page: site.name, loadTime, url: site.url }
          );
        }

        logger.info(`Page load time for ${site.name}: ${loadTime}ms`);
      } catch (error) {
        logger.error(`Error checking page load time for ${site.name}:`, error.message);
        
        // Create alert for failed page load
        await this.createAlert(
          'Page Load Failed',
          `Failed to load ${site.name}: ${error.message}`,
          'critical',
          { page: site.name, error: error.message }
        );
      }
    }
  }

  /**
   * Check API performance (WordPress and WooCommerce REST APIs)
   */
  async checkApiPerformance() {
    const apiEndpoints = [
      {
        name: 'WordPress API',
        url: `${process.env.WORDPRESS_API_URL || process.env.WORDPRESS_URL + '/wp-json'}`,
        threshold: 1000
      },
      {
        name: 'WooCommerce API',
        url: `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/system_status`,
        threshold: 2000,
        auth: {
          username: process.env.WOOCOMMERCE_CONSUMER_KEY,
          password: process.env.WOOCOMMERCE_CONSUMER_SECRET
        }
      }
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const startTime = Date.now();
        
        const config = {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mardeys Dashboard API Monitor'
          }
        };

        if (endpoint.auth) {
          config.auth = endpoint.auth;
        }

        await axios.get(endpoint.url, config);

        const responseTime = Date.now() - startTime;

        // Store metric
        await this.storeMetric('performance', 'api_response_time', responseTime, endpoint.name);

        // Check threshold
        if (responseTime > endpoint.threshold) {
          await this.createAlert(
            'API Response Time High',
            `${endpoint.name} response time: ${responseTime}ms (threshold: ${endpoint.threshold}ms)`,
            responseTime > endpoint.threshold * 2 ? 'critical' : 'warning',
            { api: endpoint.name, responseTime, threshold: endpoint.threshold }
          );
        }

        logger.info(`${endpoint.name} response time: ${responseTime}ms`);
      } catch (error) {
        logger.error(`Error checking ${endpoint.name}:`, error.message);
        
        await this.createAlert(
          'API Health Check Failed',
          `${endpoint.name} failed: ${error.message}`,
          'critical',
          { api: endpoint.name, error: error.message }
        );
      }
    }
  }

  /**
   * Check Time to First Byte (TTFB)
   */
  async checkTTFB() {
    for (const site of this.sitesToMonitor) {
      try {
        const startTime = Date.now();
        let ttfb = 0;

        const response = await axios.get(site.url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Mardeys Dashboard TTFB Monitor)'
          },
          // Track response time
          onDownloadProgress: (progressEvent) => {
            if (ttfb === 0) {
              ttfb = Date.now() - startTime;
            }
          }
        });

        if (ttfb === 0) {
          ttfb = Date.now() - startTime;
        }

        // Store metric
        await this.storeMetric('performance', 'ttfb', ttfb, site.name);

        // Check threshold (600ms is good, 1000ms is acceptable)
        if (ttfb > 1000) {
          await this.createAlert(
            'TTFB High',
            `${site.name} TTFB: ${ttfb}ms (threshold: 1000ms)`,
            ttfb > 2000 ? 'critical' : 'warning',
            { page: site.name, ttfb }
          );
        }

        logger.info(`TTFB for ${site.name}: ${ttfb}ms`);
      } catch (error) {
        logger.error(`Error checking TTFB for ${site.name}:`, error.message);
      }
    }
  }

  /**
   * Check performance thresholds for Core Web Vitals
   */
  async checkPerformanceThresholds(pageName, metrics) {
    const { lcp, fcp, cls, performanceScore } = metrics;

    // LCP should be < 2500ms (good), < 4000ms (needs improvement)
    if (lcp > 4000) {
      await this.createAlert(
        'Poor LCP Performance',
        `${pageName} LCP: ${Math.round(lcp)}ms (threshold: 2500ms)`,
        'warning',
        { page: pageName, lcp: Math.round(lcp), threshold: 2500 }
      );
    }

    // FCP should be < 1800ms (good), < 3000ms (needs improvement)
    if (fcp > 3000) {
      await this.createAlert(
        'Poor FCP Performance',
        `${pageName} FCP: ${Math.round(fcp)}ms (threshold: 1800ms)`,
        'warning',
        { page: pageName, fcp: Math.round(fcp), threshold: 1800 }
      );
    }

    // CLS should be < 0.1 (good), < 0.25 (needs improvement)
    if (cls > 0.25) {
      await this.createAlert(
        'High Layout Shift',
        `${pageName} CLS: ${cls.toFixed(3)} (threshold: 0.1)`,
        'warning',
        { page: pageName, cls: cls.toFixed(3), threshold: 0.1 }
      );
    }

    // Performance score should be > 90 (good), > 50 (needs improvement)
    if (performanceScore < 50) {
      await this.createAlert(
        'Low Performance Score',
        `${pageName} performance score: ${Math.round(performanceScore)}/100`,
        'warning',
        { page: pageName, score: Math.round(performanceScore) }
      );
    }
  }

  /**
   * Store performance metric
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
      logger.error('Error storing performance metric:', error);
    }
  }

  /**
   * Create performance alert
   */
  async createAlert(title, message, severity, metadata) {
    try {
      // Check if similar alert already exists and is active
      const existingAlert = await Alert.findOne({
        title,
        status: 'active',
        createdAt: { $gte: new Date(Date.now() - 3600000) } // Within last hour
      });

      if (existingAlert) {
        logger.debug(`Similar alert already exists: ${title}`);
        return;
      }

      await Alert.create({
        title,
        message,
        severity,
        source: 'performance_monitor',
        status: 'active',
        metadata
      });

      logger.info(`Performance alert created: ${title}`);
    } catch (error) {
      logger.error('Error creating performance alert:', error);
    }
  }
}

module.exports = PerformanceMonitor;
