const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Generate signed JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register User (Buyer or Artisan/Seller)
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const client = await db.getClient();
  try {
    const { full_name, email, password, role = 'buyer', phone, address, shop_name, bio, craft_type } = req.body;

    // Basic input validation
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full_name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "buyer" or "seller". Admin accounts cannot be self-registered.',
      });
    }

    if (role === 'seller' && !shop_name) {
      return res.status(400).json({
        success: false,
        message: 'Sellers must provide a unique shop_name.',
      });
    }

    // Begin atomic database transaction
    await client.query('BEGIN');

    // Check if email is already taken
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // If registering as seller, check if shop name is already taken
    if (role === 'seller') {
      const existingShop = await client.query('SELECT id FROM sellers WHERE LOWER(shop_name) = $1', [shop_name.toLowerCase().trim()]);
      if (existingShop.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'This shop name is already registered by another artisan.',
        });
      }
    }

    // Hash password using bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into users table
    const userInsertResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, role, phone, address, created_at`,
      [full_name.trim(), email.toLowerCase().trim(), passwordHash, role, phone || null, address || null]
    );

    const newUser = userInsertResult.rows[0];
    let sellerProfile = null;

    // If role is seller, insert into sellers table with status 'pending'
    if (role === 'seller') {
      const sellerInsertResult = await client.query(
        `INSERT INTO sellers (user_id, shop_name, bio, craft_type, approval_status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id AS seller_id, shop_name, bio, craft_type, approval_status`,
        [newUser.id, shop_name.trim(), bio || null, craft_type || null]
      );
      sellerProfile = sellerInsertResult.rows[0];
    } else {
      // If buyer, create an empty shopping cart for them
      await client.query('INSERT INTO carts (user_id) VALUES ($1)', [newUser.id]);
    }

    await client.query('COMMIT');

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: role === 'seller' 
        ? 'Artisan registration submitted! Your profile is pending Admin approval.'
        : 'Buyer registration successful!',
      token,
      user: {
        ...newUser,
        seller: sellerProfile,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Login User
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Query user by email
    const result = await db.query(
      'SELECT id, full_name, email, password_hash, role, phone, address FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];

    // Compare plain-text password with stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // If user is a seller, fetch their seller profile and approval status
    let sellerProfile = null;
    if (user.role === 'seller') {
      const sellerRes = await db.query(
        'SELECT id AS seller_id, shop_name, bio, craft_type, approval_status, approved_at FROM sellers WHERE user_id = $1',
        [user.id]
      );
      if (sellerRes.rows.length > 0) {
        sellerProfile = sellerRes.rows[0];
      }
    }

    const token = generateToken(user);

    // Omit password_hash from the returned payload
    const { password_hash, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        ...safeUser,
        seller: sellerProfile,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

/**
 * Get Current User Profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        ...req.user,
        seller: req.seller || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
