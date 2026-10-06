import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          productService.getAll({ limit: 4, sort: 'newest' }),
          categoryService.getAll(),
        ]);
        if (prodRes.success) setFeaturedProducts(prodRes.products);
        if (catRes.success) setCategories(catRes.categories);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const categoryIcons = {
    'pottery-ceramics': '🏺',
    'handloom-textiles': '🧵',
    'wood-bamboo-crafts': '🪵',
    'handmade-jewelry': '💍',
    'paintings-folk-art': '🎨',
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          backgroundColor: '#f5f0e6',
          borderBottom: '1px solid var(--border)',
          padding: '4.5rem 0',
          position: 'relative',
        }}
      >
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Direct From Maker To Doorstep
            </span>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', lineHeight: 1.15, marginBottom: '1.25rem' }}>
              Handmade With Soul, <br />
              <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Crafted for Generations.</span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--dark-light)', marginBottom: '2rem', lineHeight: 1.6, maxWidth: '520px' }}>
              Discover unique pottery, handwoven textiles, and artisan creations directly from local craftspeople. Every purchase directly sustains a maker's heritage.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/products" className="btn btn-primary" style={{ padding: '0.8rem 1.8rem', fontSize: '1rem' }}>
                Explore Handicrafts
              </Link>
              <Link to="/register?role=seller" className="btn btn-outline" style={{ padding: '0.8rem 1.6rem', fontSize: '1rem' }}>
                Open Your Artisan Shop
              </Link>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80"
                alt="Artisan working on potter wheel"
                style={{ width: '100%', height: '380px', objectFit: 'cover' }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '-20px',
                left: '-20px',
                backgroundColor: '#ffffff',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '2rem' }}>🌿</span>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>100% Authentic</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Zero mass factory goods</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Curated Craft Disciplines</h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.05rem' }}>
              Explore traditional disciplines passed down through generations of artisans
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.75rem 1.25rem',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
                className="category-tile"
              >
                <span style={{ fontSize: '2.5rem' }}>
                  {categoryIcons[cat.slug] || '🏺'}
                </span>
                <h3 style={{ fontSize: '1.15rem' }}>{cat.name}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {cat.product_count} Creations
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Artisan Creations */}
      <section style={{ padding: '4rem 0', backgroundColor: '#fcfbfa', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>Fresh from the Workshops</h2>
              <p style={{ color: 'var(--muted)' }}>Recently uploaded one-of-a-kind handmade creations</p>
            </div>
            <Link to="/products" className="btn btn-outline">
              View All Works →
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner text="Fetching handcrafted items..." />
          ) : featuredProducts.length > 0 ? (
            <div className="grid-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🏺</span>
              <h3>No products listed yet!</h3>
              <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
                Be the first artisan to list a handcrafted product on the platform.
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <Link to="/register?role=seller" className="btn btn-primary">
                  Register as an Artisan
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Handmade Section */}
      <section style={{ padding: '4.5rem 0', backgroundColor: '#ffffff', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>The Artisan Difference</h2>
            <p style={{ color: 'var(--muted)' }}>
              Unlike mass commercial platforms, every item here represents dedicated human craftsmanship and fair earnings for creators.
            </p>
          </div>

          <div className="grid-3">
            <div className="card" style={{ border: 'none', backgroundColor: 'var(--bg-sand)' }}>
              <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.75rem' }}>🖐️</span>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Pure Craftsmanship</h3>
              <p style={{ color: 'var(--dark-light)', fontSize: '0.92rem' }}>
                Every single bowl, fabric, or carving carries individual brushstrokes, chisel marks, and authentic artisan character.
              </p>
            </div>

            <div className="card" style={{ border: 'none', backgroundColor: 'var(--bg-sand)' }}>
              <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.75rem' }}>🤝</span>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Fair Artisan Earnings</h3>
              <p style={{ color: 'var(--dark-light)', fontSize: '0.92rem' }}>
                Middlemen are eliminated. Artisans receive fair, direct rewards for their time, skill, and heritage technique.
              </p>
            </div>

            <div className="card" style={{ border: 'none', backgroundColor: 'var(--bg-sand)' }}>
              <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.75rem' }}>🛡️</span>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Admin Vetted Quality</h3>
              <p style={{ color: 'var(--dark-light)', fontSize: '0.92rem' }}>
                Our marketplace administrator personally reviews and verifies each artisan application before items are published.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
