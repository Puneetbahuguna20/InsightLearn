const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['algorithm', 'concept', 'general', 'quiz', 'revision'],
    default: 'general'
  }
}, {
  timestamps: true
});

// Index for faster searching
searchHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
