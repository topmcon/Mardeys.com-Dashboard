const axios = require('axios');
const logger = require('../utils/logger');

class WooCommerceMonitor {
  constructor() {
    this.baseUrl = process.env.WORDPRESS_API_URL || process.env.WORDPRESS_URL + '/wp-json';
    this.consumerKey = process.env.WC_CONSUMER_KEY;
    this.consumerSecret = process.env.WC_CONSUMER_SECRET;
  }

  getAuthConfig() {
    return {
      auth: {
        username: this.consumerKey,
        password: this.consumerSecret
      },
      timeout: 10000
    };
  }

  async getOrderStats(period = '24h') {
    try {
      const periodMap = {
        '1h': new Date(Date.now() - 60 * 60 * 1000),
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      };

      const after = periodMap[period] || periodMap['24h'];
      
      const response = await axios.get(
        `${this.baseUrl}/wc/v3/orders`,
        {
          ...this.getAuthConfig(),
          params: {
            after: after.toISOString(),
            per_page: 100
          }
        }
      );

      const orders = response.data;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const statusBreakdown = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      return {
        totalOrders: orders.length,
        totalRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        statusBreakdown,
        period
      };
    } catch (error) {
      logger.error('WooCommerce order stats fetch failed:', error.message);
      return null;
    }
  }

  async getProductStats() {
    try {
      const [productsResponse, lowStockResponse] = await Promise.all([
        axios.get(`${this.baseUrl}/wc/v3/products`, {
          ...this.getAuthConfig(),
          params: { per_page: 1 }
        }),
        axios.get(`${this.baseUrl}/wc/v3/products`, {
          ...this.getAuthConfig(),
          params: { 
            stock_status: 'onbackorder',
            per_page: 100
          }
        })
      ]);

      const totalProducts = parseInt(productsResponse.headers['x-wp-total'] || 0);
      const lowStockProducts = lowStockResponse.data;

      // Get out of stock
      const outOfStockResponse = await axios.get(`${this.baseUrl}/wc/v3/products`, {
        ...this.getAuthConfig(),
        params: { 
          stock_status: 'outofstock',
          per_page: 100
        }
      });

      return {
        total: totalProducts,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockResponse.data.length,
        lowStockItems: lowStockProducts.slice(0, 10).map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock_quantity
        }))
      };
    } catch (error) {
      logger.error('WooCommerce product stats fetch failed:', error.message);
      return null;
    }
  }

  async getCustomerStats() {
    try {
      const response = await axios.get(`${this.baseUrl}/wc/v3/customers`, {
        ...this.getAuthConfig(),
        params: { per_page: 1 }
      });

      const totalCustomers = parseInt(response.headers['x-wp-total'] || 0);

      return {
        total: totalCustomers
      };
    } catch (error) {
      logger.error('WooCommerce customer stats fetch failed:', error.message);
      return null;
    }
  }

  async getRecentActivity() {
    try {
      // Get recent orders
      const ordersResponse = await axios.get(`${this.baseUrl}/wc/v3/orders`, {
        ...this.getAuthConfig(),
        params: {
          per_page: 10,
          orderby: 'date',
          order: 'desc'
        }
      });

      return {
        recentOrders: ordersResponse.data.map(order => ({
          id: order.id,
          status: order.status,
          total: order.total,
          customerName: `${order.billing.first_name} ${order.billing.last_name}`,
          date: order.date_created
        }))
      };
    } catch (error) {
      logger.error('WooCommerce recent activity fetch failed:', error.message);
      return null;
    }
  }

  async checkHealth() {
    try {
      // Use public Store API endpoint instead of authenticated v3 API
      const response = await axios.get(`${this.baseUrl}/wc/store/products`, {
        params: { per_page: 1 },
        timeout: 10000
      });

      return {
        isHealthy: response.status === 200 && Array.isArray(response.data),
        productsAvailable: response.data?.length > 0,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('WooCommerce health check failed:', error.message);
      return {
        isHealthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = WooCommerceMonitor;
