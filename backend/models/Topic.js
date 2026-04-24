const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  topic: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['programming', 'science', 'math', 'history', 'language'],
    default: 'programming'
  },
  description: { 
    type: String, 
    maxlength: 1000 
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

module.exports = mongoose.model('Topic', topicSchema);
