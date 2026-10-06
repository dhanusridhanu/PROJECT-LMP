import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, isBuyer, isSeller, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.8rem' }}>🏺</span>
          <div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.1 }}>
              ArtisanCraft
            </span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 600 }}>
              Handmade Marketplace
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '420px', margin: '0 1.5rem' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search handcrafted pottery, textiles, jewelry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingRight: '2.5rem', borderRadius: '999px', fontSize: '0.9rem', backgroundColor: '#faf8f5' }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'var(--muted)',
              }}
            >
              🔍
            </button>
          </div>
        </form>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/products" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark-light)' }}>
            Explore Crafts
          </Link>

          {/* Guest state */}
          {!isAuthenticated && (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Sign In
              </Link>
              <Link to="/register?role=seller" className="btn btn-primary btn-sm">
                Become a Seller
              </Link>
            </>
          )}

          {/* Buyer state */}
          {isAuthenticated && isBuyer && (
            <>
              <Link to="/orders/history" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--dark-light)' }}>
                My Orders
              </Link>
              <Link
                to="/cart"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '999px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                <span>🛒 Cart</span>
                {cartCount > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '999px',
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Seller state */}
          {isAuthenticated && isSeller && (
            <>
              <Link to="/seller/dashboard" className="btn btn-outline btn-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                Artisan Portal
              </Link>
            </>
          )}

          {/* Admin state */}
          {isAuthenticated && isAdmin && (
            <>
              <Link to="/admin/dashboard" className="btn btn-secondary btn-sm">
                Admin Panel
              </Link>
            </>
          )}

          {/* User profile dropdown / signout */}
          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
              <div style={{ textAlign: 'right', display: 'none', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>{user.full_name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm" title="Log Out">
                Sign Out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
