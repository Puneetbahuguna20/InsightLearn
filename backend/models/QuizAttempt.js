const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0
  },
  answers: [{
    questionId: String,
    selectedOption: Number,
    isCorrect: Boolean
  }],
  accuracy: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Static method to get user's quiz stats
quizAttemptSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$accuracy' },
        totalCorrect: { $sum: '$correctAnswers' },
        totalQuestions: { $sum: '$totalQuestions' },
        bestScore: { $max: '$accuracy' }
      }
    }
  ]);
  return stats[0] || { totalAttempts: 0, averageScore: 0, totalCorrect: 0, totalQuestions: 0, bestScore: 0 };
};

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
