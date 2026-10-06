import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertMessage from '../components/AlertMessage';

const ProductDetailPage = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, isBuyer } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await productService.getByIdOrSlug(identifier);
        if (res.success) {
          setProduct(res.product);
          // Set initial image
          if (res.product.images && res.product.images.length > 0) {
            setSelectedImage(res.product.images[0].image_url);
          }
          // Set initial variant if variants exist
          if (res.product.variants && res.product.variants.length > 0) {
            setSelectedVariant(res.product.variants[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setFeedback({ type: 'error', message: 'Could not find this handcrafted item.' });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [identifier]);

  if (loading) return <LoadingSpinner text="Fetching item from the artisan's workshop..." />;
  if (!product) {
    return (
      <div className="page-wrapper container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h2>Product Not Found</h2>
        <p style={{ color: 'var(--muted)', margin: '1rem 0 2rem' }}>This item may have been discontinued by the artisan.</p>
        <Link to="/products" className="btn btn-primary">Return to Catalog</Link>
      </div>
    );
  }

  // Calculate effective unit price with variant adjustment
  const basePrice = parseFloat(product.base_price);
  const variantAdjustment = selectedVariant ? parseFloat(selectedVariant.price_adjustment) : 0;
  const currentPrice = basePrice + variantAdjustment;

  // Determine current stock
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const isOutOfStock = currentStock <= 0;

  // Format image URL
  const formatImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `http://localhost:5000${url}`;
    return url;
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isBuyer) {
      setFeedback({ type: 'warning', message: 'Please sign in with a Buyer account to purchase handcrafted items.' });
      return;
    }

    try {
      setAdding(true);
      setFeedback({ type: '', message: '' });
      await addToCart(product.id, selectedVariant ? selectedVariant.id : null, quantity);
      setFeedback({ type: 'success', message: `Added ${quantity} × "${product.name}" to your cart!` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add item to cart.' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page-wrapper container">
      {/* Breadcrumb Navigation */}
      <nav style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '2rem' }}>
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Crafts</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category_slug}`}>{product.category_name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--dark)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {feedback.message && (
        <AlertMessage
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'start' }}>
        {/* Left Column: Image Gallery */}
        <div>
          <div
            style={{
              backgroundColor: '#f5f1eb',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              height: '420px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <img
              src={formatImageUrl(selectedImage)}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>

          {/* Thumbnails strip */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: `2px solid ${selectedImage === img.image_url ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    background: '#ffffff',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={formatImageUrl(img.image_url)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Cart Actions */}
        <div>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--secondary-light)',
              color: 'var(--secondary)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            {product.category_name}
          </span>

          <h1 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '0.5rem' }}>{product.name}</h1>

          {/* Artisan Maker Credential */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1rem' }}>🏺</span>
            <span style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>Crafted by</span>
            <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{product.shop_name}</strong>
            <span className="badge badge-approved" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
              ✓ Verified Maker
            </span>
          </div>

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--dark)' }}>
              ${currentPrice.toFixed(2)}
            </span>
            {isOutOfStock ? (
              <span className="badge badge-rejected" style={{ fontSize: '0.88rem' }}>Sold Out</span>
            ) : (
              <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.92rem' }}>
                ✓ {currentStock} available in workshop
              </span>
            )}
          </div>

          {/* Product Variants (if applicable) */}
          {product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                Select Option ({product.variants[0].variant_name}):
              </label>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`btn btn-sm ${selectedVariant?.id === v.id ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {v.variant_value}
                    {parseFloat(v.price_adjustment) !== 0 && (
                      <span style={{ opacity: 0.8, marginLeft: '0.25rem' }}>
                        ({parseFloat(v.price_adjustment) > 0 ? '+' : ''}${parseFloat(v.price_adjustment).toFixed(2)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Add To Cart Button */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div style={{ width: '110px' }}>
              <label htmlFor="quantityInput" className="form-label">Quantity</label>
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  style={{ width: '36px', border: 'none', background: '#faf8f5', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  -
                </button>
                <input
                  id="quantityInput"
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setQuantity(Math.max(1, Math.min(val, currentStock)));
                  }}
                  disabled={isOutOfStock}
                  style={{ width: '100%', textAlign: 'center', border: 'none', outline: 'none', fontWeight: 600 }}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  style={{ width: '36px', border: 'none', background: '#faf8f5', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              className="btn btn-primary"
              style={{ flex: 1, padding: '0.8rem 1.5rem', fontSize: '1.05rem' }}
            >
              {adding ? 'Adding to Cart...' : isOutOfStock ? 'Sold Out' : '🛒 Add to Cart'}
            </button>
          </div>

          {/* Product Description */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              About This Creation
            </h3>
            <p style={{ whiteSpace: 'pre-line', color: 'var(--dark-light)', lineHeight: 1.7 }}>
              {product.description}
            </p>
          </div>

          {/* Artisan Maker Bio Box */}
          <div className="card" style={{ backgroundColor: 'var(--bg-sand)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🌿</span>
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'block' }}>{product.shop_name}</strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Craft Specialty: {product.craft_type || 'Traditional Crafts'}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--dark-light)', lineHeight: 1.6 }}>
              {product.seller_bio || 'Every creation from this artisan is individually handcrafted with traditional tools and local sustainable materials.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
