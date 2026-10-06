import React, { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const ManageProductsPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const isApproved = user?.seller?.approval_status === 'approved';

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Variants State (Optional)
  const [variants, setVariants] = useState([]);
  const [varName, setVarName] = useState('Size');
  const [varValue, setVarValue] = useState('');
  const [varAdjustment, setVarAdjustment] = useState('0');
  const [varStock, setVarStock] = useState('5');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productService.getMyProducts(),
        categoryService.getAll(),
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) {
        setCategories(catRes.categories);
        if (catRes.categories.length > 0) setCategoryId(catRes.categories[0].id);
      }
    } catch (err) {
      console.error('Failed to load seller products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddVariant = () => {
    if (!varValue.trim()) return;
    setVariants([
      ...variants,
      {
        variant_name: varName,
        variant_value: varValue.trim(),
        price_adjustment: parseFloat(varAdjustment) || 0,
        stock_quantity: parseInt(varStock, 10) || 0,
      },
    ]);
    setVarValue('');
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!isApproved) {
      setFeedback({ type: 'warning', message: 'You cannot publish products until your artisan account is approved by an administrator.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback({ type: '', message: '' });

      const formData = new FormData();
      formData.append('name', name);
      formData.append('category_id', categoryId);
      formData.append('base_price', basePrice);
      formData.append('stock_quantity', stockQuantity);
      formData.append('description', description);

      if (variants.length > 0) {
        formData.append('variants', JSON.stringify(variants));
      }

      // Append image files
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('images', selectedFiles[i]);
      }

      const res = await productService.create(formData);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Handcrafted product listed successfully!' });
        setShowModal(false);
        // Reset form
        setName('');
        setBasePrice('');
        setDescription('');
        setSelectedFiles([]);
        setVariants([]);
        await fetchProducts();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to list product.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, prodName) => {
    if (!window.confirm(`Are you sure you want to remove "${prodName}" from your active listings?`)) return;
    try {
      const res = await productService.delete(id);
      if (res.success) {
        setFeedback({ type: 'success', message: `Product "${prodName}" removed.` });
        await fetchProducts();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to delete product.' });
    }
  };

  const formatImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=150&q=80';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `http://localhost:5000${url}`;
    return url;
  };

  if (loading) return <LoadingSpinner text="Loading your artisan inventory..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>My Products & Inventory</h1>
          <p style={{ color: 'var(--muted)' }}>
            Manage pricing, workshop stock, photos, and options for your handcrafted creations
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={!isApproved}
          className="btn btn-primary"
        >
          + Add New Product
        </button>
      </div>

      {!isApproved && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          ⚠️ Your artisan shop is pending Admin verification. Product creation will be enabled as soon as your account is approved.
        </div>
      )}

      {feedback.message && (
        <AlertMessage
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {/* Products Table */}
      <div className="card">
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏺</span>
            <h3>No products listed in your workshop yet</h3>
            <p style={{ color: 'var(--muted)', margin: '0.5rem 0 1.5rem' }}>
              Add your first creation to start showcasing your skills on the marketplace.
            </p>
            {isApproved && (
              <button onClick={() => setShowModal(true)} className="btn btn-primary">
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Workshop Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ width: '64px' }}>
                      <img
                        src={formatImageUrl(p.primary_image)}
                        alt={p.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', backgroundColor: '#f5f1eb' }}
                      />
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem' }}>{p.name}</strong>
                    </td>
                    <td>{p.category_name}</td>
                    <td>
                      <strong style={{ color: 'var(--dark)' }}>${parseFloat(p.base_price).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: p.stock_quantity > 0 ? 'var(--dark)' : 'var(--danger)' }}>
                        {p.stock_quantity} units
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-active' : 'badge-rejected'}`}>
                        {p.is_active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          <div className="card" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>List a New Handcrafted Product</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label htmlFor="prodName" className="form-label">Product Name *</label>
                <input
                  id="prodName"
                  type="text"
                  required
                  placeholder="e.g. Handmade Terracotta Water Jug"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label htmlFor="prodCategory" className="form-label">Category *</label>
                  <select
                    id="prodCategory"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="form-select"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prodBasePrice" className="form-label">Base Price ($) *</label>
                  <input
                    id="prodBasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="25.00"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="prodStockQty" className="form-label">Initial Workshop Stock Quantity *</label>
                <input
                  id="prodStockQty"
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="prodDescription" className="form-label">Craft Description & Materials Used *</label>
                <textarea
                  id="prodDescription"
                  required
                  rows={4}
                  placeholder="Describe your creative process, the natural materials used (e.g. clay, organic cotton, teak wood), and care instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              {/* Photos Upload with Multer */}
              <div className="form-group">
                <label htmlFor="prodPhotos" className="form-label">Upload Craft Photos (Up to 5)</label>
                <input
                  id="prodPhotos"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="form-input"
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>
                  Supported formats: JPEG, PNG, WebP (Max 5MB per photo). First photo becomes the main thumbnail.
                </span>
              </div>

              {/* Optional Variants Builder */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  Optional Product Variants (e.g. Sizes, Colors)
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end', marginBottom: '0.75rem' }}>
                  <div>
                    <label htmlFor="optType" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Type</label>
                    <input
                      id="optType"
                      type="text"
                      placeholder="Size / Color"
                      value={varName}
                      onChange={(e) => setVarName(e.target.value)}
                      className="form-input"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="optValue" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Option Value</label>
                    <input
                      id="optValue"
                      type="text"
                      placeholder="e.g. Medium"
                      value={varValue}
                      onChange={(e) => setVarValue(e.target.value)}
                      className="form-input"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="optPriceAdjust" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>+$ Price Adjust</label>
                    <input
                      id="optPriceAdjust"
                      type="number"
                      step="0.5"
                      value={varAdjustment}
                      onChange={(e) => setVarAdjustment(e.target.value)}
                      className="form-input"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="optStock" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Stock</label>
                    <input
                      id="optStock"
                      type="number"
                      value={varStock}
                      onChange={(e) => setVarStock(e.target.value)}
                      className="form-input"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="btn btn-secondary btn-sm"
                    style={{ height: '36px' }}
                  >
                    + Add
                  </button>
                </div>

                {/* Added Variants List */}
                {variants.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {variants.map((v, idx) => (
                      <span key={idx} className="badge badge-placed" style={{ padding: '0.35rem 0.65rem' }}>
                        {v.variant_name}: {v.variant_value} (+${v.price_adjustment}) [{v.stock_quantity} in stock]
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.35rem', color: 'inherit' }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Uploading & Creating...' : 'Publish Product to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProductsPage;
