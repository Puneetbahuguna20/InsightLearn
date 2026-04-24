const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  front: {
    type: String,
    required: true
  },
  back: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  lastReviewed: {
    type: Date
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  correctCount: {
    type: Number,
    default: 0
  },
  incorrectCount: {
    type: Number,
    default: 0
  },
  nextReview: {
    type: Date,
    default: Date.now
  },
  mastered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Get cards due for review
flashcardSchema.statics.getDueCards = async function(userId, limit = 10) {
  return await this.find({
    user: userId,
    nextReview: { $lte: new Date() },
    mastered: false
  }).limit(limit);
};

// Get user's flashcard stats
flashcardSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalCards: { $sum: 1 },
        masteredCards: {
          $sum: { $cond: ['$mastered', 1, 0] }
        },
        totalReviews: { $sum: '$reviewCount' }
      }
    }
  ]);
  return stats[0] || { totalCards: 0, masteredCards: 0, totalReviews: 0 };
};

module.exports = mongoose.model('Flashcard', flashcardSchema);
