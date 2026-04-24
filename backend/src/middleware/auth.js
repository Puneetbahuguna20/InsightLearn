const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/environment');
const logger = require('./logger');

class Auth {
  static generateToken(payload, expiresIn = '24h') {
    try {
      return jwt.sign(payload, config.security.jwtSecret, { expiresIn });
    } catch (error) {
      logger.error('Token generation failed:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, config.security.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        logger.error('Token verification failed:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  static async hashPassword(password) {
    try {
      const saltRounds = config.security.bcryptRounds;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  static async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Password comparison failed:', error);
      throw new Error('Failed to compare password');
    }
  }

  static extractTokenFromRequest(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  static required = (req, res, next) => {
    try {
      const token = Auth.extractTokenFromRequest(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const decoded = Auth.verifyToken(token);
      
      // Add user info to request object
      req.user = decoded;
      req.token = token;
      
      // Log authentication event
      logger.info('User authenticated', {
        userId: decoded.id,
        email: decoded.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      next();
    } catch (error) {
      logger.logSecurityEvent('Authentication Failed', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      });

      if (error.message.includes('expired')) {
        return res.status(401).json({
          success: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      });
    }
  };

  static optional = (req, res, next) => {
    try {
      const token = Auth.extractTokenFromRequest(req);
      
      if (token) {
        const decoded = Auth.verifyToken(token);
        req.user = decoded;
        req.token = token;
      }
      
      next();
    } catch (error) {
      // For optional auth, we don't return an error, just continue without user
      logger.debug('Optional authentication failed, continuing without user', {
        error: error.message,
        ip: req.ip
      });
      next();
    }
  };

  static requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        logger.logSecurityEvent('Insufficient Permissions', {
          userId: req.user.id,
          userRoles,
          requiredRoles,
          url: req.originalUrl,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  };

  static requirePermission = (permission) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userPermissions = req.user.permissions || [];
      
      if (!userPermissions.includes(permission)) {
        logger.logSecurityEvent('Insufficient Permissions', {
          userId: req.user.id,
          requiredPermission: permission,
          userPermissions,
          url: req.originalUrl,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  };

  static requireOwnership = (resourceIdParam = 'id', resourceType = 'resource') => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }

        const resourceId = req.params[resourceIdParam];
        
        if (!resourceId) {
          return res.status(400).json({
            success: false,
            error: 'Resource ID is required',
            code: 'MISSING_RESOURCE_ID'
          });
        }

        // Admin users can access any resource
        if (req.user.role === 'admin') {
          return next();
        }

        // Check ownership based on resource type
        let isOwner = false;
        
        switch (resourceType) {
          case 'topic':
            // This would require importing the Topic model
            // For now, we'll assume a basic check
            isOwner = await this.checkTopicOwnership(resourceId, req.user.id);
            break;
          case 'content':
            isOwner = await this.checkContentOwnership(resourceId, req.user.id);
            break;
          default:
            isOwner = false;
        }

        if (!isOwner) {
          logger.logSecurityEvent('Unauthorized Resource Access', {
            userId: req.user.id,
            resourceId,
            resourceType,
            url: req.originalUrl,
            method: req.method
          });

          return res.status(403).json({
            success: false,
            error: 'Access denied. You do not own this resource.',
            code: 'RESOURCE_ACCESS_DENIED'
          });
        }

        next();
      } catch (error) {
        logger.error('Ownership check failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to verify resource ownership',
          code: 'OWNERSHIP_CHECK_FAILED'
        });
      }
    };
  };

  static async checkTopicOwnership(topicId, userId) {
    try {
      const Topic = require('../models/Topic');
      const topic = await Topic.findById(topicId);
      return topic && topic.metadata.userId === userId;
    } catch (error) {
      logger.error('Topic ownership check failed:', error);
      return false;
    }
  }

  static async checkContentOwnership(contentId, userId) {
    try {
      const Content = require('../models/Content');
      const content = await Content.findById(contentId).populate('topicId');
      return content && content.topicId.metadata.userId === userId;
    } catch (error) {
      logger.error('Content ownership check failed:', error);
      return false;
    }
  }

  static refreshToken = (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
          code: 'REFRESH_TOKEN_REQUIRED'
        });
      }

      const decoded = Auth.verifyToken(refreshToken);
      
      // Generate new access token
      const newAccessToken = Auth.generateToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions
      }, '1h');

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          tokenType: 'Bearer',
          expiresIn: '1h'
        }
      });
    } catch (error) {
      logger.logSecurityEvent('Token Refresh Failed', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  };

  static logout = (req, res, next) => {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just log the logout event
      logger.info('User logged out', {
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to logout',
        code: 'LOGOUT_FAILED'
      });
    }
  };
}

module.exports = Auth;
