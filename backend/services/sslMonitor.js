const https = require('https');
const tls = require('tls');
const logger = require('../utils/logger');
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');

/**
 * SSL Certificate Monitoring Service
 * Monitors SSL certificate expiration and health
 */
class SSLMonitor {
  constructor() {
    this.domains = this.parseDomains();
    this.warningThreshold = parseInt(process.env.SSL_WARNING_DAYS) || 30; // Days before expiration to warn
    this.criticalThreshold = parseInt(process.env.SSL_CRITICAL_DAYS) || 15; // Days before expiration to alert critical
  }

  /**
   * Parse domains from environment variables
   */
  parseDomains() {
    const domains = [];
    
    // Add main WordPress domain
    if (process.env.WORDPRESS_URL) {
      try {
        const url = new URL(process.env.WORDPRESS_URL);
        domains.push({ name: 'WordPress Site', hostname: url.hostname, port: 443 });
      } catch (error) {
        logger.error('Invalid WORDPRESS_URL:', error.message);
      }
    }

    // Add Cloudflare domain if different
    if (process.env.CLOUDFLARE_DOMAIN && process.env.CLOUDFLARE_DOMAIN !== domains[0]?.hostname) {
      domains.push({ 
        name: 'Cloudflare Domain', 
        hostname: process.env.CLOUDFLARE_DOMAIN, 
        port: 443 
      });
    }

    return domains;
  }

  /**
   * Run SSL certificate checks
   */
  async runChecks() {
    try {
      logger.info('Starting SSL certificate monitoring...');

      for (const domain of this.domains) {
        await this.checkSSLCertificate(domain);
      }

      logger.info('SSL certificate monitoring completed');
    } catch (error) {
      logger.error('Error in SSL monitoring:', error);
    }
  }

  /**
   * Check SSL certificate for a domain
   */
  async checkSSLCertificate(domain) {
    return new Promise((resolve) => {
      const options = {
        host: domain.hostname,
        port: domain.port,
        method: 'GET',
        rejectUnauthorized: false, // Allow checking even invalid certs
        agent: false
      };

      try {
        const req = https.request(options, (res) => {
          const certificate = res.socket.getPeerCertificate();

          if (!certificate || !certificate.valid_to) {
            logger.warn(`No valid certificate found for ${domain.name}`);
            this.createAlert(
              'SSL Certificate Invalid',
              `No valid SSL certificate found for ${domain.name} (${domain.hostname})`,
              'critical',
              { domain: domain.hostname }
            );
            resolve();
            return;
          }

          this.processCertificate(domain, certificate);
          resolve();
        });

        req.on('error', (error) => {
          logger.error(`SSL check failed for ${domain.name}:`, error.message);
          this.createAlert(
            'SSL Check Failed',
            `Failed to check SSL certificate for ${domain.name}: ${error.message}`,
            'error',
            { domain: domain.hostname, error: error.message }
          );
          resolve();
        });

        req.end();
      } catch (error) {
        logger.error(`Error checking SSL for ${domain.name}:`, error.message);
        resolve();
      }
    });
  }

  /**
   * Process certificate information
   */
  async processCertificate(domain, certificate) {
    const validTo = new Date(certificate.valid_to);
    const validFrom = new Date(certificate.valid_from);
    const now = new Date();

    // Calculate days until expiration
    const daysUntilExpiration = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

    // Extract certificate information
    const certInfo = {
      subject: certificate.subject?.CN || 'Unknown',
      issuer: certificate.issuer?.CN || 'Unknown',
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      daysUntilExpiration,
      serialNumber: certificate.serialNumber,
      fingerprint: certificate.fingerprint
    };

    // Store metric
    await this.storeMetric('ssl', 'days_until_expiration', daysUntilExpiration, domain.hostname);
    await this.storeMetric('ssl', 'certificate_valid', now < validTo && now > validFrom ? 1 : 0, domain.hostname);

    // Check if certificate is expired
    if (now > validTo) {
      await this.createAlert(
        'SSL Certificate Expired',
        `SSL certificate for ${domain.name} (${domain.hostname}) has EXPIRED on ${validTo.toDateString()}`,
        'critical',
        { ...certInfo, domain: domain.hostname }
      );
      logger.error(`SSL certificate EXPIRED for ${domain.name}`);
      return;
    }

    // Check if certificate is not yet valid
    if (now < validFrom) {
      await this.createAlert(
        'SSL Certificate Not Yet Valid',
        `SSL certificate for ${domain.name} (${domain.hostname}) is not yet valid (valid from: ${validFrom.toDateString()})`,
        'warning',
        { ...certInfo, domain: domain.hostname }
      );
      logger.warn(`SSL certificate not yet valid for ${domain.name}`);
      return;
    }

    // Check expiration thresholds
    if (daysUntilExpiration <= this.criticalThreshold) {
      await this.createAlert(
        'SSL Certificate Expiring Soon',
        `SSL certificate for ${domain.name} (${domain.hostname}) expires in ${daysUntilExpiration} days (${validTo.toDateString()})`,
        'critical',
        { ...certInfo, domain: domain.hostname }
      );
      logger.warn(`SSL certificate expiring soon for ${domain.name}: ${daysUntilExpiration} days`);
    } else if (daysUntilExpiration <= this.warningThreshold) {
      await this.createAlert(
        'SSL Certificate Expiration Warning',
        `SSL certificate for ${domain.name} (${domain.hostname}) expires in ${daysUntilExpiration} days (${validTo.toDateString()})`,
        'warning',
        { ...certInfo, domain: domain.hostname }
      );
      logger.info(`SSL certificate expiration warning for ${domain.name}: ${daysUntilExpiration} days`);
    } else {
      logger.info(`SSL certificate for ${domain.name} is valid (expires in ${daysUntilExpiration} days)`);
    }

    // Check certificate issuer (warn if self-signed)
    if (certificate.issuer?.CN === certificate.subject?.CN) {
      await this.createAlert(
        'Self-Signed SSL Certificate',
        `${domain.name} (${domain.hostname}) is using a self-signed SSL certificate`,
        'warning',
        { ...certInfo, domain: domain.hostname }
      );
    }
  }

  /**
   * Store SSL metric
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
      logger.error('Error storing SSL metric:', error);
    }
  }

  /**
   * Create SSL alert
   */
  async createAlert(title, message, severity, metadata) {
    try {
      // Check if similar alert already exists and is active
      const existingAlert = await Alert.findOne({
        title,
        status: 'active',
        'metadata.domain': metadata.domain,
        createdAt: { $gte: new Date(Date.now() - 86400000) } // Within last 24 hours
      });

      if (existingAlert) {
        logger.debug(`Similar SSL alert already exists: ${title}`);
        return;
      }

      await Alert.create({
        title,
        message,
        severity,
        source: 'ssl_monitor',
        status: 'active',
        metadata
      });

      logger.info(`SSL alert created: ${title}`);
    } catch (error) {
      logger.error('Error creating SSL alert:', error);
    }
  }
}

module.exports = SSLMonitor;
