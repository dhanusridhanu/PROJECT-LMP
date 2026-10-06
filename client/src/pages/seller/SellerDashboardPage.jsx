import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import LoadingSpinner from '../../components/LoadingSpinner';

const SellerDashboardPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const approvalStatus = user?.seller?.approval_status || 'pending';

  useEffect(() => {
    const loadSellerData = async () => {
      try {
        setLoading(true);
        const [prodRes, ordRes] = await Promise.all([
          productService.getMyProducts().catch(() => ({ success: false, products: [] })),
          orderService.getSellerOrders().catch(() => ({ success: false, orders: [] })),
        ]);

        if (prodRes.success) setProducts(prodRes.products);
        if (ordRes.success) setOrders(ordRes.orders);
      } catch (err) {
        console.error('Failed to load artisan dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSellerData();
  }, []);

  if (loading) return <LoadingSpinner text="Opening your workshop dashboard..." />;

  const pendingOrdersCount = orders.filter((o) => o.order_status === 'placed').length;
  const totalStockCount = products.reduce((acc, p) => acc + p.stock_quantity, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            {user?.seller?.shop_name || 'Artisan Workshop'}
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            Specialty: <strong>{user?.seller?.craft_type || 'Handmade Crafts'}</strong> | Maker ID: {user?.id?.slice(0, 8)}
          </p>
        </div>

        {approvalStatus === 'approved' && (
          <Link to="/seller/products" className="btn btn-primary">
            + List New Craft
          </Link>
        )}
      </div>

      {/* Admin Review Status Banner */}
      {approvalStatus === 'pending' && (
        <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>
              ⏳ Application Pending Administrator Review
            </strong>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              Thank you for registering your workshop on ArtisanCraft! Our marketplace administrator reviews all artisan applications to maintain authenticity. Once approved, your products will be visible to buyers worldwide.
            </p>
          </div>
        </div>
      )}

      {approvalStatus === 'rejected' && (
        <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '1rem' }}>Application Unsuccessful</strong>
            <p style={{ fontSize: '0.9rem' }}>
              Your application was not approved by the administrator. Please contact support for more details.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Products</span>
          <div style={{ fontSize: '2.4rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--dark)' }}>
            {products.length}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>
            Total Workshop Stock: {totalStockCount} units
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders to Ship</span>
          <div style={{ fontSize: '2.4rem', fontWeight: 700, margin: '0.25rem 0', color: pendingOrdersCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {pendingOrdersCount}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Awaiting packaging & dispatch
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Status</span>
          <div style={{ margin: '0.6rem 0' }}>
            <span className={`badge badge-${approvalStatus}`} style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
              {approvalStatus.toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            {approvalStatus === 'approved' ? 'Active storefront on catalog' : 'Awaiting review'}
          </span>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.3rem' }}>Recent Customer Orders to Fulfill</h2>
          <Link to="/seller/orders" className="btn btn-outline btn-sm">
            View All Orders →
          </Link>
        </div>

        {orders.length === 0 ? (
          <p style={{ color: 'var(--muted)', padding: '1rem 0', fontSize: '0.92rem' }}>
            No customer orders received yet. Once buyers order your creations, you will fulfill them here!
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Item Ordered</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.order_item_id}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{order.buyer_name}</td>
                    <td>{order.product_name} {order.variant_value ? `(${order.variant_value})` : ''}</td>
                    <td>{order.quantity}</td>
                    <td>
                      <span className={`badge badge-${order.order_status}`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td>
                      <Link to="/seller/orders" className="btn btn-outline btn-sm">
                        Update Status
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboardPage;
