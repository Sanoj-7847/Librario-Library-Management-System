package com.lms.repository;

import com.lms.entity.Book;
import com.lms.entity.BorrowRecord;
import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long>, JpaSpecificationExecutor<BorrowRecord> {
    
    // Find by user
    List<BorrowRecord> findByUserIdOrderByBorrowDateDesc(Long userId);
    
    // Find by status
    List<BorrowRecord> findByStatusOrderByBorrowDateDesc(BorrowRecord.BorrowStatus status);
    
    // Find active borrows by user
    @Query("SELECT br FROM BorrowRecord br WHERE br.user.id = :userId AND br.status IN ('ISSUED', 'OVERDUE')")
    List<BorrowRecord> findActiveBorrowsByUserId(@Param("userId") Long userId);
    
    // Find all active borrows (for admin)
    @Query("SELECT br FROM BorrowRecord br WHERE br.status IN ('ISSUED', 'OVERDUE') ORDER BY br.borrowDate DESC")
    List<BorrowRecord> findAllActiveBorrows();
    
    // Find overdue records
    @Query("SELECT br FROM BorrowRecord br WHERE br.status IN ('ISSUED', 'OVERDUE') AND br.dueDate < :date")
    List<BorrowRecord> findOverdueRecords(@Param("date") LocalDate date);
    
    // Find records due on specific date
    @Query("SELECT br FROM BorrowRecord br WHERE br.status = 'ISSUED' AND br.dueDate = :date")
    List<BorrowRecord> findRecordsDueOnDate(@Param("date") LocalDate date);
    
    // Find records due between dates
    @Query("SELECT br FROM BorrowRecord br WHERE br.status = 'ISSUED' AND br.dueDate BETWEEN :startDate AND :endDate")
    List<BorrowRecord> findRecordsDueBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Check if user has active borrow for specific book
    @Query("SELECT br FROM BorrowRecord br WHERE br.user.id = :userId AND br.book.id = :bookId AND br.status IN ('ISSUED', 'OVERDUE')")
    Optional<BorrowRecord> findActiveBorrowByUserAndBook(@Param("userId") Long userId, @Param("bookId") Long bookId);
    
    // Count active borrows by user
    @Query("SELECT COUNT(br) FROM BorrowRecord br WHERE br.user.id = :userId AND br.status IN ('ISSUED', 'OVERDUE')")
    Long countActiveBorrowsByUserId(@Param("userId") Long userId);
    
    // Find records with unpaid penalties
    @Query("SELECT br FROM BorrowRecord br WHERE br.penaltyAmount > 0 AND br.penaltyPaid = false ORDER BY br.returnDate DESC")
    List<BorrowRecord> findUnpaidPenalties();
    
    // Find by book
    List<BorrowRecord> findByBookIdOrderByBorrowDateDesc(Long bookId);
    
    // Statistics queries
    @Query("SELECT COUNT(br) FROM BorrowRecord br WHERE br.status = 'ISSUED'")
    Long countCurrentlyBorrowed();
    
    @Query("SELECT COUNT(br) FROM BorrowRecord br WHERE br.status = 'OVERDUE'")
    Long countOverdue();
    
    @Query("SELECT SUM(br.penaltyAmount) FROM BorrowRecord br WHERE br.penaltyPaid = false")
    Double sumUnpaidPenalties();
    
    // ========== ADDED MISSING METHODS ==========
    
    // Count by status - used in BorrowService
    Long countByStatus(BorrowRecord.BorrowStatus status);
    
    // Sum all penalties - used in BorrowService
    @Query("SELECT SUM(br.penaltyAmount) FROM BorrowRecord br")
    Double sumPenalties();
    
    // Check if user has active borrow for book with specific status - used in BookRequestService
    boolean existsByUserAndBookAndStatus(User user, Book book, BorrowRecord.BorrowStatus status);
}