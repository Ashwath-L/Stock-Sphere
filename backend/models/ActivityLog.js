const mongoose = require('mongoose');

// Define Activity Log Schema
const activityLogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['owner', 'admin']
  },
  action: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    required: true
  },
  Timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
