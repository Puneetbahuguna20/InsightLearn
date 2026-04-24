const express = require('express');
const database = require('../config/database');
const redisCache = require('../config/redis');
const openaiService = require('../config/openai');
const logger = require('../middleware/logger');

const router = express.Router();

/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        redis: 'unknown',
        openai: 'unknown'
      }
    };

    // Check database health
    try {
      const dbHealth = await database.healthCheck();
      healthStatus.services.database = dbHealth.status === 'connected' ? 'healthy' : 'unhealthy';
      healthStatus.database = dbHealth;
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      healthStatus.database = { status: 'error', error: error.message };
    }

    // Check Redis health
    try {
      const redisHealth = await redisCache.healthCheck();
      healthStatus.services.redis = redisHealth.status === 'healthy' ? 'healthy' : 'unhealthy';
      healthStatus.redis = redisHealth;
    } catch (error) {
      healthStatus.services.redis = 'unhealthy';
      healthStatus.redis = { status: 'error', error: error.message };
    }

    // Check OpenAI health
    try {
      const openaiHealth = await openaiService.healthCheck();
      healthStatus.services.openai = openaiHealth.status === 'healthy' ? 'healthy' : 'unhealthy';
      healthStatus.openai = openaiHealth;
    } catch (error) {
      healthStatus.services.openai = 'unhealthy';
      healthStatus.openai = { status: 'error', error: error.message };
    }

    // Determine overall status
    const unhealthyServices = Object.values(healthStatus.services).filter(status => status === 'unhealthy');
    if (unhealthyServices.length > 0) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: healthStatus.status === 'healthy',
      data: healthStatus
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

/**
 * GET /api/health/detailed
 * Detailed health check with system metrics
 */
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // System metrics
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
          external: Math.round(process.memoryUsage().external / 1024 / 1024), // MB
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) // MB
        },
        cpu: {
          usage: process.cpuUsage()
        }
      },
      
      services: {
        database: 'unknown',
        redis: 'unknown',
        openai: 'unknown'
      }
    };

    // Detailed database health
    try {
      const dbHealth = await database.healthCheck();
      detailedHealth.services.database = dbHealth;
      
      // Get additional database stats
      if (dbHealth.status === 'connected') {
        const mongoose = require('mongoose');
        const stats = await mongoose.connection.db.stats();
        detailedHealth.database.stats = {
          collections: stats.collections,
          documents: stats.objects,
          dataSize: Math.round(stats.dataSize / 1024 / 1024), // MB
          storageSize: Math.round(stats.storageSize / 1024 / 1024), // MB
          indexes: stats.indexes,
          indexSize: Math.round(stats.indexSize / 1024 / 1024) // MB
        };
      }
    } catch (error) {
      detailedHealth.services.database = { status: 'error', error: error.message };
    }

    // Detailed Redis health
    try {
      const redisHealth = await redisCache.healthCheck();
      detailedHealth.services.redis = redisHealth;
      
      // Get additional Redis info
      if (redisHealth.status === 'healthy') {
        const cacheInfo = await redisCache.getCacheInfo();
        detailedHealth.redis.info = cacheInfo;
      }
    } catch (error) {
      detailedHealth.services.redis = { status: 'error', error: error.message };
    }

    // Detailed OpenAI health
    try {
      const openaiHealth = await openaiService.healthCheck();
      detailedHealth.services.openai = openaiHealth;
    } catch (error) {
      detailedHealth.services.openai = { status: 'error', error: error.message };
    }

    // Determine overall status
    const unhealthyServices = Object.values(detailedHealth.services).filter(service => 
      typeof service === 'object' && service.status === 'unhealthy'
    );
    
    if (unhealthyServices.length > 0) {
      detailedHealth.status = 'degraded';
    }

    const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: detailedHealth.status === 'healthy',
      data: detailedHealth
    });

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Detailed health check failed',
      details: error.message
    });
  }
});

/**
 * GET /api/health/readiness
 * Readiness probe for Kubernetes/container orchestration
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check if critical services are ready
    const dbHealth = await database.healthCheck();
    const redisHealth = await redisCache.healthCheck();
    
    const isReady = dbHealth.status === 'connected' && redisHealth.status === 'healthy';
    
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.status,
        redis: redisHealth.status
      }
    });

  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health/liveness
 * Liveness probe for Kubernetes/container orchestration
 */
router.get('/liveness', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/health/metrics
 * Application metrics for monitoring
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      
      // Performance metrics
      performance: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        eventLoop: {
          delay: process.hrtime.bigint() // Simplified event loop delay
        }
      },
      
      // Application metrics
      application: {
        activeConnections: 0, // Would need to track this in the actual implementation
        totalRequests: 0, // Would need to track this in the actual implementation
        errorRate: 0 // Would need to track this in the actual implementation
      }
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('Metrics check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Metrics check failed',
      details: error.message
    });
  }
});

module.exports = router;
