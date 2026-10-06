import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import AlertMessage from '../components/AlertMessage';

const CheckoutPage = () => {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_address: user?.address || '',
    contact_phone: user?.phone || '',
    delivery_notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (cart.items.length === 0) {
    return (
      <div className="page-wrapper container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h2>Your Cart is Empty</h2>
        <p style={{ color: 'var(--muted)', margin: '1rem 0 2rem' }}>Please add products to your cart before proceeding to checkout.</p>
        <Link to="/products" className="btn btn-primary">Browse Crafts</Link>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.shipping_address.trim() || !formData.contact_phone.trim()) {
      setErrorMsg('Please enter your full delivery address and contact phone number.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await orderService.createOrder({
        shipping_address: `${formData.shipping_address} ${formData.delivery_notes ? `(Notes: ${formData.delivery_notes})` : ''}`,
        contact_phone: formData.contact_phone,
      });

      if (res.success) {
        await refreshCart();
        // Redirect to order history with state
        navigate('/orders/history', {
          state: { newOrderNumber: res.order.order_number },
        });
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper container" style={{ maxWidth: '960px' }}>
      <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>Checkout & Delivery Details</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Your items will be directly packaged and dispatched by the artisans who crafted them.
      </p>

      {errorMsg && (
        <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        {/* Shipping Form */}
        <form onSubmit={handlePlaceOrder} className="card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            1. Delivery Address
          </h2>

          <div className="form-group">
            <label className="form-label">Recipient Full Name</label>
            <input
              type="text"
              value={user?.full_name || ''}
              disabled
              className="form-input"
              style={{ backgroundColor: '#f5f1eb' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactPhone" className="form-label">Contact Phone Number *</label>
            <input
              id="contactPhone"
              type="tel"
              name="contact_phone"
              required
              placeholder="e.g. +1 555 123 4567"
              value={formData.contact_phone}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="shippingAddress" className="form-label">Street Address & City *</label>
            <textarea
              id="shippingAddress"
              name="shipping_address"
              required
              placeholder="Enter apartment, street name, city, postal code..."
              value={formData.shipping_address}
              onChange={handleChange}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deliveryNotes" className="form-label">Special Delivery / Packaging Notes (Optional)</label>
            <input
              id="deliveryNotes"
              type="text"
              name="delivery_notes"
              placeholder="e.g. Leave on front porch or handle fragile pottery"
              value={formData.delivery_notes}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem', marginTop: '1rem' }}
          >
            {submitting ? 'Placing Order...' : `Confirm & Place Order ($${parseFloat(cart.totalAmount).toFixed(2)})`}
          </button>
        </form>

        {/* Order Item Summary */}
        <div className="card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            2. Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {cart.items.map((item) => (
              <div key={item.cart_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <div>
                  <strong>{item.quantity} × {item.product_name}</strong>
                  {item.variant_name && (
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {item.variant_value}
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>
                    Maker: {item.shop_name}
                  </span>
                </div>
                <span style={{ fontWeight: 600 }}>
                  ${parseFloat(item.item_subtotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span>
              <span>${parseFloat(cart.totalAmount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--muted)' }}>Shipping</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <span>Total Payable</span>
              <span style={{ color: 'var(--primary)' }}>${parseFloat(cart.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
