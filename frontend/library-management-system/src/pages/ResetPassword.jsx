import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../service/AuthService';
import { toast } from 'react-toastify';
import { Lock, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`).focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return toast.error('Enter a valid 6-digit OTP');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await authService.resetPassword({ email, otp: otpCode, newPassword });
      toast.success('Password Reset Successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="auth-page">
        <div className="auth-card text-center">
          <h2>Invalid Reset Request</h2>
          <p className="text-gray mb-lg">No email found. Please request a new OTP.</p>
          <Link to="/forgot-password" className="btn btn-primary">Request OTP</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter the OTP sent to <strong>{email}</strong> and set a new password</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* OTP Inputs */}
          <div className="form-group">
            <label className="form-label">OTP</label>
            <div className="flex gap-md mb-md">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="form-input text-center"
                />
              ))}
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="form-input-icon">
              <Lock className="form-icon" size={20} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="form-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: 'var(--spacing-lg)' }}>
            {loading ? <div className="spinner spinner-sm"></div> : 'Reset Password'}
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="btn btn-outline">
            <ArrowLeft size={20} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
