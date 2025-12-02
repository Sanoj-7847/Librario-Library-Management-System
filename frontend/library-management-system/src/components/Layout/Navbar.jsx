import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  LogOut,
  User,
  Search,
  BookPlusIcon,
  Settings,
  Menu,
  X,
  History,
  Users,
  BookMarked,
  ClipboardList,
  DollarSign,
  RotateCcw
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdminOrLibrarian } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setShowMenu(false);
  };

  const handleBorrowHistory = () => {
    navigate('/borrow-history');
    setShowMenu(false);
  };

  const handleTransactionHistory = () => {
    navigate('/transaction-history');
    setShowMenu(false);
  };

  const handleMemberManagement = () => {
    navigate('/member-management');
    setShowMenu(false);
  };

  const handleMyRequests = () => {
    navigate('/my-book-requests');
    setShowMenu(false);
  };

  const handleBookRequests = () => {
    navigate('/book-requests');
    setShowMenu(false);
  };

  const handleRenewalRequests = () => {
    navigate('/renewal-requests');
    setShowMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <BookOpen size={28} />
          <span>Librario</span>
        </Link>

        <ul className="navbar-nav">
          {isAuthenticated ? (
            <>
              <li>
                <Link to="/books" className="navbar-link">
                  <Search size={18} />
                  <span>Search Books</span>
                </Link>
              </li>

              {isAdminOrLibrarian && (
                <li>
                  <Link to="/manage-books" className="navbar-link">
                    <BookPlusIcon size={18} />
                    <span>Manage Books</span>
                  </Link>
                </li>
              )}

              <li className="navbar-user">
                <div className="navbar-user-info">
                  <User size={18} />
                  <span>{user?.fullName}</span>
                  <span className="user-badge">{user?.role}</span>
                </div>

                {/* Menu Button */}
                <div className="menu-container" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="menu-button"
                    aria-label="Menu"
                  >
                    {showMenu ? <X size={24} /> : <Menu size={24} />}
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="dropdown-menu">
                      {/* My Book Requests - Only for Members */}
                      {user?.role === 'MEMBER' && (
                        <>
                          <button onClick={handleMyRequests} className="dropdown-item">
                            <BookMarked size={18} />
                            <span>Your Book Requests</span>
                          </button>
                          
                          <button onClick={() => navigate('/my-renewal-requests')} className="dropdown-item">
                            <RotateCcw size={18} />
                            <span>Your Renewal Requests</span>
                          </button>
                          
                          {/* ✅ REMOVED: Report Damaged Book button for members */}
                          
                          <div className="dropdown-divider"></div>
                        </>
                      )}

                      {/* Borrow History - Available for ALL authenticated users */}
                      <button onClick={handleBorrowHistory} className="dropdown-item">
                        <History size={18} />
                        <span>Borrow History</span>
                      </button>

                      {/* Transaction History - Available for ALL */}
                      <button onClick={handleTransactionHistory} className="dropdown-item">
                        <DollarSign size={18} />
                        <span>Transaction History</span>
                      </button>

                      {/* Admin & Librarian Menu Items */}
                      {isAdminOrLibrarian && (
                        <>
                          <div className="dropdown-divider"></div>

                          {/* Book Requests Management */}
                          <button onClick={handleBookRequests} className="dropdown-item">
                            <ClipboardList size={18} />
                            <span>Member Book Requests</span>
                          </button>

                          {/* Renewal Requests Management */}
                          <button onClick={handleRenewalRequests} className="dropdown-item">
                            <RotateCcw size={18} />
                            <span>Renewal Requests</span>
                          </button>
                          
                          {/* Damaged Books Management removed */}

                          {/* Member Management */}
                          <button onClick={handleMemberManagement} className="dropdown-item">
                            <Users size={18} />
                            <span>Member Management</span>
                          </button>
                        </>
                      )}

                      <div className="dropdown-divider"></div>

                      <button onClick={handleSettings} className="dropdown-item">
                        <Settings size={18} />
                        <span>Settings</span>
                      </button>

                      <div className="dropdown-divider"></div>

                      <button onClick={handleLogout} className="dropdown-item logout">
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="navbar-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-secondary btn-sm">
                  Register
                </Link>
              </li>

              {/* Menu Button - Not Logged In */}
              <li>
                <div className="menu-container" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="menu-button"
                    aria-label="Menu"
                  >
                    {showMenu ? <X size={24} /> : <Menu size={24} />}
                  </button>

                  {/* Dropdown Menu - Not Logged In */}
                  {showMenu && (
                    <div className="dropdown-menu">
                      <button onClick={handleSettings} className="dropdown-item">
                        <Settings size={18} />
                        <span>Settings</span>
                      </button>
                    </div>
                  )}
                </div>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;