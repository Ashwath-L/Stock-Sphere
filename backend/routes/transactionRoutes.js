const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Transaction routes (All protected by JWT verification)
router.get('/', authenticateToken, transactionController.getTransactions);
router.post('/', authenticateToken, transactionController.createTransaction);

module.exports = router;
