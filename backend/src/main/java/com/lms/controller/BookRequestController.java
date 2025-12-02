package com.lms.controller;

import com.lms.dto.*;
import com.lms.entity.User;
import com.lms.service.BookRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/book-requests")
@RequiredArgsConstructor
@Slf4j
public class BookRequestController {

    private final BookRequestService bookRequestService;

    // Member: Create book request
    @PostMapping
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<BookRequestDTO>> createRequest(
            @RequestBody BookRequestRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        BookRequestDTO response = bookRequestService.createRequest(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Book request created successfully", response));
    }

    // Member: Get my requests
    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<List<BookRequestDTO>>> getMyRequests(
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<BookRequestDTO> requests = bookRequestService.getMyRequests(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Your requests retrieved", requests));
    }

    // Member: Cancel my request
    @DeleteMapping("/{id}/cancel")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(
            @PathVariable Long id,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        bookRequestService.cancelRequest(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Request cancelled", null));
    }

    // Admin/Librarian: Get all pending requests
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<BookRequestDTO>>> getPendingRequests() {
        List<BookRequestDTO> requests = bookRequestService.getPendingRequests();
        return ResponseEntity.ok(ApiResponse.success("Pending requests retrieved", requests));
    }

    // Admin/Librarian: Get all requests
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<BookRequestDTO>>> getAllRequests() {
        List<BookRequestDTO> requests = bookRequestService.getAllRequests();
        return ResponseEntity.ok(ApiResponse.success("All requests retrieved", requests));
    }

    // Admin/Librarian: Process request (approve/reject)
    @PostMapping("/{id}/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<BookRequestDTO>> processRequest(
            @PathVariable Long id,
            @RequestBody ProcessRequestDTO processDTO,
            Authentication authentication) {
        User admin = (User) authentication.getPrincipal();
        processDTO.setRequestId(id);
        BookRequestDTO response = bookRequestService.processRequest(id, processDTO, admin);
        return ResponseEntity.ok(ApiResponse.success("Request processed successfully", response));
    }
}