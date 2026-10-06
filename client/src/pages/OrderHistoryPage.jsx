import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertMessage from '../components/AlertMessage';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const newOrderNumber = location.state?.newOrderNumber;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await orderService.getMyOrders();
        if (res.success) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error('Failed to load order history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=200&q=80';
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

  const renderStatusTracker = (status) => {
    if (status === 'cancelled') {
      return <span className="badge badge-cancelled">Order Cancelled</span>;
    }

    const steps = ['placed', 'shipped', 'delivered'];
    const currentStepIndex = steps.indexOf(status);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.75rem 0' }}>
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <React.Fragment key={step}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? 'var(--primary)' : 'var(--border)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted ? '✓' : idx + 1}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: isCurrent ? 700 : 500, color: isCompleted ? 'var(--dark)' : 'var(--muted)', textTransform: 'capitalize' }}>
                  {step}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ height: '2px', width: '28px', backgroundColor: idx < currentStepIndex ? 'var(--primary)' : 'var(--border)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (loading) return <LoadingSpinner text="Retrieving your artisan order history..." />;

  return (
    <div className="page-wrapper container" style={{ maxWidth: '980px' }}>
      <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>My Orders & Package Tracking</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Follow your handcrafted creations from workshop preparation to doorstep delivery.
      </p>

      {newOrderNumber && (
        <AlertMessage
          type="success"
          message={`Thank you! Your order #${newOrderNumber} has been received. The artisan has been notified to begin fulfillment.`}
        />
      )}

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📦</span>
          <h2>No orders placed yet</h2>
          <p style={{ color: 'var(--muted)', margin: '0.5rem auto 1.5rem', maxWidth: '400px' }}>
            When you purchase handmade creations from our local artisans, you can track their packaging and shipping progress right here.
          </p>
          <Link to="/products" className="btn btn-primary">Start Exploring</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ padding: '1.75rem' }}>
              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Number</span>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--dark)' }}>{order.order_number}</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    Placed on: {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${statusColors[order.status] || 'badge-placed'}`} style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Status: {order.status.toUpperCase()}
                  </span>
                  <strong style={{ display: 'block', fontSize: '1.3rem', color: 'var(--primary)' }}>
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Status Tracker */}
              <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fulfillment Progress</span>
                {renderStatusTracker(order.status)}
              </div>

              {/* Order Items */}
              <div style={{ padding: '1rem 0' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>Items in this Package</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img
                        src={formatImageUrl(item.image_url)}
                        alt={item.product_name}
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', backgroundColor: '#f5f1eb' }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.95rem', display: 'block' }}>{item.product_name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Artisan: {item.shop_name}</span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                        <span>{item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}</span>
                        <strong style={{ display: 'block', color: 'var(--dark)' }}>${parseFloat(item.subtotal).toFixed(2)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <strong>Shipping to:</strong> {order.shipping_address} | <strong>Contact:</strong> {order.contact_phone}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
