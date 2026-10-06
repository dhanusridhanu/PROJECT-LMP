import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await login(formData);
      if (res.success) {
        // Direct based on role or intended route
        if (from) {
          navigate(from, { replace: true });
        } else if (res.user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (res.user.role === 'seller') {
          navigate('/seller/dashboard', { replace: true });
        } else {
          navigate('/products', { replace: true });
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing
  const fillDemoAdmin = () => {
    setFormData({
      email: 'admin@marketplace.local',
      password: 'AdminPassword123!',
    });
  };

  return (
    <div className="page-wrapper container" style={{ maxWidth: '460px', padding: '4rem 1.5rem' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🏺</span>
          <h1 style={{ fontSize: '1.8rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Sign in to access your artisan workshop or buyer orders
          </p>
        </div>

        {errorMsg && (
          <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="emailInput" className="form-label">Email Address</label>
            <input
              id="emailInput"
              type="email"
              name="email"
              required
              placeholder="e.g. artisan@craft.com"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="passwordInput" className="form-label">Password</label>
            <input
              id="passwordInput"
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Account Quick-Fill */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--border)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>
            Development Quick Access:
          </span>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="btn btn-outline btn-sm"
            style={{ width: '100%', fontSize: '0.8rem' }}
          >
            🔑 Fill Default Admin Credentials
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
