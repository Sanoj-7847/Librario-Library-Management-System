package com.lms.repository;

import com.lms.entity.DamagedBookReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DamagedBookReportRepository extends JpaRepository<DamagedBookReport, Long> {
    
    // Find by status
    List<DamagedBookReport> findByStatusOrderByReportDateDesc(DamagedBookReport.ReportStatus status);
    
    // Find by book
    List<DamagedBookReport> findByBookIdOrderByReportDateDesc(Long bookId);
    
    // Find by reporter
    List<DamagedBookReport> findByReportedByIdOrderByReportDateDesc(Long userId);
    
    // Find all ordered by report date
    List<DamagedBookReport> findAllByOrderByReportDateDesc();
    
    // Find pending reports (PENDING or UNDER_REVIEW)
    @Query("SELECT d FROM DamagedBookReport d WHERE d.status IN ('PENDING', 'UNDER_REVIEW') ORDER BY d.reportDate DESC")
    List<DamagedBookReport> findPendingReports();
    
    // Count pending reports
    @Query("SELECT COUNT(d) FROM DamagedBookReport d WHERE d.status IN ('PENDING', 'UNDER_REVIEW')")
    Long countPendingReports();
    
    // Find by borrow record
    List<DamagedBookReport> findByBorrowRecordId(Long borrowRecordId);
}