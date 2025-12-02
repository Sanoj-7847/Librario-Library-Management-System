package com.lms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private Long id;
    private Long borrowRecordId;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private Double amount;
    private String paymentType; // PENALTY, DAMAGE_REPAIR, MEMBERSHIP_FEE
    private String paymentMethod; // CASH, CARD, UPI
    private String transactionId;
    private String status; // PENDING, COMPLETED, FAILED, REFUNDED
    private LocalDateTime paymentDate;
    private String notes;
    private LocalDateTime createdAt;
}
