import React from 'react';
import Navbar from './Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <main className="page-content">
        <div className="container">
          {children}
        </div>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Layout;