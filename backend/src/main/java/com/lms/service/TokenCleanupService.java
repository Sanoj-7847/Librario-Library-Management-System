package com.lms.service;

import com.lms.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Service to periodically clean up expired password reset tokens
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupService {

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    /**
     * Clean up expired tokens every hour
     * Cron: 0 0 * * * * = Every hour at minute 0
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        try {
            log.info("🧹 Starting cleanup of expired password reset tokens...");
            
            Instant now = Instant.now();
            passwordResetTokenRepository.deleteExpiredTokens(now);
            
            log.info("✅ Expired token cleanup completed");
            
        } catch (Exception e) {
            log.error("❌ Error during token cleanup: {}", e.getMessage(), e);
        }
    }

    /**
     * Clean up tokens older than 7 days (even if not expired)
     * Runs daily at 3 AM
     * Cron: 0 0 3 * * * = Every day at 3:00 AM
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldTokens() {
        try {
            log.info("🧹 Starting cleanup of old password reset tokens (7+ days)...");
            
            Instant sevenDaysAgo = Instant.now().minusSeconds(7 * 24 * 60 * 60);
            passwordResetTokenRepository.deleteExpiredTokens(sevenDaysAgo);
            
            log.info("✅ Old token cleanup completed");
            
        } catch (Exception e) {
            log.error("❌ Error during old token cleanup: {}", e.getMessage(), e);
        }
    }
}