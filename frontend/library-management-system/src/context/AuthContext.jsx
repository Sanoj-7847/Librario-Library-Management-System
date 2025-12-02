import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../service/axiosConfig';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return setLoading(false);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/users/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token, ...userData } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      setIsAuthenticated(true);

      toast.success('Login successful!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        theme: 'light',
        style: { background: 'white', color: '#000', boxShadow: '0px 2px 10px rgba(0,0,0,0.2)' }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, ...newUserData } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(newUserData);
      setIsAuthenticated(true);

      toast.success('Registration successful!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        theme: 'light',
        style: { background: 'white', color: '#000', boxShadow: '0px 2px 10px rgba(0,0,0,0.2)' }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);

    toast.success('Logged out successfully!', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      theme: 'light',
      style: { background: 'white', color: '#000', boxShadow: '0px 2px 10px rgba(0,0,0,0.2)' }
    });
  };

  const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    isAdminOrLibrarian
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};