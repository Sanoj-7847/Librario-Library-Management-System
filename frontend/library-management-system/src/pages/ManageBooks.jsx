import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, X, Search, Filter, RefreshCw, ArrowLeft } from 'lucide-react';
import BookCard from '../components/BookCard';
import instance from '../service/axiosConfig';

const ManageBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publishedYear: '',
    description: '',
    totalCopies: 1,
    availableCopies: 1,
    pages: '',
    coverImage: '',
    categoryIds: []
  });

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, []);

  useEffect(() => {
    if (searchTerm || selectedCategory) {
      const timeoutId = setTimeout(() => {
        fetchBooks();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedCategory]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await instance.get('/api/books');
      let booksData = [];
      if (Array.isArray(response.data)) booksData = response.data;
      else if (response.data?.content) booksData = response.data.content;
      else if (response.data?.data) booksData = response.data.data;
      let filtered = booksData;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (book) =>
            book.title?.toLowerCase().includes(term) ||
            book.author?.toLowerCase().includes(term) ||
            book.isbn?.toLowerCase().includes(term)
        );
      }
      if (selectedCategory) {
        filtered = filtered.filter((book) =>
          book.categories?.some((cat) => cat.id === parseInt(selectedCategory))
        );
      }
      setBooks(filtered);
      if (filtered.length === 0 && booksData.length > 0)
        toast.info(`No books match your filters (${booksData.length} total)`);
      else if (booksData.length === 0) toast.warning('No books in database');
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          setTimeout(() => {
            localStorage.clear();
            window.location.href = '/login';
          }, 2000);
        } else if (error.response.status === 403) {
          toast.error('Access denied. Admin/Librarian access required.');
        } else {
          toast.error(error.response.data?.message || 'Failed to fetch books');
        }
      } else if (error.request) {
        toast.error('Cannot connect to server.');
      } else {
        toast.error('Failed to fetch books: ' + error.message);
      }
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await instance.get('/api/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch {
      setCategories([]);
    }
  };

  const handleOpenModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        publishedYear: book.publishedYear || '',
        description: book.description || '',
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies || book.totalCopies,
        pages: book.pages || '',
        coverImage: book.coverImage || '',
        categoryIds:
          book.categories && Array.isArray(book.categories)
            ? book.categories.map((cat) => cat.id)
            : []
      });
    } else {
      setEditingBook(null);
      setFormData({
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        publishedYear: '',
        description: '',
        totalCopies: 1,
        availableCopies: 1,
        pages: '',
        coverImage: '',
        categoryIds: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBook(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (categoryId) => {
    setFormData((prev) => {
      const currentIds = Array.isArray(prev.categoryIds) ? prev.categoryIds : [];
      const categoryIds = currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId];
      return { ...prev, categoryIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || null,
        publisher: formData.publisher || null,
        publishedYear: formData.publishedYear ? Number(formData.publishedYear) : null,
        description: formData.description || null,
        pages: Number(formData.pages) || 0,
        totalCopies: Number(formData.totalCopies) || 1,
        availableCopies: Number(formData.availableCopies) || 0,
        coverImage: formData.coverImage || null,
        categoryId:
          formData.categoryIds && formData.categoryIds.length > 0
            ? formData.categoryIds[0]
            : null
      };
      if (!bookData.categoryId) {
        toast.error('Please select at least one category');
        return;
      }
      if (editingBook) {
        await instance.put(`/api/books/${editingBook.id}`, bookData);
        toast.success('Book updated successfully');
      } else {
        await instance.post('/api/books', bookData);
        toast.success('Book created successfully');
      }
      handleCloseModal();
      fetchBooks();
    } catch (error) {
      const errorMsg = error.response?.data?.validationErrors
        ? Object.values(error.response.data.validationErrors).join(', ')
        : error.response?.data?.message || 'Operation failed';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await instance.delete(`/api/books/${id}`);
      toast.success('Book deleted successfully');
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete book');
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSelectedCategory('');
    fetchBooks();
    toast.success('Refreshed successfully');
  };

  return (
    <div className="page-animate">
      <div className="manage-books-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>Manage Books</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
              Add, edit, and manage your book collection
            </p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary btn-lg">
          <Plus size={20} />
          <span>Add New Book</span>
        </button>
      </div>

      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search books by title, author, ISBN..."
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleRefresh} className="btn btn-outline">
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <p>No books found</p>
          {searchTerm || selectedCategory ? (
            <button onClick={handleRefresh} className="btn btn-outline">
              Clear Filters
            </button>
          ) : (
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              <Plus size={20} />
              Add First Book
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="results-info">
            <p>
              Showing <strong>{books.length}</strong> book
              {books.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="books-grid">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                showActions={true}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button onClick={handleCloseModal} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid grid-cols-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Author *</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Publisher</label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Published Year</label>
                  <input
                    type="number"
                    name="publishedYear"
                    value={formData.publishedYear}
                    onChange={handleChange}
                    min="1000"
                    max="2100"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Copies *</label>
                  <input
                    type="number"
                    name="totalCopies"
                    value={formData.totalCopies}
                    onChange={handleChange}
                    required
                    min="1"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Available Copies *</label>
                  <input
                    type="number"
                    name="availableCopies"
                    value={formData.availableCopies}
                    onChange={handleChange}
                    required
                    min="0"
                    max={formData.totalCopies}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pages *</label>
                  <input
                    type="number"
                    name="pages"
                    value={formData.pages}
                    onChange={handleChange}
                    required
                    min="1"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-input"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Image URL</label>
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categories</label>
                <div className="grid grid-cols-3 gap-sm">
                  {categories.map((cat) => (
                    <label key={cat.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(cat.id)}
                        onChange={() => handleCategoryChange(cat.id)}
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-md mt-lg">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {editingBook ? 'Update Book' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBooks;