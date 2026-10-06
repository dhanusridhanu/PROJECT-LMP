const slugify = require('slugify');
const db = require('../config/db');

/**
 * Get Public Products Catalog (with search, category filter, sorting, pagination)
 * GET /api/products
 */
const getAllProducts = async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 12 } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    let queryConditions = ['p.is_active = true', 'p.is_approved = true'];

    // Category filter by category slug or ID
    if (category) {
      params.push(category);
      queryConditions.push(`(c.slug = $${params.length} OR c.id::text = $${params.length})`);
    }

    // Keyword search filter (matches product name or description)
    if (search) {
      params.push(`%${search.trim()}%`);
      queryConditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR s.shop_name ILIKE $${params.length})`);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    // Determine Sort Order
    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.base_price ASC';
    if (sort === 'price_desc') orderBy = 'p.base_price DESC';
    if (sort === 'name_asc') orderBy = 'p.name ASC';

    // Count total matching items for pagination metadata
    const countSql = `
      SELECT COUNT(p.id)::int AS total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN sellers s ON p.seller_id = s.id
      ${whereClause}
    `;
    const countResult = await db.query(countSql, params);
    const totalItems = countResult.rows[0].total;

    // Fetch paginated products with primary image, category name, and artisan shop name
    const productsSql = `
      SELECT 
        p.id, p.name, p.slug, p.description, p.base_price, p.stock_quantity,
        p.created_at,
        c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
        s.id AS seller_id, s.shop_name, s.craft_type,
        COALESCE(
          (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1),
          '/placeholder-craft.jpg'
        ) AS primary_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN sellers s ON p.seller_id = s.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit, 10), offset);
    const result = await db.query(productsSql, params);

    return res.status(200).json({
      success: true,
      total: totalItems,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalItems / parseInt(limit, 10)),
      products: result.rows,
    });
  } catch (error) {
    console.error('Get All Products Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve products catalog.',
      error: error.message,
    });
  }
};

/**
 * Get Single Product Details by ID or Slug
 * GET /api/products/:identifier
 */
const getProductByIdOrSlug = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Query product with category and seller details
    const productResult = await db.query(
      `SELECT 
         p.id, p.name, p.slug, p.description, p.base_price, p.stock_quantity,
         p.is_approved, p.is_active, p.created_at, p.updated_at,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
         s.id AS seller_id, s.shop_name, s.bio AS seller_bio, s.craft_type
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN sellers s ON p.seller_id = s.id
       WHERE (p.slug = $1 OR p.id::text = $1)
       LIMIT 1`,
      [identifier]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const product = productResult.rows[0];

    // Fetch product images
    const imagesResult = await db.query(
      `SELECT id, image_url, is_primary, sort_order 
       FROM product_images 
       WHERE product_id = $1 
       ORDER BY is_primary DESC, sort_order ASC`,
      [product.id]
    );

    // Fetch product variants (e.g. sizes, colors)
    const variantsResult = await db.query(
      `SELECT id, variant_name, variant_value, price_adjustment, stock_quantity
       FROM product_variants
       WHERE product_id = $1
       ORDER BY variant_name ASC, variant_value ASC`,
      [product.id]
    );

    return res.status(200).json({
      success: true,
      product: {
        ...product,
        images: imagesResult.rows,
        variants: variantsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get Product Detail Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve product details.',
      error: error.message,
    });
  }
};

/**
 * Create a New Product (Approved Seller Only)
 * POST /api/products
 */
