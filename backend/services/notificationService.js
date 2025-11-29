const nodemailer = require('nodemailer');
const axios = require('axios');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.emailEnabled = !!process.env.EMAIL_HOST;
    this.slackEnabled = !!process.env.SLACK_WEBHOOK_URL;
    
    // Email transporter
    if (this.emailEnabled) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }

  getActiveChannels() {
    const channels = [];
    if (this.emailEnabled) channels.push('email');
    if (this.slackEnabled) channels.push('slack');
    return channels;
  }

  async sendAlert(alert) {
    const notifications = [];

    // Send email notification
    if (this.emailEnabled) {
      notifications.push(this.sendEmailAlert(alert));
    }

    // Send Slack notification
    if (this.slackEnabled) {
      notifications.push(this.sendSlackAlert(alert));
    }

    // Wait for all notifications to send
    const results = await Promise.allSettled(notifications);
    
    // Log results
    results.forEach((result, index) => {
      const channel = this.getActiveChannels()[index];
      if (result.status === 'fulfilled') {
        logger.info(`Alert sent via ${channel}: ${alert.title}`);
      } else {
        logger.error(`Failed to send alert via ${channel}:`, result.reason);
      }
    });

    return results;
  }

  async sendEmailAlert(alert) {
    try {
      const severityColors = {
        info: '#0ea5e9',
        warning: '#f59e0b',
        error: '#ef4444',
        critical: '#dc2626'
      };

      const color = severityColors[alert.severity] || '#6b7280';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
            .badge { display: inline-block; padding: 5px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .metric-row { margin: 10px 0; padding: 10px; background-color: white; border-left: 3px solid ${color}; }
            .label { font-weight: bold; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🚨 ${alert.title}</h2>
            </div>
            <div class="content">
              <div class="metric-row">
                <span class="label">Severity:</span>
                <span class="badge" style="background-color: ${color}; color: white;">${alert.severity}</span>
              </div>
              <div class="metric-row">
                <span class="label">Source:</span> ${alert.source}
              </div>
              <div class="metric-row">
                <span class="label">Message:</span><br/>
                ${alert.message}
              </div>
              ${alert.metricValue ? `
                <div class="metric-row">
                  <span class="label">Current Value:</span> ${alert.metricValue}
                  ${alert.threshold ? `<br/><span class="label">Threshold:</span> ${alert.threshold}` : ''}
                </div>
              ` : ''}
              <div class="metric-row">
                <span class="label">Time:</span> ${new Date(alert.createdAt).toLocaleString()}
              </div>
            </div>
            <div class="footer">
              <p>This is an automated alert from your e-commerce monitoring dashboard.</p>
              <p>Log in to your dashboard to acknowledge or resolve this alert.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.ALERT_EMAIL_TO,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: htmlContent,
        text: `
Alert: ${alert.title}
Severity: ${alert.severity}
Source: ${alert.source}
Message: ${alert.message}
${alert.metricValue ? `Value: ${alert.metricValue}` : ''}
${alert.threshold ? `Threshold: ${alert.threshold}` : ''}
Time: ${new Date(alert.createdAt).toLocaleString()}
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      return { success: true, channel: 'email' };
    } catch (error) {
      logger.error('Email notification failed:', error);
      throw error;
    }
  }

  async sendSlackAlert(alert) {
    try {
      const severityEmojis = {
        info: ':information_source:',
        warning: ':warning:',
        error: ':x:',
        critical: ':rotating_light:'
      };

      const severityColors = {
        info: '#0ea5e9',
        warning: '#f59e0b',
        error: '#ef4444',
        critical: '#dc2626'
      };

      const emoji = severityEmojis[alert.severity] || ':bell:';
      const color = severityColors[alert.severity] || '#6b7280';

      const payload = {
        text: `${emoji} *${alert.title}*`,
        attachments: [
          {
            color: color,
            fields: [
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true
              },
              {
                title: 'Source',
                value: alert.source,
                short: true
              },
              {
                title: 'Message',
                value: alert.message,
                short: false
              }
            ],
            footer: 'E-commerce Monitoring Dashboard',
            ts: Math.floor(new Date(alert.createdAt).getTime() / 1000)
          }
        ]
      };

      if (alert.metricValue) {
        payload.attachments[0].fields.push({
          title: 'Current Value',
          value: alert.metricValue.toString(),
          short: true
        });
      }

      if (alert.threshold) {
        payload.attachments[0].fields.push({
          title: 'Threshold',
          value: alert.threshold.toString(),
          short: true
        });
      }

      await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
      return { success: true, channel: 'slack' };
    } catch (error) {
      logger.error('Slack notification failed:', error);
      throw error;
    }
  }

  async sendTestNotification() {
    const testAlert = {
      title: 'Test Alert',
      message: 'This is a test notification from your monitoring dashboard.',
      severity: 'info',
      source: 'system',
      createdAt: new Date()
    };

    return await this.sendAlert(testAlert);
  }

  async sendCustomNotification(to, subject, message) {
    if (!this.emailEnabled) {
      throw new Error('Email notifications are not configured');
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: subject,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br/>')}</p>`
      };

      await this.emailTransporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      logger.error('Custom email notification failed:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
