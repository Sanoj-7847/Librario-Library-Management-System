package com.lms.controller;

import com.lms.dto.*;
import com.lms.service.BorrowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.lms.entity.User;
import java.util.List;

@RestController
@RequestMapping("/api/borrow")
@RequiredArgsConstructor
public class BorrowController {
    
    private final BorrowService borrowService;
    
    // Issue a book (Admin & Librarian only)
    @PostMapping("/issue")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> borrowBook(
            @Valid @RequestBody BorrowBookRequest request) {
        BorrowRecordResponse response = borrowService.borrowBook(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Book issued successfully", response));
    }
    
    // Return a book (Admin & Librarian only)
    @PostMapping("/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> returnBook(
            @Valid @RequestBody ReturnBookRequest request) {
        BorrowRecordResponse response = borrowService.returnBook(request);
        return ResponseEntity.ok(ApiResponse.success("Book returned successfully", response));
    }
    
    // Get borrow record by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> getBorrowRecordById(
            @PathVariable Long id) {
        BorrowRecordResponse response = borrowService.getBorrowRecordById(id);
        return ResponseEntity.ok(ApiResponse.success("Borrow record retrieved", response));
    }
    
    // Get borrow history with pagination (Admin & Librarian)
    @PostMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<Page<BorrowRecordResponse>>> getBorrowHistory(
            @RequestBody BorrowHistoryRequest request) {
        Page<BorrowRecordResponse> history = borrowService.getBorrowHistory(request);
        return ResponseEntity.ok(ApiResponse.success("Borrow history retrieved", history));
    }
    
    // Get MY borrow history (Current logged-in user)
    @GetMapping("/my-history")
    public ResponseEntity<ApiResponse<List<BorrowRecordResponse>>> getMyBorrowHistory(
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<BorrowRecordResponse> records = borrowService.getActiveBorrowsByUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Your borrow history retrieved", records));
    }
    
    // Get active borrows by user ID (Admin & Librarian)
    @GetMapping("/user/{userId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<BorrowRecordResponse>>> getActiveBorrowsByUser(
            @PathVariable Long userId) {
        List<BorrowRecordResponse> records = borrowService.getActiveBorrowsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Active borrows retrieved", records));
    }
    
    // Get all active borrows (Admin & Librarian)
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<BorrowRecordResponse>>> getAllActiveBorrows() {
        List<BorrowRecordResponse> records = borrowService.getAllActiveBorrows();
        return ResponseEntity.ok(ApiResponse.success("All active borrows retrieved", records));
    }
    
    // Get overdue books (Admin & Librarian)
    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<BorrowRecordResponse>>> getOverdueBooks() {
        List<BorrowRecordResponse> records = borrowService.getOverdueBooks();
        return ResponseEntity.ok(ApiResponse.success("Overdue books retrieved", records));
    }
    
    // Calculate penalty for a borrow record
    @GetMapping("/{id}/penalty")
    public ResponseEntity<ApiResponse<PenaltyResponse>> calculatePenalty(
            @PathVariable Long id) {
        PenaltyResponse response = borrowService.calculatePenalty(id);
        return ResponseEntity.ok(ApiResponse.success("Penalty calculated", response));
    }
    
    // Mark penalty as paid (Admin & Librarian)
    @PatchMapping("/{id}/penalty/paid")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> markPenaltyAsPaid(
            @PathVariable Long id) {
        BorrowRecordResponse response = borrowService.markPenaltyAsPaid(id);
        return ResponseEntity.ok(ApiResponse.success("Penalty marked as paid", response));
    }
    
    // Get statistics (Admin & Librarian)
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<BorrowStatisticsResponse>> getStatistics() {
        BorrowStatisticsResponse stats = borrowService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success("Statistics retrieved", stats));
    }
}