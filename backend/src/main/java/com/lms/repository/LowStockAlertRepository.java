package com.lms.repository;

import com.lms.entity.LowStockAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LowStockAlertRepository extends JpaRepository<LowStockAlert, Long> {
    
    // Find active alerts
    List<LowStockAlert> findByStatusOrderByAlertDateDesc(LowStockAlert.AlertStatus status);
    
    // Find by book
    Optional<LowStockAlert> findByBookIdAndStatus(Long bookId, LowStockAlert.AlertStatus status);
    
    // Check if alert exists for book
    boolean existsByBookIdAndStatus(Long bookId, LowStockAlert.AlertStatus status);
    
    // Count active alerts
    @Query("SELECT COUNT(a) FROM LowStockAlert a WHERE a.status = 'ACTIVE'")
    Long countActiveAlerts();
}