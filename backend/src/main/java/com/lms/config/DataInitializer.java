package com.lms.config;

import com.lms.entity.Category;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.repository.CategoryRepository;
import com.lms.repository.RoleRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    @Transactional
    public void run(String... args) {
        log.info("🚀 Starting Data Initialization...");
        
        initializeRoles();
        initializeAdminUser();
        initializeCategories();
        fixExistingUsers(); // NEW: Fix any existing users with NULL values
        
        log.info("✅ Data Initialization Complete!");
    }
    
    private void initializeRoles() {
        if (roleRepository.count() == 0) {
            List<Role> roles = Arrays.asList(
                Role.builder().name("ADMIN").description("Administrator with full access").build(),
                Role.builder().name("LIBRARIAN").description("Librarian with book management access").build(),
                Role.builder().name("MEMBER").description("Library member with borrowing access").build()
            );
            
            roleRepository.saveAll(roles);
            log.info("✅ Roles initialized successfully");
        } else {
            log.info("ℹ️  Roles already exist, skipping initialization");
        }
    }
    
    private void initializeAdminUser() {
        if (!userRepository.existsByEmail("admin@gmail.com")) {
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));

            User admin = User.builder()
                    .username("admin")
                    .email("admin@gmail.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .fullName("System Administrator")
                    .phone("1234567890")
                    .address("System")
                    .role(adminRole)
                    .isActive(true)
                    .isVerified(true)
                    .membershipPlan(User.MembershipPlan.GOLD) // Give admin GOLD plan
                    .membershipStartDate(LocalDate.now())
                    .membershipExpiryDate(LocalDate.now().plusYears(100)) // 100 years
                    .membershipFee(0.0)
                    .maxBooksAllowed(User.MembershipPlan.GOLD.getMaxBooks())
                    .currentlyBorrowed(0)
                    .accountStatus(User.AccountStatus.ACTIVE)
                    .build();

            userRepository.save(admin);
            log.info("✅ Admin user created successfully");
            log.info("   📧 Email: admin@gmail.com");
            log.info("   🔑 Password: Admin@123");
        } else {
            log.info("ℹ️  Admin user already exists, skipping creation");
        }
    }
    
    private void initializeCategories() {
        if (categoryRepository.count() == 0) {
            List<Category> categories = Arrays.asList(
                Category.builder().name("Fiction").description("Fiction books and novels").build(),
                Category.builder().name("Non-Fiction").description("Non-fiction and factual books").build(),
                Category.builder().name("Science").description("Science and technology books").build(),
                Category.builder().name("History").description("Historical books and biographies").build(),
                Category.builder().name("Biography").description("Life stories and memoirs").build(),
                Category.builder().name("Children").description("Children's books and stories").build(),
                Category.builder().name("Programming").description("Programming and computer science").build(),
                Category.builder().name("Business").description("Business and management books").build(),
                Category.builder().name("Self-Help").description("Personal development and motivation").build(),
                Category.builder().name("Romance").description("Romance and love stories").build(),
                Category.builder().name("Mystery").description("Mystery and thriller books").build(),
                Category.builder().name("Fantasy").description("Fantasy and magical worlds").build()
            );
            
            categoryRepository.saveAll(categories);
            log.info("✅ Categories initialized successfully ({} categories)", categories.size());
        } else {
            log.info("ℹ️  Categories already exist, skipping initialization");
        }
    }
    
    /**
     * Fix existing users with NULL values in critical fields
     * This prevents NullPointerException errors during borrowing
     */
    @Transactional
    private void fixExistingUsers() {
        log.info("🔧 Checking for users with NULL values...");
        
        List<User> allUsers = userRepository.findAll();
        int fixedCount = 0;
        
        for (User user : allUsers) {
            boolean needsUpdate = false;
            
            // Fix NULL account_status (CRITICAL for borrowing)
            if (user.getAccountStatus() == null) {
                log.warn("⚠️  User {} has NULL account_status, setting to ACTIVE", user.getEmail());
                user.setAccountStatus(User.AccountStatus.ACTIVE);
                needsUpdate = true;
            }
            
            // Fix NULL membership_plan
            if (user.getMembershipPlan() == null) {
                log.warn("⚠️  User {} has NULL membership_plan, setting to STANDARD", user.getEmail());
                user.setMembershipPlan(User.MembershipPlan.STANDARD);
                needsUpdate = true;
            }
            
            // Fix NULL currently_borrowed
            if (user.getCurrentlyBorrowed() == null) {
                log.warn("⚠️  User {} has NULL currently_borrowed, setting to 0", user.getEmail());
                user.setCurrentlyBorrowed(0);
                needsUpdate = true;
            }
            
            // Fix NULL max_books_allowed
            if (user.getMaxBooksAllowed() == null) {
                log.warn("⚠️  User {} has NULL max_books_allowed, setting based on plan", user.getEmail());
                user.setMaxBooksAllowed(user.getMembershipPlan().getMaxBooks());
                needsUpdate = true;
            }
            
            // Fix NULL membership_start_date
            if (user.getMembershipStartDate() == null) {
                log.warn("⚠️  User {} has NULL membership_start_date, setting to today", user.getEmail());
                user.setMembershipStartDate(LocalDate.now());
                needsUpdate = true;
            }
            
            // Fix NULL membership_expiry_date
            if (user.getMembershipExpiryDate() == null) {
                log.warn("⚠️  User {} has NULL membership_expiry_date, setting to 1 year from start", user.getEmail());
                LocalDate startDate = user.getMembershipStartDate() != null ? 
                    user.getMembershipStartDate() : LocalDate.now();
                user.setMembershipExpiryDate(startDate.plusYears(1));
                needsUpdate = true;
            }
            
            // Fix NULL isActive
            if (user.getIsActive() == null) {
                log.warn("⚠️  User {} has NULL isActive, setting to true", user.getEmail());
                user.setIsActive(true);
                needsUpdate = true;
            }
            
            // Fix NULL isVerified
            if (user.getIsVerified() == null) {
                log.warn("⚠️  User {} has NULL isVerified, setting to true", user.getEmail());
                user.setIsVerified(true);
                needsUpdate = true;
            }
            
            // Fix NULL membership_fee
            if (user.getMembershipFee() == null) {
                log.warn("⚠️  User {} has NULL membership_fee, setting based on plan", user.getEmail());
                user.setMembershipFee(user.getMembershipPlan().getFee());
                needsUpdate = true;
            }
            
            // Fix NULL username (use email as username)
            if (user.getUsername() == null || user.getUsername().isEmpty()) {
                log.warn("⚠️  User {} has NULL username, setting to email", user.getEmail());
                user.setUsername(user.getEmail());
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                userRepository.save(user);
                fixedCount++;
                log.info("✅ Fixed user: {} ({})", user.getFullName(), user.getEmail());
            }
        }
        
        if (fixedCount > 0) {
            log.info("✅ Fixed {} users with NULL values", fixedCount);
        } else {
            log.info("✅ All users have valid data, no fixes needed");
        }
    }
}