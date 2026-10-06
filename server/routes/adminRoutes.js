const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Restrict entire router to authenticated Admin users
router.use(authenticate, authorize('admin'));

// Seller approvals & management
router.get('/sellers', adminController.getSellers);
router.put('/sellers/:id/approval', adminController.updateSellerApproval);

// Platform analytics
router.get('/dashboard', adminController.getDashboardStats);

// Orders overview
router.get('/orders', adminController.getAllOrders);

module.exports = router;
