const Joi = require('joi');
const ErrorHandler = require('./errorHandler');

class Validation {
  static validate(schema) {
    return (req, res, next) => {
      const { error, value } = schema.compile().validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details
        });
      }

      // Replace req.body with validated and sanitized data
      req.body = value;
      next();
    };
  }

  static validateQuery(schema) {
    return (req, res, next) => {
      const { error, value } = schema.compile().validate(req.query, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details
        });
      }

      // Replace req.query with validated and sanitized data
      req.query = value;
      next();
    };
  }

  static validateParams(schema) {
    return (req, res, next) => {
      const { error, value } = schema.compile().validate(req.params, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        return res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details
        });
      }

      // Replace req.params with validated and sanitized data
      req.params = value;
      next();
    };
  }

  static validateFile(schema) {
    return (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { error, value } = schema.compile().validate(req.file, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          details
        });
      }

      // Replace req.file with validated and sanitized data
      req.file = value;
      next();
    };
  }

  // Common validation schemas
  static schemas = {
    objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ID format'),
    
    email: Joi.string().email().message('Invalid email format'),
    
    password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).message('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    topic: Joi.string().min(3).max(500).trim().required(),
    
    classification: Joi.string().valid('structure', 'process', 'algorithm', 'hierarchy', 'comparison').required(),
    
    rating: Joi.number().min(1).max(5).required(),
    
    pagination: {
      limit: Joi.number().integer().min(1).max(100).default(20),
      offset: Joi.number().integer().min(0).default(0)
    },
    
    sorting: {
      sortBy: Joi.string().valid('popularity', 'recent', 'requests', 'rating', 'name').default('popularity'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    },
    
    dateRange: {
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate'))
    }
  };

  // Custom validation functions
  static validateMongoId(value, helpers) {
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
      return helpers.error('custom.objectId');
    }
    return value;
  }

  static validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB');
    }

    return true;
  }

  // Sanitization helpers
  static sanitizeHtml(value) {
    if (typeof value !== 'string') return value;
    
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  static sanitizeString(value) {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/[<>]/g, '');
  }

  // Middleware for sanitizing request body
  static sanitizeBody() {
    return (req, res, next) => {
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(req.body);
      }
      next();
    };
  }

  static sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Async validation
  static async validateAsync(schema, data) {
    try {
      const { error, value } = await schema.compile().validateAsync(data, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        throw new Error(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      return value;
    } catch (error) {
      throw error;
    }
  }

  // Conditional validation
  static conditional(condition, schema) {
    return Joi.when(Joi.ref(condition), {
      is: Joi.exist(),
      then: schema.required(),
      otherwise: schema.optional()
    });
  }

  // File upload validation
  static fileUpload(options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      required = false
    } = options;

    return (req, res, next) => {
      if (!req.file && required) {
        return res.status(400).json({
          success: false,
          error: 'File is required'
        });
      }

      if (req.file) {
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
          });
        }

        if (req.file.size > maxSize) {
          return res.status(400).json({
            success: false,
            error: `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
          });
        }
      }

      next();
    };
  }
}

module.exports = Validation;
