const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  certificateId: {
    type: String,
    unique: true
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C'],
    default: 'B'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Generate unique certificate ID before saving
certificateSchema.pre('save', async function(next) {
  if (!this.certificateId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.certificateId = `INSIGHT-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
