package com.lms.service;

import com.lms.dto.*;
import com.lms.entity.*;
import com.lms.entity.BookRequest;
import com.lms.exception.BadRequestException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookRequestService {

    private final BookRequestRepository bookRequestRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final NotificationRepository notificationRepository;

    @Transactional
    public BookRequestDTO createRequest(Long userId, BookRequestRequest request) {
        log.info("🔍 Creating book request - userId: {}, bookId: {}", userId, request.getBookId());

        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            Book book = bookRepository.findById(request.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

            // ========== VALIDATION ==========
            validateBookRequest(user, book);

            // ========== CREATE REQUEST ==========
            BookRequest bookRequest = BookRequest.builder()
                    .user(user)
                    .book(book)
                    .status(BookRequest.RequestStatus.PENDING)
                    .requestDate(LocalDate.now())
                    .notes(request.getNotes())
                    .build();

            bookRequest = bookRequestRepository.save(bookRequest);

            log.info("✅ Book request created successfully - ID: {}", bookRequest.getId());
            return mapToDTO(bookRequest);

        } catch (BadRequestException | ResourceNotFoundException e) {
            log.error("❌ Validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected error creating request", e);
            throw new RuntimeException("Failed to create book request: " + e.getMessage());
        }
    }

    @Transactional
    public BookRequestDTO processRequest(Long requestId, ProcessRequestDTO processDTO, User admin) {
        log.info("🔄 Processing book request: {} by admin: {}", requestId, admin.getEmail());

        try {
            BookRequest request = bookRequestRepository.findById(requestId)
                    .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

            if (request.getStatus() != BookRequest.RequestStatus.PENDING) {
                throw new BadRequestException("Request already processed with status: " + request.getStatus());
            }

            if ("APPROVE".equalsIgnoreCase(processDTO.getAction())) {
                return approveRequest(request, admin, processDTO.getAdminNotes());
            } else if ("REJECT".equalsIgnoreCase(processDTO.getAction())) {
                return rejectRequest(request, admin, processDTO.getAdminNotes());
            } else {
                throw new BadRequestException("Invalid action. Use APPROVE or REJECT");
            }

        } catch (BadRequestException | ResourceNotFoundException e) {
            log.error("❌ Processing error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected error processing request", e);
            throw new RuntimeException("Failed to process request: " + e.getMessage());
        }
    }

    @Transactional
    protected BookRequestDTO approveRequest(BookRequest request, User admin, String adminNotes) {
        User user = request.getUser();
        Book book = request.getBook();

        log.info("✅ Approving request - ID: {}, User: {}, Book: {}", 
                request.getId(), user.getEmail(), book.getTitle());

        // ========== FINAL VALIDATION ==========
        if (book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            throw new BadRequestException("Book is no longer available");
        }

        // Check current borrow count
        Long currentBorrows = borrowRecordRepository.countActiveBorrowsByUserId(user.getId());
        if (currentBorrows != null && user.getMaxBooksAllowed() != null && 
                currentBorrows >= user.getMaxBooksAllowed()) {
            throw new BadRequestException("User has reached borrowing limit");
        }

        // ========== CREATE BORROW RECORD ==========
        BorrowRecord borrowRecord = new BorrowRecord();
        borrowRecord.setUser(user);
        borrowRecord.setBook(book);
        borrowRecord.setBorrowDate(LocalDate.now());

        int borrowDays = user.getMembershipPlan() != null ? 
                user.getMembershipPlan().getBorrowDays() : 14;
        borrowRecord.setDueDate(LocalDate.now().plusDays(borrowDays));
        borrowRecord.setStatus(BorrowRecord.BorrowStatus.ISSUED);
        borrowRecord.setNotes("Approved from request #" + request.getId());
        borrowRecord.setOverdueDays(0);
        borrowRecord.setPenaltyAmount(0.0);
        borrowRecord.setPenaltyPaid(false);

        // ========== UPDATE BOOK AND USER ==========
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        
        Integer currentlyBorrowed = user.getCurrentlyBorrowed() != null ? 
                user.getCurrentlyBorrowed() : 0;
        user.setCurrentlyBorrowed(currentlyBorrowed + 1);

        bookRepository.save(book);
        userRepository.save(user);
        borrowRecordRepository.save(borrowRecord);

        // ========== UPDATE REQUEST STATUS ==========
        request.setStatus(BookRequest.RequestStatus.APPROVED);
        request.setProcessedBy(admin);
        request.setProcessedDate(LocalDateTime.now());
        request.setAdminNotes(adminNotes != null && !adminNotes.isEmpty() ? 
                adminNotes : "Request approved");

        request = bookRequestRepository.save(request);

        // ========== SEND NOTIFICATION ==========
        try {
            notificationService.sendBookIssuedNotification(user, book, borrowRecord.getDueDate());
        } catch (Exception e) {
            log.error("❌ Failed to send notification", e);
        }

        log.info("✅ Request approved and book issued successfully");
        return mapToDTO(request);
    }

    @Transactional
    protected BookRequestDTO rejectRequest(BookRequest request, User admin, String adminNotes) {
        User user = request.getUser();
        Book book = request.getBook();

        log.info("❌ Rejecting request - ID: {}, User: {}, Book: {}", 
                request.getId(), user.getEmail(), book.getTitle());

        // ========== UPDATE REQUEST STATUS ==========
        request.setStatus(BookRequest.RequestStatus.REJECTED);
        request.setProcessedBy(admin);
        request.setProcessedDate(LocalDateTime.now());
        request.setAdminNotes(adminNotes != null && !adminNotes.trim().isEmpty() ?
                adminNotes : "Request rejected by admin");

        request = bookRequestRepository.save(request);

        // ========== SEND REJECTION NOTIFICATION ==========
        try {
            sendRejectionNotification(user, book, adminNotes);
        } catch (Exception e) {
            log.error("❌ Failed to send rejection notification", e);
        }

        log.info("✅ Request rejected successfully");
        return mapToDTO(request);
    }

    public List<BookRequestDTO> getPendingRequests() {
        return bookRequestRepository.findAllPendingRequests()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<BookRequestDTO> getMyRequests(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return bookRequestRepository.findByUserIdOrderByRequestDateDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<BookRequestDTO> getAllRequests() {
        return bookRequestRepository.findAllOrderByRequestDateDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelRequest(Long requestId, Long userId) {
        BookRequest request = bookRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getUser().getId().equals(userId)) {
            throw new BadRequestException("Not authorized to cancel this request");
        }

        if (request.getStatus() != BookRequest.RequestStatus.PENDING) {
            throw new BadRequestException("Can only cancel pending requests");
        }

        request.setStatus(BookRequest.RequestStatus.CANCELLED);
        bookRequestRepository.save(request);

        log.info("🚫 Request cancelled by user - ID: {}", requestId);
    }

    // ==================== HELPER METHODS ====================

    private void validateBookRequest(User user, Book book) {
        // Validate user account status
        if (user.getAccountStatus() == null) {
            user.setAccountStatus(User.AccountStatus.ACTIVE);
            userRepository.save(user);
        }

        if (user.getAccountStatus() != User.AccountStatus.ACTIVE) {
            throw new BadRequestException("Account is not active");
        }

        // Validate borrowing limit
        Integer currentlyBorrowed = user.getCurrentlyBorrowed() != null ? 
                user.getCurrentlyBorrowed() : 0;
        Integer maxAllowed = user.getMaxBooksAllowed() != null ? 
                user.getMaxBooksAllowed() : 3;

        if (currentlyBorrowed >= maxAllowed) {
            throw new BadRequestException("Borrowing limit reached");
        }

        // Validate book availability
        if (book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            throw new BadRequestException("Book is not available");
        }

        // Check for pending request
        if (bookRequestRepository.existsByUserAndBookAndStatus(
                user, book, BookRequest.RequestStatus.PENDING)) {
            throw new BadRequestException("You already have a pending request for this book");
        }

        // Check for active borrow - FIXED: using proper method signature
        if (borrowRecordRepository.existsByUserAndBookAndStatus(
                user, book, BorrowRecord.BorrowStatus.ISSUED)) {
            throw new BadRequestException("You already have this book borrowed");
        }
    }

    private void sendRejectionNotification(User user, Book book, String adminNotes) {
        // Create in-app notification
        Notification notification = Notification.builder()
                .user(user)
                .title("Book Request Rejected")
                .message(String.format("Your request for '%s' has been rejected. Reason: %s",
                        book.getTitle(),
                        adminNotes != null && !adminNotes.trim().isEmpty() ? 
                                adminNotes : "No reason provided"))
                .type(Notification.NotificationType.GENERAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);

        // Send email notification
        String subject = "Book Request Rejected - Librario";
        String emailBody = String.format(
                "Dear %s,\n\n" +
                        "We regret to inform you that your request for the following book has been rejected:\n\n" +
                        "Book Title: %s\n" +
                        "Author: %s\n" +
                        "ISBN: %s\n\n" +
                        "Reason for Rejection:\n%s\n\n" +
                        "If you believe this decision was made in error or need clarification, " +
                        "please contact the library administration.\n\n" +
                        "You can still browse and request other available books from our collection.\n\n" +
                        "Thank you for your understanding.\n\n" +
                        "Best regards,\n" +
                        "Librario Team",
                user.getFullName(),
                book.getTitle(),
                book.getAuthor(),
                book.getIsbn() != null ? book.getIsbn() : "N/A",
                adminNotes != null && !adminNotes.trim().isEmpty() ? 
                        adminNotes : "No specific reason provided");

        try {
            emailService.sendNotificationEmail(user.getEmail(), subject, emailBody);
            log.info("📧 Rejection email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("❌ Failed to send rejection email to: {}", user.getEmail(), e);
        }
    }

    private BookRequestDTO mapToDTO(BookRequest request) {
        return BookRequestDTO.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .userFullName(request.getUser().getFullName())
                .userEmail(request.getUser().getEmail())
                .bookId(request.getBook().getId())
                .bookTitle(request.getBook().getTitle())
                .bookAuthor(request.getBook().getAuthor())
                .bookIsbn(request.getBook().getIsbn())
                .status(request.getStatus().name())
                .requestDate(request.getRequestDate())
                .notes(request.getNotes())
                .adminNotes(request.getAdminNotes())
                .processedBy(request.getProcessedBy() != null ? 
                        request.getProcessedBy().getId() : null)
                .processedByName(request.getProcessedBy() != null ? 
                        request.getProcessedBy().getFullName() : null)
                .processedDate(request.getProcessedDate())
                .createdAt(request.getCreatedAt())
                .build();
    }
}