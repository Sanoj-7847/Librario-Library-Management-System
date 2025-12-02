package com.lms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false, unique = true)
    private String isbn;

    private String publisher;

    @Column(name = "published_year")
    private Integer publishedYear;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_copies", nullable = false)
    private Integer totalCopies;

    @Column(name = "available_copies", nullable = false)
    private Integer availableCopies;

    @Column(nullable = false)
    private Integer pages;

    private String coverImage;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "book_categories", joinColumns = @JoinColumn(name = "book_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    private List<Category> categories = new ArrayList<>();

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BorrowRecord> borrowRecords = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookStatus status = BookStatus.AVAILABLE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum BookStatus {
        AVAILABLE,
        ISSUED,
        MAINTENANCE,
        LOST
    }
    
    public void borrowBook() {
        if (availableCopies > 0) {
            availableCopies--;
            if (availableCopies == 0) {
                status = BookStatus.ISSUED;
            }
        }
    }
    
    public void returnBook() {
        if (availableCopies < totalCopies) {
            availableCopies++;
            if (status == BookStatus.ISSUED && availableCopies > 0) {
                status = BookStatus.AVAILABLE;
            }
        }
    }
}
