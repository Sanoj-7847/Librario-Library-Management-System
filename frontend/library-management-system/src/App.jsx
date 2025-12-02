// App.jsx (clean & updated)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Books
import Books from './pages/Books';
import ManageBooks from './pages/ManageBooks';
import BookDetails from './pages/BookDetails';

// Borrow & Return
import BorrowIssue from './pages/BorrowIssue';
import BorrowHistory from './pages/BorrowHistory';
import ReturnBook from './pages/ReturnBook';

// Book Requests
import MyBookRequests from './pages/MyBookRequests';
import BookRequestManagement from './pages/BookRequestManagement';

// Renewal Requests
import MyRenewalRequests from './pages/MyRenewalRequests';
import RenewalManagement from './pages/RenewalManagement';

// Transaction History
import TransactionHistory from './pages/TransactionHistory';

// Members
import MemberManagement from './pages/MemberManagement';

// Settings
import Settings from './pages/Settings';

// Toast
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* HOME */}
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />

          {/* BOOK ROUTES */}
          <Route
            path="/books"
            element={
              <PrivateRoute>
                <Layout><Books /></Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/books/:id"
            element={
              <PrivateRoute>
                <Layout><BookDetails /></Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/manage-books"
            element={
              <PrivateRoute requiredRole="LIBRARIAN">
                <Layout><ManageBooks /></Layout>
              </PrivateRoute>
            }
          />

          {/* BOOK REQUESTS */}
          <Route
            path="/my-book-requests"
            element={
              <PrivateRoute requiredRole="MEMBER">
                <Layout><MyBookRequests /></Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/book-requests"
            element={
              <PrivateRoute requiredRole="LIBRARIAN">
                <Layout><BookRequestManagement /></Layout>
              </PrivateRoute>
            }
          />

          {/* BORROW & RETURN */}
          <Route
            path="/borrow-history"
            element={
              <PrivateRoute>
                <Layout><BorrowHistory /></Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/borrow-issue"
            element={
              <PrivateRoute requiredRole="LIBRARIAN">
                <Layout><BorrowIssue /></Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/return-book/:recordId"
            element={
              <PrivateRoute requiredRole="LIBRARIAN">
                <Layout><ReturnBook /></Layout>
              </PrivateRoute>
            }
          />

          {/* RENEWALS */}
          <Route
            path="/my-renewal-requests"
            element={
              <PrivateRoute requiredRole="MEMBER">
                <Layout><MyRenewalRequests /></Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/renewal-requests"
            element={
              <PrivateRoute requiredRole="LIBRARIAN">
                <Layout><RenewalManagement /></Layout>
              </PrivateRoute>
            }
          />

          {/* TRANSACTIONS */}
          <Route
            path="/transaction-history"
            element={
              <PrivateRoute>
                <Layout><TransactionHistory /></Layout>
              </PrivateRoute>
            }
          />

          {/* MEMBER MANAGEMENT */}
          <Route
            path="/member-management"
            element={
              <PrivateRoute requiredRole="LIBRARIAN">
                <Layout><MemberManagement /></Layout>
              </PrivateRoute>
            }
          />

          {/* SETTINGS */}
          <Route
            path="/settings"
            element={<Layout><Settings /></Layout>}
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* TOAST */}
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;
