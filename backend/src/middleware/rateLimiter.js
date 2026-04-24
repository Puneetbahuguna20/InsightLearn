const rateLimit = require('express-rate-limit');
const config = require('../config/environment');

class RateLimiter {
  static create(options = {}) {
    const {
      windowMs = config.rateLimit.windowMs,
      max = config.rateLimit.maxRequests,
      message = 'Too many requests from this IP, please try again later.'
    } = options;

    return rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  static createStrict() {
    return this.create({
      windowMs: 60 * 1000, // 1 minute
      max: 10 // 10 requests per minute
    });
  }

  static createContentLimiter() {
    return this.create({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 20 // 20 content generations per 5 minutes
    });
  }

  static createImageLimiter() {
    return this.create({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 15 // 15 image generations per 10 minutes
    });
  }

  static createClassificationLimiter() {
    return this.create({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 classifications per minute
      message: 'Classification rate limit exceeded. Please wait before making more requests.'
    });
  }

  static createSearchLimiter() {
    return this.create({
      windowMs: 60 * 1000, // 1 minute
      max: 100 // 100 searches per minute
    });
  }
}

module.exports = RateLimiter;
