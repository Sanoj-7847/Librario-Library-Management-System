package com.lms.controller;

import com.lms.dto.*;
import com.lms.entity.User;
import com.lms.service.RenewalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/renewals")
@RequiredArgsConstructor
public class RenewalController {

    private final RenewalService renewalService;

    // ==================== MEMBER ENDPOINTS ====================

    // Create renewal request
    @PostMapping
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<RenewalRequestDTO>> createRenewalRequest(
            @RequestBody RenewalRequestRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        RenewalRequestDTO response = renewalService.createRenewalRequest(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Renewal request created", response));
    }

    // Get all my renewal requests (DESC)
    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<List<RenewalRequestDTO>>> getMyRenewalRequests(
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<RenewalRequestDTO> requests = renewalService.getMyRenewalRequests(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Your renewal requests retrieved", requests));
    }

    // Cancel renewal request
    @DeleteMapping("/{id}/cancel")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<Void>> cancelRenewalRequest(
            @PathVariable Long id,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        renewalService.cancelRenewalRequest(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Renewal request cancelled", null));
    }

    // ==================== ADMIN / LIBRARIAN ENDPOINTS ====================

    // Get pending renewal requests
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<RenewalRequestDTO>>> getPendingRenewalRequests() {
        List<RenewalRequestDTO> requests = renewalService.getPendingRenewalRequests();
        return ResponseEntity.ok(ApiResponse.success("Pending renewal requests retrieved", requests));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<RenewalRequestDTO>>> getAllRenewalRequests() {
        List<RenewalRequestDTO> requests = renewalService.getAllRenewalRequests();
        return ResponseEntity.ok(ApiResponse.success("All renewal requests retrieved", requests));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<RenewalRequestDTO>>> getRenewalRequestsByStatus(
            @PathVariable String status) {
        List<RenewalRequestDTO> requests = renewalService.getRenewalRequestsByStatus(status.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success(
                "Renewal requests with status " + status + " retrieved", requests));
    }

    // Process renewal request (approve/reject)
    @PostMapping("/{id}/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<RenewalRequestDTO>> processRenewalRequest(
            @PathVariable Long id,
            @RequestBody ProcessRenewalRequest request,
            Authentication authentication) {
        User admin = (User) authentication.getPrincipal();
        RenewalRequestDTO response = renewalService.processRenewalRequest(id, request, admin);
        return ResponseEntity.ok(ApiResponse.success("Renewal request processed", response));
    }
}
