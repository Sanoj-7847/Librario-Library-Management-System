import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../service/AuthService';
import { toast } from 'react-toastify';
import { Mail, X, Lock, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setShowOtpModal(true);
      toast.success('OTP Sent Successfully! Please check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  if (showOtpModal) {
    return <OtpVerificationModal email={email} onClose={() => setShowOtpModal(false)} />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Reset Password</h2>
              <Link to="/login" className="modal-close">
                <X size={24} />
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <div className="form-input-icon">
                  <Mail className="form-icon" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Your Email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? <div className="spinner spinner-sm"></div> : 'Send OTP'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const OtpVerificationModal = ({ email, onClose }) => {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes = 600 seconds
  const [canResend, setCanResend] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [verifiedOtp, setVerifiedOtp] = useState('');

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      toast.error('OTP Expired. Please request a new one.');
      return;
    }

    // Allow resend after 1 minute (60 seconds)
    if (timeLeft === 540) {
      setCanResend(true);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.slice(-1); // Take only last digit
    setOtpDigits(newOtpDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    
    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      await authService.verifyOtp(email, otp);
      setVerifiedOtp(otp);
      toast.success('OTP Verified Successfully!');
      setShowResetPassword(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      setOtpDigits(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setTimeLeft(600);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      toast.success('New OTP sent to your email!');
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    onClose();
  };

  if (showResetPassword) {
    return <ResetPasswordModal email={email} otp={verifiedOtp} />;
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
              <h2 className="modal-title" style={{ margin: 0 }}>OTP Sent Successfully!</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.875rem' }}>
              Please check your email and enter OTP below to reset your password.
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Email Display */}
          <div className="form-group">
            <label className="form-label">Email *</label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              background: 'var(--gray-700)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              gap: '0.5rem'
            }}>
              <Mail size={20} style={{ color: 'var(--gray-400)' }} />
              <span style={{ color: 'white', flex: 1 }}>{email}</span>
            </div>
          </div>

          {/* OTP Input Boxes */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              justifyContent: 'center',
              marginBottom: 'var(--spacing-md)'
            }}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  disabled={timeLeft === 0}
                  style={{
                    width: '60px',
                    height: '60px',
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    border: `2px solid ${digit ? 'var(--primary-600)' : 'var(--gray-600)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: digit ? 'var(--gray-700)' : 'var(--gray-800)',
                    color: 'white',
                    outline: 'none'
                  }}
                  className="otp-box-input"
                />
              ))}
            </div>
          </div>

          {/* Timer and Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{
              flex: 1,
              background: timeLeft <= 60 ? 'var(--error)' : timeLeft <= 120 ? 'var(--warning)' : '#5a5a3d',
              color: 'white',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>
              {timeLeft > 0 ? formatTime(timeLeft) : 'Expired!'}
            </div>
            <button
              type="button"
              onClick={handleChangeEmail}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Change Email
            </button>
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={loading || timeLeft === 0 || otpDigits.join('').length !== 6}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
          >
            {loading ? <div className="spinner spinner-sm"></div> : 'Verify OTP'}
          </button>

          {/* Resend OTP - Only show after 1 minute */}
          {canResend && (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="btn btn-outline"
              style={{ width: '100%' }}
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ResetPasswordModal = ({ email, otp }) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email, otp, newPassword);
      setSuccess(true);
      toast.success('Password Reset Successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-overlay">
        <div className="modal text-center" style={{ maxWidth: '500px' }}>
          <div className="modal-body">
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'var(--success-light)', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--spacing-xl)',
              animation: 'scaleIn 0.3s ease-out'
            }}>
              <CheckCircle size={48} style={{ color: 'var(--success)' }} />
            </div>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Password Reset Successful!</h2>
            <p className="text-gray" style={{ marginBottom: 'var(--spacing-xl)' }}>
              Your password has been updated successfully.
              <br />
              Redirecting to login...
            </p>
            <Link to="/login" className="btn btn-primary btn-lg">
              Go to Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
              <h2 className="modal-title" style={{ margin: 0 }}>OTP Verified Successfully!</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.875rem' }}>
              Please enter new password.
            </p>
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="modal-body">
          {/* Email Display (Read-only) */}
          <div className="form-group">
            <label className="form-label">Email *</label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              background: 'var(--gray-700)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              gap: '0.5rem'
            }}>
              <Mail size={20} style={{ color: 'var(--gray-400)' }} />
              <span style={{ color: 'white', flex: 1 }}>{email}</span>
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label">Password *</label>
            <div className="form-input-icon">
              <Lock className="form-icon" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="form-input"
                placeholder="Enter New Password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? <div className="spinner spinner-sm"></div> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;