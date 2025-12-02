package com.lms.controller;

import com.lms.dto.*;
import com.lms.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {
    
    private final AlertService alertService;
    
    // ==================== LOW STOCK ALERTS ====================
    
    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<LowStockAlertDTO>>> getActiveLowStockAlerts() {
        List<LowStockAlertDTO> alerts = alertService.getActiveLowStockAlerts();
        return ResponseEntity.ok(ApiResponse.success("Active low stock alerts retrieved", alerts));
    }
    
    @PostMapping("/low-stock/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<LowStockAlertDTO>> resolveLowStockAlert(
            @PathVariable Long id,
            @RequestBody ResolveAlertRequest request,
            Authentication authentication) {
        LowStockAlertDTO response = alertService.resolveLowStockAlert(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.success("Alert resolved", response));
    }
    
    // ==================== DAMAGED BOOK REPORTS ====================
    
    // Get all pending damaged book reports (Admin/Librarian)
    @GetMapping("/damaged-books")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<DamagedBookReportDTO>>> getPendingDamagedBookReports() {
        List<DamagedBookReportDTO> reports = alertService.getPendingDamagedBookReports();
        return ResponseEntity.ok(ApiResponse.success("Pending damaged book reports retrieved", reports));
    }
    
    // Get all damaged book reports (Admin/Librarian)
    @GetMapping("/damaged-books/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<DamagedBookReportDTO>>> getAllDamagedBookReports() {
        List<DamagedBookReportDTO> reports = alertService.getAllDamagedBookReports();
        return ResponseEntity.ok(ApiResponse.success("All damaged book reports retrieved", reports));
    }
    
    // Get my damaged book reports (Member)
    @GetMapping("/damaged-books/my-reports")
    @PreAuthorize("hasAnyRole('MEMBER', 'ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<DamagedBookReportDTO>>> getMyDamagedBookReports(
            Authentication authentication) {
        List<DamagedBookReportDTO> reports = alertService.getMyDamagedBookReports(authentication);
        return ResponseEntity.ok(ApiResponse.success("Your damaged book reports retrieved", reports));
    }
    
    // Report a damaged book (Any authenticated user)
    @PostMapping("/damaged-books")
    @PreAuthorize("hasAnyRole('MEMBER', 'ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<DamagedBookReportDTO>> reportDamagedBook(
            @RequestBody ReportDamagedBookRequest request,
            Authentication authentication) {
        DamagedBookReportDTO response = alertService.reportDamagedBook(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Damaged book report created", response));
    }
    
    // Process damaged book report (Admin/Librarian)
    @PostMapping("/damaged-books/{id}/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<DamagedBookReportDTO>> processDamagedBookReport(
            @PathVariable Long id,
            @RequestBody ProcessDamagedBookRequest request,
            Authentication authentication) {
        DamagedBookReportDTO response = alertService.processDamagedBookReport(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.success("Report processed", response));
    }
    
    // Delete damaged book report (Admin only)
    @DeleteMapping("/damaged-books/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDamagedBookReport(@PathVariable Long id) {
        alertService.deleteDamagedBookReport(id);
        return ResponseEntity.ok(ApiResponse.success("Report deleted successfully", null));
    }
}