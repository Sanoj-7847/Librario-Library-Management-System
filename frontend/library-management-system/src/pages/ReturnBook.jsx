import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  AlertCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle
} from 'lucide-react';
import axios from '../service/axiosConfig';

const ReturnBook = () => {
  const navigate = useNavigate();
  const { recordId } = useParams();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [penalty, setPenalty] = useState(null);
  const [showPaymentPortal, setShowPaymentPortal] = useState(false);

  // ✅ No backend data hardcoded – only UI defaults
  const [formData, setFormData] = useState({
    borrowRecordId: null,
    returnDate: '',
    notes: '',
    isDamaged: false,
    damageLevel: 'MINOR',
    damageDescription: '',
    repairCost: 0,
    paymentMethod: '',
    transactionId: '',
    paymentCompleted: false
  });

  const damageLevels = [
    { value: 'MINOR', label: 'Minor', color: '#10b981', description: 'Small wear, minor scratches' },
    { value: 'MODERATE', label: 'Moderate', color: '#f59e0b', description: 'Torn pages, water damage' },
    { value: 'SEVERE', label: 'Severe', color: '#ef4444', description: 'Major damage, missing pages' },
    { value: 'LOST', label: 'Lost/Missing', color: '#991b1b', description: 'Book completely lost' }
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash', icon: <Banknote size={20} />, description: 'Pay at library counter' },
    { value: 'CARD', label: 'Card', icon: <CreditCard size={20} />, description: 'Debit/Credit card' },
    { value: 'UPI', label: 'UPI', icon: <Smartphone size={20} />, description: 'PhonePe / GPay / Paytm' }
  ];

  useEffect(() => {
    if (recordId) {
      fetchBorrowRecord();
      calculatePenalty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const fetchBorrowRecord = async () => {
    try {
      setFetchLoading(true);
      const response = await axios.get(`/api/borrow/${recordId}`);
      const data = response.data.data || response.data;
      setRecord(data);

      // 🔁 Set backend-linked values in formData here, not hardcoded
      setFormData((prev) => ({
        ...prev,
        borrowRecordId: data.id || parseInt(recordId, 10),
        returnDate: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Error fetching borrow record:', error);
      toast.error('Failed to load borrow record');
      navigate('/borrow-history');
    } finally {
      setFetchLoading(false);
    }
  };

  const calculatePenalty = async () => {
    try {
      const response = await axios.get(`/api/borrow/${recordId}/penalty`);
      const data = response.data.data || response.data;
      setPenalty(data);
    } catch (error) {
      console.error('Error calculating penalty:', error);
    }
  };

  const calculateTotalAmount = () => {
    const penaltyAmount = penalty?.penaltyAmount || 0;
    const damageAmount = formData.isDamaged ? (formData.repairCost || 0) : 0;
    return penaltyAmount + damageAmount;
  };

  const calculateDaysBorrowed = () => {
    if (!record || !formData.returnDate) return 0;
    const borrowDate = new Date(record.borrowDate);
    const returnDate = new Date(formData.returnDate);
    const diffTime = Math.abs(returnDate.getTime() - borrowDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = () => {
    if (!record || !formData.returnDate) return false;
    const dueDate = new Date(record.dueDate);
    const returnDate = new Date(formData.returnDate);
    return returnDate > dueDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalAmount = calculateTotalAmount();

    // Damage validation
    if (formData.isDamaged) {
      if (!formData.damageDescription.trim()) {
        toast.error('Please describe the damage');
        return;
      }
      if (!formData.repairCost || formData.repairCost <= 0) {
        toast.error('Please enter estimated repair cost');
        return;
      }
    }

    // If amount due, show payment portal instead
    if (totalAmount > 0 && !formData.paymentCompleted) {
      setShowPaymentPortal(true);
      return;
    }

    // Confirm damage
    if (formData.isDamaged) {
      const confirmDamage = window.confirm(
        `⚠️ You are reporting this book as ${formData.damageLevel}.\n\n` +
        `Estimated Cost: ₹${formData.repairCost.toFixed(2)}\n\n` +
        `This will create a damage report. Continue?`
      );
      if (!confirmDamage) return;
    }

    setLoading(true);

    try {
      const requestData = {
        borrowRecordId: formData.borrowRecordId ?? parseInt(recordId, 10),
        returnDate: formData.returnDate,
        notes: formData.notes,
        isDamaged: formData.isDamaged,
        ...(formData.isDamaged && {
          damageLevel: formData.damageLevel,
          damageDescription: formData.damageDescription,
          repairCost: parseFloat(formData.repairCost) || 0
        }),
        ...(formData.paymentCompleted && {
          paymentMethod: formData.paymentMethod,
          transactionId: formData.transactionId,
          paymentCompleted: true
        })
      };

      await axios.post('/api/borrow/return', requestData);

      if (formData.paymentCompleted) {
        toast.success(
          `✅ Book returned & payment of ₹${totalAmount.toFixed(2)} completed!`,
          { autoClose: 5000 }
        );
      } else if (formData.isDamaged) {
        toast.success('Book returned and damage report created!', { autoClose: 5000 });
      } else {
        toast.success('Book returned successfully!');
      }

      navigate('/borrow-history');
    } catch (error) {
      console.error('Error returning book:', error);
      const message = error.response?.data?.message || 'Failed to return book';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = () => {
    if (!formData.paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (
      (formData.paymentMethod === 'CARD' || formData.paymentMethod === 'UPI') &&
      !formData.transactionId.trim()
    ) {
      toast.error('Please enter transaction ID');
      return;
    }

    const totalAmount = calculateTotalAmount();

    const confirmPayment = window.confirm(
      `Confirm Payment of ₹${totalAmount.toFixed(2)}?\n\n` +
      `Penalty: ₹${(penalty?.penaltyAmount || 0).toFixed(2)}\n` +
      `Damage Cost: ₹${formData.isDamaged ? formData.repairCost.toFixed(2) : '0.00'}\n\n` +
      `Payment Method: ${formData.paymentMethod}\n` +
      (formData.transactionId ? `Transaction ID: ${formData.transactionId}` : '')
    );

    if (!confirmPayment) return;

    setFormData((prev) => ({ ...prev, paymentCompleted: true }));
    setShowPaymentPortal(false);
    toast.success('Payment details confirmed! Now submit to complete return.');
  };

  if (fetchLoading) {
    return (
      <div className="page-animate">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading borrow record...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-animate">
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Borrow record not found</p>
          <button
            onClick={() => navigate('/borrow-history')}
            className="btn btn-primary"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = calculateTotalAmount();

  return (
    <div className="page-animate">
      <div className="container" style={{ maxWidth: '900px', padding: '2rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 style={{ margin: 0 }}>📚 Return Book</h1>
        </div>

        {/* Book Details Card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div
            className="card-header"
            style={{
              backgroundColor: 'var(--primary-50)',
              borderBottom: '2px solid var(--primary-200)'
            }}
          >
            <h3
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--primary-700)'
              }}
            >
              <BookOpen size={24} />
              Book Information
            </h3>
          </div>
          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem'
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Title
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  {record.bookTitle}
                </p>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Author
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  {record.bookAuthor}
                </p>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Member
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}
                >
                  {record.fullName}
                </p>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Email
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}
                >
                  {record.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Clock size={24} />
              Borrow Timeline
            </h3>
          </div>
          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--primary-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--primary-200)'
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Calendar
                    size={16}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Issued On
                </p>
                <p
                  style={{
                    margin: '0.5rem 0 0 0',
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  {new Date(record.borrowDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: isOverdue()
                    ? 'var(--error-light)'
                    : 'var(--warning-light)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    isOverdue() ? 'var(--error-border)' : 'var(--warning)'
                  }`
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Calendar
                    size={16}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Due Date
                </p>
                <p
                  style={{
                    margin: '0.5rem 0 0 0',
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  {new Date(record.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--success-light)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--success-border)'
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Days Borrowed
                </p>
                <p
                  style={{
                    margin: '0.5rem 0 0 0',
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  {calculateDaysBorrowed()} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Penalty / On-time info */}
        {penalty && penalty.penaltyAmount > 0 && (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--error-light)',
              border: '2px solid var(--error-border)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}
          >
            <AlertCircle
              size={32}
              style={{ color: 'var(--error)', flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: '0 0 0.75rem 0',
                  color: 'var(--error)',
                  fontSize: '1.25rem',
                  fontWeight: 700
                }}
              >
                ⚠️ Late Return Penalty
              </h4>
              <div
                style={{
                  display: 'grid',
                  gap: '0.5rem',
                  color: '#991b1b',
                  fontSize: '1rem'
                }}
              >
                <p style={{ margin: 0 }}>
                  Book is{' '}
                  <strong>
                    {penalty.overdueDays} day
                    {penalty.overdueDays > 1 ? 's' : ''} overdue
                  </strong>
                </p>
                <p style={{ margin: 0 }}>
                  Penalty Rate:{' '}
                  <strong>₹15 per day</strong>
                  {/* If you have rate from backend, render that instead of hardcode */}
                </p>
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--error)'
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: 'var(--error)'
                    }}
                  >
                    Penalty Amount: ₹{penalty.penaltyAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {penalty && penalty.penaltyAmount === 0 && (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--success-light)',
              border: '2px solid var(--success-border)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <span style={{ color: 'white', fontSize: '1.5rem' }}>✓</span>
            </div>
            <div>
              <h4
                style={{
                  margin: '0 0 0.25rem 0',
                  color: '#065f46',
                  fontSize: '1.25rem'
                }}
              >
                ✅ On-Time Return
              </h4>
              <p style={{ margin: 0, color: '#065f46' }}>
                No penalty charges. Thank you!
              </p>
            </div>
          </div>
        )}

        {/* Return Form */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Return Details</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Return Date */}
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={18} style={{ marginRight: '0.5rem' }} />
                  Return Date *
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.returnDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      returnDate: e.target.value
                    }))
                  }
                  max={new Date().toISOString().split('T')[0]}
                  min={
                    record.borrowDate
                      ? new Date(record.borrowDate)
                          .toISOString()
                          .split('T')[0]
                      : undefined
                  }
                  required
                />
              </div>

              {/* Damage toggle */}
              <div className="form-group">
                <label
                  className="checkbox-label"
                  style={{
                    padding: '1rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    backgroundColor: formData.isDamaged ? '#fee2e2' : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.isDamaged}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isDamaged: e.target.checked
                      }))
                    }
                    style={{ width: '20px', height: '20px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}
                    >
                      <AlertTriangle
                        size={18}
                        style={{ marginRight: '0.5rem', color: '#ef4444' }}
                      />
                      Report Book Damage
                    </span>
                    <p
                      style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Check if the book is damaged, lost, or needs repair
                    </p>
                  </div>
                </label>
              </div>

              {/* Damage details */}
              {formData.isDamaged && (
                <>
                  {/* Damage level */}
                  <div className="form-group">
                    <label className="form-label">Damage Level *</label>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {damageLevels.map((level) => (
                        <label
                          key={level.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            border: `2px solid ${
                              formData.damageLevel === level.value
                                ? level.color
                                : 'var(--border-color)'
                            }`,
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            background:
                              formData.damageLevel === level.value
                                ? `${level.color}15`
                                : 'transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input
                            type="radio"
                            name="damageLevel"
                            value={level.value}
                            checked={formData.damageLevel === level.value}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                damageLevel: e.target.value
                              }))
                            }
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.25rem'
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: level.color
                                }}
                              >
                                {level.label}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {level.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Damage Description */}
                  <div className="form-group">
                    <label className="form-label">Damage Description *</label>
                    <textarea
                      rows="4"
                      className="form-input"
                      value={formData.damageDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          damageDescription: e.target.value
                        }))
                      }
                      placeholder="Describe the damage: location, extent, condition..."
                      required={formData.isDamaged}
                    />
                  </div>

                  {/* Estimated Repair Cost */}
                  <div className="form-group">
                    <label className="form-label">
                      Estimated Repair/Replacement Cost (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-input"
                      value={formData.repairCost}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          repairCost: parseFloat(e.target.value) || 0
                        }))
                      }
                      placeholder="Enter estimated cost in rupees"
                      required={formData.isDamaged}
                    />
                    <p
                      style={{
                        margin: '0.5rem 0 0 0',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Admin/Librarian should enter the estimated repair or replacement cost
                    </p>
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Additional Notes (Optional)</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value
                    }))
                  }
                />
              </div>

              {/* Payment Completed Badge */}
              {formData.paymentCompleted && totalAmount > 0 && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--success-light)',
                    border: '2px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--success)',
                      fontWeight: 600
                    }}
                  >
                    <CheckCircle size={20} />
                    Payment Details Confirmed - ₹{totalAmount.toFixed(2)}
                  </div>
                  <p
                    style={{
                      margin: '0.5rem 0 0 0',
                      fontSize: '0.875rem',
                      color: '#065f46'
                    }}
                  >
                    Method: {formData.paymentMethod}{' '}
                    {formData.transactionId &&
                      `| Transaction: ${formData.transactionId}`}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '2rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner spinner-sm" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <BookOpen size={18} />
                      {totalAmount > 0 && !formData.paymentCompleted
                        ? `Proceed to Payment (₹${totalAmount.toFixed(2)})`
                        : 'Complete Return'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Payment Portal Modal */}
      {showPaymentPortal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaymentPortal(false)}
        >
          <div
            className="modal modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">💳 Payment Portal</h2>
              <button
                onClick={() => setShowPaymentPortal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Payment Summary */}
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--warning-light)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '1.5rem',
                  border: '2px solid var(--warning)'
                }}
              >
                <h4
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <DollarSign size={24} />
                  Payment Summary
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: '#92400e'
                      }}
                    >
                      Late Penalty
                    </p>
                    <p
                      style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#92400e'
                      }}
                    >
                      ₹{(penalty?.penaltyAmount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: '#92400e'
                      }}
                    >
                      Damage Cost
                    </p>
                    <p
                      style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#92400e'
                      }}
                    >
                      ₹
                      {formData.isDamaged
                        ? formData.repairCost.toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: '#92400e'
                      }}
                    >
                      Total Amount
                    </p>
                    <p
                      style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#92400e'
                      }}
                    >
                      ₹{totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label className="form-label">
                  Select Payment Method *
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  {paymentMethods.map((method) => (
                    <label
                      key={method.value}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '1.5rem',
                        border: `2px solid ${
                          formData.paymentMethod === method.value
                            ? 'var(--primary-600)'
                            : 'var(--border-color)'
                        }`,
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        background:
                          formData.paymentMethod === method.value
                            ? 'var(--primary-50)'
                            : 'transparent',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentMethod: e.target.value
                          }))
                        }
                        style={{ display: 'none' }}
                      />
                      <div style={{ marginBottom: '0.5rem' }}>
                        {method.icon}
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: '0.25rem',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {method.label}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {method.description}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Transaction ID (for CARD / UPI) */}
              {(formData.paymentMethod === 'CARD' ||
                formData.paymentMethod === 'UPI') && (
                <div className="form-group">
                  <label className="form-label">
                    Transaction ID / Reference Number *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.transactionId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        transactionId: e.target.value
                      }))
                    }
                    placeholder="Enter transaction/reference number"
                    required
                  />
                  <p
                    style={{
                      margin: '0.5rem 0 0 0',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {formData.paymentMethod === 'CARD'
                      ? 'Enter bank/reference number or last 4 digits.'
                      : 'Enter UPI transaction ID (e.g., 1234567890)'}
                  </p>
                </div>
              )}

              {formData.paymentMethod === 'CASH' && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--primary-50)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '1rem'
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: 'var(--primary-700)'
                    }}
                  >
                    💵 Cash payment will be collected at the library counter
                    during book return.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '2rem'
                }}
              >
                <button
                  onClick={() => setShowPaymentPortal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnBook;
