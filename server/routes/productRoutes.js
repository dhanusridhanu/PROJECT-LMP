const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, requireApprovedSeller } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public catalog routes
router.get('/', productController.getAllProducts);
router.get('/:identifier', productController.getProductByIdOrSlug);

// Seller dashboard: get current artisan's products
router.get(
  '/seller/my-products',
  authenticate,
  authorize('seller'),
  productController.getMySellerProducts
);

// Seller product creation (must be an approved seller, max 5 images)
router.post(
  '/',
  authenticate,
  requireApprovedSeller,
  upload.array('images', 5),
  productController.createProduct
);

// Update product (seller owner or admin)
router.put(
  '/:id',
  authenticate,
  authorize('seller', 'admin'),
  productController.updateProduct
);

// Delete/deactivate product (seller owner or admin)
router.delete(
  '/:id',
  authenticate,
  authorize('seller', 'admin'),
  productController.deleteProduct
);

module.exports = router;
