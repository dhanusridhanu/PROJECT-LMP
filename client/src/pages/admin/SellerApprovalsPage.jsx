import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const SellerApprovalsPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchSellers = async (status = filterStatus) => {
    try {
      setLoading(true);
      const res = await adminService.getSellers(status);
      if (res.success) {
        setSellers(res.sellers);
      }
    } catch (err) {
      console.error('Failed to load seller applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers(filterStatus);
  }, [filterStatus]);

  const handleDecision = async (sellerId, action, shopName) => {
    const remarks = window.prompt(
      `Enter admin remarks for ${action.toUpperCase()} on "${shopName}" (optional):`,
      action === 'approved' ? 'Verified authentic artisan craftsmanship.' : 'Application does not meet criteria.'
    );

    if (remarks === null) return; // User cancelled prompt

    try {
      setProcessingId(sellerId);
      setFeedback({ type: '', message: '' });

      const res = await adminService.updateSellerApproval(sellerId, action, remarks);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Artisan "${shopName}" has been successfully ${action}!`,
        });
        await fetchSellers();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update artisan status.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const statusColors = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Artisan Seller Approvals & Vetting</h1>
        <p style={{ color: 'var(--muted)' }}>
          Review artisan workshop applications, verify authentic craftsmanship, and grant store publishing rights
        </p>
      </div>

      {feedback.message && (
        <AlertMessage
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterStatus('')}
          className={`btn btn-sm ${!filterStatus ? 'btn-primary' : 'btn-outline'}`}
        >
          All Applications ({sellers.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-primary' : 'btn-outline'}`}
        >
          ⏳ Pending Review
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`btn btn-sm ${filterStatus === 'approved' ? 'btn-primary' : 'btn-outline'}`}
        >
          ✓ Approved Artisans
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`btn btn-sm ${filterStatus === 'rejected' ? 'btn-primary' : 'btn-outline'}`}
        >
          ✕ Rejected
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching seller verification queue..." />
      ) : sellers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🛡️</span>
          <h3>No applications found</h3>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
            No artisan applications currently match the selected status filter.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Shop & Artisan</th>
                  <th>Craft Specialty</th>
                  <th>Artisan Bio / Story</th>
                  <th>Contact Details</th>
                  <th>Status</th>
                  <th>Decisions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.seller_id}>
                    <td>
                      <strong style={{ fontSize: '1rem', display: 'block', color: 'var(--dark)' }}>
                        {s.shop_name}
                      </strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        Maker: {s.full_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-placed">{s.craft_type || 'General Crafts'}</span>
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '0.85rem', color: 'var(--dark-light)', lineHeight: 1.5 }}>
                      {s.bio || 'No backstory provided.'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <span style={{ display: 'block' }}>📧 {s.email}</span>
                      {s.phone && <span style={{ display: 'block', color: 'var(--muted)' }}>📞 {s.phone}</span>}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[s.approval_status] || 'badge-pending'}`}>
                        {s.approval_status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {s.approval_status !== 'approved' && (
                          <button
                            onClick={() => handleDecision(s.seller_id, 'approved', s.shop_name)}
                            disabled={processingId === s.seller_id}
                            className="btn btn-secondary btn-sm"
                            title="Approve seller"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {s.approval_status !== 'rejected' && (
                          <button
                            onClick={() => handleDecision(s.seller_id, 'rejected', s.shop_name)}
                            disabled={processingId === s.seller_id}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                            title="Reject seller"
                          >
                            ✕ Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerApprovalsPage;
