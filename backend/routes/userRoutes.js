const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireOwner } = require('../middleware/authMiddleware');

// User & Authentication Routes
router.post('/login', userController.loginUser);
router.get('/', authenticateToken, requireOwner, userController.getAdmins);
router.post('/', authenticateToken, requireOwner, userController.createAdmin);
router.put('/:id/reset', authenticateToken, requireOwner, userController.resetAdminPassword);
router.delete('/:id', authenticateToken, requireOwner, userController.deleteAdmin);

module.exports = router;
