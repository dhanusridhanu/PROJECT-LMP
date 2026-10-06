import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(searchParams.get('role') === 'seller' ? 'seller' : 'buyer');

  useEffect(() => {
    if (searchParams.get('role') === 'seller') {
      setRole('seller');
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    // Seller fields
    shop_name: '',
    craft_type: '',
    bio: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (role === 'seller' && !formData.shop_name.trim()) {
      setErrorMsg('Please enter your unique artisan shop name.');
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        ...formData,
        role,
      });

      if (res.success) {
        if (role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/products');
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper container" style={{ maxWidth: '540px', padding: '3rem 1.5rem' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🏺</span>
          <h1 style={{ fontSize: '1.8rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>Create Account</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Join our community of authentic makers and conscious shoppers
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', backgroundColor: '#f0ece4', padding: '0.3rem', marginBottom: '1.75rem' }}>
          <button
            type="button"
            onClick={() => setRole('buyer')}
            style={{
              flex: 1,
              padding: '0.6rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              backgroundColor: role === 'buyer' ? '#ffffff' : 'transparent',
              color: role === 'buyer' ? 'var(--dark)' : 'var(--muted)',
              boxShadow: role === 'buyer' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            🛍️ I Want to Shop (Buyer)
          </button>
          <button
            type="button"
            onClick={() => setRole('seller')}
            style={{
              flex: 1,
              padding: '0.6rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              backgroundColor: role === 'seller' ? '#ffffff' : 'transparent',
              color: role === 'seller' ? 'var(--dark)' : 'var(--muted)',
              boxShadow: role === 'seller' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            🏺 I am an Artisan (Seller)
          </button>
        </div>

        {errorMsg && (
          <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="regFullName" className="form-label">Full Name *</label>
            <input
              id="regFullName"
              type="text"
              name="full_name"
              required
              placeholder="e.g. Maria Gonzalez"
              value={formData.full_name}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="regEmail" className="form-label">Email Address *</label>
            <input
              id="regEmail"
              type="email"
              name="email"
              required
              placeholder="e.g. maria@artisan.com"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="regPassword" className="form-label">Password *</label>
            <input
              id="regPassword"
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="regPhone" className="form-label">Phone Number</label>
              <input
                id="regPhone"
                type="tel"
                name="phone"
                placeholder="+1 555 0192"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="regAddress" className="form-label">Location / City</label>
              <input
                id="regAddress"
                type="text"
                name="address"
                placeholder="City, Country"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Artisan Specific Fields */}
          {role === 'seller' && (
            <div style={{ marginTop: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                }}
              >
                Artisan Studio Profile
              </span>

              <div className="form-group">
                <label htmlFor="shopName" className="form-label">Workshop / Shop Name *</label>
                <input
                  id="shopName"
                  type="text"
                  name="shop_name"
                  required
                  placeholder="e.g. Blue Clay Ceramics"
                  value={formData.shop_name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="craftType" className="form-label">Primary Craft Specialty *</label>
                <input
                  id="craftType"
                  type="text"
                  name="craft_type"
                  required
                  placeholder="e.g. Stoneware Pottery, Woodworking, Handloom"
                  value={formData.craft_type}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="artisanBio" className="form-label">Artisan Story & Bio</label>
                <textarea
                  id="artisanBio"
                  name="bio"
                  placeholder="Tell buyers about your background, tools, materials, and passion for your craft..."
                  value={formData.bio}
                  onChange={handleChange}
                  className="form-textarea"
                />
              </div>

              <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
                ℹ️ To preserve quality and authenticity, new artisan applications are reviewed by an administrator before store products go live.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '1rem' }}
          >
            {loading ? 'Submitting...' : role === 'seller' ? 'Submit Artisan Application' : 'Create Buyer Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
