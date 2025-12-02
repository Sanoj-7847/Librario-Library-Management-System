import React, { useState } from 'react';
import axios from 'axios';

const SendOtpForm = () => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/send-otp', { email });
      console.log(res.data);
      setOtpSent(true);
      alert('OTP sent! Check your email.');
    } catch (err) {
      console.error(err);
      alert('Failed to send OTP.');
    }
  };

  return (
    <form onSubmit={handleSendOtp}>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send OTP</button>
      {otpSent && <p>Check your email for OTP.</p>}
    </form>
  );
};

export default SendOtpForm;
