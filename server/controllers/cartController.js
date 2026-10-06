const db = require('../config/db');

/**
 * Get or create cart ID for the logged in user
 */
const getOrCreateUserCartId = async (userId) => {
  let cartRes = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (cartRes.rows.length === 0) {
    cartRes = await db.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
  }
  return cartRes.rows[0].id;
};

/**
 * Get Buyer Shopping Cart
 * GET /api/cart
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartId = await getOrCreateUserCartId(userId);

    const itemsQuery = `
      SELECT 
        ci.id AS cart_item_id,
        ci.quantity,
        ci.added_at,
        p.id AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        p.base_price,
        p.stock_quantity AS product_stock,
        p.is_active,
        pv.id AS variant_id,
        pv.variant_name,
        pv.variant_value,
        pv.price_adjustment,
        pv.stock_quantity AS variant_stock,
        (p.base_price + COALESCE(pv.price_adjustment, 0.00)) AS effective_unit_price,
        ((p.base_price + COALESCE(pv.price_adjustment, 0.00)) * ci.quantity) AS item_subtotal,
        COALESCE(
          (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC LIMIT 1),
          '/placeholder-craft.jpg'
        ) AS primary_image,
        s.shop_name,
        s.id AS seller_id
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN sellers s ON p.seller_id = s.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.cart_id = $1
      ORDER BY ci.added_at DESC
    `;

    const result = await db.query(itemsQuery, [cartId]);

    // Calculate cart total
    let totalAmount = 0;
    const items = result.rows.map((item) => {
      const subtotal = parseFloat(item.item_subtotal);
      totalAmount += subtotal;
      return {
        ...item,
        effective_unit_price: parseFloat(item.effective_unit_price),
        item_subtotal: subtotal,
      };
    });

    return res.status(200).json({
      success: true,
      cart: {
        cart_id: cartId,
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Get Cart Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve shopping cart.',
      error: error.message,
    });
  }
};

/**
 * Add Item to Cart
 * POST /api/cart/items
 */
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, variant_id = null, quantity = 1 } = req.body;

    const qty = parseInt(quantity, 10);
    if (!product_id || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product_id and quantity (> 0) required.' });
    }

    // Verify product exists and is active
    const prodRes = await db.query('SELECT id, name, stock_quantity, is_active FROM products WHERE id = $1', [product_id]);
    if (prodRes.rows.length === 0 || !prodRes.rows[0].is_active) {
      return res.status(404).json({ success: false, message: 'Product is unavailable or does not exist.' });
    }

    let availableStock = prodRes.rows[0].stock_quantity;

    // Check variant stock if variant_id provided
    if (variant_id) {
      const varRes = await db.query('SELECT stock_quantity FROM product_variants WHERE id = $1 AND product_id = $2', [variant_id, product_id]);
      if (varRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Selected variant not found for this product.' });
      }
      availableStock = varRes.rows[0].stock_quantity;
    }

    const cartId = await getOrCreateUserCartId(userId);

    // Check if item already in cart
    const existingItemRes = await db.query(
      `SELECT id, quantity FROM cart_items 
       WHERE cart_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))`,
      [cartId, product_id, variant_id]
    );

    let newQuantity = qty;
    if (existingItemRes.rows.length > 0) {
      newQuantity = existingItemRes.rows[0].quantity + qty;
    }

    if (newQuantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} item(s) currently available in stock.`,
      });
    }

    if (existingItemRes.rows.length > 0) {
      await db.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [newQuantity, existingItemRes.rows[0].id]);
    } else {
      await db.query(
        'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4)',
        [cartId, product_id, variant_id, qty]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Product added to cart successfully.',
    });
  } catch (error) {
    console.error('Add To Cart Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to cart.',
      error: error.message,
    });
  }
};

/**
 * Update Cart Item Quantity
 * PUT /api/cart/items/:id
 */
const updateCartItemQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0.' });
    }

    const cartItemRes = await db.query(
      `SELECT ci.id, ci.product_id, ci.variant_id, p.stock_quantity AS prod_stock, pv.stock_quantity AS var_stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.id = $1`,
      [id]
    );

    if (cartItemRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    const item = cartItemRes.rows[0];
    const availableStock = item.variant_id ? item.var_stock : item.prod_stock;

    if (qty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} item(s) available in stock.`,
      });
    }

    await db.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [qty, id]);

    return res.status(200).json({
      success: true,
      message: 'Cart quantity updated.',
    });
  } catch (error) {
    console.error('Update Cart Quantity Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update item quantity.',
      error: error.message,
    });
  }
};

/**
 * Remove Item from Cart
 * DELETE /api/cart/items/:id
 */
const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM cart_items WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
    });
  } catch (error) {
    console.error('Remove Cart Item Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove cart item.',
      error: error.message,
    });
  }
};

/**
 * Clear All Items from User's Cart
 * DELETE /api/cart/clear
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartRes = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);

    if (cartRes.rows.length > 0) {
      await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartRes.rows[0].id]);
    }

    return res.status(200).json({
      success: true,
      message: 'Shopping cart cleared.',
    });
  } catch (error) {
    console.error('Clear Cart Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart.',
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
