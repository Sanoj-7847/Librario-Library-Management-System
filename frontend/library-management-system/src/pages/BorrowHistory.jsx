import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  User,
  Plus,
  RotateCcw
} from 'lucide-react';
import axios from '../service/axiosConfig';

const BorrowHistory = () => {
  const navigate = useNavigate();
  const { user, isAdminOrLibrarian } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [renewalDays, setRenewalDays] = useState(14);
  const [renewalReason, setRenewalReason] = useState('');
  const [submittingRenewal, setSubmittingRenewal] = useState(false);

  useEffect(() => {
    fetchBorrowHistory();
  }, [filter]);

  const fetchBorrowHistory = async () => {
    setLoading(true);
    try {
      let response;
      
      if (isAdminOrLibrarian) {
        response = await axios.get('/api/borrow/active');
      } else {
        response = await axios.get('/api/borrow/my-history');
      }

      const data = response.data.data || response.data;
      let filteredRecords = Array.isArray(data) ? data : [];

      if (filter !== 'ALL') {
        filteredRecords = filteredRecords.filter(r => r.status === filter);
      }

      setRecords(filteredRecords);
    } catch (error) {
      console.error('Error fetching borrow history:', error);
      toast.error('Failed to load borrow history');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = (recordId) => {
    navigate(`/return-book/${recordId}`);
  };

  const handleOpenRenewalModal = (record) => {
    setSelectedRecord(record);
    setRenewalDays(14);
    setRenewalReason('');
    setShowRenewalModal(true);
  };

  const handleSubmitRenewal = async () => {
    if (renewalDays < 1 || renewalDays > 30) {
      toast.error('Renewal days must be between 1 and 30');
      return;
    }

    setSubmittingRenewal(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:1205/librario/api/renewals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          borrowRecordId: selectedRecord.id,
          renewalDays: parseInt(renewalDays),
          reason: renewalReason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create renewal request');
      }

      toast.success('Renewal request submitted! Waiting for admin approval');
      setShowRenewalModal(false);
      setSelectedRecord(null);
      
      setTimeout(() => {
        navigate('/my-renewal-requests');
      }, 1500);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingRenewal(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ISSUED: { 
        bg: '#dbeafe', 
        color: '#1e40af',  
        label: 'ISSUED' 
      },
      RETURNED: { 
        bg: '#d1fae5', 
        color: '#065f46',  
        label: 'RETURNED' 
      },
      OVERDUE: { 
        bg: '#fee2e2', 
        color: '#991b1b',  
        label: 'OVERDUE' 
      }
    };

    const config = statusConfig[status] || statusConfig.ISSUED;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color
      }}>
        {config.label}
      </span>
    );
  };

  const calculateDaysInfo = (record) => {
    if (record.returnDate) {
      return null;
    }

    const today = new Date();
    const dueDate = new Date(record.dueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span style={{ color: 'var(--error)', fontWeight: 500 }}>
          {Math.abs(diffDays)} days overdue
        </span>
      );
    } else if (diffDays === 0) {
      return <span style={{ color: 'var(--warning)', fontWeight: 500 }}>Due today</span>;
    } else if (diffDays <= 3) {
      return (
        <span style={{ color: 'var(--warning)', fontWeight: 500 }}>
          Due in {diffDays} day{diffDays > 1 ? 's' : ''}
        </span>
      );
    } else {
      return (
        <span style={{ color: 'var(--text-secondary)' }}>
          Due in {diffDays} days
        </span>
      );
    }
  };

  const canRenew = (record) => {
    return record.status === 'ISSUED' && !record.returnDate;
  };

  return (
    <div className="page-animate">
      <div className="container" style={{ padding: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate(-1)} className="btn btn-outline">
              <ArrowLeft size={20} />
              Back
            </button>
            <div>
              <h1 style={{ margin: 0 }}>🕒 Borrow History</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                {isAdminOrLibrarian ? 'All borrow records of members' : 'Your borrowing history'}
              </p>
            </div>
          </div>

          {isAdminOrLibrarian && (
            <button
              onClick={() => navigate('/borrow-issue')}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={20} />
              Issue Book
            </button>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '0'
        }}>
          {['ALL', 'ISSUED', 'RETURNED', 'OVERDUE'].map((status) => (
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

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading borrow history...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No records found</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              {filter === 'ALL' ? 'No borrow records yet' : `No ${filter.toLowerCase()} records`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {records.map((record) => (
              <div key={record.id} className="card" style={{ padding: '1.5rem', transition: 'var(--transition)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <BookOpen size={24} style={{ color: 'var(--primary-600)' }} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{record.bookTitle}</h3>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          by {record.bookAuthor}
                        </p>
                      </div>
                    </div>

                    {isAdminOrLibrarian && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <User size={18} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {record.fullName} ({record.email})
                        </span>
                      </div>
                    )}

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          <Calendar size={16} style={{ marginRight: '0.5rem' }} />
                          Issue Date
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                          {new Date(record.borrowDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          <Calendar size={16} style={{ marginRight: '0.5rem' }} />
                          Due Date
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                          {new Date(record.dueDate).toLocaleDateString()}
                        </p>
                        {calculateDaysInfo(record) && (
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                            {calculateDaysInfo(record)}
                          </p>
                        )}
                      </div>

                      {record.returnDate && (
                        <div>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={16} style={{ marginRight: '0.5rem' }} />
                            Return Date
                          </p>
                          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                            {new Date(record.returnDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {record.penaltyAmount > 0 && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: record.penaltyPaid ? 'var(--success-light)' : 'var(--error-light)',
                        border: `1px solid ${record.penaltyPaid ? 'var(--success-border)' : 'var(--error-border)'}`,
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <strong>Penalty:</strong> ₹{record.penaltyAmount.toFixed(2)}
                        {record.overdueDays > 0 && ` (${record.overdueDays} days overdue)`}
                        {record.penaltyPaid && (
                          <span style={{ marginLeft: '1rem', color: 'var(--success)' }}>
                            ✓ Paid
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem', minWidth: '180px' }}>
                    {getStatusBadge(record.status)}

                    {/* ✅ FIX 4: Member can request renewal for ISSUED records */}
                    {!isAdminOrLibrarian && canRenew(record) && (
                      <button
                        onClick={() => handleOpenRenewalModal(record)}
                        className="btn btn-outline btn-sm"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '10px',
                          width: '100%',
                          justifyContent: 'center'
                        }}
                      >
                        Request Renewal
                      </button>
                    )}

                    {/* ✅ FIX 4: Admin can return book for BOTH ISSUED and OVERDUE */}
                    {isAdminOrLibrarian && (record.status === 'ISSUED' || record.status === 'OVERDUE') && (
                      <button
                        onClick={() => handleReturnBook(record.id)}
                        className="btn btn-primary btn-sm"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          width: '100%',
                          justifyContent: 'center'
                        }}
                      >
                        Return Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Renewal Request Modal */}
        {showRenewalModal && selectedRecord && (
          <div className="modal-overlay" onClick={() => setShowRenewalModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2 className="modal-title">Request Book Renewal</h2>
                <button onClick={() => setShowRenewalModal(false)} className="modal-close">
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div style={{
                  padding: '1rem',
                  background: 'var(--primary-50)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{selectedRecord.bookTitle}</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    by {selectedRecord.bookAuthor}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                    <strong>Current Due Date:</strong> {new Date(selectedRecord.dueDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Extension Days (1-30) *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={renewalDays}
                    onChange={(e) => setRenewalDays(e.target.value)}
                    className="form-input"
                  />
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Typical renewal: 7-14 days
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason (Optional)</label>
                  <textarea
                    value={renewalReason}
                    onChange={(e) => setRenewalReason(e.target.value)}
                    rows="3"
                    className="form-input"
                    placeholder="Why do you need an extension?"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    onClick={() => setShowRenewalModal(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    disabled={submittingRenewal}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRenewal}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={submittingRenewal}
                  >
                    {submittingRenewal ? (
                      <>
                        <div className="spinner spinner-sm"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Request
                      </>
                    )}
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

export default BorrowHistory;