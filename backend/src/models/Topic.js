const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    default: () => new mongoose.Types.ObjectId().toString() 
  },
  originalText: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 500
  },
  normalizedText: { 
    type: String, 
    required: true, 
    index: true,
    lowercase: true,
    trim: true
  },
  classification: {
    type: { 
      type: String, 
      enum: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'],
      required: true 
    },
    confidence: { 
      type: Number, 
      min: 0, 
      max: 1, 
      required: true 
    },
    model: { 
      type: String, 
      required: true 
    },
    classifiedAt: { 
      type: Date, 
      default: Date.now 
    },
    reasoning: {
      type: String,
      maxlength: 500
    }
  },
  metadata: {
    userId: { 
      type: String, 
      index: true 
    },
    language: { 
      type: String, 
      default: 'en',
      lowercase: true
    },
    complexity: { 
      type: String, 
      enum: ['basic', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    domain: { 
      type: String, 
      index: true,
      lowercase: true
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }]
  },
  usage: {
    requestCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    lastAccessed: { 
      type: Date, 
      default: Date.now 
    },
    popularity: { 
      type: Number, 
      default: 0,
      min: 0
    },
    averageRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'flagged'],
    default: 'active'
  },
  similarTopics: [{
    topicId: String,
    similarity: Number,
    matchedAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
topicSchema.index({ 'normalizedText': 'text', 'classification.type': 1 });
topicSchema.index({ 'metadata.domain': 1, 'classification.type': 1 });
topicSchema.index({ 'usage.popularity': -1 });
topicSchema.index({ 'usage.lastAccessed': -1 });
topicSchema.index({ createdAt: -1 });

// Virtual for content count
topicSchema.virtual('contentCount', {
  ref: 'Content',
  localField: '_id',
  foreignField: 'topicId',
  count: true
});

// Pre-save middleware to normalize text
topicSchema.pre('save', function(next) {
  if (this.isModified('originalText')) {
    this.normalizedText = this.originalText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  next();
});

// Instance methods
topicSchema.methods.incrementUsage = function() {
  this.usage.requestCount += 1;
  this.usage.lastAccessed = new Date();
  this.usage.popularity = Math.min(100, this.usage.popularity + 0.1);
  return this.save();
};

topicSchema.methods.addRating = function(rating) {
  const currentTotal = this.usage.averageRating * this.usage.ratingCount;
  this.usage.ratingCount += 1;
  this.usage.averageRating = (currentTotal + rating) / this.usage.ratingCount;
  return this.save();
};

topicSchema.methods.addSimilarTopic = function(topicId, similarity) {
  // Remove existing similar topic if present
  this.similarTopics = this.similarTopics.filter(
    similar => similar.topicId !== topicId
  );
  
  // Add new similar topic
  this.similarTopics.push({ topicId, similarity });
  
  // Keep only top 5 similar topics
  this.similarTopics.sort((a, b) => b.similarity - a.similarity);
  this.similarTopics = this.similarTopics.slice(0, 5);
  
  return this.save();
};

// Static methods
topicSchema.statics.findByText = function(searchText) {
  const normalized = searchText.toLowerCase().replace(/[^\w\s]/g, '').trim();
  return this.findOne({ normalizedText: normalized });
};

topicSchema.statics.findSimilar = function(topic, limit = 5) {
  return this.find({
    _id: { $ne: topic._id },
    'classification.type': topic.classification.type,
    'metadata.domain': topic.metadata.domain,
    status: 'active'
  })
  .sort({ 'usage.popularity': -1 })
  .limit(limit);
};

topicSchema.statics.getPopularTopics = function(limit = 10, domain = null) {
  const query = { status: 'active' };
  if (domain) {
    query['metadata.domain'] = domain;
  }
  
  return this.find(query)
    .sort({ 'usage.popularity': -1, 'usage.requestCount': -1 })
    .limit(limit);
};

topicSchema.statics.getTopicsByType = function(type, limit = 20) {
  return this.find({ 
    'classification.type': type,
    status: 'active'
  })
  .sort({ 'usage.requestCount': -1 })
  .limit(limit);
};

// Validation
topicSchema.path('originalText').validate(function(text) {
  return text && text.trim().length >= 3;
}, 'Topic text must be at least 3 characters long');

topicSchema.path('classification.confidence').validate(function(confidence) {
  return confidence >= 0 && confidence <= 1;
}, 'Confidence must be between 0 and 1');

module.exports = mongoose.model('Topic', topicSchema);
