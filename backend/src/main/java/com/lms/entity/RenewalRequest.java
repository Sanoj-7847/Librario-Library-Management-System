package com.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "renewal_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenewalRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "borrow_record_id", nullable = false)
    private BorrowRecord borrowRecord;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RenewalStatus status = RenewalStatus.PENDING;
    
    @Column(name = "current_due_date", nullable = false)
    private LocalDate currentDueDate;
    
    @Column(name = "requested_due_date")
    private LocalDate requestedDueDate;
    
    @Column(name = "new_due_date")
    private LocalDate newDueDate;
    
    @Column(name = "renewal_days")
    private Integer renewalDays;
    
    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;
    
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
    
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;
    
    @Column(name = "processed_date")
    private LocalDateTime processedDate;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (requestDate == null) {
            requestDate = LocalDate.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum RenewalStatus {
        PENDING,
        APPROVED,
        REJECTED,
        EXPIRED
    }
}