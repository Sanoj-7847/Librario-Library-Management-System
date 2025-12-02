import React, { useState } from 'react';
import { Book, Calendar, User, Info, BookOpen, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const BookCard = ({ book, onEdit, onDelete, showActions }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [borrowing, setBorrowing] = useState(false);

  const handleBorrowBook = async (e) => {
    e.stopPropagation();

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

  return (
    <div className="book-card">
      <div className="book-cover">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} />
        ) : (
          <Book size={64} />
        )}
      </div>

      <div className="book-content">
        <h3 className="book-title" title={book.title}>
          {book.title}
        </h3>

        <div className="book-info">
          <div className="book-info-item">
            <User size={16} />
            <span>{book.author}</span>
          </div>
          {book.publishedYear && (
            <div className="book-info-item">
              <Calendar size={16} />
              <span>{book.publishedYear}</span>
            </div>
          )}
        </div>

        <div className="flex-between mb-md">
          <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-error'}`}>
            {book.availableCopies > 0
              ? `${book.availableCopies} Available`
              : 'Not Available'}
          </span>
        </div>

        {book.categories && book.categories.length > 0 && (
          <div className="book-categories">
            {book.categories.map(cat => (
              <span key={cat.id} className="category-tag">
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Actions Section */}
        <div className="book-actions">
          {showActions ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(book);
                }}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(book.id);
                }}
                className="btn btn-danger btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          ) : (
            <>
              <Link
                to={`/books/${book.id}`}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
              >
                <Info size={16} />
                Details
              </Link>
              {book.availableCopies > 0 && (
                <button
                  onClick={handleBorrowBook}
                  disabled={borrowing}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {borrowing ? (
                    <div className="spinner spinner-sm"></div>
                  ) : (
                    <>
                      <BookOpen size={16} />
                      Borrow
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex-between mb-md">
          <span className={`badge ${book.availableCopies === 0 ? 'badge-error' :
              book.availableCopies <= 2 ? 'badge-warning' :
                'badge-success'
            }`} style={{
              ...(book.availableCopies <= 2 && book.availableCopies > 0 && {
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontWeight: 600
              })
            }}>
            {book.availableCopies === 0 ? 'Not Available' :
              book.availableCopies <= 2 ? `Only ${book.availableCopies} Left!` :
                `${book.availableCopies} Available`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BookCard;