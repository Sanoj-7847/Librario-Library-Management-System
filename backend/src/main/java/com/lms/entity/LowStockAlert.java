package com.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "low_stock_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LowStockAlert {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;
    
    @Column(name = "available_copies", nullable = false)
    private Integer availableCopies;
    
    @Column(name = "threshold", nullable = false)
    private Integer threshold;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status = AlertStatus.ACTIVE;
    
    @Column(name = "alert_date", nullable = false)
    private LocalDateTime alertDate;
    
    @Column(name = "resolved_date")
    private LocalDateTime resolvedDate;
    
    @Column(name = "resolved_by")
    private Long resolvedBy;
    
    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (alertDate == null) {
            alertDate = LocalDateTime.now();
        }
    }
    
    public enum AlertStatus {
        ACTIVE,
        RESOLVED,
        DISMISSED
    }
}