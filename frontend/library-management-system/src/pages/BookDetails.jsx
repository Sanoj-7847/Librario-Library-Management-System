import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookService } from '../service/BookService';
import { toast } from 'react-toastify';
import {
  Book,
  User,
  Calendar,
  Tag,
  FileText,
  ArrowLeft,
  BookOpen,
  Package,
  Star,
  MapPin
} from 'lucide-react';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdminOrLibrarian, user } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);

  useEffect(() => {
    loadBookDetails();
  }, [id]);

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      const response = await bookService.getBookById(id);
      console.log("📖 Full response:", response);

      // Handle different response formats
      let bookData = null;

      if (response && response.data) {
        // Response wrapped with metadata (success, message, data, etc.)
        bookData = response.data;
        console.log("✅ Using response.data:", bookData);
      } else if (response && response.id) {
        // Direct book object
        bookData = response;
        console.log("✅ Using direct response:", bookData);
      }

      if (!bookData) throw new Error('No book data received');

      setBook(bookData);
      console.log("📖 Book set successfully:", bookData);
    } catch (error) {
      console.error("❌ Error loading book:", error);
      const message = error.response?.data?.message || 'Failed to load book details';
      toast.error(message);
      setTimeout(() => navigate('/books'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowBook = async () => {
    if (!user) {
      toast.error('Please login to borrow books');
      navigate('/login');
      return;
    }

    if (book.availableCopies <= 0) {
      toast.error('Book is not available');
      return;
    }

    try {
      setBorrowing(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:1205/librario/api/book-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: book.id,
          notes: 'Request from book catalog'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create request');
      }

      toast.success('Book request sent! Waiting for admin approval');
      setTimeout(() => {
        navigate('/my-book-requests');
      }, 2000);
    } catch (error) {
      toast.error(error.message || 'Failed to send request');
      console.error('Request error:', error);
    } finally {
      setBorrowing(false);
    }
  };

  if (loading)
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading book details...</p>
      </div>
    );

  if (!book)
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Book not found</p>
        <button onClick={() => navigate('/books')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Catalog
        </button>
      </div>
    );

  const isAvailable = book.availableCopies > 0;
  const categories =
    book.categories && book.categories.length > 0
      ? book.categories.map((c) => c.name).join(', ')
      : 'Uncategorized';

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/books')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={20} />
          Back to Catalog
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Section */}
        <div>
          {/* Book Cover */}
          <div
            style={{
              width: '100%',
              aspectRatio: '3/4',
              backgroundColor: '#f5f5f5',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Book size={80} color="#ccc" />
            )}
          </div>

          {/* Availability */}
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: isAvailable ? '#d4edda' : '#f8d7da',
              border: `1px solid ${isAvailable ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <Package
              size={24}
              color={isAvailable ? '#155724' : '#721c24'}
              style={{ marginBottom: '0.5rem' }}
            />
            <p
              style={{
                margin: 0,
                fontWeight: 'bold',
                color: isAvailable ? '#155724' : '#721c24',
              }}
            >
              {isAvailable ? 'In Stock' : 'Out of Stock'}
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              {book.availableCopies || 0} of {book.totalCopies || 0} available
            </p>
          </div>

          {/* Borrow Button */}
          {!isAdminOrLibrarian && isAvailable && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={handleBorrowBook}
              disabled={borrowing}
            >
              {borrowing ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  Sending Request...
                </>
              ) : (
                <>
                  <BookOpen size={20} />
                  Borrow This Book
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Section */}
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{book.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={20} fill="#ffc107" color="#ffc107" />
                <span style={{ fontWeight: 'bold' }}>4.3</span>
              </div>
              <span style={{ color: '#666' }}>•</span>
              {book.categories && book.categories.length > 0 ? (
                <Link
                  to={`/books?category=${book.categories[0].id}`}
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >
                  {book.categories.map((c) => c.name).join(', ')}
                </Link>
              ) : (
                <span style={{ color: '#666' }}>Uncategorized</span>
              )}
            </div>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{book.borrowed || 0} Borrowed in Past Month</p>
          </div>

          {/* Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <DetailItem icon={<User size={20} />} label="Author" value={book.author || 'N/A'} />
            <DetailItem icon={<Book size={20} />} label="ISBN" value={book.isbn || 'N/A'} />
            <DetailItem
              icon={<Calendar size={20} />}
              label="Published Year"
              value={book.publishedYear || book.publicationYear || 'N/A'}
            />
            <DetailItem icon={<Tag size={20} />} label="Category" value={categories} />
            <DetailItem icon={<MapPin size={20} />} label="Publisher" value={book.publisher || 'N/A'} />
            <DetailItem icon={<FileText size={20} />} label="Pages" value={book.pages || 'N/A'} />
          </div>

          {/* Description */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
            }}
          >
            <h3
              style={{
                fontSize: '1.2rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FileText size={24} /> Description
            </h3>
            <p style={{ lineHeight: '1.6', color: '#333', margin: 0 }}>
              {book.description || 'No description available.'}
            </p>
          </div>

          {/* Admin Info */}
          {isAdminOrLibrarian && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107',
              }}
            >
              <h4 style={{ marginBottom: '1rem', color: '#856404' }}>Admin Information</h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                }}
              >
                <p><strong>Book ID:</strong> {book.id}</p>
                <p><strong>Status:</strong> {book.status || 'Active'}</p>
                <p><strong>Total Copies:</strong> {book.totalCopies}</p>
                <p><strong>Available:</strong> {book.availableCopies}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
    <div style={{ color: '#007bff', marginTop: '0.2rem' }}>{icon}</div>
    <div>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{label}</p>
      <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>{value}</p>
    </div>
  </div>
);

export default BookDetails;