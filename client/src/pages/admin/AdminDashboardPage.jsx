import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboardStats();
        if (res.success) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Aggregating platform metrics..." />;

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Marketplace Oversight & Metrics</h1>
        <p style={{ color: 'var(--muted)' }}>
          Monitor community growth, vetting queues, active inventory, and platform sales
        </p>
      </div>

      {/* Urgent Pending Notice */}
      {stats?.pending_seller_approvals > 0 && (
        <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>🔔 {stats.pending_seller_approvals} Artisan Application(s) Awaiting Verification</strong>
            <p style={{ fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
              Review their workshop credentials and craft specialty to allow them to publish products.
            </p>
          </div>
          <Link to="/admin/approvals" className="btn btn-primary btn-sm">
            Review Applications →
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Artisans</span>
          <div style={{ fontSize: '2.4rem', fontWeight: 700, margin: '0.3rem 0', color: 'var(--dark)' }}>
            {stats?.total_active_sellers || 0}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
            Pending Review: <strong>{stats?.pending_seller_approvals || 0}</strong>
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered Buyers</span>
          <div style={{ fontSize: '2.4rem', fontWeight: 700, margin: '0.3rem 0', color: 'var(--dark)' }}>
            {stats?.total_buyers || 0}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
            Conscious shoppers
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Platform Sales</span>
          <div style={{ fontSize: '2.4rem', fontWeight: 700, margin: '0.3rem 0', color: 'var(--primary)' }}>
            ${parseFloat(stats?.total_gross_revenue || 0).toFixed(2)}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Total Orders: {stats?.total_orders || 0}
          </span>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Published Craft Items</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, margin: '0.3rem 0', color: 'var(--dark)' }}>
            {stats?.total_active_products || 0}
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            Active handicraft listings currently accessible across all craft categories.
          </p>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Quick Links</span>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <Link to="/admin/approvals" className="btn btn-outline btn-sm">
              🛡️ Seller Vetting Queue
            </Link>
            <Link to="/admin/categories" className="btn btn-outline btn-sm">
              🏷️ Manage Categories
            </Link>
            <Link to="/admin/orders" className="btn btn-outline btn-sm">
              📑 Platform Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
