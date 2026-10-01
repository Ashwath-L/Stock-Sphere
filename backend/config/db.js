const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Fallback to local MongoDB if environment variable is not set
    const connURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocksphere';
    const conn = await mongoose.connect(connURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
