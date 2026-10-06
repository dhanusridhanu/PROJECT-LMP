const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Authentication Middleware
 * Validates the JWT token passed in the 'Authorization: Bearer <token>' header.
 * Attaches the authenticated user details to `req.user`.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authorization header.',
      });
    }

    // Verify token using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to verify user exists and account status
    const result = await db.query(
      'SELECT id, full_name, email, role, phone, address FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User no longer exists.',
      });
    }

    // Attach user information to request
    req.user = result.rows[0];

    // If the user is a seller, also fetch seller profile info (approval status, shop name)
    if (req.user.role === 'seller') {
      const sellerResult = await db.query(
        'SELECT id AS seller_id, shop_name, approval_status, craft_type FROM sellers WHERE user_id = $1',
        [req.user.id]
      );
      if (sellerResult.rows.length > 0) {
        req.seller = sellerResult.rows[0];
      }
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged authentication token.',
    });
  }
};

module.exports = {
  authenticate,
};
