const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Authentication middleware
const auth = async (req, res, next) => {
  console.log(`🔐 Auth Middleware: Checking token for ${req.method} ${req.url}`);
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.warn('⚠️ Auth Failed: No Authorization header');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.warn('⚠️ Auth Failed: Empty token');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.warn(`⚠️ Auth Failed: User not found for ID ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found'
      });
    }
    
    console.log(`✅ Auth Success: User ${user.username} authenticated`);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth Error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

// Admin authorization middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

module.exports = { auth, adminOnly, generateToken };
