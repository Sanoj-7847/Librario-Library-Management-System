const express = require('express');
const router = express.Router();
const sendOtp = require('../utils/SendOtp');
const generateOtp = require('../utils/OtpGenerator');

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  const otp = generateOtp(6); // 6-digit OTP
  // You can save OTP in DB or in-memory with expiry
  // For demo, we just send it
  await sendOtp(email, otp);

  res.json({ message: 'OTP sent to your email', otp }); // remove otp in production!
});

module.exports = router;
