package com.lms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ReturnBookRequest {
    
    @NotNull(message = "Borrow record ID is required")
    private Long borrowRecordId;
    
    private LocalDate returnDate;
    private String notes;
    
    // Damage reporting fields
    private Boolean isDamaged = false;
    private String damageLevel; // MINOR, MODERATE, SEVERE, LOST
    private String damageDescription;
    private Double repairCost;
    
    // Payment fields for penalty/damage
    private String paymentMethod; // CASH, CARD, UPI
    private String transactionId; // For CARD/UPI payments
    private Boolean paymentCompleted = false;
}
