package com.lms.service;

import com.lms.dto.*;
import com.lms.entity.*;
import com.lms.exception.BadRequestException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BorrowService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final LowStockAlertRepository lowStockAlertRepository;
    private final DamagedBookReportRepository damagedBookReportRepository;
    private final PaymentRepository paymentRepository;

    @Value("${library.penalty.per.day:15.0}")
    private Double penaltyPerDay;

    @Value("${library.low.stock.threshold:2}")
    private Integer lowStockThreshold;

    @Transactional
    public BorrowRecordResponse borrowBook(BorrowBookRequest request) {
        log.info("📚 Processing book borrow - userId: {}, bookId: {}", 
                request.getUserId(), request.getBookId());

        try {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            Book book = bookRepository.findById(request.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

            validateUser(user);

            if (book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
                throw new BadRequestException("Book is not available");
            }

            boolean alreadyBorrowed = borrowRecordRepository
                    .findActiveBorrowByUserAndBook(user.getId(), book.getId())
                    .isPresent();

            if (alreadyBorrowed) {
                throw new BadRequestException("You already have this book borrowed");
            }

            BorrowRecord borrowRecord = new BorrowRecord();
            borrowRecord.setUser(user);
            borrowRecord.setBook(book);
            borrowRecord.setBorrowDate(request.getBorrowDate() != null ? 
                    request.getBorrowDate() : LocalDate.now());

            int borrowDays = getBorrowDays(user);
            borrowRecord.setDueDate(borrowRecord.getBorrowDate().plusDays(borrowDays));
            
            borrowRecord.setStatus(BorrowRecord.BorrowStatus.ISSUED);
            borrowRecord.setNotes(request.getNotes());
            borrowRecord.setOverdueDays(0);
            borrowRecord.setPenaltyAmount(0.0);
            borrowRecord.setPenaltyPaid(false);

            book.setAvailableCopies(book.getAvailableCopies() - 1);
            
            if (user.getCurrentlyBorrowed() == null) {
                user.setCurrentlyBorrowed(0);
            }
            user.setCurrentlyBorrowed(user.getCurrentlyBorrowed() + 1);

            bookRepository.save(book);
            userRepository.save(user);
            BorrowRecord savedRecord = borrowRecordRepository.save(borrowRecord);

            checkAndCreateLowStockAlert(book);

            try {
                notificationService.sendBookIssuedNotification(user, book, borrowRecord.getDueDate());
            } catch (Exception e) {
                log.error("❌ Failed to send notification: {}", e.getMessage());
            }

            log.info("✅ Book borrowed successfully - Record ID: {}", savedRecord.getId());
            return mapToResponse(savedRecord);

        } catch (BadRequestException | ResourceNotFoundException e) {
            log.error("❌ Validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected error borrowing book", e);
            throw new RuntimeException("Failed to borrow book: " + e.getMessage());
        }
    }

    @Transactional
    public BorrowRecordResponse returnBook(ReturnBookRequest request) {
        log.info("📖 Processing book return - Record ID: {}", request.getBorrowRecordId());

        try {
            BorrowRecord borrowRecord = borrowRecordRepository.findById(request.getBorrowRecordId())
                    .orElseThrow(() -> new ResourceNotFoundException("Borrow record not found"));

            if (borrowRecord.getStatus() == BorrowRecord.BorrowStatus.RETURNED) {
                throw new BadRequestException("Book already returned");
            }

            LocalDate returnDate = request.getReturnDate() != null ? 
                    request.getReturnDate() : LocalDate.now();

            borrowRecord.setReturnDate(returnDate);
            
            // ✅ FIX 2: Calculate penalty correctly - use returnDate for calculation
            calculatePenaltyForReturn(borrowRecord, returnDate);

            if (request.getNotes() != null && !request.getNotes().isEmpty()) {
                String existingNotes = borrowRecord.getNotes() != null ? borrowRecord.getNotes() : "";
                borrowRecord.setNotes(existingNotes + "\nReturn notes: " + request.getNotes());
            }

            Book book = borrowRecord.getBook();
            User user = borrowRecord.getUser();
            
            Double totalAmount = 0.0;
            Double damageAmount = 0.0;
            boolean hasDamage = false;

            // ✅ FIX 3: Handle damage reporting ONLY if isDamaged is true
            if (Boolean.TRUE.equals(request.getIsDamaged())) {
                damageAmount = handleDamageReport(borrowRecord, request);
                totalAmount += damageAmount;
                hasDamage = true;
                
                log.info("⚠️ Book returned with damage - Not increasing available copies");
            } else {
                // Book returned in good condition
                book.setAvailableCopies(book.getAvailableCopies() + 1);
                log.info("✅ Book returned in good condition - Increasing available copies");
            }
            
            // Add penalty to total
            totalAmount += (borrowRecord.getPenaltyAmount() != null ? borrowRecord.getPenaltyAmount() : 0.0);
            
            // ✅ FIX 1: Process payment with book reference
            if (totalAmount > 0) {
                if (request.getPaymentMethod() != null && Boolean.TRUE.equals(request.getPaymentCompleted())) {
                    // Payment provided during return
                    processPayment(borrowRecord, user, book, borrowRecord.getPenaltyAmount(), damageAmount, request);
                    borrowRecord.setPenaltyPaid(true);
                } else {
                    // Payment portal needed
                    borrowRecord.setPenaltyPaid(false);
                    log.warn("⚠️ Amount due: ₹{} - Payment portal required", totalAmount);
                }
            }
            
            borrowRecord.setStatus(BorrowRecord.BorrowStatus.RETURNED);
            
            if (user.getCurrentlyBorrowed() != null && user.getCurrentlyBorrowed() > 0) {
                user.setCurrentlyBorrowed(user.getCurrentlyBorrowed() - 1);
            }

            bookRepository.save(book);
            userRepository.save(user);
            BorrowRecord savedRecord = borrowRecordRepository.save(borrowRecord);

            try {
                // ✅ FIX 3: Send notification with proper damage info
                notificationService.sendBookReturnedNotification(
                        user, book, returnDate, totalAmount, 
                        request.getPaymentMethod(), hasDamage,
                        request.getDamageLevel(), request.getDamageDescription(),
                        damageAmount
                );
            } catch (Exception e) {
                log.error("❌ Failed to send notification: {}", e.getMessage());
            }

            log.info("✅ Book returned successfully - Total Amount: ₹{}", totalAmount);
            return mapToResponse(savedRecord);

        } catch (BadRequestException | ResourceNotFoundException e) {
            log.error("❌ Validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected error returning book", e);
            throw new RuntimeException("Failed to return book: " + e.getMessage());
        }
    }

    @Transactional
    protected void calculatePenaltyForReturn(BorrowRecord borrowRecord, LocalDate returnDate) {
        LocalDate dueDate = borrowRecord.getDueDate();
        
        if (returnDate.isAfter(dueDate)) {
            // ✅ FIX 2: Correct overdue calculation
            long overdueDays = ChronoUnit.DAYS.between(dueDate, returnDate);
            borrowRecord.setOverdueDays((int) overdueDays);
            
            // ✅ FIX 2: Correct penalty calculation
            Double penalty = overdueDays * penaltyPerDay;
            borrowRecord.setPenaltyAmount(penalty);
            
            log.info("📊 Penalty calculated - Overdue days: {}, Amount: ₹{}", overdueDays, penalty);
        } else {
            borrowRecord.setOverdueDays(0);
            borrowRecord.setPenaltyAmount(0.0);
            log.info("✅ On-time return - No penalty");
        }
    }

    @Transactional
    protected Double handleDamageReport(BorrowRecord borrowRecord, ReturnBookRequest request) {
        log.info("⚠️ Processing damage report for borrow record: {}", borrowRecord.getId());

        try {
            DamagedBookReport.DamageLevel damageLevel = 
                DamagedBookReport.DamageLevel.valueOf(request.getDamageLevel().toUpperCase());

            // ✅ Use admin-entered repair cost
            Double repairCost = request.getRepairCost() != null ? request.getRepairCost() : 0.0;

            DamagedBookReport report = DamagedBookReport.builder()
                .book(borrowRecord.getBook())
                .reportedBy(borrowRecord.getUser())
                .borrowRecord(borrowRecord)
                .damageLevel(damageLevel)
                .damageDescription(request.getDamageDescription())
                .repairCost(repairCost)
                .status(DamagedBookReport.ReportStatus.PENDING)
                .reportDate(LocalDateTime.now())
                .build();

            damagedBookReportRepository.save(report);

            // Reduce total copies for LOST or SEVERE damage
            if (damageLevel == DamagedBookReport.DamageLevel.LOST || 
                damageLevel == DamagedBookReport.DamageLevel.SEVERE) {
                Book book = borrowRecord.getBook();
                if (book.getTotalCopies() > 0) {
                    book.setTotalCopies(book.getTotalCopies() - 1);
                    bookRepository.save(book);
                    log.info("📉 Total copies reduced for {} damage", damageLevel);
                }
            }

            notificationService.sendDamagedBookAlertToAdmins(report);

            log.info("✅ Damage report created successfully");
            return repairCost;
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid damage level. Use: MINOR, MODERATE, SEVERE, LOST");
        }
    }

    @Transactional
    protected void processPayment(BorrowRecord borrowRecord, User user, Book book,
                                   Double penaltyAmount, Double damageAmount, 
                                   ReturnBookRequest request) {
        log.info("💳 Processing payment - Penalty: ₹{}, Damage: ₹{}, Method: {}", 
                penaltyAmount, damageAmount, request.getPaymentMethod());

        // ✅ FIX 1: Create payment for penalty if applicable
        if (penaltyAmount != null && penaltyAmount > 0) {
            Payment penaltyPayment = Payment.builder()
                .borrowRecord(borrowRecord)
                .book(borrowRecord.getBook())
                .user(user)
                .amount(penaltyAmount)
                .paymentType(Payment.PaymentType.PENALTY)
                .paymentMethod(Payment.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()))
                .transactionId(request.getTransactionId())
                .status(Payment.PaymentStatus.COMPLETED)
                .paymentDate(LocalDateTime.now())
                .notes("Late return penalty - " + borrowRecord.getOverdueDays() + " days overdue")
                .build();
            
            paymentRepository.save(penaltyPayment);
            log.info("✅ Penalty payment recorded: ₹{}", penaltyAmount);
        }

        // ✅ FIX 1: Create payment for damage if applicable
        if (damageAmount != null && damageAmount > 0) {
            Payment damagePayment = Payment.builder()
                .borrowRecord(borrowRecord)
                .book(borrowRecord.getBook())
                .user(user)
                .amount(damageAmount)
                .paymentType(Payment.PaymentType.DAMAGE_REPAIR)
                .paymentMethod(Payment.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()))
                .transactionId(request.getTransactionId())
                .status(Payment.PaymentStatus.COMPLETED)
                .paymentDate(LocalDateTime.now())
                .notes("Book damage repair cost - " + request.getDamageLevel())
                .build();
            
            paymentRepository.save(damagePayment);
            log.info("✅ Damage payment recorded: ₹{}", damageAmount);
        }
    }

    public BorrowRecordResponse getBorrowRecordById(Long id) {
        BorrowRecord record = borrowRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow record not found"));
        return mapToResponse(record);
    }

    public Page<BorrowRecordResponse> getBorrowHistory(BorrowHistoryRequest request) {
        Specification<BorrowRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (request.getUserId() != null) {
                predicates.add(cb.equal(root.get("user").get("id"), request.getUserId()));
            }

            if (request.getBookId() != null) {
                predicates.add(cb.equal(root.get("book").get("id"), request.getBookId()));
            }

            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                try {
                    BorrowRecord.BorrowStatus status = BorrowRecord.BorrowStatus.valueOf(request.getStatus());
                    predicates.add(cb.equal(root.get("status"), status));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status filter: {}", request.getStatus());
                }
            }

            if (request.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("borrowDate"), request.getStartDate()));
            }

            if (request.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("borrowDate"), request.getEndDate()));
            }

            if (Boolean.TRUE.equals(request.getOverdueOnly())) {
                predicates.add(cb.equal(root.get("status"), BorrowRecord.BorrowStatus.OVERDUE));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(request.getSortDirection()) ? 
                        Sort.Direction.DESC : Sort.Direction.ASC,
                request.getSortBy() != null ? request.getSortBy() : "borrowDate");

        Pageable pageable = PageRequest.of(
                request.getPage() != null ? request.getPage() : 0, 
                request.getSize() != null ? request.getSize() : 10, 
                sort);

        Page<BorrowRecord> recordPage = borrowRecordRepository.findAll(spec, pageable);
        return recordPage.map(this::mapToResponse);
    }

    public List<BorrowRecordResponse> getActiveBorrowsByUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<BorrowRecord> records = borrowRecordRepository.findActiveBorrowsByUserId(userId);
        
        return records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BorrowRecordResponse> getAllActiveBorrows() {
        List<BorrowRecord> records = borrowRecordRepository.findAllActiveBorrows();
        return records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BorrowRecordResponse> getOverdueBooks() {
        List<BorrowRecord> records = borrowRecordRepository
                .findOverdueRecords(LocalDate.now());

        records.forEach(record -> {
            record.setStatus(BorrowRecord.BorrowStatus.OVERDUE);
            calculatePenaltyForReturn(record, LocalDate.now());
            borrowRecordRepository.save(record);

            try {
                int daysOverdue = record.getOverdueDays() != null ? record.getOverdueDays() : 0;
                notificationService.sendOverdueNotification(
                        record.getUser(),
                        record.getBook(),
                        record.getDueDate(),
                        daysOverdue);
            } catch (Exception e) {
                log.error("Failed to send overdue notification: {}", e.getMessage());
            }
        });

        return records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PenaltyResponse calculatePenalty(Long borrowRecordId) {
        BorrowRecord record = borrowRecordRepository.findById(borrowRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow record not found"));

        // ✅ FIX 2: Calculate current penalty using today's date
        LocalDate today = LocalDate.now();
        if (record.getReturnDate() == null && today.isAfter(record.getDueDate())) {
            long overdueDays = ChronoUnit.DAYS.between(record.getDueDate(), today);
            record.setOverdueDays((int) overdueDays);
            record.setPenaltyAmount(overdueDays * penaltyPerDay);
            borrowRecordRepository.save(record);
        }

        return PenaltyResponse.builder()
                .borrowRecordId(record.getId())
                .bookTitle(record.getBook().getTitle())
                .fullName(record.getUser().getFullName())
                .overdueDays(record.getOverdueDays() != null ? record.getOverdueDays() : 0)
                .penaltyAmount(record.getPenaltyAmount() != null ? record.getPenaltyAmount() : 0.0)
                .penaltyPaid(record.getPenaltyPaid() != null ? record.getPenaltyPaid() : false)
                .message(record.getOverdueDays() != null && record.getOverdueDays() > 0 ? 
                        "Book is overdue by " + record.getOverdueDays() + " days" : "No penalty")
                .build();
    }

    @Transactional
    public BorrowRecordResponse markPenaltyAsPaid(Long borrowRecordId) {
        BorrowRecord record = borrowRecordRepository.findById(borrowRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow record not found"));

        if (record.getPenaltyAmount() == null || record.getPenaltyAmount() <= 0) {
            throw new BadRequestException("No penalty to pay");
        }

        record.setPenaltyPaid(true);
        BorrowRecord savedRecord = borrowRecordRepository.save(record);

        log.info("✅ Penalty marked as paid - Record ID: {}", borrowRecordId);
        return mapToResponse(savedRecord);
    }

    public BorrowStatisticsResponse getStatistics() {
        Long totalBorrowed = borrowRecordRepository.count();
        Long overdueBooks = borrowRecordRepository.countByStatus(BorrowRecord.BorrowStatus.OVERDUE);
        Long totalReturned = borrowRecordRepository.countByStatus(BorrowRecord.BorrowStatus.RETURNED);
        Long availableBooks = bookRepository.countByAvailableCopiesGreaterThan(0);
        Double totalPenalties = borrowRecordRepository.sumPenalties();
        Long activeMembers = userRepository.countActiveMembers();

        return BorrowStatisticsResponse.builder()
                .totalBorrowed(totalBorrowed != null ? totalBorrowed : 0L)
                .overdueBooks(overdueBooks != null ? overdueBooks : 0L)
                .availableBooks(availableBooks != null ? availableBooks : 0L)
                .totalPenalties(totalPenalties != null ? totalPenalties : 0.0)
                .totalReturned(totalReturned != null ? totalReturned : 0L)
                .activeMembers(activeMembers != null ? activeMembers : 0L)
                .build();
    }

    private void validateUser(User user) {
        if (user.getAccountStatus() == null) {
            user.setAccountStatus(User.AccountStatus.ACTIVE);
            userRepository.save(user);
        }

        if (user.getCurrentlyBorrowed() == null) {
            user.setCurrentlyBorrowed(0);
            userRepository.save(user);
        }

        if (user.getMaxBooksAllowed() == null) {
            user.setMaxBooksAllowed(user.getMembershipPlan() != null ? 
                    user.getMembershipPlan().getMaxBooks() : 3);
            userRepository.save(user);
        }

        if (user.getAccountStatus() != User.AccountStatus.ACTIVE) {
            throw new BadRequestException("Account is not active");
        }

        if (user.getMembershipExpiryDate() != null &&
                user.getMembershipExpiryDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Membership expired");
        }

        if (user.getCurrentlyBorrowed() >= user.getMaxBooksAllowed()) {
            throw new BadRequestException("Borrowing limit reached");
        }
    }

    private int getBorrowDays(User user) {
        if (user.getMembershipPlan() != null) {
            return user.getMembershipPlan().getBorrowDays();
        }
        return 14;
    }

    private void checkAndCreateLowStockAlert(Book book) {
        if (book.getAvailableCopies() != null && book.getAvailableCopies() <= lowStockThreshold) {
            if (!lowStockAlertRepository.existsByBookIdAndStatus(
                    book.getId(), LowStockAlert.AlertStatus.ACTIVE)) {

                LowStockAlert alert = LowStockAlert.builder()
                        .book(book)
                        .availableCopies(book.getAvailableCopies())
                        .threshold(lowStockThreshold)
                        .status(LowStockAlert.AlertStatus.ACTIVE)
                        .alertDate(LocalDateTime.now())
                        .build();

                lowStockAlertRepository.save(alert);
                notificationService.sendLowStockAlertToAdmins(book, book.getAvailableCopies());

                log.warn("⚠️ Low stock alert created for book: {}", book.getTitle());
            }
        }
    }

    private BorrowRecordResponse mapToResponse(BorrowRecord record) {
        int daysUntilDue = 0;
        if (record.getReturnDate() == null && record.getDueDate() != null) {
            daysUntilDue = (int) ChronoUnit.DAYS.between(LocalDate.now(), record.getDueDate());
        }

        return BorrowRecordResponse.builder()
                .id(record.getId())
                .userId(record.getUser().getId())
                .fullName(record.getUser().getFullName())
                .email(record.getUser().getEmail())
                .bookId(record.getBook().getId())
                .bookTitle(record.getBook().getTitle())
                .bookAuthor(record.getBook().getAuthor())
                .bookIsbn(record.getBook().getIsbn())
                .borrowDate(record.getBorrowDate())
                .dueDate(record.getDueDate())
                .returnDate(record.getReturnDate())
                .status(record.getStatus().name())
                .overdueDays(record.getOverdueDays() != null ? record.getOverdueDays() : 0)
                .penaltyAmount(record.getPenaltyAmount() != null ? record.getPenaltyAmount() : 0.0)
                .penaltyPaid(record.getPenaltyPaid() != null ? record.getPenaltyPaid() : false)
                .notes(record.getNotes())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .isOverdue(record.isOverdue())
                .daysUntilDue(daysUntilDue)
                .build();
    }
}