const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// POST /users/login - Authenticate user
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user in database
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    // Compare passwords using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    // Store previous login before updating
    const previousLogin = user.lastLogin;

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      username: user.username,
      role: user.role,
      lastLogin: previousLogin // Return previous login to show on dashboard profile
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
};

// GET /users - Get all admin users (Owner only)
exports.getAdmins = async (req, res) => {
  try {
    // Only return admin accounts
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ Created_Date: -1 });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving admins list', error: error.message });
  }
};

// POST /users - Create a new admin user (Owner only)
exports.createAdmin = async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const trimmedUsername = username.toLowerCase().trim();

    // Check if username already exists
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to MongoDB
    const newAdmin = new User({
      username: trimmedUsername,
      password: hashedPassword,
      role: 'admin'
    });

    const savedAdmin = await newAdmin.save();

    // Log the activity
    const log = new ActivityLog({
      username: req.user.username,
      role: req.user.role,
      action: 'Admin Created',
      productName: '',
      details: `Created Admin account for "${trimmedUsername}"`
    });
    await log.save();

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: {
        _id: savedAdmin._id,
        username: savedAdmin.username,
        role: savedAdmin.role,
        Created_Date: savedAdmin.Created_Date
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin account', error: error.message });
  }
};

// PUT /users/:id/reset - Reset admin password (Owner only)
exports.resetAdminPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const targetUserId = req.params.id;

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Protect Owner account
    if (targetUser.role === 'owner') {
      return res.status(403).json({ message: 'Owner password cannot be modified from the Admin Management module' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    targetUser.password = hashedPassword;
    await targetUser.save();

    // Log the activity
    const log = new ActivityLog({
      username: req.user.username,
      role: req.user.role,
      action: 'Admin Password Reset',
      productName: '',
      details: `Reset password for Admin "${targetUser.username}"`
    });
    await log.save();

    res.status(200).json({ message: `Password for admin "${targetUser.username}" has been reset successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

// DELETE /users/:id - Delete an admin user (Owner only)
exports.deleteAdmin = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Find user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Protect Owner account
    if (targetUser.role === 'owner') {
      return res.status(403).json({ message: 'The Owner account can never be deleted' });
    }

    // Perform delete
    await User.findByIdAndDelete(targetUserId);

    // Log the activity
    const log = new ActivityLog({
      username: req.user.username,
      role: req.user.role,
      action: 'Admin Deleted',
      productName: '',
      details: `Deleted Admin account for "${targetUser.username}"`
    });
    await log.save();

    res.status(200).json({ message: `Admin account "${targetUser.username}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin account', error: error.message });
  }
};
