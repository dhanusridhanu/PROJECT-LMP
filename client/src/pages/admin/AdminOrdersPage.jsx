import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await adminService.getAllOrders();
        if (res.success) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error('Failed to load system orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  const statusColors = {
    placed: 'badge-placed',
    shipped: 'badge-shipped',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled',
  };

  if (loading) return <LoadingSpinner text="Retrieving platform orders..." />;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Platform Orders Inspection</h1>
        <p style={{ color: 'var(--muted)' }}>
          Supervise global purchasing activity, fulfillment rates, and buyer transactions
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setStatusFilter('')}
          className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-outline'}`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setStatusFilter('placed')}
          className={`btn btn-sm ${statusFilter === 'placed' ? 'btn-primary' : 'btn-outline'}`}
        >
          Placed
        </button>
        <button
          onClick={() => setStatusFilter('shipped')}
          className={`btn btn-sm ${statusFilter === 'shipped' ? 'btn-primary' : 'btn-outline'}`}
        >
          Shipped
        </button>
        <button
          onClick={() => setStatusFilter('delivered')}
          className={`btn btn-sm ${statusFilter === 'delivered' ? 'btn-primary' : 'btn-outline'}`}
        >
          Delivered
        </button>
        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`btn btn-sm ${statusFilter === 'cancelled' ? 'btn-primary' : 'btn-outline'}`}
        >
          Cancelled
        </button>
      </div>

      <div className="card">
        {filteredOrders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
            No orders match this status filter.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Buyer Name</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Shipping Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.order_number}</strong>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div>
                        <strong>{o.buyer_name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>
                          {o.buyer_email}
                        </span>
                      </div>
                    </td>
                    <td>{o.item_count} item(s)</td>
                    <td>
                      <strong style={{ color: 'var(--primary)' }}>${parseFloat(o.total_amount).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${statusColors[o.status] || 'badge-placed'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.82rem', color: 'var(--dark-light)' }}>
                      {o.shipping_address}
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

export default AdminOrdersPage;
