const mongoose = require('mongoose');

// Define User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['owner', 'admin'],
    default: 'admin'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  Created_Date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
