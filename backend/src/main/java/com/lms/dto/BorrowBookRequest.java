package com.lms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BorrowBookRequest {
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Book ID is required")
    private Long bookId;
    
    private LocalDate borrowDate;
    private LocalDate dueDate;
    private String notes;
}