package com.lms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "borrow_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BorrowRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "borrow_date", nullable = false)
    private LocalDate borrowDate;
    
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    
    @Column(name = "return_date")
    private LocalDate returnDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BorrowStatus status = BorrowStatus.ISSUED;
    
    @Column(name = "overdue_days")
    private Integer overdueDays = 0;
    
    @Column(name = "penalty_amount")
    private Double penaltyAmount = 0.0;
    
    @Column(name = "penalty_paid")
    private Boolean penaltyPaid = false;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        // ✅ FIXED: Was setting createdAt instead of updatedAt
        updatedAt = LocalDateTime.now();
    }
    
    public enum BorrowStatus {
        ISSUED,
        RETURNED,
        OVERDUE,
        LOST
    }

    public void calculateOverdue() {
        if (returnDate != null) {
            if (returnDate.isAfter(dueDate)) {
                overdueDays = (int) ChronoUnit.DAYS.between(dueDate, returnDate);
            } else {
                overdueDays = 0;
            }
        } else if (LocalDate.now().isAfter(dueDate)) {
            overdueDays = (int) ChronoUnit.DAYS.between(dueDate, LocalDate.now());
            status = BorrowStatus.OVERDUE;
        }
    }
    
    public void calculatePenalty(double penaltyPerDay) {
        calculateOverdue();
        if (overdueDays > 0) {
            penaltyAmount = overdueDays * penaltyPerDay;
        } else {
            penaltyAmount = 0.0;
        }
    }
    
    public boolean isOverdue() {
        return LocalDate.now().isAfter(dueDate) && returnDate == null;
    }
    
    public void markAsReturned() {
        returnDate = LocalDate.now();
        status = BorrowStatus.RETURNED;
        calculateOverdue();
    }
}