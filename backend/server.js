const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

// Initialize database connection
connectDB();

// Seed default users if database is empty
const seedDefaultUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const salt = await bcrypt.genSalt(10);
      const ownerHashedPassword = await bcrypt.hash('owner123', salt);
      const adminHashedPassword = await bcrypt.hash('admin123', salt);

      // Create Default Owner
      await User.create({
        username: 'owner',
        password: ownerHashedPassword,
        role: 'owner'
      });
      console.log('Successfully seeded Default Owner: owner / owner123');

      // Create Default Admin
      await User.create({
        username: 'admin',
        password: adminHashedPassword,
        role: 'admin'
      });
      console.log('Successfully seeded Default Admin: admin / admin123');
    }
  } catch (error) {
    console.error('Error seeding default users:', error.message);
  }
};

// Seed when MongoDB connection is established
mongoose.connection.once('open', () => {
  seedDefaultUsers();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/activity-logs', require('./routes/activityLogRoutes'));

// Serve Static Frontend Assets from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback route to serve index.html for undefined frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
