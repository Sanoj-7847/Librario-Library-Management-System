package com.lms.service;

import com.lms.dto.*;
import com.lms.entity.*;
import com.lms.exception.BadRequestException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final LowStockAlertRepository lowStockAlertRepository;
    private final DamagedBookReportRepository damagedBookReportRepository;
    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ==================== LOW STOCK ALERTS ====================
    
    public List<LowStockAlertDTO> getActiveLowStockAlerts() {
        log.info("Fetching active low stock alerts");
        
        List<LowStockAlert> alerts = lowStockAlertRepository
            .findByStatusOrderByAlertDateDesc(LowStockAlert.AlertStatus.ACTIVE);
        
        log.info("Found {} active low stock alerts", alerts.size());
        return alerts.stream()
            .map(this::mapLowStockAlertToDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public LowStockAlertDTO resolveLowStockAlert(Long alertId, ResolveAlertRequest request, Authentication authentication) {
        log.info("Resolving low stock alert ID: {}", alertId);
        
        User user = (User) authentication.getPrincipal();
        
        LowStockAlert alert = lowStockAlertRepository.findById(alertId)
            .orElseThrow(() -> new ResourceNotFoundException("Low stock alert not found"));
        
        if (alert.getStatus() != LowStockAlert.AlertStatus.ACTIVE) {
            throw new BadRequestException("Alert is already resolved or dismissed");
        }
        
        // Update alert status
        if ("RESOLVED".equalsIgnoreCase(request.getStatus())) {
            alert.setStatus(LowStockAlert.AlertStatus.RESOLVED);
        } else if ("DISMISSED".equalsIgnoreCase(request.getStatus())) {
            alert.setStatus(LowStockAlert.AlertStatus.DISMISSED);
        } else {
            throw new BadRequestException("Invalid status. Use RESOLVED or DISMISSED");
        }
        
        alert.setResolvedDate(LocalDateTime.now());
        alert.setResolvedBy(user.getId());
        alert.setResolutionNotes(request.getResolutionNotes());
        
        alert = lowStockAlertRepository.save(alert);
        
        log.info("Low stock alert {} by {}", alert.getStatus(), user.getEmail());
        return mapLowStockAlertToDTO(alert);
    }

    @Transactional
    public void createLowStockAlert(Book book, int threshold) {
        log.info("Creating low stock alert for book: {}", book.getTitle());
        
        // Check if alert already exists
        if (lowStockAlertRepository.existsByBookIdAndStatus(
                book.getId(), LowStockAlert.AlertStatus.ACTIVE)) {
            log.info("Alert already exists for book: {}", book.getTitle());
            return;
        }
        
        LowStockAlert alert = LowStockAlert.builder()
            .book(book)
            .availableCopies(book.getAvailableCopies())
            .threshold(threshold)
            .status(LowStockAlert.AlertStatus.ACTIVE)
            .alertDate(LocalDateTime.now())
            .build();
        
        lowStockAlertRepository.save(alert);
        
        // Notify admins
        notificationService.sendLowStockAlertToAdmins(book, book.getAvailableCopies());
        
        log.info("Low stock alert created for: {}", book.getTitle());
    }

    // ==================== DAMAGED BOOK REPORTS ====================
    
    public List<DamagedBookReportDTO> getPendingDamagedBookReports() {
        log.info("Fetching pending damaged book reports");
        
        List<DamagedBookReport> reports = damagedBookReportRepository.findPendingReports();
        
        log.info("Found {} pending damaged book reports", reports.size());
        return reports.stream()
            .map(this::mapDamagedBookReportToDTO)
            .collect(Collectors.toList());
    }
    
    public List<DamagedBookReportDTO> getAllDamagedBookReports() {
        log.info("Fetching all damaged book reports");
        
        List<DamagedBookReport> reports = damagedBookReportRepository
            .findAllByOrderByReportDateDesc();
        
        log.info("Found {} total damaged book reports", reports.size());
        return reports.stream()
            .map(this::mapDamagedBookReportToDTO)
            .collect(Collectors.toList());
    }
    
    public List<DamagedBookReportDTO> getMyDamagedBookReports(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        log.info("Fetching damaged book reports for user: {}", user.getEmail());
        
        List<DamagedBookReport> reports = damagedBookReportRepository
            .findByReportedByIdOrderByReportDateDesc(user.getId());
        
        log.info("Found {} reports for user: {}", reports.size(), user.getEmail());
        return reports.stream()
            .map(this::mapDamagedBookReportToDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public DamagedBookReportDTO reportDamagedBook(ReportDamagedBookRequest request, Authentication authentication) {
        log.info("Creating damaged book report for book ID: {}", request.getBookId());
        
        User user = (User) authentication.getPrincipal();
        
        Book book = bookRepository.findById(request.getBookId())
            .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        
        BorrowRecord borrowRecord = null;
        if (request.getBorrowRecordId() != null) {
            borrowRecord = borrowRecordRepository.findById(request.getBorrowRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Borrow record not found"));
                
            // Verify the borrow record belongs to the user
            if (!borrowRecord.getUser().getId().equals(user.getId()) && 
                !user.getRole().getName().equals("ADMIN") && 
                !user.getRole().getName().equals("LIBRARIAN")) {
                throw new BadRequestException("This borrow record does not belong to you");
            }
        }
        
        // Validate damage level
        DamagedBookReport.DamageLevel damageLevel;
        try {
            damageLevel = DamagedBookReport.DamageLevel.valueOf(request.getDamageLevel().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid damage level. Use: MINOR, MODERATE, SEVERE, LOST");
        }
        
        DamagedBookReport report = DamagedBookReport.builder()
            .book(book)
            .reportedBy(user)
            .borrowRecord(borrowRecord)
            .damageLevel(damageLevel)
            .damageDescription(request.getDamageDescription())
            .repairCost(request.getRepairCost())
            .status(DamagedBookReport.ReportStatus.PENDING)
            .reportDate(LocalDateTime.now())
            .build();
        
        report = damagedBookReportRepository.save(report);
        
        // Notify admins
        notificationService.sendDamagedBookAlertToAdmins(report);
        
        // Send confirmation email to reporter
        notificationService.sendDamagedBookReportConfirmation(user, book, damageLevel.name());
        
        log.info("Damaged book report created: ID {}", report.getId());
        return mapDamagedBookReportToDTO(report);
    }

    @Transactional
    public DamagedBookReportDTO processDamagedBookReport(Long reportId, ProcessDamagedBookRequest request, Authentication authentication) {
        log.info("Processing damaged book report ID: {}", reportId);
        
        User user = (User) authentication.getPrincipal();
        
        DamagedBookReport report = damagedBookReportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Damaged book report not found"));
        
        // Validate status
        DamagedBookReport.ReportStatus newStatus;
        try {
            newStatus = DamagedBookReport.ReportStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status. Use: PENDING, UNDER_REVIEW, REPAIRING, REPAIRED, REPLACED, WRITTEN_OFF");
        }
        
        DamagedBookReport.ReportStatus oldStatus = report.getStatus();
        
        report.setStatus(newStatus);
        report.setResolutionNotes(request.getResolutionNotes());
        report.setResolvedBy(user);
        report.setResolvedDate(LocalDateTime.now());
        
        // If book is written off or lost, update book status
        if (newStatus == DamagedBookReport.ReportStatus.WRITTEN_OFF || 
            report.getDamageLevel() == DamagedBookReport.DamageLevel.LOST) {
            Book book = report.getBook();
            if (book.getTotalCopies() > 0) {
                book.setTotalCopies(book.getTotalCopies() - 1);
                if (book.getAvailableCopies() > 0) {
                    book.setAvailableCopies(book.getAvailableCopies() - 1);
                }
                bookRepository.save(book);
                log.info("Book total copies reduced due to write-off. Book: {}", book.getTitle());
            }
        }
        
        // If book is repaired or replaced, update availability
        if (newStatus == DamagedBookReport.ReportStatus.REPAIRED || 
            newStatus == DamagedBookReport.ReportStatus.REPLACED) {
            Book book = report.getBook();
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
            log.info("Book availability increased after repair/replacement. Book: {}", book.getTitle());
        }
        
        report = damagedBookReportRepository.save(report);
        
        // Notify the reporter about the status update
        notificationService.sendDamagedBookReportUpdate(
            report.getReportedBy(), 
            report.getBook(), 
            newStatus.name(), 
            request.getResolutionNotes()
        );
        
        log.info("Damaged book report processed with status: {} -> {}", oldStatus, newStatus);
        return mapDamagedBookReportToDTO(report);
    }
    
    @Transactional
    public void deleteDamagedBookReport(Long reportId) {
        log.info("Deleting damaged book report ID: {}", reportId);
        
        DamagedBookReport report = damagedBookReportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Damaged book report not found"));
        
        damagedBookReportRepository.delete(report);
        log.info("Damaged book report deleted: ID {}", reportId);
    }

    // ==================== MAPPING METHODS ====================

    private LowStockAlertDTO mapLowStockAlertToDTO(LowStockAlert alert) {
        return LowStockAlertDTO.builder()
            .id(alert.getId())
            .bookId(alert.getBook().getId())
            .bookTitle(alert.getBook().getTitle())
            .bookAuthor(alert.getBook().getAuthor())
            .bookIsbn(alert.getBook().getIsbn())
            .availableCopies(alert.getAvailableCopies())
            .totalCopies(alert.getBook().getTotalCopies())
            .threshold(alert.getThreshold())
            .status(alert.getStatus().name())
            .alertDate(alert.getAlertDate())
            .resolvedDate(alert.getResolvedDate())
            .resolutionNotes(alert.getResolutionNotes())
            .build();
    }

    private DamagedBookReportDTO mapDamagedBookReportToDTO(DamagedBookReport report) {
        return DamagedBookReportDTO.builder()
            .id(report.getId())
            .bookId(report.getBook().getId())
            .bookTitle(report.getBook().getTitle())
            .bookAuthor(report.getBook().getAuthor())
            .borrowRecordId(report.getBorrowRecord() != null ? report.getBorrowRecord().getId() : null)
            .reportedByUserId(report.getReportedBy().getId())
            .reportedByName(report.getReportedBy().getFullName())
            .damageLevel(report.getDamageLevel().name())
            .damageDescription(report.getDamageDescription())
            .repairCost(report.getRepairCost())
            .status(report.getStatus().name())
            .reportDate(report.getReportDate())
            .resolutionNotes(report.getResolutionNotes())
            .resolvedBy(report.getResolvedBy() != null ? report.getResolvedBy().getId() : null)
            .resolvedByName(report.getResolvedBy() != null ? report.getResolvedBy().getFullName() : null)
            .resolvedDate(report.getResolvedDate())
            .build();
    }
}