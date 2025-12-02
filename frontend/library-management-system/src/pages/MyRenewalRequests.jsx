import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { RotateCcw, ArrowLeft, BookOpen, Calendar, Clock, CheckCircle, XCircle, X } from 'lucide-react';

const MyRenewalRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [activeBooks, setActiveBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [filter, setFilter] = useState('ALL');
  
  const [formData, setFormData] = useState({
    borrowRecordId: '',
    renewalDays: 14,
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch renewal requests
      const requestsResponse = await fetch('http://localhost:1205/librario/api/renewals/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const requestsData = await requestsResponse.json();
      setRequests(requestsData.data || []);

      // Fetch active borrows (for creating new requests)
      const borrowsResponse = await fetch('http://localhost:1205/librario/api/borrow/my-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const borrowsData = await borrowsResponse.json();
      const active = (borrowsData.data || []).filter(b => b.status === 'ISSUED');
      setActiveBooks(active);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.borrowRecordId) {
      toast.error('Please select a book');
      return;
    }

    if (formData.renewalDays < 1 || formData.renewalDays > 30) {
      toast.error('Renewal days must be between 1 and 30');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:1205/librario/api/renewals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          borrowRecordId: parseInt(formData.borrowRecordId),
          renewalDays: parseInt(formData.renewalDays),
          reason: formData.reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create request');
      }

      toast.success('Renewal request sent!');
      setShowCreateModal(false);
      setFormData({ borrowRecordId: '', renewalDays: 14, reason: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Cancel this renewal request?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:1205/librario/api/renewals/${requestId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to cancel');

      toast.success('Request cancelled');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { color: '#fbbf24', bg: '#fef3c7', label: 'PENDING' },
      APPROVED: { color: '#10b981', bg: '#d1fae5', label: 'APPROVED' },
      REJECTED: { color: '#ef4444', bg: '#fee2e2', label: 'REJECTED' },
      EXPIRED: { color: '#6b7280', bg: '#f3f4f6', label: 'EXPIRED' }
    };
    const { color, bg, label } = config[status] || config.PENDING;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: bg,
        color: color,
        fontWeight: 600,
        fontSize: '0.875rem'
      }}>
        {label}
      </span>
    );
  };

  const filteredRequests = filter === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading renewal requests...</p>
      </div>
    );
  }

  return (
    <div className="page-animate" style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate(-1)} className="btn btn-outline">
              <ArrowLeft size={20} /> Back
            </button>
            <div>
              <h1 style={{ margin: 0 }}>🔄 My Renewal Requests</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                Request extensions for your borrowed books
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            disabled={activeBooks.length === 0}
          >
            Request Renewal
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid var(--border-color)'
        }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
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
        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <RotateCcw size={64} style={{ color: 'var(--gray-400)' }} />
            <p style={{ fontSize: '1.25rem', marginTop: '1rem' }}>No renewal requests</p>
            {activeBooks.length > 0 && (
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                Create Renewal Request
              </button>
            )}
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

                      {/* Dates Info */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={14} /> Current Due
                          </p>
                          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600 }}>
                            {new Date(request.currentDueDate).toLocaleDateString()}
                          </p>
                        </div>
                        {request.newDueDate && (
                          <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <Calendar size={14} /> New Due Date
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--success)' }}>
                              {new Date(request.newDueDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Extension Days
                          </p>
                          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600 }}>
                            {request.renewalDays || 0} days
                          </p>
                        </div>
                      </div>

                      {/* Reason & Notes */}
                      {request.reason && (
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                          <strong>Your Reason:</strong> {request.reason}
                        </p>
                      )}
                      {request.adminNotes && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--primary-600)' }}>
                          <strong>Admin Response:</strong> {request.adminNotes}
                        </p>
                      )}

                      {/* Cancel Button */}
                      {request.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="btn btn-outline btn-sm"
                          style={{ marginTop: '1rem', color: 'var(--error)' }}
                        >
                          <X size={16} /> Cancel Request
                        </button>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div>{getStatusBadge(request.status)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Request Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2 className="modal-title">Request Book Renewal</h2>
                <button onClick={() => setShowCreateModal(false)} className="modal-close">
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                {/* Select Book */}
                <div className="form-group">
                  <label className="form-label">Select Book *</label>
                  <select
                    value={formData.borrowRecordId}
                    onChange={(e) => {
                      setFormData({ ...formData, borrowRecordId: e.target.value });
                      const book = activeBooks.find(b => b.id === parseInt(e.target.value));
                      setSelectedBook(book);
                    }}
                    className="form-input"
                    required
                  >
                    <option value="">-- Select a book --</option>
                    {activeBooks.map(book => (
                      <option key={book.id} value={book.id}>
                        {book.bookTitle} - Due: {new Date(book.dueDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Book Details */}
                {selectedBook && (
                  <div style={{
                    padding: '1rem',
                    background: 'var(--primary-50)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      <strong>Author:</strong> {selectedBook.bookAuthor}
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                      <strong>Current Due:</strong> {new Date(selectedBook.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Renewal Days */}
                <div className="form-group">
                  <label className="form-label">Extension Days (1-30) *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.renewalDays}
                    onChange={(e) => setFormData({ ...formData, renewalDays: e.target.value })}
                    className="form-input"
                    required
                  />
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Typical renewal: 7-14 days
                  </p>
                </div>

                {/* Reason */}
                <div className="form-group">
                  <label className="form-label">Reason (Optional)</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows="3"
                    className="form-input"
                    placeholder="Why do you need an extension?"
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRequest}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyRenewalRequests;