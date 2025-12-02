package com.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "phone")
    private String phone;

    private String address;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(name = "reset_otp")
    private String resetOtp;

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;

    @Enumerated(EnumType.STRING)
    @Column(name = "membership_plan")
    private MembershipPlan membershipPlan = MembershipPlan.STANDARD;

    @Column(name = "membership_start_date")
    private LocalDate membershipStartDate;

    @Column(name = "membership_expiry_date")
    private LocalDate membershipExpiryDate;

    @Column(name = "membership_fee")
    private Double membershipFee = 0.0;

    @Column(name = "max_books_allowed")
    private Integer maxBooksAllowed = 3;

    @Column(name = "currently_borrowed")
    private Integer currentlyBorrowed = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status")
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<BorrowRecord> borrowRecords = new ArrayList<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.getName()));
    }

    // For Spring Security, email is used as username
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }

    @PrePersist
    protected void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (membershipStartDate == null) {
            membershipStartDate = LocalDate.now();
        }

        if (membershipExpiryDate == null) {
            membershipExpiryDate = membershipStartDate.plusYears(1);
        }

        // Auto-set username if null
        if (username == null && email != null) {
            username = email;
        }
    }

    @PreUpdate
    protected void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Enums
    public enum MembershipPlan {
        STANDARD(3, 0.0, 14),
        PREMIUM(5, 500.0, 21),
        GOLD(10, 1000.0, 30);

        private final int maxBooks;
        private final double fee;
        private final int borrowDays;

        MembershipPlan(int maxBooks, double fee, int borrowDays) {
            this.maxBooks = maxBooks;
            this.fee = fee;
            this.borrowDays = borrowDays;
        }

        public int getMaxBooks() { return maxBooks; }
        public double getFee() { return fee; }
        public int getBorrowDays() { return borrowDays; }
    }

    public enum AccountStatus {
        ACTIVE,
        SUSPENDED,
        EXPIRED,
        INACTIVE
    }

    public boolean canBorrowBook() {
        return accountStatus == AccountStatus.ACTIVE
                && currentlyBorrowed < maxBooksAllowed
                && (membershipExpiryDate == null || membershipExpiryDate.isAfter(LocalDate.now()));
    }

    public void incrementBorrowedBooks() { currentlyBorrowed++; }
    public void decrementBorrowedBooks() { if (currentlyBorrowed > 0) currentlyBorrowed--; }
}