const createProduct = async (req, res) => {
  const client = await db.getClient();
  try {
    const seller_id = req.seller.seller_id;
    const { name, category_id, description, base_price, stock_quantity, variants } = req.body;

    if (!name || !category_id || !description || base_price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, category_id, description, and base_price are required.',
      });
    }

    const priceNum = parseFloat(base_price);
    const stockNum = parseInt(stock_quantity || 0, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: 'base_price must be a positive number.' });
    }

    await client.query('BEGIN');

    // Generate unique slug
    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    // Verify category exists
    const catCheck = await client.query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (catCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
    }

    // Insert Product
    const insertProductSql = `
      INSERT INTO products (seller_id, category_id, name, slug, description, base_price, stock_quantity)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const productResult = await client.query(insertProductSql, [
      seller_id,
      category_id,
      name.trim(),
      slug,
      description.trim(),
      priceNum,
      stockNum,
    ]);

    const newProduct = productResult.rows[0];

    // Handle Uploaded Images (from multer req.files)
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/${file.filename}`;
        const isPrimary = i === 0; // First uploaded image is default primary

        const imgRes = await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [newProduct.id, imageUrl, isPrimary, i]
        );
        uploadedImages.push(imgRes.rows[0]);
      }
    }

    // Handle Product Variants if provided
    let createdVariants = [];
    if (variants) {
      const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      if (Array.isArray(parsedVariants)) {
        for (const v of parsedVariants) {
          if (v.variant_name && v.variant_value) {
            const vRes = await client.query(
              `INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, stock_quantity)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING *`,
              [
                newProduct.id,
                v.variant_name.trim(),
                v.variant_value.trim(),
                parseFloat(v.price_adjustment || 0),
                parseInt(v.stock_quantity || 0, 10),
              ]
            );
            createdVariants.push(vRes.rows[0]);
          }
        }
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      product: {
        ...newProduct,
        images: uploadedImages,
        variants: createdVariants,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create Product Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product.',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Update Product (Seller Owner or Admin)
 * PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, description, base_price, stock_quantity, is_active } = req.body;

    // Check ownership unless admin
    const productCheck = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = productCheck.rows[0];
    if (req.user.role !== 'admin' && product.seller_id !== req.seller.seller_id) {
      return res.status(403).json({ success: false, message: 'You do not own this product.' });
    }

    let slug = product.slug;
    if (name && name.trim() !== product.name) {
      slug = `${slugify(name, { lower: true, strict: true })}-${Date.now().toString().slice(-4)}`;
    }

    const updateSql = `
      UPDATE products
      SET name = COALESCE($1, name),
          slug = COALESCE($2, slug),
          category_id = COALESCE($3, category_id),
          description = COALESCE($4, description),
          base_price = COALESCE($5, base_price),
          stock_quantity = COALESCE($6, stock_quantity),
          is_active = COALESCE($7, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const result = await db.query(updateSql, [
      name ? name.trim() : null,
      slug,
      category_id || null,
      description ? description.trim() : null,
      base_price !== undefined ? parseFloat(base_price) : null,
      stock_quantity !== undefined ? parseInt(stock_quantity, 10) : null,
      is_active !== undefined ? is_active : null,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: result.rows[0],
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product.',
      error: error.message,
    });
  }
};

/**
 * Delete Product (Soft delete by setting is_active = false)
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const productCheck = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = productCheck.rows[0];
    if (req.user.role !== 'admin' && product.seller_id !== req.seller.seller_id) {
      return res.status(403).json({ success: false, message: 'You do not own this product.' });
    }

    // Soft delete: keep row intact so existing order records don't break
    await db.query('UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Product removed from marketplace successfully.',
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product.',
      error: error.message,
    });
  }
};

/**
 * Get Products for Current Logged-in Seller
 * GET /api/products/seller/my-products
 */
const getMySellerProducts = async (req, res) => {
  try {
    const seller_id = req.seller.seller_id;

    const result = await db.query(
      `SELECT 
         p.id, p.name, p.slug, p.description, p.base_price, p.stock_quantity,
         p.is_approved, p.is_active, p.created_at,
         c.name AS category_name,
         COALESCE(
           (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC LIMIT 1),
           '/placeholder-craft.jpg'
         ) AS primary_image
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = $1
       ORDER BY p.created_at DESC`,
      [seller_id]
    );

    return res.status(200).json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error('Get Seller Products Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your products.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getMySellerProducts,
};
