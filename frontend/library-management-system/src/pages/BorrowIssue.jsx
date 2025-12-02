import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Calendar, User, BookOpen, CreditCard, AlertTriangle, Search } from 'lucide-react';
import axios from '../service/axiosConfig';

const BorrowIssue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    bookId: '',
    borrowDate: new Date().toISOString().split('T')[0],
    membershipPlan: 'STANDARD',
    notes: ''
  });

  const [membershipPlans] = useState([
    { value: 'STANDARD', label: 'Standard (Free)', days: 14, fee: 0 },
    { value: 'PREMIUM', label: 'Premium (₹500)', days: 21, fee: 500 },
    { value: 'GOLD', label: 'Gold (₹1000)', days: 30, fee: 1000 }
  ]);

  useEffect(() => {
    fetchMembers();
    fetchBooks();
  }, []);

  useEffect(() => {
    if (formData.userId) {
      const member = members.find(m => m.id === parseInt(formData.userId));
      setSelectedMember(member);
    } else {
      setSelectedMember(null);
    }
  }, [formData.userId, members]);

  useEffect(() => {
    if (formData.bookId) {
      const book = allBooks.find(b => b.id === parseInt(formData.bookId));
      setSelectedBook(book);
    } else {
      setSelectedBook(null);
    }
  }, [formData.bookId, allBooks]);

  // Filter books based on search term
  useEffect(() => {
    if (bookSearchTerm.trim() === '') {
      setBooks(allBooks);
    } else {
      const searchLower = bookSearchTerm.toLowerCase();
      const filtered = allBooks.filter(book =>
        book.title?.toLowerCase().includes(searchLower) ||
        book.author?.toLowerCase().includes(searchLower) ||
        book.isbn?.toLowerCase().includes(searchLower)
      );
      setBooks(filtered);
    }
  }, [bookSearchTerm, allBooks]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get('/api/members');
      const data = response.data.data || response.data;
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get('/api/books');
      const data = response.data.data || response.data;
      const booksList = Array.isArray(data) ? data : [];
      setAllBooks(booksList);
      setBooks(booksList);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load books');
    }
  };

  const handleBookSelect = (book) => {
    setFormData({ ...formData, bookId: book.id });
    setBookSearchTerm(book.title);
    setShowBookSuggestions(false);
  };

  const getBookStatusBadge = (book) => {
    if (book.availableCopies <= 0) {
      return { text: 'Out of Stock', color: 'var(--error)', bg: 'var(--error-light)' };
    } else if (book.availableCopies <= 2) {
      return { text: `Only ${book.availableCopies} Left`, color: '#92400e', bg: '#fef3c7' };
    } else {
      return { text: `${book.availableCopies} Available`, color: 'var(--success)', bg: 'var(--success-light)' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMember) {
      toast.error('Please select a member');
      return;
    }

    if (!selectedBook) {
      toast.error('Please select a book');
      return;
    }

    if (selectedBook.availableCopies <= 0) {
      toast.error('This book is out of stock');
      return;
    }

    if (selectedMember.accountStatus !== 'ACTIVE') {
      toast.error('Member account is not active');
      return;
    }

    if (selectedMember.currentlyBorrowed >= selectedMember.maxBooksAllowed) {
      toast.error('Member has reached borrowing limit');
      return;
    }

    const selectedPlan = membershipPlans.find(p => p.value === formData.membershipPlan);
    if (selectedPlan && selectedPlan.fee > 0) {
      const confirmPayment = window.confirm(
        `This plan requires a membership fee of ₹${selectedPlan.fee}. Continue?`
      );
      if (!confirmPayment) return;
    }

    setLoading(true);

    try {
      const requestData = {
        userId: parseInt(formData.userId),
        bookId: parseInt(formData.bookId),
        borrowDate: formData.borrowDate,
        notes: formData.notes || `Membership Plan: ${formData.membershipPlan}`
      };

      await axios.post('/api/borrow/issue', requestData);
      
      toast.success('Book issued successfully!');
      navigate('/borrow-history');
    } catch (error) {
      console.error('Error issuing book:', error);
      const message = error.response?.data?.message || 'Failed to issue book';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-animate">
      <div className="container" style={{ maxWidth: '900px', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 style={{ margin: 0 }}>Issue Book</h1>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Issue Date */}
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={18} style={{ marginRight: '0.5rem' }} />
                  Issue Date (Auto-generated)
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.borrowDate}
                  readOnly
                  disabled
                  style={{ backgroundColor: 'var(--gray-100)', cursor: 'not-allowed' }}
                />
              </div>

              {/* Select Member */}
              <div className="form-group">
                <label className="form-label">
                  <User size={18} style={{ marginRight: '0.5rem' }} />
                  Select Member *
                </label>
                <select
                  className="form-input"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                >
                  <option value="">-- Select Member --</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} - {member.email} ({member.currentlyBorrowed}/{member.maxBooksAllowed} books)
                    </option>
                  ))}
                </select>
              </div>

              {/* Member Details */}
              {selectedMember && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--primary-50)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--primary-200)'
                }}>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary-700)' }}>
                    Member Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <p><strong>Status:</strong> {selectedMember.accountStatus}</p>
                    <p><strong>Plan:</strong> {selectedMember.membershipPlan}</p>
                    <p><strong>Books Borrowed:</strong> {selectedMember.currentlyBorrowed}/{selectedMember.maxBooksAllowed}</p>
                    <p><strong>Membership Expires:</strong> {new Date(selectedMember.membershipExpiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {/* Book Search with Suggestions */}
              <div className="form-group">
                <label className="form-label">
                  <BookOpen size={18} style={{ marginRight: '0.5rem' }} />
                  Search & Select Book *
                </label>
                <div style={{ position: 'relative' }}>
                  <div className="form-input-icon">
                    <Search className="form-icon" size={20} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search by title, author, or ISBN..."
                      value={bookSearchTerm}
                      onChange={(e) => {
                        setBookSearchTerm(e.target.value);
                        setShowBookSuggestions(true);
                      }}
                      onFocus={() => setShowBookSuggestions(true)}
                    />
                  </div>

                  {/* Book Suggestions Dropdown */}
                  {showBookSuggestions && books.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      marginTop: '0.25rem'
                    }}>
                      {books.slice(0, 10).map((book) => {
                        const status = getBookStatusBadge(book);
                        return (
                          <div
                            key={book.id}
                            onClick={() => handleBookSelect(book)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-color)',
                              transition: 'background 0.2s',
                              background: formData.bookId === book.id ? 'var(--primary-50)' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = formData.bookId === book.id ? 'var(--primary-50)' : 'transparent'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {book.title}
                                </p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                  by {book.author} {book.isbn && `• ISBN: ${book.isbn}`}
                                </p>
                              </div>
                              <div style={{ marginLeft: '1rem' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: status.bg,
                                  color: status.color,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {book.availableCopies <= 0 && <AlertTriangle size={14} />}
                                  {status.text}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Book Details with Warning */}
              {selectedBook && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: selectedBook.availableCopies <= 0 ? 'var(--error-light)' : 
                                   selectedBook.availableCopies <= 2 ? '#fef3c7' : 'var(--success-light)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  border: `2px solid ${selectedBook.availableCopies <= 0 ? 'var(--error-border)' : 
                                        selectedBook.availableCopies <= 2 ? '#f59e0b' : 'var(--success-border)'}`
                }}>
                  {selectedBook.availableCopies <= 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <AlertTriangle size={24} style={{ color: 'var(--error)' }} />
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--error)' }}>⚠️ Out of Stock</h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#991b1b' }}>
                          This book is currently unavailable. Cannot issue.
                        </p>
                      </div>
                    </div>
                  ) : selectedBook.availableCopies <= 2 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
                      <div>
                        <h4 style={{ margin: 0, color: '#92400e' }}>⚠️ Low Stock Alert</h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#92400e' }}>
                          Only {selectedBook.availableCopies} cop{selectedBook.availableCopies === 1 ? 'y' : 'ies'} remaining
                        </p>
                      </div>
                    </div>
                  ) : (
                    <h4 style={{ margin: 0, color: '#065f46' }}>✓ Book Available</h4>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                    <p><strong>Title:</strong> {selectedBook.title}</p>
                    <p><strong>Author:</strong> {selectedBook.author}</p>
                    <p><strong>ISBN:</strong> {selectedBook.isbn || 'N/A'}</p>
                    <p><strong>Available:</strong> {selectedBook.availableCopies}/{selectedBook.totalCopies}</p>
                  </div>
                </div>
              )}

              {/* Membership Plan Selection */}
              <div className="form-group">
                <label className="form-label">
                  <CreditCard size={18} style={{ marginRight: '0.5rem' }} />
                  Membership Plan *
                </label>
                <select
                  className="form-input"
                  value={formData.membershipPlan}
                  onChange={(e) => {
                    const plan = membershipPlans.find(p => p.value === e.target.value);
                    setFormData({
                      ...formData,
                      membershipPlan: e.target.value,
                      membershipFee: plan?.fee || 0
                    });
                  }}
                  required
                >
                  {membershipPlans.map((plan) => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label} - {plan.days} days
                    </option>
                  ))}
                </select>

                {formData.membershipPlan && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {membershipPlans.find(p => p.value === formData.membershipPlan)?.fee > 0 ? (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--warning-light)',
                        border: '1px solid var(--warning)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--warning-text)'
                      }}>
                        <strong>⚠️ Payment Required:</strong> ₹
                        {membershipPlans.find(p => p.value === formData.membershipPlan)?.fee}
                      </div>
                    ) : (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--success-light)',
                        border: '1px solid var(--success-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#065f46'
                      }}>
                        <strong>✓ Free Plan</strong> - No payment required
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
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
                  style={{ flex: 1 }}
                  disabled={loading || (selectedBook && selectedBook.availableCopies <= 0)}
                >
                  {loading ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      Issuing...
                    </>
                  ) : (
                    'Issue Book'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowIssue;