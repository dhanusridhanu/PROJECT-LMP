import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user, isSeller, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sellerStatus = user?.seller?.approval_status || 'pending';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-sand)' }}>
      {/* Top Bar */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.4rem' }}>🏺</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
              ArtisanCraft
            </span>
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}>
            {isAdmin ? 'Platform Administration' : 'Artisan Workshop Hub'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isSeller && (
            <span className={`badge badge-${sellerStatus}`}>
              Status: {sellerStatus.toUpperCase()}
            </span>
          )}
          <Link to="/" className="btn btn-outline btn-sm">
            ← View Marketplace
          </Link>
          <button onClick={handleLogout} className="btn btn-outline btn-sm">
            Sign Out
          </button>
        </div>
      </header>

      {/* Dashboard Body with Sidebar */}
      <div className="dashboard-container" style={{ flex: 1 }}>
        <aside className="dashboard-sidebar">
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <strong style={{ display: 'block', fontSize: '1rem' }}>
              {isSeller ? (user?.seller?.shop_name || 'Artisan Workshop') : 'Admin Portal'}
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{user?.email}</span>
          </div>

          <nav>
            {isSeller && (
              <>
                <NavLink
                  to="/seller/dashboard"
                  end
                  className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  📊 Overview
                </NavLink>
                <NavLink
                  to="/seller/products"
                  className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  🏺 My Products & Stock
                </NavLink>
                <NavLink
                  to="/seller/orders"
                  className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  📦 Customer Orders
                </NavLink>
              </>
            )}

            {isAdmin && (
              <>
                <NavLink
                  to="/admin/dashboard"
                  end
                  className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  📈 Platform Analytics
                </NavLink>
                <NavLink
                  to="/admin/approvals"
                  className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  🛡️ Seller Approvals
                </NavLink>
                <NavLink
                  to="/admin/categories"
                  className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  🏷️ Manage Categories
                </NavLink>
                <NavLink
                  to="/admin/orders"
                  className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  📑 System Orders
                </NavLink>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
