package com.lms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private String message;
    
    // Use STRING type instead of ORDINAL to store the enum name as varchar
    // This automatically handles new enum values without database migration
    @Enumerated(EnumType.STRING)
    @Column(length = 50)  // Ensure column is VARCHAR(50) not ENUM
    private NotificationType type;
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public enum NotificationType {
        BOOK_ISSUED, 
        REMINDER, 
        OVERDUE, 
        PENALTY, 
        BOOK_RETURNED, 
        GENERAL,
        ALERT
    }
}