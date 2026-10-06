const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, requireApprovedSeller } = require('../middleware/roleMiddleware');

// Buyer places order from cart
router.post('/', authenticate, authorize('buyer'), orderController.createOrder);

// Buyer views their past orders
router.get('/my-orders', authenticate, authorize('buyer'), orderController.getMyOrders);

// Seller views incoming orders for their handcrafted items
router.get('/seller', authenticate, requireApprovedSeller, orderController.getSellerOrders);

// View order details (Buyer, Seller, Admin)
router.get('/:id', authenticate, orderController.getOrderById);

// Update order status (Seller or Admin)
router.put('/:id/status', authenticate, authorize('seller', 'admin'), orderController.updateOrderStatus);

module.exports = router;
