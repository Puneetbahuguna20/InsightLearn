const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison', 'concept'],
    required: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for search
contentSchema.index({ title: 'text', description: 'text', topic: 'text' });

module.exports = mongoose.model('Content', contentSchema);
