import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  DollarSign,
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  BookOpen,
  User,
  CreditCard,
  Filter,
  AlertTriangle
} from 'lucide-react';
import axios from '../service/axiosConfig';

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { user, isAdminOrLibrarian } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalPenalties: 0,
    totalDamage: 0,
    completedPayments: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let response;
      
      if (isAdminOrLibrarian) {
        // Admin/Librarian: Get all payments
        response = await axios.get('/api/payments');
      } else {
        // Member: Get only their payments
        response = await axios.get(`/api/payments/my-payments`);
      }

      const data = response.data.data || response.data;
      const paymentsList = Array.isArray(data) ? data : [];

      setPayments(paymentsList);

      // Calculate statistics
      const totalPayments = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalPenalties = paymentsList
        .filter(p => p.paymentType === 'PENALTY')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalDamage = paymentsList
        .filter(p => p.paymentType === 'DAMAGE_REPAIR')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const completedPayments = paymentsList
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats({
        totalPayments,
        totalPenalties,
        totalDamage,
        completedPayments
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentTypeBadge = (type) => {
    const badges = {
      PENALTY: { bg: '#fee2e2', color: '#991b1b', label: 'Late Penalty' },
      DAMAGE_REPAIR: { bg: '#fef3c7', color: '#92400e', label: 'Damage Repair' },
      MEMBERSHIP_FEE: { bg: '#dbeafe', color: '#1e40af', label: 'Membership' }
    };
    const badge = badges[type] || badges.PENALTY;
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: badge.bg,
        color: badge.color
      }}>
        {badge.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'CASH':
        return '💵';
      case 'CARD':
        return '💳';
      case 'UPI':
        return '📱';
      default:
        return '💰';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      COMPLETED: { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle size={14} />, label: 'Paid' },
      PENDING: { bg: '#fef3c7', color: '#92400e', icon: <XCircle size={14} />, label: 'Pending' },
      FAILED: { bg: '#fee2e2', color: '#991b1b', icon: <XCircle size={14} />, label: 'Failed' }
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        fontWeight: 600,
        background: config.bg,
        color: config.color
      }}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const filteredPayments = payments.filter(p => {
    if (filter === 'COMPLETED' && p.status !== 'COMPLETED') return false;
    if (filter === 'PENDING' && p.status !== 'PENDING') return false;
    if (typeFilter !== 'ALL' && p.paymentType !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading payment history...</p>
      </div>
    );
  }

  return (
    <div className="page-animate">
      <div className="container" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>💳 Payment History</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
              {isAdminOrLibrarian ? 'All payment transactions' : 'Your payment history'}
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div className="card-body">
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Total Payments</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold' }}>
                ₹{stats.totalPayments.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
            <div className="card-body">
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Penalties</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold' }}>
                ₹{stats.totalPenalties.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
            <div className="card-body">
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Damage Costs</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold' }}>
                ₹{stats.totalDamage.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
            <div className="card-body">
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Completed</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold' }}>
                ₹{stats.completedPayments.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={20} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontWeight: 600 }}>Status:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['ALL', 'COMPLETED', 'PENDING'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={filter === status ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Type:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['ALL', 'PENALTY', 'DAMAGE_REPAIR'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={typeFilter === type ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                  >
                    {type === 'ALL' ? 'ALL' : type === 'PENALTY' ? 'Penalties' : 'Damage'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={64} style={{ color: 'var(--gray-400)' }} />
            <p style={{ fontSize: '1.25rem', marginTop: '1rem' }}>No payments found</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              {filter !== 'ALL' || typeFilter !== 'ALL' ? 'Try adjusting your filters' : 'No payment history yet'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {filteredPayments.map(payment => (
              <div key={payment.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '2rem' }}>
                    {/* Left Section */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: payment.paymentType === 'PENALTY' ? '#fee2e2' : '#fef3c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem'
                        }}>
                          {payment.paymentType === 'PENALTY' ? '⏰' : '🔧'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            {getPaymentTypeBadge(payment.paymentType)}
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
                            {payment.bookTitle || 'Book Payment'}
                          </h3>
                        </div>
                      </div>

                      {isAdminOrLibrarian && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <User size={18} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {payment.userFullName} ({payment.userEmail})
                          </span>
                        </div>
                      )}

                      <div style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem'
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Payment Method
                          </p>
                          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{getPaymentMethodIcon(payment.paymentMethod)}</span>
                            {payment.paymentMethod}
                          </p>
                        </div>

                        {payment.transactionId && (
                          <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                              Transaction ID
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, fontSize: '0.875rem', wordBreak: 'break-all' }}>
                              {payment.transactionId}
                            </p>
                          </div>
                        )}

                        {payment.notes && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                              Notes
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                              {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Amount & Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end', minWidth: '180px' }}>
                      <div style={{
                        padding: '1.5rem',
                        background: payment.status === 'COMPLETED' ? 'var(--success-light)' : 'var(--warning-light)',
                        border: `2px solid ${payment.status === 'COMPLETED' ? 'var(--success-border)' : 'var(--warning)'}`,
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'center',
                        width: '100%'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          Amount
                        </p>
                        <p style={{
                          margin: '0.5rem 0 0 0',
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: payment.status === 'COMPLETED' ? 'var(--success)' : '#92400e'
                        }}>
                          ₹{payment.amount.toFixed(2)}
                        </p>
                      </div>

                      {getStatusBadge(payment.status)}
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

export default TransactionHistory;