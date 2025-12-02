import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Clock, BookOpen, User, ArrowLeft, Calendar } from 'lucide-react';
import axios from '../service/axiosConfig'; // ✅ use same axios setup as rest of project

const RenewalManagement = () => {
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
      let endpoint = '/api/renewals';

      // ✅ Use correct paths from backend
      if (filter === 'PENDING') {
        endpoint = '/api/renewals/pending';
      } else if (filter !== 'ALL') {
        endpoint = `/api/renewals/status/${filter}`;
      }

      const response = await axios.get(endpoint);
      const data = response.data?.data || response.data || [];

      setRequests(data);
    } catch (error) {
      console.error('Error loading renewal requests:', error);
      toast.error('Failed to load renewal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    const renewalDays = window.prompt('Enter extension days (7-30):', '14');
    if (!renewalDays || isNaN(renewalDays) || renewalDays < 1 || renewalDays > 30) {
      toast.error('Please enter valid days (1-30)');
      return;
    }

    const adminNotes = window.prompt('Add approval notes (optional):');
    try {
      setProcessing(requestId);
      await axios.post(`/api/renewals/${requestId}/process`, {
        action: 'APPROVE',
        renewalDays: parseInt(renewalDays),
        adminNotes: adminNotes || 'Approved',
      });
      toast.success(`Renewal approved! Extended by ${renewalDays} days`);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    const adminNotes = window.prompt('⚠️ Reason for rejecting (required):');
    if (!adminNotes || adminNotes.trim() === '') {
      toast.warning('Please provide a reason');
      return;
    }

    try {
      setProcessing(requestId);
      await axios.post(`/api/renewals/${requestId}/process`, {
        action: 'REJECT',
        adminNotes: adminNotes.trim(),
      });
      toast.success('Renewal request rejected');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { color: '#fbbf24', bg: '#fef3c7', label: 'PENDING' },
      APPROVED: { color: '#10b981', bg: '#d1fae5', label: 'APPROVED' },
      REJECTED: { color: '#ef4444', bg: '#fee2e2', label: 'REJECTED' },
      EXPIRED: { color: '#6b7280', bg: '#f3f4f6', label: 'EXPIRED' },
    };
    const { color, bg, label } = config[status] || config.PENDING;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: bg,
          color,
          fontWeight: 600,
          fontSize: '0.875rem',
        }}
      >
        {label}
      </span>
    );
  };

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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>🔄 Book Renewal Requests</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
              Approve or reject book renewal requests from members
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            borderBottom: '2px solid var(--border-color)',
          }}
        >
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom:
                  filter === status
                    ? '3px solid var(--primary-600)'
                    : '3px solid transparent',
                color:
                  filter === status ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: filter === status ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="empty-state">
            <Clock size={64} style={{ color: 'var(--gray-400)' }} />
            <p style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
              {filter === 'PENDING' ? 'No pending renewal requests' : 'No requests found'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {requests.map((request) => (
              <div key={request.id} className="card">
                <div className="card-body">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      gap: '2rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <BookOpen size={28} style={{ color: 'var(--primary-600)' }} />
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{request.bookTitle}</h3>
                          <p
                            style={{
                              margin: '0.25rem 0 0 0',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            by {request.bookAuthor}
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '1rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '1rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <User size={18} style={{ color: 'var(--text-secondary)' }} />
                          <strong>Member:</strong> {request.userFullName} ({request.userEmail})
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '1rem',
                          padding: '1rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <Calendar size={14} /> Current Due
                          </p>
                          <p
                            style={{
                              margin: '0.25rem 0 0 0',
                              fontWeight: 600,
                            }}
                          >
                            {new Date(request.currentDueDate).toLocaleDateString()}
                          </p>
                        </div>
                        {request.newDueDate && (
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <Calendar size={14} /> New Due Date
                            </p>
                            <p
                              style={{
                                margin: '0.25rem 0 0 0',
                                fontWeight: 600,
                                color: 'var(--success)',
                              }}
                            >
                              {new Date(request.newDueDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            Extension
                          </p>
                          <p
                            style={{
                              margin: '0.25rem 0 0 0',
                              fontWeight: 600,
                            }}
                          >
                            {request.renewalDays || 0} days
                          </p>
                        </div>
                      </div>

                      {request.reason && (
                        <p style={{ margin: '1rem 0 0 0', fontSize: '0.875rem' }}>
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      )}
                      {request.adminNotes && (
                        <p
                          style={{
                            margin: '0.5rem 0 0 0',
                            fontSize: '0.875rem',
                            color: 'var(--primary-600)',
                          }}
                        >
                          <strong>Admin Response:</strong> {request.adminNotes}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3rem',
                        alignItems: 'flex-end',
                      }}
                    >
                      {getStatusBadge(request.status)}

                      {request.status === 'PENDING' && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            width: '200px',
                          }}
                        >
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
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
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

export default RenewalManagement;
