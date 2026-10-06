import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchSellerOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getSellerOrders();
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to load seller orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      setFeedback({ type: '', message: '' });

      const res = await orderService.updateStatus(orderId, newStatus);
      if (res.success) {
        setFeedback({ type: 'success', message: `Order #${orderId.slice(0, 8)} status updated to "${newStatus}".` });
        await fetchSellerOrders();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update order status.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=150&q=80';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `http://localhost:5000${url}`;
    return url;
  };

  const statusColors = {
    placed: 'badge-placed',
    shipped: 'badge-shipped',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled',
  };

  if (loading) return <LoadingSpinner text="Retrieving orders to fulfill..." />;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Customer Orders & Fulfillment</h1>
        <p style={{ color: 'var(--muted)' }}>
          Review incoming purchases for your handmade items and update the delivery lifecycle
        </p>
      </div>

      {feedback.message && (
        <AlertMessage
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📦</span>
          <h2>No incoming orders yet</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
            When conscious buyers purchase items from your workshop, their shipping details and package requirements will appear right here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((item) => (
            <div key={item.order_item_id} className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Reference</span>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)' }}>{item.order_number}</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    Ordered: {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge ${statusColors[item.order_status] || 'badge-placed'}`} style={{ fontSize: '0.9rem' }}>
                    Status: {item.order_status.toUpperCase()}
                  </span>

                  {/* Status Action Controls */}
                  {item.order_status === 'placed' && (
                    <button
                      onClick={() => handleUpdateStatus(item.order_id, 'shipped')}
                      disabled={updatingId === item.order_id}
                      className="btn btn-primary btn-sm"
                    >
                      {updatingId === item.order_id ? 'Updating...' : '📦 Mark as Shipped'}
                    </button>
                  )}

                  {item.order_status === 'shipped' && (
                    <button
                      onClick={() => handleUpdateStatus(item.order_id, 'delivered')}
                      disabled={updatingId === item.order_id}
                      className="btn btn-secondary btn-sm"
                    >
                      {updatingId === item.order_id ? 'Updating...' : '✓ Mark as Delivered'}
                    </button>
                  )}

                  {item.order_status !== 'delivered' && item.order_status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to cancel this order? Inventory will be restored.')) {
                          handleUpdateStatus(item.order_id, 'cancelled');
                        }
                      }}
                      disabled={updatingId === item.order_id}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Ordered Item Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 0', borderBottom: '1px solid var(--border)' }}>
                <img
                  src={formatImageUrl(item.product_image)}
                  alt={item.product_name}
                  style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', backgroundColor: '#f5f1eb' }}
                />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '1.05rem', display: 'block' }}>{item.product_name}</strong>
                  {item.variant_name && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block' }}>
                      Selected Option: {item.variant_value}
                    </span>
                  )}
                  <span style={{ fontSize: '0.9rem', color: 'var(--dark-light)' }}>
                    Quantity Ordered: <strong>{item.quantity}</strong>
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Item Subtotal</span>
                  <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary)' }}>
                    ${parseFloat(item.subtotal).toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Shipping Address and Buyer Details */}
              <div style={{ paddingTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.88rem' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--dark)' }}>👤 Customer Name</strong>
                  <span style={{ color: 'var(--dark-light)' }}>{item.buyer_name}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--dark)' }}>📞 Contact Phone</strong>
                  <span style={{ color: 'var(--dark-light)' }}>{item.contact_phone}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--dark)' }}>📍 Shipping Destination</strong>
                  <span style={{ color: 'var(--dark-light)' }}>{item.shipping_address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
