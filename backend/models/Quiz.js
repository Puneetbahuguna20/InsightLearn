const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  questionCount: {
    type: Number,
    required: true
  },
  questions: [{
    id: String,
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
    difficulty: String
  }],
  language: {
    type: String,
    default: 'en'
  }
}, {
  timestamps: true
});

// Compound index for fast lookup of exact quiz configurations
quizSchema.index({ topic: 1, difficulty: 1, questionCount: 1, language: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
