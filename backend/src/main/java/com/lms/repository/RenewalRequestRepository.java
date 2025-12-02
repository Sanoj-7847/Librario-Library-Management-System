package com.lms.repository;

import com.lms.entity.RenewalRequest;
import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RenewalRequestRepository extends JpaRepository<RenewalRequest, Long> {
    
    // Find by user
    List<RenewalRequest> findByUserIdOrderByRequestDateDesc(Long userId);
    
    // Find by status
    List<RenewalRequest> findByStatusOrderByRequestDateDesc(RenewalRequest.RenewalStatus status);
    
    // Find pending requests
    @Query("SELECT rr FROM RenewalRequest rr WHERE rr.status = 'PENDING' ORDER BY rr.requestDate DESC")
    List<RenewalRequest> findAllPendingRequests();
    
    // Find by borrow record
    Optional<RenewalRequest> findByBorrowRecordIdAndStatus(Long borrowRecordId, RenewalRequest.RenewalStatus status);
    
    // Check if renewal already requested
    boolean existsByBorrowRecordIdAndStatus(Long borrowRecordId, RenewalRequest.RenewalStatus status);
    
    // Count pending requests
    @Query("SELECT COUNT(rr) FROM RenewalRequest rr WHERE rr.status = 'PENDING'")
    Long countPendingRequests();
}