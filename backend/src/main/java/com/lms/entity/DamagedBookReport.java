package com.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "damaged_book_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DamagedBookReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reported_by_user_id")
    private User reportedBy;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "borrow_record_id")
    private BorrowRecord borrowRecord;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DamageLevel damageLevel;
    
    @Column(name = "damage_description", columnDefinition = "TEXT", nullable = false)
    private String damageDescription;
    
    @Column(name = "repair_cost")
    private Double repairCost;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;
    
    @Column(name = "report_date", nullable = false)
    private LocalDateTime reportDate;
    
    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;
    
    @Column(name = "resolved_date")
    private LocalDateTime resolvedDate;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (reportDate == null) {
            reportDate = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum DamageLevel {
        MINOR,      // Small wear, still usable
        MODERATE,   // Noticeable damage, needs repair
        SEVERE,     // Major damage, may need replacement
        LOST        // Book is lost/missing
    }
    
    public enum ReportStatus {
        PENDING,
        UNDER_REVIEW,
        REPAIRING,
        REPAIRED,
        REPLACED,
        WRITTEN_OFF
    }
}