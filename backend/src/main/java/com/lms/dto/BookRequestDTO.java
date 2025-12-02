package com.lms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookRequestDTO {
    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookIsbn;
    private String status;
    private LocalDate requestDate;
    private String notes;
    private String adminNotes;
    private Long processedBy;
    private String processedByName;
    private LocalDateTime processedDate;
    private LocalDateTime createdAt;
}