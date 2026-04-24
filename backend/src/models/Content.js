const mongoose = require('mongoose');

const clickableRegionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['label', 'component', 'area', 'button'],
    required: true 
  },
  coordinates: {
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 }
  },
  content: { type: String, required: true },
  action: { 
    type: String, 
    enum: ['show-detail', 'navigate', 'highlight', 'play-animation'],
    default: 'show-detail' 
  },
  target: { type: String }, // For navigation actions
  metadata: mongoose.Schema.Types.Mixed
});

const stepSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  order: { type: Number, required: true, min: 0 },
  imageId: { type: String, ref: 'Image' },
  imagePrompt: { type: String, maxlength: 1000 },
  clickableRegions: [clickableRegionSchema],
  keyPoints: [{ type: String, maxlength: 200 }],
  code: { type: String, maxlength: 2000 },
  complexity: { type: String, enum: ['O(1)', 'O(n)', 'O(n²)', 'O(log n)', 'O(n log n)'] },
  estimatedTime: { type: Number }, // in minutes
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  }
});

const labelSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true, maxlength: 100 },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  connections: [{ type: String }], // IDs of connected labels
  description: { type: String, maxlength: 500 },
  importance: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
});

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true, maxlength: 100 },
  level: { type: Number, required: true, min: 0 },
  parentId: { type: String },
  children: [{ type: String }],
  description: { type: String, maxlength: 500 },
  metadata: mongoose.Schema.Types.Mixed
});

const comparisonItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, maxlength: 100 },
  properties: mongoose.Schema.Types.Mixed,
  description: { type: String, maxlength: 1000 },
  advantages: [{ type: String, maxlength: 200 }],
  disadvantages: [{ type: String, maxlength: 200 }],
  useCases: [{ type: String, maxlength: 200 }]
});

const contentSchema = new mongoose.Schema({
  topicId: { 
    type: String, 
    ref: 'Topic', 
    required: true
  },
  type: { 
    type: String, 
    enum: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'],
    required: true
  },
  
  // Type-specific data
  data: {
    // For structure type
    labels: [labelSchema],
    imagePrompt: { type: String, maxlength: 1000 },
    
    // For process/algorithm type
    steps: [stepSchema],
    totalEstimatedTime: { type: Number }, // in minutes
    
    // For hierarchy type
    nodes: [nodeSchema],
    rootNodes: [{ type: String }],
    
    // For comparison type
    items: [comparisonItemSchema],
    comparisonCriteria: [{ type: String, maxlength: 100 }],
    
    // Common fields
    summary: { type: String, maxlength: 1000 },
    learningObjectives: [{ type: String, maxlength: 200 }],
    prerequisites: [{ type: String, maxlength: 200 }]
  },
  
  generation: {
    model: { type: String, required: true },
    prompt: { type: String, required: true },
    tokensUsed: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    generatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1, min: 1 },
    quality: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  
  // Content management
  status: {
    type: String,
    enum: ['draft', 'ready', 'published', 'archived'],
    default: 'ready'
  },
  
  // User interactions
  interactions: {
    viewCount: { type: Number, default: 0, min: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    averageTimeSpent: { type: Number, default: 0 }, // in minutes
    feedback: [{
      userId: String,
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  
  // Caching and optimization
  cacheKey: { type: String },
  lastAccessed: { type: Date, default: Date.now },
  accessFrequency: { type: Number, default: 0, min: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
contentSchema.index({ cacheKey: 1 });
contentSchema.index({ topicId: 1, type: 1 });
contentSchema.index({ 'generation.model': 1 });
contentSchema.index({ status: 1, 'interactions.viewCount': -1 });
contentSchema.index({ lastAccessed: -1 });

// Virtual for images
contentSchema.virtual('images', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'contentId'
});

// Virtual for completion status
contentSchema.virtual('isComplete').get(function() {
  if (this.data.steps) {
    return this.data.steps.length > 0;
  }
  if (this.data.labels) {
    return this.data.labels.length > 0;
  }
  if (this.data.nodes) {
    return this.data.nodes.length > 0;
  }
  if (this.data.items) {
    return this.data.items.length > 0;
  }
  return false;
});

// Pre-save middleware
contentSchema.pre('save', function(next) {
  // Generate cache key
  if (this.isModified('data') || this.isNew) {
    this.cacheKey = `content:${this.topicId}:${this.type}:${this.generation.version}`;
  }
  
  // Calculate total estimated time for process/algorithm
  if (this.data.steps && this.isModified('data.steps')) {
    this.data.totalEstimatedTime = this.data.steps.reduce(
      (total, step) => total + (step.estimatedTime || 0), 
      0
    );
  }
  
  next();
});

// Instance methods
contentSchema.methods.incrementViews = function() {
  this.interactions.viewCount += 1;
  this.lastAccessed = new Date();
  this.accessFrequency += 1;
  return this.save();
};

contentSchema.methods.addFeedback = function(userId, rating, comment = null) {
  // Remove existing feedback from same user
  this.interactions.feedback = this.interactions.feedback.filter(
    feedback => feedback.userId !== userId
  );
  
  // Add new feedback
  this.interactions.feedback.push({ userId, rating, comment });
  
  return this.save();
};

contentSchema.methods.getStepByIndex = function(index) {
  if (!this.data.steps) return null;
  return this.data.steps.find(step => step.order === index);
};

contentSchema.methods.getNextStep = function(currentStepId) {
  if (!this.data.steps) return null;
  const currentIndex = this.data.steps.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === this.data.steps.length - 1) return null;
  return this.data.steps[currentIndex + 1];
};

contentSchema.methods.getPreviousStep = function(currentStepId) {
  if (!this.data.steps) return null;
  const currentIndex = this.data.steps.findIndex(step => step.id === currentStepId);
  if (currentIndex <= 0) return null;
  return this.data.steps[currentIndex - 1];
};

// Static methods
contentSchema.statics.findByTopicAndType = function(topicId, type) {
  return this.findOne({ topicId, type }).sort({ 'generation.version': -1 });
};

contentSchema.statics.getPopularContent = function(limit = 10, type = null) {
  const query = { status: 'published' };
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ 'interactions.viewCount': -1, 'interactions.completionRate': -1 })
    .limit(limit);
};

contentSchema.statics.getContentByModel = function(model, limit = 20) {
  return this.find({ 'generation.model': model, status: 'published' })
    .sort({ 'generation.generatedAt': -1 })
    .limit(limit);
};

// Validation
contentSchema.pre('save', function(next) {
  // At least one data type must be present
  if (this.data && !(this.data.labels || this.data.steps || this.data.nodes || this.data.items)) {
    return next(new Error('Content data must contain at least one valid data type (labels, steps, nodes, or items)'));
  }
  next();
});

stepSchema.path('order').validate(function(order) {
  return order >= 0;
}, 'Step order must be non-negative');

module.exports = mongoose.model('Content', contentSchema);
