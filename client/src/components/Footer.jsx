import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#221e1a', color: '#ded7ce', padding: '3.5rem 0 2rem', marginTop: 'auto' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          
          {/* Brand & Mission */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.6rem' }}>🏺</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>
                ArtisanCraft
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#a89f93', lineHeight: 1.6, marginBottom: '1rem' }}>
              Empowering local craftspeople, weavers, potters, and makers by connecting them directly with appreciative shoppers worldwide.
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
              100% Verified Authentic Handicrafts
            </span>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Craft Collections
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
              <li><Link to="/products?category=pottery-ceramics" style={{ color: '#c4bcb0' }}>Pottery & Ceramics</Link></li>
              <li><Link to="/products?category=handloom-textiles" style={{ color: '#c4bcb0' }}>Handloom & Textiles</Link></li>
              <li><Link to="/products?category=wood-bamboo-crafts" style={{ color: '#c4bcb0' }}>Wood & Bamboo Crafts</Link></li>
              <li><Link to="/products?category=handmade-jewelry" style={{ color: '#c4bcb0' }}>Handmade Jewelry</Link></li>
              <li><Link to="/products?category=paintings-folk-art" style={{ color: '#c4bcb0' }}>Paintings & Folk Art</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Marketplace
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
              <li><Link to="/products" style={{ color: '#c4bcb0' }}>Browse Catalog</Link></li>
              <li><Link to="/register?role=seller" style={{ color: '#c4bcb0' }}>Sell on ArtisanCraft</Link></li>
              <li><Link to="/login" style={{ color: '#c4bcb0' }}>Artisan & Buyer Sign In</Link></li>
              <li><Link to="/orders/history" style={{ color: '#c4bcb0' }}>Track Your Order</Link></li>
            </ul>
          </div>

          {/* Guarantee / Trust */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Our Promise
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: '#a89f93' }}>
              <div>
                <strong style={{ color: '#ffffff', display: 'block' }}>🛡️ Admin Verified Makers</strong>
                Every artisan is personally vetted for authentic craftsmanship.
              </div>
              <div>
                <strong style={{ color: '#ffffff', display: 'block' }}>📦 Direct From Workshop</strong>
                Orders are packed and shipped directly by the artisan.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid #38322c', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: '#8c8376' }}>
          <p>© {new Date().getFullYear()} ArtisanCraft Marketplace. Handcrafted with care.</p>
          <p>Local Artisan & Handicraft Marketplace Project</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
