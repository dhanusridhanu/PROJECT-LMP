import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Fetch categories on mount
  useEffect(() => {
    categoryService.getAll().then((res) => {
      if (res.success) setCategories(res.categories);
    });
  }, []);

  // Fetch products whenever search params change
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await productService.getAll({
          category: currentCategory,
          search: currentSearch,
          sort: currentSort,
          page: currentPage,
          limit: 12,
        });

        if (res.success) {
          setProducts(res.products);
          setTotalPages(res.totalPages);
          setTotalCount(res.total);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [currentCategory, currentSearch, currentSort, currentPage]);

  const handleCategorySelect = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSortChange = (e) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', e.target.value);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-wrapper container">
      {/* Header & Filter Controls */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Handmade Marketplace Catalog</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.05rem', marginBottom: '1.75rem' }}>
          Showing {totalCount} authentic handcrafted products made by local artisans
        </p>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button
            onClick={() => handleCategorySelect('')}
            className={`btn btn-sm ${!currentCategory ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '999px' }}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`btn btn-sm ${currentCategory === cat.slug ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px' }}
            >
              {cat.name} ({cat.product_count})
            </button>
          ))}
        </div>

        {/* Search & Sort Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.92rem', color: 'var(--muted)' }}>
            {currentSearch && (
              <span>
                Search results for: <strong>"{currentSearch}"</strong>{' '}
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete('search');
                    setSearchParams(params);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: '0.5rem' }}
                >
                  ✕ Clear
                </button>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <label htmlFor="sortSelect" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sort By:</label>
            <select
              id="sortSelect"
              value={currentSort}
              onChange={handleSortChange}
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 1.8rem 0.45rem 0.75rem', fontSize: '0.9rem' }}
            >
              <option value="newest">Recently Added</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid Area */}
      {loading ? (
        <LoadingSpinner text="Loading craft catalog..." />
      ) : products.length > 0 ? (
        <>
          <div className="grid-4" style={{ marginBottom: '3rem' }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn btn-outline btn-sm"
              >
                ← Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                  style={{ minWidth: '36px' }}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn btn-outline btn-sm"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
          <h2>No matching handicrafts found</h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
            We couldn't find any creations matching your search or filters. Try adjusting your search term or select another craft category.
          </p>
          <button onClick={() => setSearchParams({})} className="btn btn-outline">
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
