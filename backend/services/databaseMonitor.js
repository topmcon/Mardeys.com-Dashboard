const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseMonitor {
  constructor() {
    this.lastCheckTime = null;
  }

  /**
   * Check MongoDB connection health
   */
  async checkHealth() {
    const startTime = Date.now();
    
    try {
      // Check connection state
      const state = mongoose.connection.readyState;
      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      // Ping the database
      const adminDb = mongoose.connection.db.admin();
      await adminDb.ping();
      
      const responseTime = Date.now() - startTime;
      this.lastCheckTime = new Date();

      return {
        isHealthy: state === 1,
        state: stateMap[state] || 'unknown',
        responseTime,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Database health check failed:', error.message);
      return {
        isHealthy: false,
        state: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        collections: stats.collections,
        objects: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        avgObjSize: stats.avgObjSize,
        // Human-readable sizes
        dataSizeMB: (stats.dataSize / 1024 / 1024).toFixed(2),
        storageSizeMB: (stats.storageSize / 1024 / 1024).toFixed(2),
        indexSizeMB: (stats.indexSize / 1024 / 1024).toFixed(2)
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error.message);
      return null;
    }
  }

  /**
   * Get collection-level statistics
   */
  async getCollectionStats() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      const stats = [];
      for (const col of collections) {
        try {
          const colStats = await db.collection(col.name).stats();
          stats.push({
            name: col.name,
            count: colStats.count,
            size: colStats.size,
            avgObjSize: colStats.avgObjSize,
            storageSize: colStats.storageSize,
            indexes: colStats.nindexes,
            sizeMB: (colStats.size / 1024 / 1024).toFixed(2)
          });
        } catch (e) {
          // Some collections might not have stats
        }
      }
      
      return stats.sort((a, b) => b.size - a.size);
    } catch (error) {
      logger.error('Failed to get collection stats:', error.message);
      return [];
    }
  }

  /**
   * Check for slow queries (requires profiling enabled)
   */
  async getSlowQueries(thresholdMs = 100) {
    try {
      const db = mongoose.connection.db;
      
      // Check if system.profile collection exists
      const collections = await db.listCollections({ name: 'system.profile' }).toArray();
      
      if (collections.length === 0) {
        return { 
          enabled: false, 
          message: 'Query profiling not enabled',
          queries: [] 
        };
      }
      
      const slowQueries = await db.collection('system.profile')
        .find({ millis: { $gt: thresholdMs } })
        .sort({ ts: -1 })
        .limit(10)
        .toArray();
      
      return {
        enabled: true,
        threshold: thresholdMs,
        queries: slowQueries.map(q => ({
          operation: q.op,
          namespace: q.ns,
          duration: q.millis,
          timestamp: q.ts,
          query: q.query
        }))
      };
    } catch (error) {
      logger.error('Failed to get slow queries:', error.message);
      return { enabled: false, error: error.message, queries: [] };
    }
  }

  /**
   * Monitor connection pool
   */
  getConnectionPoolStatus() {
    try {
      const client = mongoose.connection.getClient();
      
      // Get topology description if available
      const topology = client.topology;
      if (!topology) {
        return { available: false, message: 'Topology not available' };
      }

      return {
        available: true,
        // Connection state
        isConnected: mongoose.connection.readyState === 1,
        // Pool settings from options
        maxPoolSize: client.options?.maxPoolSize || 100,
        minPoolSize: client.options?.minPoolSize || 0
      };
    } catch (error) {
      logger.error('Failed to get connection pool status:', error.message);
      return { available: false, error: error.message };
    }
  }

  /**
   * Run a comprehensive database health check
   */
  async runFullCheck() {
    const results = {
      timestamp: new Date(),
      health: await this.checkHealth(),
      stats: await this.getStats(),
      collections: await this.getCollectionStats(),
      connectionPool: this.getConnectionPoolStatus()
    };

    // Calculate overall health score
    let score = 100;
    
    if (!results.health.isHealthy) score -= 50;
    if (results.health.responseTime > 100) score -= 10;
    if (results.health.responseTime > 500) score -= 20;
    
    results.healthScore = Math.max(0, score);
    results.status = score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy';

    return results;
  }
}

module.exports = DatabaseMonitor;
