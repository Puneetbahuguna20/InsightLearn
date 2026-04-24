const winston = require('winston');
const path = require('path');
const config = require('../config/environment');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'visuallearn-api' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport for development
if (config.env === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += '\n' + JSON.stringify(meta, null, 2);
        }
        return msg;
      })
    )
  }));
}

// Add request logging helper
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: res.get('Content-Length')
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Add AI service logging helper
logger.logAICall = (service, operation, tokens, cost, duration, error = null) => {
  const logData = {
    service,
    operation,
    tokens,
    cost,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };

  if (error) {
    logData.error = error.message;
    logger.error('AI Service Call Failed', logData);
  } else {
    logger.info('AI Service Call', logData);
  }
};

// Add cache logging helper
logger.logCacheOperation = (operation, key, hit = null, duration = null) => {
  const logData = {
    operation,
    key,
    hit,
    duration: duration ? `${duration}ms` : null,
    timestamp: new Date().toISOString()
  };

  logger.debug('Cache Operation', logData);
};

// Add database operation logging helper
logger.logDatabaseOperation = (operation, collection, duration, error = null) => {
  const logData = {
    operation,
    collection,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };

  if (error) {
    logData.error = error.message;
    logger.error('Database Operation Failed', logData);
  } else {
    logger.debug('Database Operation', logData);
  }
};

// Add performance logging helper
logger.logPerformance = (operation, duration, metadata = {}) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    ...metadata,
    timestamp: new Date().toISOString()
  };

  if (duration > 5000) { // Log slow operations as warnings
    logger.warn('Slow Operation Detected', logData);
  } else {
    logger.info('Performance Metric', logData);
  }
};

// Add security logging helper
logger.logSecurityEvent = (event, details = {}) => {
  const logData = {
    event,
    ...details,
    timestamp: new Date().toISOString()
  };

  logger.warn('Security Event', logData);
};

// Add business metrics logging helper
logger.logBusinessMetric = (metric, value, metadata = {}) => {
  const logData = {
    metric,
    value,
    ...metadata,
    timestamp: new Date().toISOString()
  };

  logger.info('Business Metric', logData);
};

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'exceptions.log')
  })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'rejections.log')
  })
);

// Stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
