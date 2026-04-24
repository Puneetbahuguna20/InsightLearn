const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Profile Fields
  fullName: { type: String, trim: true },
  age: { type: Number, min: 5, max: 100 },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer not to say'] },
  education: {
    level: { type: String, enum: ['school', 'college', 'other'], default: 'school' },
    schoolDetails: {
      class: { type: String }, // e.g., "11", "12"
      stream: { type: String, enum: ['arts', 'science', 'commerce', 'none'], default: 'none' }
    },
    collegeDetails: {
      degree: { type: String }, // e.g., "B.Tech", "B.Sc"
      year: { type: String }
    }
  },
  interests: [{ type: String }],
  bio: { type: String, maxlength: 200 },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
