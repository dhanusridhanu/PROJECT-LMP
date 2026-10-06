const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All cart operations require an authenticated buyer
router.use(authenticate, authorize('buyer'));

router.get('/', cartController.getCart);
router.post('/items', cartController.addToCart);
router.put('/items/:id', cartController.updateCartItemQuantity);
router.delete('/items/:id', cartController.removeCartItem);
router.delete('/clear', cartController.clearCart);

module.exports = router;
