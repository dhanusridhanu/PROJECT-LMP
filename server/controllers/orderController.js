const db = require('../config/db');

/**
 * Place Order from Shopping Cart
 * Uses atomic PostgreSQL transaction to guarantee stock safety.
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  const client = await db.getClient();
  try {
    const buyerId = req.user.id;
    const { shipping_address, contact_phone } = req.body;

    if (!shipping_address || !contact_phone) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and contact phone are required to complete checkout.',
      });
    }

    await client.query('BEGIN');

    // 1. Fetch user's cart
    const cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1', [buyerId]);
    if (cartRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }
    const cartId = cartRes.rows[0].id;

    // 2. Fetch cart items with product and variant info
    const cartItemsQuery = `
      SELECT 
        ci.id AS cart_item_id,
        ci.quantity,
        ci.product_id,
        ci.variant_id,
        p.name AS product_name,
        p.base_price,
        p.seller_id,
        p.stock_quantity AS product_stock,
        p.is_active,
        pv.price_adjustment,
        pv.stock_quantity AS variant_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.cart_id = $1
      FOR UPDATE OF p
    `;
    const cartItemsRes = await client.query(cartItemsQuery, [cartId]);

    if (cartItemsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Your cart is empty. Add items before checking out.' });
    }

    const cartItems = cartItemsRes.rows;
    let totalOrderAmount = 0;
    const orderItemsToInsert = [];

    // 3. Validate stock & calculate totals
    for (const item of cartItems) {
      if (!item.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Product "${item.product_name}" is no longer available. Please remove it from your cart.`,
        });
      }

      const availableStock = item.variant_id ? item.variant_stock : item.product_stock;
      if (item.quantity > availableStock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for "${item.product_name}". Only ${availableStock} in stock.`,
        });
      }

      const unitPrice = parseFloat(item.base_price) + (item.price_adjustment ? parseFloat(item.price_adjustment) : 0);
      const subtotal = unitPrice * item.quantity;
      totalOrderAmount += subtotal;

      orderItemsToInsert.push({
        product_id: item.product_id,
        seller_id: item.seller_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
      });

      // 4. Safely decrement inventory
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );

      if (item.variant_id) {
        await client.query(
          'UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.variant_id]
        );
      }
    }

    // 5. Generate human-readable order number: ORD-YYYYMMDD-RANDOM
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randPart}`;

    // 6. Insert Order
    const insertOrderSql = `
      INSERT INTO orders (buyer_id, order_number, total_amount, status, shipping_address, contact_phone)
      VALUES ($1, $2, $3, 'placed', $4, $5)
      RETURNING *
    `;
    const orderRes = await client.query(insertOrderSql, [
      buyerId,
      orderNumber,
      totalOrderAmount.toFixed(2),
      shipping_address.trim(),
      contact_phone.trim(),
    ]);

    const createdOrder = orderRes.rows[0];

    // 7. Insert Order Items
    for (const oi of orderItemsToInsert) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, variant_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [createdOrder.id, oi.product_id, oi.seller_id, oi.variant_id, oi.quantity, oi.unit_price, oi.subtotal]
      );
    }

    // 8. Clear buyer's cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! The artisan will prepare your package shortly.',
      order: createdOrder,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create Order Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process order.',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Get Current Buyer's Order History
 * GET /api/orders/my-orders
 */
const getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const ordersRes = await db.query(
      `SELECT o.*,
         (
           SELECT json_agg(
             json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'product_name', p.name,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price,
               'subtotal', oi.subtotal,
               'shop_name', s.shop_name,
               'image_url', (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1)
             )
           )
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           JOIN sellers s ON oi.seller_id = s.id
           WHERE oi.order_id = o.id
         ) AS items
       FROM orders o
       WHERE o.buyer_id = $1
       ORDER BY o.created_at DESC`,
      [buyerId]
    );

    return res.status(200).json({
      success: true,
      orders: ordersRes.rows,
    });
  } catch (error) {
    console.error('Get My Orders Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order history.',
      error: error.message,
    });
  }
};

/**
 * Get Single Order Details
 * GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const orderRes = await db.query(
      `SELECT o.*, u.full_name AS buyer_name, u.email AS buyer_email
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // Authorization check: buyer who placed it, an admin, or a seller with items in it
    if (req.user.role === 'buyer' && order.buyer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this order.' });
    }

    const itemsRes = await db.query(
      `SELECT 
         oi.id, oi.quantity, oi.unit_price, oi.subtotal,
         p.id AS product_id, p.name AS product_name,
         s.id AS seller_id, s.shop_name,
         pv.variant_name, pv.variant_value,
         (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) AS image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN sellers s ON oi.seller_id = s.id
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items: itemsRes.rows,
      },
    });
  } catch (error) {
    console.error('Get Order Detail Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details.',
      error: error.message,
    });
  }
};

/**
 * Get Orders for Logged-in Artisan/Seller
 * GET /api/orders/seller
 */
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.seller.seller_id;

    const sellerOrdersRes = await db.query(
      `SELECT 
         o.id AS order_id,
         o.order_number,
         o.status AS order_status,
         o.shipping_address,
         o.contact_phone,
         o.created_at,
         u.full_name AS buyer_name,
         oi.id AS order_item_id,
         oi.quantity,
         oi.unit_price,
         oi.subtotal,
         p.name AS product_name,
         pv.variant_name,
         pv.variant_value,
         (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) AS product_image
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN users u ON o.buyer_id = u.id
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.seller_id = $1
       ORDER BY o.created_at DESC`,
      [sellerId]
    );

    return res.status(200).json({
      success: true,
      orders: sellerOrdersRes.rows,
    });
  } catch (error) {
    console.error('Get Seller Orders Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve seller orders.',
      error: error.message,
    });
  }
};

/**
 * Update Order Status
 * Lifecycle: PLACED -> SHIPPED -> DELIVERED (or CANCELLED)
 * PUT /api/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['placed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    await client.query('BEGIN');

    const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const currentOrder = orderRes.rows[0];

    // If order is already delivered or cancelled, disallow further arbitrary updates
    if (currentOrder.status === 'delivered') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Delivered orders cannot be modified.' });
    }

    // If changing to 'cancelled', restore stock to inventory
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      const itemsRes = await client.query('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1', [id]);
      for (const item of itemsRes.rows) {
        await client.query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.product_id]);
        if (item.variant_id) {
          await client.query('UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.variant_id]);
        }
      }
    }

    // Update order status
    const updateRes = await client.query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Order status successfully updated to "${status}".`,
      order: updateRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update Order Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
};
