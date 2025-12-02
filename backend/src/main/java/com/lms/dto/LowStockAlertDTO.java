package com.lms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

// Low Stock Alert DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockAlertDTO {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookIsbn;
    private Integer availableCopies;
    private Integer totalCopies;
    private Integer threshold;
    private String status;
    private LocalDateTime alertDate;
    private LocalDateTime resolvedDate;
    private String resolutionNotes;
}