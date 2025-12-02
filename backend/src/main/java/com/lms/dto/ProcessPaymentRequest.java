package com.lms.dto;

import lombok.Data;

@Data
public class ProcessPaymentRequest {
    private String paymentMethod; // CASH, CARD, UPI
    private String transactionId; // For CARD/UPI payments
    private String notes;
}