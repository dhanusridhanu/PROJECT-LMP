import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated, isBuyer } = useAuth();
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Compute full image URL: if relative path like /uploads/..., prefix with backend URL if needed or use as is
  const imageUrl = product.primary_image?.startsWith('http')
    ? product.primary_image
    : product.primary_image?.startsWith('/uploads')
    ? `http://localhost:5000${product.primary_image}`
    : 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80';

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !isBuyer || isOutOfStock) return;

    try {
      setAdding(true);
      await addToCart(product.id, null, 1);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } catch (err) {
      alert(err.message || 'Could not add product to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      className="product-card"
    >
      <Link to={`/products/${product.slug || product.id}`} style={{ position: 'relative', overflow: 'hidden', height: '220px', display: 'block', backgroundColor: '#f5f1eb' }}>
        <img
          src={imageUrl}
          alt={product.name}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
          }}
        />
        {product.category_name && (
          <span
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(4px)',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--dark)',
            }}
          >
            {product.category_name}
          </span>
        )}
      </Link>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>By</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
            {product.shop_name || 'Artisan Workshop'}
          </span>
        </div>

        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>
          <Link to={`/products/${product.slug || product.id}`} style={{ color: 'var(--dark)' }}>
            {product.name}
          </Link>
        </h3>

        <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark)' }}>
              ${parseFloat(product.base_price).toFixed(2)}
            </span>

            {isOutOfStock ? (
              <span className="badge badge-rejected">Sold Out</span>
            ) : isLowStock ? (
              <span className="badge badge-pending">Only {product.stock_quantity} left</span>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>In Stock</span>
            )}
          </div>

          {(!isAuthenticated || isBuyer) && (
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock || adding}
              className={`btn ${addedSuccess ? 'btn-secondary' : 'btn-primary'} btn-sm`}
              style={{ width: '100%' }}
            >
              {adding ? 'Adding...' : addedSuccess ? '✓ Added to Cart!' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
