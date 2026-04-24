const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    default: () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
  },
  topicId: { 
    type: String, 
    ref: 'Topic', 
    required: true
  },
  contentId: { 
    type: String, 
    ref: 'Content', 
    required: true
  },
  type: { 
    type: String, 
    enum: ['main', 'step', 'detail', 'comparison', 'thumbnail'],
    required: true
  },
  stepIndex: { 
    type: Number, 
    min: 0
  },
  
  // Image URLs and storage
  urls: {
    original: { 
      type: String, 
      required: true 
    },
    thumbnail: { 
      type: String 
    },
    optimized: { 
      type: String 
    },
    cdn: { 
      type: String 
    }
  },
  
  // Generation details
  generation: {
    prompt: { 
      type: String, 
      required: true, 
      maxlength: 2000 
    },
    model: { 
      type: String, 
      required: true 
    },
    size: { 
      type: String, 
      enum: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'],
      default: '1024x1024'
    },
    quality: { 
      type: String, 
      enum: ['standard', 'hd'],
      default: 'standard'
    },
    style: { 
      type: String, 
      enum: ['vivid', 'natural'],
      default: 'natural'
    },
    revisedPrompt: { 
      type: String, 
      maxlength: 2000 
    },
    cost: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    generatedAt: { 
      type: Date, 
      default: Date.now 
    },
    generationTime: { 
      type: Number, // in milliseconds
      min: 0
    }
  },
  
  // Image metadata
  metadata: {
    width: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    height: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    format: { 
      type: String, 
      enum: ['png', 'jpg', 'jpeg', 'webp'],
      default: 'png'
    },
    fileSize: { 
      type: Number, 
      required: true, 
      min: 0 
    }, // in bytes
    aspectRatio: { 
      type: Number, 
      min: 0 
    },
    dominantColors: [{ 
      type: String 
    }],
    description: { 
      type: String, 
      maxlength: 500 
    }
  },
  
  // Clickable regions for interactive images
  clickableRegions: [{
    id: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['label', 'component', 'area', 'button', 'hotspot'],
      required: true 
    },
    coordinates: {
      x: { type: Number, required: true, min: 0 },
      y: { type: Number, required: true, min: 0 },
      width: { type: Number, required: true, min: 1 },
      height: { type: Number, required: true, min: 1 }
    },
    content: { type: String, required: true, maxlength: 500 },
    action: { 
      type: String, 
      enum: ['show-detail', 'navigate', 'highlight', 'play-animation', 'zoom'],
      default: 'show-detail' 
    },
    target: { type: String }, // For navigation actions
    style: {
      backgroundColor: { type: String },
      borderColor: { type: String },
      borderWidth: { type: Number, default: 2 },
      borderRadius: { type: Number, default: 4 }
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Processing status
  processing: {
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed'
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0, min: 0 }
  },
  
  // Usage analytics
  analytics: {
    viewCount: { type: Number, default: 0, min: 0 },
    clickCount: { type: Number, default: 0, min: 0 },
    regionClicks: [{
      regionId: String,
      count: { type: Number, default: 0, min: 0 }
    }],
    lastViewed: { type: Date },
    averageViewTime: { type: Number, default: 0 } // in seconds
  },
  
  // Quality and moderation
  quality: {
    score: { type: Number, min: 0, max: 100 },
    moderated: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, maxlength: 200 }
  },
  
  // Caching
  cacheKey: { type: String },
  cachedAt: { type: Date },
  ttl: { type: Number, default: 2592000 } // 30 days in seconds
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
imageSchema.index({ cacheKey: 1 });
imageSchema.index({ topicId: 1, type: 1 });
imageSchema.index({ contentId: 1, stepIndex: 1 });
imageSchema.index({ 'processing.status': 1 });
imageSchema.index({ 'generation.generatedAt': -1 });
imageSchema.index({ 'analytics.viewCount': -1 });

// Virtual for aspect ratio
imageSchema.virtual('aspectRatioCalculated').get(function() {
  if (this.metadata.width && this.metadata.height) {
    return (this.metadata.width / this.metadata.height).toFixed(2);
  }
  return null;
});

