const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    default: 'general'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file']
    },
    url: String,
    name: String
  }]
}, {
  timestamps: true
});

// Get chat history for user
chatMessageSchema.statics.getUserChat = async function(userId, limit = 50) {
  return await this.find({ user: userId })
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Get chat by topic
chatMessageSchema.statics.getTopicChat = async function(userId, topic, limit = 50) {
  return await this.find({ user: userId, topic })
    .sort({ createdAt: 1 })
    .limit(limit);
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
