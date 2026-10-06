import React, { useEffect, useState } from 'react';
import { categoryService } from '../../services/categoryService';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const ManageCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getAll();
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      setFeedback({ type: '', message: '' });

      const res = await categoryService.create(formData);
      if (res.success) {
        setFeedback({ type: 'success', message: `Category "${res.category.name}" created successfully!` });
        setShowAddModal(false);
        setFormData({ name: '', description: '', image_url: '' });
        await fetchCategories();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create category.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      const res = await categoryService.delete(id);
      if (res.success) {
        setFeedback({ type: 'success', message: `Category "${name}" deleted.` });
        await fetchCategories();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Cannot delete category with associated products.',
      });
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving craft categories..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Craft Categories Taxonomy</h1>
          <p style={{ color: 'var(--muted)' }}>
            Curate and organize marketplace disciplines and artisan specialties
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          + Add New Category
        </button>
      </div>

      {feedback.message && (
        <AlertMessage
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>URL Slug</th>
                <th>Description</th>
                <th>Active Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <strong style={{ fontSize: '1rem', color: 'var(--dark)' }}>{cat.name}</strong>
                  </td>
                  <td>
                    <code>{cat.slug}</code>
                  </td>
                  <td style={{ maxWidth: '320px', fontSize: '0.85rem', color: 'var(--dark-light)' }}>
                    {cat.description || '—'}
                  </td>
                  <td>
                    <span className="badge badge-active">{cat.product_count} items</span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              Add New Craft Category
            </h2>

            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label htmlFor="catName" className="form-label">Category Name *</label>
                <input
                  id="catName"
                  type="text"
                  required
                  placeholder="e.g. Leathercraft & Bookbinding"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="catDesc" className="form-label">Description</label>
                <textarea
                  id="catDesc"
                  placeholder="Describe the craft discipline and handmade goods included in this collection..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategoriesPage;
