package com.lms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MembershipPlanRequest {
    
    @NotBlank(message = "Plan is required")
    private String plan;
    
    @NotNull(message = "Max books allowed is required")
    @Min(value = 1, message = "Max books must be at least 1")
    private Integer maxBooks;
    
    @NotNull(message = "Fee is required")
    @Min(value = 0, message = "Fee cannot be negative")
    private Double fee;
    
    @NotNull(message = "Borrow days is required")
    @Min(value = 1, message = "Borrow days must be at least 1")
    private Integer borrowDays;
}