// Virtual for file size in human readable format
imageSchema.virtual('fileSizeHuman').get(function() {
  const bytes = this.metadata.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Pre-save middleware
imageSchema.pre('save', function(next) {
  // Generate cache key
  if (this.isModified('urls.original') || this.isNew) {
    this.cacheKey = `image:${this._id}:${this.generation.version || 1}`;
  }
  
  // Calculate aspect ratio
  if (this.metadata.width && this.metadata.height) {
    this.metadata.aspectRatio = this.metadata.width / this.metadata.height;
  }
  
  // Set processing completion time
  if (this.isModified('processing.status') && this.processing.status === 'completed') {
    this.processing.completedAt = new Date();
  }
  
  next();
});

// Instance methods
imageSchema.methods.incrementViews = function() {
  this.analytics.viewCount += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

imageSchema.methods.incrementRegionClick = function(regionId) {
  this.analytics.clickCount += 1;
  
  let regionClick = this.analytics.regionClicks.find(rc => rc.regionId === regionId);
  if (!regionClick) {
    regionClick = { regionId, count: 0 };
    this.analytics.regionClicks.push(regionClick);
  }
  regionClick.count += 1;
  
  return this.save();
};

imageSchema.methods.addClickableRegion = function(regionData) {
  // Remove existing region with same ID
  this.clickableRegions = this.clickableRegions.filter(
    region => region.id !== regionData.id
  );
  
  // Add new region
  this.clickableRegions.push(regionData);
  
  return this.save();
};

imageSchema.methods.removeClickableRegion = function(regionId) {
  this.clickableRegions = this.clickableRegions.filter(
    region => region.id !== regionId
  );
  return this.save();
};

imageSchema.methods.getRegionById = function(regionId) {
  return this.clickableRegions.find(region => region.id === regionId);
};

imageSchema.methods.updateProcessingStatus = function(status, errorMessage = null) {
  this.processing.status = status;
  
  if (status === 'processing' && !this.processing.startedAt) {
    this.processing.startedAt = new Date();
  }
  
  if (status === 'failed') {
    this.processing.errorMessage = errorMessage;
    this.processing.retryCount += 1;
  }
  
  return this.save();
};

// Static methods
imageSchema.statics.findByTopic = function(topicId, type = null) {
  const query = { topicId };
  if (type) {
    query.type = type;
  }
  return this.find(query).sort({ stepIndex: 1, 'generation.generatedAt': -1 });
};

imageSchema.statics.findByContent = function(contentId, stepIndex = null) {
  const query = { contentId };
  if (stepIndex !== null) {
    query.stepIndex = stepIndex;
  }
  return this.find(query).sort({ stepIndex: 1 });
};

imageSchema.statics.getPopularImages = function(limit = 10) {
  return this.find({ 'processing.status': 'completed' })
    .sort({ 'analytics.viewCount': -1 })
    .limit(limit);
};

imageSchema.statics.getFailedGenerations = function(limit = 20) {
  return this.find({ 'processing.status': 'failed' })
    .sort({ 'processing.retryCount': -1, createdAt: -1 })
    .limit(limit);
};

imageSchema.statics.getImagesByModel = function(model, limit = 20) {
  return this.find({ 'generation.model': model })
    .sort({ 'generation.generatedAt': -1 })
    .limit(limit);
};

// Validation
imageSchema.path('urls.original').validate(function(url) {
  return url && (url.startsWith('http') || url.startsWith('/'));
}, 'Original URL must be a valid HTTP URL or relative path');

imageSchema.path('metadata.width').validate(function(width) {
  return width > 0 && width <= 4096;
}, 'Width must be between 1 and 4096 pixels');

imageSchema.path('metadata.height').validate(function(height) {
  return height > 0 && height <= 4096;
}, 'Height must be between 1 and 4096 pixels');

clickableRegionSchema = imageSchema.path('clickableRegions');
clickableRegionSchema.validate(function(regions) {
  const ids = regions.map(r => r.id);
  return ids.length === new Set(ids).size; // Check for duplicate IDs
}, 'Clickable region IDs must be unique');

module.exports = mongoose.model('Image', imageSchema);
