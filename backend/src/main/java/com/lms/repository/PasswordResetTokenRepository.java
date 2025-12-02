package com.lms.repository;

import com.lms.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByEmailAndOtp(String email, String otp);
    
    @Query("SELECT p FROM PasswordResetToken p WHERE p.email = :email AND p.otp = :otp " +
           "AND p.isUsed = false AND p.expiresAt > :now")
    Optional<PasswordResetToken> findValidToken(
        @Param("email") String email, 
        @Param("otp") String otp, 
        @Param("now") Instant now
    );
    
    List<PasswordResetToken> findByEmailOrderByCreatedAtDesc(String email);
    
    @Query("SELECT p FROM PasswordResetToken p WHERE p.email = :email AND p.isUsed = false " +
           "ORDER BY p.createdAt DESC")
    List<PasswordResetToken> findUnusedTokensByEmail(@Param("email") String email);
    
    @Transactional
    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.email = :email")
    void deleteByEmail(@Param("email") String email);
    
    @Transactional
    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") Instant now);
    
    @Transactional
    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.isUsed = true WHERE p.email = :email")
    void markAllAsUsed(@Param("email") String email);
}