const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Product API routes (All routes protected by JWT verification)
router.get('/', authenticateToken, productController.getProducts);
router.get('/stats', authenticateToken, productController.getDashboardStats);
router.get('/reports-stats', authenticateToken, productController.getReportsStats);
router.get('/:id', authenticateToken, productController.getProductById);
router.post('/', authenticateToken, productController.createProduct);
router.put('/:id', authenticateToken, productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

module.exports = router;
