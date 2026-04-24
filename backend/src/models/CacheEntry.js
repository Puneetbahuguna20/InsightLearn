const mongoose = require('mongoose');

const cacheEntrySchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true
  },
  type: { 
    type: String, 
    enum: ['classification', 'content', 'image', 'regions', 'user-session'],
    required: true,
    index: true
  },
  
  // Cache data
  data: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  
  // Cache metadata
  metadata: {
    size: { type: Number, required: true, min: 0 }, // in bytes
    compressed: { type: Boolean, default: false },
    compressionRatio: { type: Number, min: 0, max: 1 },
    version: { type: Number, default: 1, min: 1 },
    checksum: { type: String } // for data integrity
  },
  
  // Expiration and access
  ttl: { 
    type: Number, 
    required: true, 
    min: 0 
  }, // in seconds
  expiresAt: { 
    type: Date, 
    required: true,
    index: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastAccessed: { 
    type: Date, 
    default: Date.now 
  },
  accessCount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  
  // Performance metrics
  performance: {
    hitCount: { type: Number, default: 0, min: 0 },
    missCount: { type: Number, default: 0, min: 0 },
    hitRate: { type: Number, default: 0, min: 0, max: 1 },
    averageAccessTime: { type: Number, default: 0, min: 0 }, // in milliseconds
    lastAccessTime: { type: Number, default: 0, min: 0 } // in milliseconds
  },
  
  // Related entities
  relatedTo: {
    topicId: { type: String, index: true },
    userId: { type: String, index: true },
    sessionId: { type: String }
  },
  
  // Cache status
  status: {
    type: String,
    enum: ['active', 'expired', 'invalidated', 'archived'],
    default: 'active',
    index: true
  },
  
  // Invalidation tracking
  invalidation: {
    reason: { 
      type: String, 
      enum: ['manual', 'ttl-expired', 'data-updated', 'memory-pressure', 'version-mismatch']
    },
    invalidatedAt: { type: Date },
    invalidatedBy: { type: String } // user ID or system process
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
cacheEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
cacheEntrySchema.index({ type: 1, 'relatedTo.topicId': 1 });
cacheEntrySchema.index({ status: 1, lastAccessed: -1 });
cacheEntrySchema.index({ 'performance.hitCount': -1 });

// Virtual for time to expiration
cacheEntrySchema.virtual('timeToExpiration').get(function() {
  return Math.max(0, this.expiresAt.getTime() - Date.now());
});

// Virtual for cache age
cacheEntrySchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is expired
cacheEntrySchema.virtual('isExpired').get(function() {
  return Date.now() > this.expiresAt.getTime();
});

// Pre-save middleware
cacheEntrySchema.pre('save', function(next) {
  // Calculate data size if not provided
  if (!this.metadata.size) {
    this.metadata.size = Buffer.byteLength(JSON.stringify(this.data), 'utf8');
  }
  
  // Set expiration date if not provided
  if (!this.expiresAt && this.ttl) {
    this.expiresAt = new Date(Date.now() + (this.ttl * 1000));
  }
  
  // Update hit rate
  if (this.performance.hitCount > 0) {
    this.performance.hitRate = this.performance.hitCount / 
      (this.performance.hitCount + this.performance.missCount);
  }
  
  next();
});

// Instance methods
cacheEntrySchema.methods.recordAccess = function(accessTime = 0) {
  this.lastAccessed = new Date();
  this.accessCount += 1;
  this.performance.hitCount += 1;
  
  if (accessTime > 0) {
    // Update average access time
    const totalAccesses = this.performance.hitCount;
    this.performance.averageAccessTime = 
      ((this.performance.averageAccessTime * (totalAccesses - 1)) + accessTime) / totalAccesses;
    this.performance.lastAccessTime = accessTime;
  }
  
  // Update hit rate
  this.performance.hitRate = this.performance.hitCount / 
    (this.performance.hitCount + this.performance.missCount);
  
  return this.save();
};

cacheEntrySchema.methods.recordMiss = function() {
  this.performance.missCount += 1;
  this.performance.hitRate = this.performance.hitCount / 
    (this.performance.hitCount + this.performance.missCount);
  return this.save();
};

cacheEntrySchema.methods.invalidate = function(reason, invalidatedBy = null) {
  this.status = 'invalidated';
  this.invalidation.reason = reason;
  this.invalidation.invalidatedAt = new Date();
  this.invalidation.invalidatedBy = invalidatedBy;
  return this.save();
};

cacheEntrySchema.methods.extendTTL = function(additionalSeconds) {
  this.expiresAt = new Date(this.expiresAt.getTime() + (additionalSeconds * 1000));
  this.ttl = Math.floor((this.expiresAt.getTime() - Date.now()) / 1000);
  return this.save();
};

cacheEntrySchema.methods.isStillValid = function() {
  return this.status === 'active' && !this.isExpired;
};

// Static methods
cacheEntrySchema.statics.findByKey = function(key) {
  return this.findOne({ key, status: 'active' });
};

cacheEntrySchema.statics.findByType = function(type, limit = 50) {
  return this.find({ type, status: 'active' })
    .sort({ lastAccessed: -1 })
    .limit(limit);
};

cacheEntrySchema.statics.findByTopic = function(topicId, type = null) {
  const query = { 
    'relatedTo.topicId': topicId, 
    status: 'active' 
  };
  if (type) {
    query.type = type;
  }
  return this.find(query).sort({ lastAccessed: -1 });
};

cacheEntrySchema.statics.getExpiredEntries = function(limit = 100) {
  return this.find({ 
    expiresAt: { $lt: new Date() },
    status: 'active'
  }).limit(limit);
};

cacheEntrySchema.statics.getLeastUsedEntries = function(limit = 50) {
  return this.find({ status: 'active' })
    .sort({ accessCount: 1, lastAccessed: 1 })
    .limit(limit);
};

cacheEntrySchema.statics.getLargestEntries = function(limit = 20) {
  return this.find({ status: 'active' })
    .sort({ 'metadata.size': -1 })
    .limit(limit);
};

cacheEntrySchema.statics.getCacheStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        totalEntries: { $sum: 1 },
        totalSize: { $sum: '$metadata.size' },
        averageSize: { $avg: '$metadata.size' },
        totalHits: { $sum: '$performance.hitCount' },
        totalMisses: { $sum: '$performance.missCount' },
        averageHitRate: { $avg: '$performance.hitRate' },
        averageAccessTime: { $avg: '$performance.averageAccessTime' }
      }
    }
  ]);
  
  const overall = await this.aggregate([
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        totalSize: { $sum: '$metadata.size' },
        averageSize: { $avg: '$metadata.size' },
        totalHits: { $sum: '$performance.hitCount' },
        totalMisses: { $sum: '$performance.missCount' },
        averageHitRate: { $avg: '$performance.hitRate' },
        averageAccessTime: { $avg: '$performance.averageAccessTime' }
      }
    }
  ]);
  
  return {
    byType: stats,
    overall: overall[0] || {}
  };
};

cacheEntrySchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    { 
      expiresAt: { $lt: new Date() },
      status: 'active'
    },
    { 
      $set: { 
        status: 'expired',
        'invalidation.reason': 'ttl-expired',
        'invalidation.invalidatedAt': new Date()
      }
    }
  );
  
  return result.modifiedCount;
};

cacheEntrySchema.statics.cleanupByMemoryPressure = async function(targetSizeBytes) {
  // Get current total size
  const currentSize = await this.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: null, totalSize: { $sum: '$metadata.size' } } }
  ]);
  
  const totalSize = currentSize[0]?.totalSize || 0;
  
  if (totalSize <= targetSizeBytes) {
    return 0; // No cleanup needed
  }
  
  // Find least used entries to remove
  const entriesToRemove = await this.find({ status: 'active' })
    .sort({ accessCount: 1, lastAccessed: 1 })
    .limit(100); // Remove up to 100 entries
  
  let freedSize = 0;
  for (const entry of entriesToRemove) {
    await entry.invalidate('memory-pressure');
    freedSize += entry.metadata.size;
    
    if (totalSize - freedSize <= targetSizeBytes) {
      break;
    }
  }
  
  return freedSize;
};

// Validation
cacheEntrySchema.path('key').validate(function(key) {
  return key && key.length >= 3 && key.length <= 255;
}, 'Cache key must be between 3 and 255 characters');

cacheEntrySchema.path('ttl').validate(function(ttl) {
  return ttl >= 0 && ttl <= 31536000; // Max 1 year
}, 'TTL must be between 0 and 31536000 seconds (1 year)');

module.exports = mongoose.model('CacheEntry', cacheEntrySchema);
