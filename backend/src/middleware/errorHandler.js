const logger = require('./logger');
const config = require('../config/environment');

class ErrorHandler {
  static handle(error, req, res, next) {
    logger.error('Error occurred:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let details = null;

    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation error';
      details = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
      details = `Invalid ${error.path}: ${error.value}`;
    } else if (error.code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry';
      details = 'A record with this value already exists';
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
    } else if (error.name === 'MulterError') {
      statusCode = 400;
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large';
        details = `Maximum file size is ${error.limit} bytes`;
      } else {
        message = 'File upload error';
        details = error.message;
      }
    } else if (error.message.includes('OpenAI')) {
      statusCode = 503;
      message = 'AI service temporarily unavailable';
      details = config.env === 'development' ? error.message : null;
    } else if (error.message.includes('Mongo') || error.message.includes('Mongoose')) {
      statusCode = 503;
      message = 'Database service temporarily unavailable';
      details = config.env === 'development' ? error.message : null;
    } else if (error.message.includes('Redis')) {
      statusCode = 503;
      message = 'Cache service temporarily unavailable';
      details = config.env === 'development' ? error.message : null;
    } else if (error.statusCode) {
      statusCode = error.statusCode;
      message = error.message;
      details = error.details || null;
    }

    // Build error response
    const errorResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    };

    // Add details in development or if explicitly provided
    if (details && (config.env === 'development' || error.includeDetails)) {
      errorResponse.details = details;
    }

    // Add request ID if available
    if (req.requestId) {
      errorResponse.requestId = req.requestId;
    }

    // Add stack trace in development
    if (config.env === 'development') {
      errorResponse.stack = error.stack;
    }

    res.status(statusCode).json(errorResponse);
  }

  static notFound(req, res, next) {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    next(error);
  }

  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static createError(message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
  }
}

module.exports = ErrorHandler.handle;
