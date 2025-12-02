package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin endpoint to manually fix user data issues
 * Accessible only by ADMIN users
 */
@RestController
@RequestMapping("/api/admin/fix")
@RequiredArgsConstructor
@Slf4j
public class AdminFixController {
    
    private final UserRepository userRepository;
    
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> fixAllUsers() {
        log.info("🔧 Admin triggered: Fixing all users with NULL values");
        
        List<User> allUsers = userRepository.findAll();
        Map<String, Integer> stats = new HashMap<>();
        
        int fixedCount = 0;
        int accountStatusFixed = 0;
        int membershipPlanFixed = 0;
        int currentlyBorrowedFixed = 0;
        int maxBooksFixed = 0;
        int membershipDatesFixed = 0;
        int isActiveFixed = 0;
        int isVerifiedFixed = 0;
        
        for (User user : allUsers) {
            boolean needsUpdate = false;
            
            // Fix NULL account_status
            if (user.getAccountStatus() == null) {
                user.setAccountStatus(User.AccountStatus.ACTIVE);
                accountStatusFixed++;
                needsUpdate = true;
            }
            
            // Fix NULL membership_plan
            if (user.getMembershipPlan() == null) {
                user.setMembershipPlan(User.MembershipPlan.STANDARD);
                membershipPlanFixed++;
                needsUpdate = true;
            }
            
            // Fix NULL currently_borrowed
            if (user.getCurrentlyBorrowed() == null) {
                user.setCurrentlyBorrowed(0);
                currentlyBorrowedFixed++;
                needsUpdate = true;
            }
            
            // Fix NULL max_books_allowed
            if (user.getMaxBooksAllowed() == null) {
                user.setMaxBooksAllowed(user.getMembershipPlan().getMaxBooks());
                maxBooksFixed++;
                needsUpdate = true;
            }
            
            // Fix NULL membership dates
            if (user.getMembershipStartDate() == null) {
                user.setMembershipStartDate(LocalDate.now());
                membershipDatesFixed++;
                needsUpdate = true;
            }
            
            if (user.getMembershipExpiryDate() == null) {
                LocalDate startDate = user.getMembershipStartDate() != null ? 
                    user.getMembershipStartDate() : LocalDate.now();
                user.setMembershipExpiryDate(startDate.plusYears(1));
                membershipDatesFixed++;
                needsUpdate = true;
            }
            
            // Fix NULL isActive
            if (user.getIsActive() == null) {
                user.setIsActive(true);
                isActiveFixed++;
                needsUpdate = true;
            }
            
            // Fix NULL isVerified
            if (user.getIsVerified() == null) {
                user.setIsVerified(true);
                isVerifiedFixed++;
                needsUpdate = true;
            }
            
            // Fix NULL membership_fee
            if (user.getMembershipFee() == null) {
                user.setMembershipFee(user.getMembershipPlan().getFee());
                needsUpdate = true;
            }
            
            // Fix NULL username
            if (user.getUsername() == null || user.getUsername().isEmpty()) {
                user.setUsername(user.getEmail());
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                userRepository.save(user);
                fixedCount++;
            }
        }
        
        stats.put("totalUsers", allUsers.size());
        stats.put("usersFixed", fixedCount);
        stats.put("accountStatusFixed", accountStatusFixed);
        stats.put("membershipPlanFixed", membershipPlanFixed);
        stats.put("currentlyBorrowedFixed", currentlyBorrowedFixed);
        stats.put("maxBooksFixed", maxBooksFixed);
        stats.put("membershipDatesFixed", membershipDatesFixed);
        stats.put("isActiveFixed", isActiveFixed);
        stats.put("isVerifiedFixed", isVerifiedFixed);
        
        Map<String, Object> result = new HashMap<>();
        result.put("stats", stats);
        result.put("message", fixedCount > 0 ? 
            "Fixed " + fixedCount + " users successfully" : 
            "All users have valid data, no fixes needed");
        
        log.info("✅ User fix complete: {} users fixed out of {}", fixedCount, allUsers.size());
        
        return ResponseEntity.ok(
            ApiResponse.success("User data fix completed", result)
        );
    }
    
    @GetMapping("/users/check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkUsers() {
        log.info("🔍 Admin triggered: Checking users for NULL values");
        
        List<User> allUsers = userRepository.findAll();
        Map<String, Integer> issues = new HashMap<>();
        
        int totalIssues = 0;
        int accountStatusNull = 0;
        int membershipPlanNull = 0;
        int currentlyBorrowedNull = 0;
        int maxBooksNull = 0;
        int membershipDatesNull = 0;
        
        for (User user : allUsers) {
            if (user.getAccountStatus() == null) {
                accountStatusNull++;
                totalIssues++;
            }
            if (user.getMembershipPlan() == null) {
                membershipPlanNull++;
                totalIssues++;
            }
            if (user.getCurrentlyBorrowed() == null) {
                currentlyBorrowedNull++;
                totalIssues++;
            }
            if (user.getMaxBooksAllowed() == null) {
                maxBooksNull++;
                totalIssues++;
            }
            if (user.getMembershipStartDate() == null || user.getMembershipExpiryDate() == null) {
                membershipDatesNull++;
                totalIssues++;
            }
        }
        
        issues.put("totalUsers", allUsers.size());
        issues.put("totalIssues", totalIssues);
        issues.put("accountStatusNull", accountStatusNull);
        issues.put("membershipPlanNull", membershipPlanNull);
        issues.put("currentlyBorrowedNull", currentlyBorrowedNull);
        issues.put("maxBooksNull", maxBooksNull);
        issues.put("membershipDatesNull", membershipDatesNull);
        
        Map<String, Object> result = new HashMap<>();
        result.put("issues", issues);
        result.put("needsFix", totalIssues > 0);
        result.put("message", totalIssues > 0 ? 
            "Found " + totalIssues + " issues that need fixing" : 
            "All users have valid data");
        
        return ResponseEntity.ok(
            ApiResponse.success("User data check completed", result)
        );
    }
}