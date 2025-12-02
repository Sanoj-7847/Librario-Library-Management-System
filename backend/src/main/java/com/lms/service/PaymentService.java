package com.lms.service;

import com.lms.dto.PaymentDTO;
import com.lms.entity.Payment;
import com.lms.entity.User;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    
    @Transactional(readOnly = true)
    public List<PaymentDTO> getAllPayments() {
        log.info("Fetching all payments");
        List<Payment> payments = paymentRepository.findAll();
        return payments.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PaymentDTO> getMyPayments(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        log.info("Fetching payments for user: {}", user.getEmail());
        
        List<Payment> payments = paymentRepository.findByUserIdOrderByPaymentDateDesc(user.getId());
        return payments.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PaymentDTO> getPaymentsByUserId(Long userId) {
        log.info("Fetching payments for user ID: {}", userId);
        List<Payment> payments = paymentRepository.findByUserIdOrderByPaymentDateDesc(userId);
        return payments.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PaymentDTO> getPaymentsByBorrowRecordId(Long borrowRecordId) {
        log.info("Fetching payments for borrow record ID: {}", borrowRecordId);
        List<Payment> payments = paymentRepository.findByBorrowRecordIdOrderByPaymentDateDesc(borrowRecordId);
        return payments.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public PaymentDTO getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return mapToDTO(payment);
    }
    
    private PaymentDTO mapToDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .borrowRecordId(payment.getBorrowRecord().getId())
                .userId(payment.getUser().getId())
                .userFullName(payment.getUser().getFullName())
                .userEmail(payment.getUser().getEmail())
                .bookId(payment.getBorrowRecord().getBook().getId())
                .bookTitle(payment.getBorrowRecord().getBook().getTitle())
                .bookAuthor(payment.getBorrowRecord().getBook().getAuthor())
                .amount(payment.getAmount())
                .paymentType(payment.getPaymentType().name())
                .paymentMethod(payment.getPaymentMethod().name())
                .transactionId(payment.getTransactionId())
                .status(payment.getStatus().name())
                .paymentDate(payment.getPaymentDate())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}