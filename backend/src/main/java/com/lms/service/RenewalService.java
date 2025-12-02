package com.lms.service;

import com.lms.dto.*;
import com.lms.entity.*;
import com.lms.exception.BadRequestException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RenewalService {

    private final RenewalRequestRepository renewalRequestRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    // ==================== MEMBER ====================

    @Transactional
    public RenewalRequestDTO createRenewalRequest(Long userId, RenewalRequestRequest request) {
        log.info("Creating renewal request for user: {}, borrow record: {}", userId, request.getBorrowRecordId());

        BorrowRecord borrowRecord = borrowRecordRepository.findById(request.getBorrowRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Borrow record not found"));

        if (!borrowRecord.getUser().getId().equals(userId)) {
            throw new BadRequestException("This borrow record does not belong to you");
        }
        if (borrowRecord.getStatus() == BorrowRecord.BorrowStatus.RETURNED) {
            throw new BadRequestException("Book is already returned");
        }
        if (borrowRecord.getStatus() == BorrowRecord.BorrowStatus.OVERDUE) {
            throw new BadRequestException("Cannot renew overdue books. Please return the book first.");
        }
        if (renewalRequestRepository.existsByBorrowRecordIdAndStatus(
                borrowRecord.getId(), RenewalRequest.RenewalStatus.PENDING)) {
            throw new BadRequestException("A renewal request is already pending for this book");
        }

        if (borrowRecord.getBook().getAvailableCopies() <= 0) {
            throw new BadRequestException("Book is not available for renewal (high demand)");
        }

        User user = borrowRecord.getUser();
        Book book = borrowRecord.getBook();

        int renewalDays = request.getRenewalDays() != null
                ? request.getRenewalDays()
                : user.getMembershipPlan().getBorrowDays();
        LocalDate requestedDueDate = borrowRecord.getDueDate().plusDays(renewalDays);

        RenewalRequest renewalRequest = RenewalRequest.builder()
                .borrowRecord(borrowRecord)
                .user(user)
                .book(book)
                .status(RenewalRequest.RenewalStatus.PENDING)
                .currentDueDate(borrowRecord.getDueDate())
                .requestedDueDate(requestedDueDate)
                .renewalDays(renewalDays)
                .requestDate(LocalDate.now())
                .reason(request.getReason())
                .build();

        renewalRequest = renewalRequestRepository.save(renewalRequest);
        notificationService.notifyAdminsAboutRenewalRequest(renewalRequest);

        return mapToDTO(renewalRequest);
    }

    // ✅ DESC ORDER for member’s requests
    public List<RenewalRequestDTO> getMyRenewalRequests(Long userId) {
        return renewalRequestRepository.findByUserIdOrderByRequestDateDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<RenewalRequestDTO> getPendingRenewalRequests() {
        return renewalRequestRepository.findAllPendingRequests()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ✅ DESC ORDER for admin/librarian “All Renewal History”
    public List<RenewalRequestDTO> getAllRenewalRequests() {
        return renewalRequestRepository.findAll(Sort.by(Sort.Direction.DESC, "requestDate"))
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ✅ DESC ORDER for status-filtered renewals
    public List<RenewalRequestDTO> getRenewalRequestsByStatus(String status) {
        RenewalRequest.RenewalStatus renewalStatus =
                RenewalRequest.RenewalStatus.valueOf(status.toUpperCase());
        return renewalRequestRepository.findByStatusOrderByRequestDateDesc(renewalStatus)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ==================== ADMIN / LIBRARIAN ====================

    @Transactional
    public RenewalRequestDTO processRenewalRequest(Long requestId, ProcessRenewalRequest request, User admin) {
        log.info("Processing renewal request: {} by {}", requestId, admin.getEmail());

        RenewalRequest renewalRequest = renewalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Renewal request not found"));

        if (renewalRequest.getStatus() != RenewalRequest.RenewalStatus.PENDING) {
            throw new BadRequestException("Request already processed");
        }

        if ("APPROVE".equalsIgnoreCase(request.getAction())) {
            return approveRenewal(renewalRequest, admin, request);
        } else if ("REJECT".equalsIgnoreCase(request.getAction())) {
            return rejectRenewal(renewalRequest, admin, request.getAdminNotes());
        } else {
            throw new BadRequestException("Invalid action. Use APPROVE or REJECT");
        }
    }

    @Transactional
    protected RenewalRequestDTO approveRenewal(RenewalRequest renewalRequest, User admin,
                                               ProcessRenewalRequest request) {
        BorrowRecord borrowRecord = renewalRequest.getBorrowRecord();

        if (borrowRecord.getBook().getAvailableCopies() <= 0) {
            throw new BadRequestException("Book no longer available for renewal");
        }

        LocalDate oldDueDate = borrowRecord.getDueDate();
        int renewalDays = request.getRenewalDays() != null
                ? request.getRenewalDays()
                : renewalRequest.getRenewalDays();
        LocalDate newDueDate = oldDueDate.plusDays(renewalDays);

        borrowRecord.setDueDate(newDueDate);
        borrowRecord.setUpdatedAt(LocalDateTime.now());
        borrowRecordRepository.save(borrowRecord);

        renewalRequest.setStatus(RenewalRequest.RenewalStatus.APPROVED);
        renewalRequest.setNewDueDate(newDueDate);
        renewalRequest.setRenewalDays(renewalDays);
        renewalRequest.setProcessedBy(admin);
        renewalRequest.setProcessedDate(LocalDateTime.now());
        renewalRequest.setAdminNotes(request.getAdminNotes());
        renewalRequestRepository.save(renewalRequest);

        notificationService.sendRenewalApprovedNotification(
                renewalRequest.getUser(),
                renewalRequest.getBook(),
                oldDueDate,
                newDueDate,
                renewalDays
        );

        return mapToDTO(renewalRequest);
    }

    @Transactional
    protected RenewalRequestDTO rejectRenewal(RenewalRequest renewalRequest, User admin, String adminNotes) {
        renewalRequest.setStatus(RenewalRequest.RenewalStatus.REJECTED);
        renewalRequest.setProcessedBy(admin);
        renewalRequest.setProcessedDate(LocalDateTime.now());
        renewalRequest.setAdminNotes(
                adminNotes != null && !adminNotes.trim().isEmpty() ? adminNotes : "Request rejected");
        renewalRequestRepository.save(renewalRequest);

        notificationService.sendRenewalRejectedNotification(
                renewalRequest.getUser(),
                renewalRequest.getBook(),
                adminNotes);

        return mapToDTO(renewalRequest);
    }

    @Transactional
    public void cancelRenewalRequest(Long requestId, Long userId) {
        RenewalRequest renewalRequest = renewalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Renewal request not found"));

        if (!renewalRequest.getUser().getId().equals(userId)) {
            throw new BadRequestException("Not authorized to cancel this request");
        }

        if (renewalRequest.getStatus() != RenewalRequest.RenewalStatus.PENDING) {
            throw new BadRequestException("Can only cancel pending requests");
        }

        renewalRequestRepository.delete(renewalRequest);
        log.info("Renewal request cancelled by user {}", userId);
    }

    private RenewalRequestDTO mapToDTO(RenewalRequest request) {
        return RenewalRequestDTO.builder()
                .id(request.getId())
                .borrowRecordId(request.getBorrowRecord().getId())
                .userId(request.getUser().getId())
                .userFullName(request.getUser().getFullName())
                .userEmail(request.getUser().getEmail())
                .bookId(request.getBook().getId())
                .bookTitle(request.getBook().getTitle())
                .bookAuthor(request.getBook().getAuthor())
                .status(request.getStatus().name())
                .currentDueDate(request.getCurrentDueDate())
                .requestedDueDate(request.getRequestedDueDate())
                .newDueDate(request.getNewDueDate())
                .renewalDays(request.getRenewalDays())
                .requestDate(request.getRequestDate())
                .reason(request.getReason())
                .adminNotes(request.getAdminNotes())
                .processedBy(request.getProcessedBy() != null ? request.getProcessedBy().getId() : null)
                .processedByName(request.getProcessedBy() != null ? request.getProcessedBy().getFullName() : null)
                .processedDate(request.getProcessedDate())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
