import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, Users, TrendingUp } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="page-content container">
      {/* Hero Section */}
      <section className="hero mb-xl">
        <h1>Welcome to Librario</h1>
        <p>
          Your modern library management solution. Discover, borrow, and manage books with ease.
        </p>

        {isAuthenticated ? (
          <div className="mt-lg text-center">
            <p className="text-gray" style={{ fontSize: '1.125rem', marginBottom: 'var(--spacing-md)' }}>
              Hello, <strong>{user?.fullName || user?.email}</strong>!
            </p>
            <Link to="/books" className="btn btn-secondary btn-lg">
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="flex flex-center gap-md mt-lg">
            <Link to="/register" className="btn btn-secondary btn-lg">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-primary btn-lg">
              Sign In
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-4 gap-lg mb-xl">
        <div className="feature-card">
          <div className="feature-icon primary">
            <BookOpen size={24} />
          </div>
          <h3>Extensive Catalog</h3>
          <p className="text-gray">
            Browse through thousands of books across multiple categories
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon success">
            <Search size={24} />
          </div>
          <h3>Smart Search</h3>
          <p className="text-gray">
            Find books quickly by title, author, ISBN, or category
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon purple">
            <Users size={24} />
          </div>
          <h3>User Management</h3>
          <p className="text-gray">
            Role-based access for admins, librarians, and members
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon warning">
            <TrendingUp size={24} />
          </div>
          <h3>Real-time Tracking</h3>
          <p className="text-gray">
            Track borrowing, returns, and availability in real-time
          </p>
        </div>
      </section>

      {/* Stats Section */}
      {isAuthenticated && (
        <section className="card mb-xl">
          <div className="card-body">
            <h2>Quick Stats</h2>
            <div className="grid grid-cols-3 text-center gap-lg">
              <div>
                <div className="text-primary" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                  1000+
                </div>
                <div className="text-gray">Total Books</div>
              </div>
              <div>
                <div className="text-success" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                  850+
                </div>
                <div className="text-gray">Available</div>
              </div>
              <div>
                <div className="text-warning" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                  8
                </div>
                <div className="text-gray">Categories</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section for non-authenticated users */}
      {!isAuthenticated && (
        <section className="card text-center" style={{ background: 'var(--primary-50)' }}>
          <div className="card-body p-2xl">
            <h2>Ready to Get Started?</h2>
            <p className="text-gray mb-lg" style={{ fontSize: '1.125rem' }}>
              Join Librario today and experience the future of library management
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account
            </Link>
          </div>
        </section>
      )}

      {/* Footer Section */}
      <footer>
        <div className="footer-grid">
          {/* About */}
          <div>
            <h3>About</h3>
            <p>
              Empowering libraries with digital tools for smarter management and better accessibility.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/books">Books</Link></li>
              <li><Link to="/categories">Categories</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4>Follow Us</h4>
            <div className="footer-social">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-whatsapp"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
            </div>
          </div>

          {/* Subscribe */}
          <div className="footer-subscribe">
            <h4>Subscribe</h4>
            <p>Get the latest updates and book releases.</p>
            <form>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} Librario. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
