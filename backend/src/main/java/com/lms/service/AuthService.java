package com.lms.service;

import com.lms.dto.*;
import com.lms.entity.PasswordResetToken;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.exception.BadRequestException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.PasswordResetTokenRepository;
import com.lms.repository.RoleRepository;
import com.lms.repository.UserRepository;
import com.lms.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("📝 Registration request for email: {}", request.getEmail());

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        // Get MEMBER role
        Role memberRole = roleRepository.findByName("MEMBER")
            .orElseThrow(() -> new ResourceNotFoundException("Member role not found"));

        // CREATE USER WITH ALL REQUIRED FIELDS
        User user = User.builder()
            .email(request.getEmail())
            .username(request.getEmail()) // Use email as username
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .phone(request.getPhone())
            .address(request.getAddress() != null && !request.getAddress().trim().isEmpty() 
                ? request.getAddress() 
                : "Not Provided")
            .role(memberRole)
            
            // CRITICAL FIELDS FOR BORROWING
            .isActive(true)
            .isVerified(true)
            .accountStatus(User.AccountStatus.ACTIVE) // Required for borrowing
            .membershipPlan(User.MembershipPlan.STANDARD) // Default free plan
            .membershipStartDate(LocalDate.now())
            .membershipExpiryDate(LocalDate.now().plusMonths(2))
            .membershipFee(0.0) // Standard is free
            .maxBooksAllowed(3) // Standard allows 3 books
            .currentlyBorrowed(0) // Start with 0
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getEmail());

        // Generate JWT token using JwtUtil
        String token = jwtUtil.generateToken(savedUser);

        return AuthResponse.builder()
            .token(token)
            .type("Bearer")
            .id(savedUser.getId())
            .email(savedUser.getEmail())
            .fullName(savedUser.getFullName())
            .role(savedUser.getRole().getName())
            .membershipPlan(savedUser.getMembershipPlan().name())
            .accountStatus(savedUser.getAccountStatus().name())
            .maxBooksAllowed(savedUser.getMaxBooksAllowed())
            .currentlyBorrowed(savedUser.getCurrentlyBorrowed())
            .build();
    }

    public AuthResponse login(AuthRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            // Get user details
            User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // Generate JWT token using JwtUtil
            String token = jwtUtil.generateToken(user);

            log.info("Login successful for: {}", user.getEmail());

            return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .membershipPlan(user.getMembershipPlan().name())
                .accountStatus(user.getAccountStatus().name())
                .maxBooksAllowed(user.getMaxBooksAllowed())
                .currentlyBorrowed(user.getCurrentlyBorrowed())
                .build();

        } catch (Exception e) {
            log.error("Login failed for {}: {}", request.getEmail(), e.getMessage());
            throw new BadRequestException("Invalid email or password");
        }
    }

    @Transactional
    public ApiResponse<String> requestPasswordReset(PasswordResetRequest request) {
        String email = request.getEmail();
        log.info("Password reset request for: {}", email);

        try {
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

            // Generate 6-digit OTP
            String otp = String.format("%06d", (int)(Math.random() * 1000000));
            
            // Set expiry time (10 minutes from now)
            Instant expiresAt = Instant.now().plusSeconds(600); // 10 minutes

            // Save OTP in User table (for backward compatibility)
            user.setResetOtp(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            userRepository.save(user);

            // Save OTP in password_reset_tokens table
            PasswordResetToken resetToken = PasswordResetToken.builder()
                .email(email)
                .otp(otp)
                .expiresAt(expiresAt)
                .createdAt(LocalDateTime.now())
                .isUsed(false)
                .build();
            passwordResetTokenRepository.save(resetToken);

            // Send OTP via email
            try {
                emailService.sendOtpEmail(email, otp, user.getFullName());
                log.info("OTP sent successfully to: {}", email);
            } catch (Exception e) {
                log.error("Email sending failed, but OTP saved: {}", e.getMessage());
            }

            log.info("OTP generated and saved for {}: {}", email, otp);
            return ApiResponse.success("OTP sent to your email", null);

        } catch (ResourceNotFoundException e) {
            log.error("User not found: {}", email);
            // Don't reveal if email exists or not (security best practice)
            return ApiResponse.success("If email exists, OTP has been sent", null);
        } catch (Exception e) {
            log.error("Password reset request failed: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to send OTP. Please try again.");
        }
    }

    @Transactional
    public ApiResponse<String> verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail();
        String otp = request.getOtp();
        log.info("🔍 OTP verification for: {}", email);

        try {
            // Verify from password_reset_tokens table
            PasswordResetToken resetToken = passwordResetTokenRepository
                .findValidToken(email, otp, Instant.now())
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP"));

            // Also verify from User table (backward compatibility)
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
                throw new BadRequestException("Invalid OTP");
            }

            if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
                throw new BadRequestException("OTP has expired");
            }

            // Mark OTP as verified in password_reset_tokens table
            resetToken.setVerifiedAt(LocalDateTime.now());
            passwordResetTokenRepository.save(resetToken);

            log.info("OTP verified successfully for: {} at {}", email, LocalDateTime.now());
            return ApiResponse.success("OTP verified successfully", null);

        } catch (BadRequestException e) {
            log.error("OTP verification failed for {}: {}", email, e.getMessage());
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            log.error("OTP verification error: {}", e.getMessage(), e);
            return ApiResponse.error("OTP verification failed");
        }
    }

    @Transactional
    public ApiResponse<String> resetPasswordWithOtp(ResetPasswordWithOtpRequest request) {
        String email = request.getEmail();
        String otp = request.getOtp();
        String newPassword = request.getNewPassword();
        log.info("Password reset for: {}", email);

        try {
            // Verify OTP from password_reset_tokens table
            PasswordResetToken resetToken = passwordResetTokenRepository
                .findValidToken(email, otp, Instant.now())
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP"));

            // Check if already used
            if (resetToken.getIsUsed()) {
                throw new BadRequestException("OTP has already been used");
            }

            // Get user
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // Verify from User table as well
            if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
                throw new BadRequestException("Invalid OTP");
            }

            if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
                throw new BadRequestException("OTP has expired");
            }

            // Reset password
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setResetOtp(null); // Clear OTP from User table
            user.setOtpExpiry(null);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            // Mark token as used in password_reset_tokens table
            resetToken.setIsUsed(true);
            passwordResetTokenRepository.save(resetToken);

            // Optional: Clean up old tokens for this email
            try {
                passwordResetTokenRepository.markAllAsUsed(email);
            } catch (Exception e) {
                log.warn("Failed to mark old tokens as used: {}", e.getMessage());
            }

            log.info("Password reset successful for: {}", email);
            return ApiResponse.success("Password reset successful", null);

        } catch (BadRequestException | ResourceNotFoundException e) {
            log.error("Password reset failed for {}: {}", email, e.getMessage());
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            log.error("Password reset error: {}", e.getMessage(), e);
            return ApiResponse.error("Password reset failed. Please try again.");
        }
    }
}