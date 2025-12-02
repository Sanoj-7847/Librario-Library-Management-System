import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Check } from 'lucide-react';
import { toast } from 'react-toastify';

const Settings = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (selectedTheme) => {
    document.documentElement.setAttribute('data-theme', selectedTheme);
    localStorage.setItem('theme', selectedTheme);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    toast.success(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme activated`);
  };

  return (
    <div className="page-animate">
      <div className="container" style={{ maxWidth: '800px', padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 style={{ margin: 0 }}>Settings</h1>
        </div>

        {/* Settings Card */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Appearance</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Customize how Librario looks on your device
            </p>
          </div>

          <div className="card-body">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Theme</h3>
            
            <div className="theme-options">
              {/* Light Theme */}
              <div
                className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <div className="theme-preview light-preview">
                  <div className="preview-header"></div>
                  <div className="preview-content">
                    <div className="preview-sidebar"></div>
                    <div className="preview-main"></div>
                  </div>
                </div>
                <div className="theme-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sun size={20} style={{ color: '#f59e0b' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Light</span>
                  </div>
                  {theme === 'light' && (
                    <div className="theme-check">
                      <Check size={18} />
                    </div>
                  )}
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Clean and bright interface
                </p>
              </div>

              {/* Dark Theme */}
              <div
                className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="theme-preview dark-preview">
                  <div className="preview-header"></div>
                  <div className="preview-content">
                    <div className="preview-sidebar"></div>
                    <div className="preview-main"></div>
                  </div>
                </div>
                <div className="theme-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Moon size={20} style={{ color: '#6366f1' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dark</span>
                  </div>
                  {theme === 'dark' && (
                    <div className="theme-check">
                      <Check size={18} />
                    </div>
                  )}
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Easy on the eyes in low light
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Settings Card */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>About</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Application:</strong> Librario - Library Management System</p>
              <p><strong>Developer:</strong> Librario Team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;