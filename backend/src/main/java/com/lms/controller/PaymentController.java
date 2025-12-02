package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.dto.PaymentDTO;
import com.lms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {
    
    private final PaymentService paymentService;
    
    // Get all payments (Admin/Librarian only)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<PaymentDTO>>> getAllPayments() {
        List<PaymentDTO> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved", payments));
    }
    
    // Get my payments (Member)
    @GetMapping("/my-payments")
    @PreAuthorize("hasAnyRole('MEMBER', 'ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<PaymentDTO>>> getMyPayments(Authentication authentication) {
        List<PaymentDTO> payments = paymentService.getMyPayments(authentication);
        return ResponseEntity.ok(ApiResponse.success("Your payments retrieved", payments));
    }
    
    // Get payments by user ID (Admin/Librarian)
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<PaymentDTO>>> getPaymentsByUserId(@PathVariable Long userId) {
        List<PaymentDTO> payments = paymentService.getPaymentsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("User payments retrieved", payments));
    }
    
    // Get payments by borrow record ID
    @GetMapping("/borrow-record/{borrowRecordId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<PaymentDTO>>> getPaymentsByBorrowRecordId(
            @PathVariable Long borrowRecordId) {
        List<PaymentDTO> payments = paymentService.getPaymentsByBorrowRecordId(borrowRecordId);
        return ResponseEntity.ok(ApiResponse.success("Borrow record payments retrieved", payments));
    }
    
    // Get payment by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentDTO>> getPaymentById(@PathVariable Long id) {
        PaymentDTO payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved", payment));
    }
}