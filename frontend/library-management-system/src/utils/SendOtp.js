const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // e.g., smtp.gmail.com
  port: process.env.SMTP_PORT,      // usually 465 or 587
  secure: true,                     // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,    // your email
    pass: process.env.SMTP_PASS     // app password or email password
  },
});

// Function to send OTP
const sendOtp = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Librario" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`
    });
    console.log("OTP sent successfully!");
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
};

module.exports = sendOtp;
