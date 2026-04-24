const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastStudied: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to ensure one progress record per user-topic
learningProgressSchema.index({ user: 1, topic: 1 }, { unique: true });

// Static method to get user's learning stats
learningProgressSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalTopics: { $sum: 1 },
        completedTopics: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        totalStudyTime: { $sum: '$timeSpent' },
        averageProgress: { $avg: '$progress' }
      }
    }
  ]);
  return stats[0] || { totalTopics: 0, completedTopics: 0, totalStudyTime: 0, averageProgress: 0 };
};

// Get study streak
learningProgressSchema.statics.getStudyStreak = async function(userId) {
  const progress = await this.find({ user: userId })
    .sort({ lastStudied: -1 })
    .select('lastStudied');
  
  if (!progress.length) return 0;
  
  const studiedDates = new Set(
    progress.map(p => p.lastStudied.toDateString())
  );
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Check if they studied today or yesterday to start the streak count
  const today = currentDate.toDateString();
  const yesterday = new Date(currentDate.getTime() - 86400000).toDateString();
  
  let checkDate = studiedDates.has(today) ? currentDate : (studiedDates.has(yesterday) ? new Date(currentDate.getTime() - 86400000) : null);
  
  if (!checkDate) {
    // Even if no activity today/yesterday, if they HAVE history, count it as 1 day
    return progress.length > 0 ? 1 : 0;
  }
  
  while (studiedDates.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return Math.max(streak, 1);
};

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
