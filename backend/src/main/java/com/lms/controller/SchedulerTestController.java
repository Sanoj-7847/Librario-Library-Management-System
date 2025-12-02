package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.service.DueDateReminderScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * ✅ Controller for testing scheduler functionality
 * Admin-only access for testing reminders
 */
@RestController
@RequestMapping("/api/scheduler")
@RequiredArgsConstructor
@Slf4j
public class SchedulerTestController {
    
    private final DueDateReminderScheduler dueDateReminderScheduler;
    
    @PostMapping("/test-reminders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testAllReminders() {
        log.info("🧪 Admin triggered: Manual test of all reminder functions");
        
        try {
            dueDateReminderScheduler.sendTestReminders();
            
            Map<String, Object> result = new HashMap<>();
            result.put("timestamp", LocalDateTime.now());
            result.put("message", "All reminder tests completed successfully");
            result.put("testsRun", new String[]{
                "Due Today Reminders",
                "Due Soon Reminders (2 days)",
                "Overdue Notifications"
            });
            
            log.info("✅ Manual reminder test completed successfully");
            
            return ResponseEntity.ok(
                ApiResponse.success("Reminder tests completed", result)
            );
            
        } catch (Exception e) {
            log.error("❌ Error during manual reminder test: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                ApiResponse.error("Failed to test reminders", e.getMessage())
            );
        }
    }
    
    @PostMapping("/test-due-today")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testDueTodayReminders() {
        log.info("🧪 Admin triggered: Test due today reminders");
        
        try {
            dueDateReminderScheduler.sendDueTodayReminders();
            
            Map<String, Object> result = new HashMap<>();
            result.put("timestamp", LocalDateTime.now());
            result.put("test", "Due Today Reminders");
            result.put("message", "Check logs for detailed results");
            
            return ResponseEntity.ok(
                ApiResponse.success("Due today reminders tested", result)
            );
            
        } catch (Exception e) {
            log.error("❌ Error testing due today reminders: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                ApiResponse.error("Failed to test due today reminders", e.getMessage())
            );
        }
    }
    
    @PostMapping("/test-due-soon")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testDueSoonReminders() {
        log.info("🧪 Admin triggered: Test due soon reminders");
        
        try {
            dueDateReminderScheduler.sendDueSoonReminders();
            
            Map<String, Object> result = new HashMap<>();
            result.put("timestamp", LocalDateTime.now());
            result.put("test", "Due Soon Reminders (2 days)");
            result.put("message", "Check logs for detailed results");
            
            return ResponseEntity.ok(
                ApiResponse.success("Due soon reminders tested", result)
            );
            
        } catch (Exception e) {
            log.error("❌ Error testing due soon reminders: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                ApiResponse.error("Failed to test due soon reminders", e.getMessage())
            );
        }
    }
    
    @PostMapping("/test-overdue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testOverdueNotifications() {
        log.info("🧪 Admin triggered: Test overdue notifications");
        
        try {
            dueDateReminderScheduler.sendOverdueNotifications();
            
            Map<String, Object> result = new HashMap<>();
            result.put("timestamp", LocalDateTime.now());
            result.put("test", "Overdue Notifications");
            result.put("message", "Check logs for detailed results");
            
            return ResponseEntity.ok(
                ApiResponse.success("Overdue notifications tested", result)
            );
            
        } catch (Exception e) {
            log.error("❌ Error testing overdue notifications: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                ApiResponse.error("Failed to test overdue notifications", e.getMessage())
            );
        }
    }
    
    @PostMapping("/update-overdue-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateOverdueStatuses() {
        log.info("🧪 Admin triggered: Manual update of overdue statuses");
        
        try {
            dueDateReminderScheduler.updateOverdueStatusesAndPenalties();
            
            Map<String, Object> result = new HashMap<>();
            result.put("timestamp", LocalDateTime.now());
            result.put("action", "Update Overdue Statuses & Penalties");
            result.put("message", "Check logs for number of records updated");
            
            return ResponseEntity.ok(
                ApiResponse.success("Overdue statuses updated", result)
            );
            
        } catch (Exception e) {
            log.error("❌ Error updating overdue statuses: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                ApiResponse.error("Failed to update overdue statuses", e.getMessage())
            );
        }
    }
    
    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSchedulerStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("timestamp", LocalDateTime.now());
        status.put("scheduler", "DueDateReminderScheduler");
        status.put("status", "RUNNING");
        status.put("schedules", new HashMap<String, String>() {{
            put("dueTodayReminders", "Every day at 8:00 AM");
            put("dueSoonReminders", "Every day at 9:00 AM");
            put("overdueNotifications", "Every day at 10:00 AM");
            put("statusUpdate", "Every day at 11:00 PM");
            put("healthCheck", "Every hour");
        }});
        status.put("testEndpoints", new String[]{
            "POST /api/scheduler/test-reminders",
            "POST /api/scheduler/test-due-today",
            "POST /api/scheduler/test-due-soon",
            "POST /api/scheduler/test-overdue",
            "POST /api/scheduler/update-overdue-status"
        });
        
        return ResponseEntity.ok(
            ApiResponse.success("Scheduler status retrieved", status)
        );
    }
}