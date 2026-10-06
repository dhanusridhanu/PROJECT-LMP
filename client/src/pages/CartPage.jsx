import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertMessage from '../components/AlertMessage';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const formatImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=300&q=80';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `http://localhost:5000${url}`;
    return url;
  };

  const handleQtyChange = async (cartItemId, newQty) => {
    if (newQty <= 0) {
      await handleRemove(cartItemId);
      return;
    }
    try {
      setUpdatingId(cartItemId);
      setErrorMsg('');
      await updateQuantity(cartItemId, newQty);
    } catch (err) {
      setErrorMsg(err.message || 'Could not update item quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (cartItemId) => {
    try {
      setUpdatingId(cartItemId);
      setErrorMsg('');
      await removeFromCart(cartItemId);
    } catch (err) {
      setErrorMsg(err.message || 'Could not remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && cart.items.length === 0) {
    return <LoadingSpinner text="Retrieving your shopping basket..." />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="page-wrapper container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🛒</span>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--muted)', maxWidth: '420px', margin: '0 auto 2rem' }}>
          Explore our marketplace to discover unique handcrafted items created with dedication by local artisans.
        </p>
        <Link to="/products" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
          Discover Handicrafts
        </Link>
      </div>
    );
  }

  return (
    <div className="page-wrapper container">
      <h1 style={{ fontSize: '2.4rem', marginBottom: '1.5rem' }}>Your Shopping Basket</h1>

      {errorMsg && (
        <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        {/* Cart Items List */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
              {cart.totalItems} unique handcrafted {cart.totalItems === 1 ? 'item' : 'items'}
            </span>
            <button
              onClick={clearCart}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.88rem' }}
            >
              Clear Basket
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cart.items.map((item) => (
              <div
                key={item.cart_item_id}
                className="card"
                style={{
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'center',
                  padding: '1.25rem',
                }}
              >
                <img
                  src={formatImageUrl(item.primary_image)}
                  alt={item.product_name}
                  style={{
                    width: '84px',
                    height: '84px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#f5f1eb',
                  }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=300&q=80';
                  }}
                />

                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    Maker: <strong style={{ color: 'var(--primary)' }}>{item.shop_name}</strong>
                  </span>
                  <h3 style={{ fontSize: '1.1rem', margin: '0.2rem 0' }}>
                    <Link to={`/products/${item.product_slug || item.product_id}`} style={{ color: 'var(--dark)' }}>
                      {item.product_name}
                    </Link>
                  </h3>
                  {item.variant_name && (
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block' }}>
                      Option: {item.variant_value}
                    </span>
                  )}
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark-light)', display: 'block', marginTop: '0.25rem' }}>
                    ${parseFloat(item.effective_unit_price).toFixed(2)} each
                  </span>
                </div>

                {/* Quantity adjusters */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <button
                    onClick={() => handleQtyChange(item.cart_item_id, item.quantity - 1)}
                    disabled={updatingId === item.cart_item_id}
                    style={{ width: '32px', height: '32px', border: 'none', background: '#faf8f5', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ width: '38px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600 }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQtyChange(item.cart_item_id, item.quantity + 1)}
                    disabled={updatingId === item.cart_item_id}
                    style={{ width: '32px', height: '32px', border: 'none', background: '#faf8f5', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--dark)', display: 'block' }}>
                    ${parseFloat(item.item_subtotal).toFixed(2)}
                  </strong>
                  <button
                    onClick={() => handleRemove(item.cart_item_id)}
                    disabled={updatingId === item.cart_item_id}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.25rem' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Card */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal ({cart.totalItems} items)</span>
              <strong>${parseFloat(cart.totalAmount).toFixed(2)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--muted)' }}>Artisan Direct Shipping</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Estimated Total</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>
                ${parseFloat(cart.totalAmount).toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem' }}
            >
              Proceed to Checkout →
            </button>

            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>
              🔒 Safe & Direct from verified craft workshops
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
