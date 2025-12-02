import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Clock, BookOpen, User, ArrowLeft } from 'lucide-react';

const BookRequestManagement = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const endpoint = filter === 'PENDING'
        ? 'http://localhost:1205/librario/api/book-requests/pending'
        : 'http://localhost:1205/librario/api/book-requests/all';

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      let requestsList = data.data || [];

      if (filter !== 'PENDING' && filter !== 'ALL') {
        requestsList = requestsList.filter(r => r.status === filter);
      }

      setRequests(requestsList);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    const adminNotes = window.prompt('Add approval notes (optional):');

    try {
      setProcessing(requestId);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:1205/librario/api/book-requests/${requestId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'APPROVE',
          adminNotes: adminNotes || 'Approved'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve');
      }

      toast.success('Request approved and book issued!');
      fetchRequests();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (requestId) => {
    const adminNotes = window.prompt('⚠️ Reason for rejecting this request (required):\n\nThis will be sent to the member via email.');

    if (!adminNotes || adminNotes.trim() === '') {
      toast.warning('Please provide a reason for rejecting the request');
      return;
    }

    try {
      setProcessing(requestId);
      const token = localStorage.getItem('token');

      console.log('🚫 Rejecting request:', requestId);
      console.log('📝 Reason:', adminNotes);

      const response = await fetch(`http://localhost:1205/librario/api/book-requests/${requestId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'REJECT',  
          adminNotes: adminNotes.trim()
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Rejection error:', errorData);
        throw new Error(errorData.message || 'Failed to reject request');
      }

      const result = await response.json();
      console.log('Request rejected:', result);

      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { color: '#fbbf24', bg: '#fef3c7', label: 'PENDING' },
      APPROVED: { color: '#10b981', bg: '#d1fae5', label: 'APPROVED' },
      REJECTED: { color: '#ef4444', bg: '#fee2e2', label: 'REJECTED' },
      CANCELLED: { color: '#6b7280', bg: '#f3f4f6', label: 'CANCELLED' }
    };

    const { color, bg, icon, label } = config[status] || config.PENDING;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: bg,
        color: color,
        fontWeight: 600,
        fontSize: '0.875rem'
      }}>
        {icon}
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="page-animate" style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>📚 Book Requests Management</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
              Approve or reject member book borrowing requests
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '0'
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

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} style={{ color: 'var(--gray-400)' }} />
            <p style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
              {filter === 'PENDING' ? 'No pending requests' : 'No requests found'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {requests.map(request => (
              <div key={request.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '2rem' }}>
                    {/* Left: Book & Member Info */}
                    <div style={{ flex: 1 }}>
                      {/* Book Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <BookOpen size={28} style={{ color: 'var(--primary-600)' }} />
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{request.bookTitle}</h3>
                          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                            by {request.bookAuthor} • ISBN: {request.bookIsbn || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Member Info */}
                      <div style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <User size={18} style={{ color: 'var(--text-secondary)' }} />
                          <strong>Member:</strong> {request.userFullName}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '1.625rem' }}>
                          {request.userEmail}
                        </p>
                      </div>

                      {/* Request Details */}
                      <div style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                          <strong>Request Date:</strong> {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                        {request.notes && (
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                            <strong>Member Note:</strong> {request.notes}
                          </p>
                        )}
                        {request.adminNotes && (
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--primary-600)' }}>
                            <strong>Admin Response:</strong> {request.adminNotes}
                          </p>
                        )}
                        {request.processedByName && (
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                            <strong>Processed By:</strong> {request.processedByName}
                            {request.processedDate && ` on ${new Date(request.processedDate).toLocaleString()}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'flex-end' }}>
                      {getStatusBadge(request.status)}

                      {request.status === 'PENDING' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '200px' }}>
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processing === request.id}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            {processing === request.id ? (
                              <>
                                <div className="spinner spinner-sm"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={18} />
                                Accept
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDecline(request.id)}
                            disabled={processing === request.id}
                            className="btn btn-danger"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            <XCircle size={18} />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
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

export default BookRequestManagement;