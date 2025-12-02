import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, BookOpen, Clock, CheckCircle, XCircle, X } from 'lucide-react';

const MyBookRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:1205/librario/api/book-requests/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch requests');

      const data = await response.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Cancel this request?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:1205/librario/api/book-requests/${requestId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to cancel');

      toast.success('Request cancelled');
      fetchMyRequests();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { color: '#fbbf24', bg: '#fef3c7'},
      APPROVED: { color: '#10b981', bg: '#d1fae5'},
      REJECTED: { color: '#ef4444', bg: '#fee2e2'},
      CANCELLED: { color: '#6b7280', bg: '#f3f4f6'}
    };
    const { color, bg, icon } = config[status] || config.PENDING;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: bg,
        color,
        fontWeight: 600
      }}>
        {icon}
        {status}
      </span>
    );
  };

  const filteredRequests = filter === "ALL"
    ? requests
    : requests.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="page-animate" style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft size={20} /> Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>📚 My Book Requests</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
              Track your borrowing requests
            </p>
          </div>
        </div>

        {/* ✅ Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid var(--border-color)'
        }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: filter === status ? '3px solid var(--primary-600)' : '3px solid transparent',
                color: filter === status ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: filter === status ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* List */}
        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} style={{ color: 'var(--gray-400)' }} />
            <p style={{ fontSize: '1.25rem', marginTop: '1rem' }}>No requests found</p>
            <button onClick={() => navigate('/books')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Browse Books
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {filteredRequests.map(request => (
              <div key={request.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      
                      {/* Book Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <BookOpen size={24} style={{ color: 'var(--primary-600)' }} />
                        <div>
                          <h3 style={{ margin: 0 }}>{request.bookTitle}</h3>
                          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                            by {request.bookAuthor}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                          <strong>Request Date:</strong> {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                        {request.notes && (
                          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                            <strong>Your Note:</strong> {request.notes}
                          </p>
                        )}
                        {request.adminNotes && (
                          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--primary-600)' }}>
                            <strong>Admin Response:</strong> {request.adminNotes}
                          </p>
                        )}
                      </div>

                      {request.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(request.id)}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--error)' }}
                        >
                          <X size={16} /> Cancel Request
                        </button>
                      )}
                    </div>

                    {/* Status */}
                    <div>{getStatusBadge(request.status)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyBookRequests;
