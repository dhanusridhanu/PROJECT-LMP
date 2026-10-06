import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="page-wrapper container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>🏺</span>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>404 — Page Not Found</h1>
      <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '440px', margin: '0.5rem auto 2rem' }}>
        The artisan page or handicraft item you are looking for does not exist or has been relocated.
      </p>
      <Link to="/" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
        Back to Marketplace Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
