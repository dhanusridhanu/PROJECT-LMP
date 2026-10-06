const db = require('../config/db');

/**
 * Get All Sellers (with filter for pending approvals)
 * GET /api/admin/sellers
 */
const getSellers = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        s.id AS seller_id, s.shop_name, s.bio, s.craft_type, s.approval_status, s.approved_at, s.created_at,
        u.id AS user_id, u.full_name, u.email, u.phone, u.address,
        (SELECT COUNT(p.id)::int FROM products p WHERE p.seller_id = s.id) AS product_count
      FROM sellers s
      JOIN users u ON s.user_id = u.id
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE s.approval_status = $1`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await db.query(query, params);

    return res.status(200).json({
      success: true,
      sellers: result.rows,
    });
  } catch (error) {
    console.error('Admin Get Sellers Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve sellers.',
      error: error.message,
    });
  }
};

/**
 * Approve or Reject Seller Registration
 * PUT /api/admin/sellers/:id/approval
 */
const updateSellerApproval = async (req, res) => {
  const client = await db.getClient();
  try {
    const { id } = req.params; // seller_id
    const { action, remarks } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approved" or "rejected".',
      });
    }

    await client.query('BEGIN');

    const sellerCheck = await client.query('SELECT * FROM sellers WHERE id = $1', [id]);
    if (sellerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    // Update seller status
    const approvedAt = action === 'approved' ? 'CURRENT_TIMESTAMP' : 'NULL';
    const updateSellerSql = `
      UPDATE sellers 
      SET approval_status = $1, 
          approved_at = ${action === 'approved' ? 'CURRENT_TIMESTAMP' : 'NULL'}
      WHERE id = $2
      RETURNING *
    `;
    const updatedSellerRes = await client.query(updateSellerSql, [action, id]);

    // Record in audit log
    await client.query(
      `INSERT INTO seller_approvals (seller_id, reviewed_by, action, remarks)
       VALUES ($1, $2, $3, $4)`,
      [id, req.user.id, action, remarks || null]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Artisan status updated to "${action}".`,
      seller: updatedSellerRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin Update Approval Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update artisan status.',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Get Platform Dashboard Metrics
 * GET /api/admin/dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE role = 'buyer') AS total_buyers,
        (SELECT COUNT(*)::int FROM sellers WHERE approval_status = 'approved') AS total_active_sellers,
        (SELECT COUNT(*)::int FROM sellers WHERE approval_status = 'pending') AS pending_seller_approvals,
        (SELECT COUNT(*)::int FROM products WHERE is_active = true) AS total_active_products,
        (SELECT COUNT(*)::int FROM orders) AS total_orders,
        COALESCE((SELECT SUM(total_amount)::numeric(10,2) FROM orders WHERE status != 'cancelled'), 0.00) AS total_gross_revenue
    `;

    const statsRes = await db.query(statsQuery);

    return res.status(200).json({
      success: true,
      stats: statsRes.rows[0],
    });
  } catch (error) {
    console.error('Admin Dashboard Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard metrics.',
      error: error.message,
    });
  }
};

/**
 * Get All Platform Orders (Admin View)
 * GET /api/admin/orders
 */
const getAllOrders = async (req, res) => {
  try {
    const ordersRes = await db.query(
      `SELECT o.*, u.full_name AS buyer_name, u.email AS buyer_email,
              COUNT(oi.id)::int AS item_count
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id, u.full_name, u.email
       ORDER BY o.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      orders: ordersRes.rows,
    });
  } catch (error) {
    console.error('Admin Get All Orders Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders.',
      error: error.message,
    });
  }
};

module.exports = {
  getSellers,
  updateSellerApproval,
  getDashboardStats,
  getAllOrders,
};
