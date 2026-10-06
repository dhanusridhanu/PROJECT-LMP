const slugify = require('slugify');
const db = require('../config/db');

/**
 * Get All Categories
 * GET /api/categories
 */
const getAllCategories = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.created_at,
              COUNT(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
       GROUP BY c.id
       ORDER BY c.name ASC`
    );

    return res.status(200).json({
      success: true,
      categories: result.rows,
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories.',
      error: error.message,
    });
  }
};

/**
 * Create a Category (Admin Only)
 * POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, image_url } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const slug = slugify(name, { lower: true, strict: true });

    // Check if category name or slug already exists
    const existing = await db.query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name or slug already exists.',
      });
    }

    const result = await db.query(
      `INSERT INTO categories (name, slug, description, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), slug, description || null, image_url || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Create Category Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create category.',
      error: error.message,
    });
  }
};

/**
 * Update a Category (Admin Only)
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url } = req.body;

    const current = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    let slug = current.rows[0].slug;
    if (name && name.trim() !== current.rows[0].name) {
      slug = slugify(name, { lower: true, strict: true });
    }

    const result = await db.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url)
       WHERE id = $5
       RETURNING *`,
      [name ? name.trim() : null, slug, description, image_url, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Update Category Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update category.',
      error: error.message,
    });
  }
};

/**
 * Delete a Category (Admin Only)
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if products exist in this category
    const productCheck = await db.query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id]);
    if (productCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category: existing products are linked to this category.',
      });
    }

    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Category Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete category.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
