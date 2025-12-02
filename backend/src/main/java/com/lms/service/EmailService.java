package com.lms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    /**
     * Send OTP email for password reset
     */
    public void sendOtpEmail(String toEmail, String otp, String fullName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Password Reset OTP Code - Librario");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "You have requested to reset your password.\n\n" +
                "Your OTP Code:\n\n" +
                "%s\n\n" +
                "This code is valid for 10 minutes.\n\n" +
                "Didn't request an OTP? Please ignore this email or contact our support team if you have any concerns.\n\n" +
                "Best regards,\n" +
                "Librario Team",
                fullName, otp
            ));
            
            mailSender.send(message);
            log.info("OTP Sent Successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP to: {}", toEmail, e);
            throw new RuntimeException("Failed to send OTP. Please try again later.");
        }
    }
    
    /**
     * Send general notification email
     */
    public void sendNotificationEmail(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            log.info("Notification email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send notification email to: {}", toEmail, e);
            // Don't throw exception for notification emails to avoid blocking main operations
            log.warn("Continuing without email notification");
        }
    }
}