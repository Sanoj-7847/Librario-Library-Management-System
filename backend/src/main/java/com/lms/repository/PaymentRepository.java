package com.lms.repository;

import com.lms.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    List<Payment> findByUserIdOrderByPaymentDateDesc(Long userId);
    
    List<Payment> findByBorrowRecordIdOrderByPaymentDateDesc(Long borrowRecordId);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.user.id = :userId")
    Double sumAmountByUserId(Long userId);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentType = :paymentType")
    Double sumAmountByPaymentType(Payment.PaymentType paymentType);
}