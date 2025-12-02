package com.lms.service;

import com.lms.entity.BorrowRecord;
import com.lms.repository.BorrowRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * ✅ FIXED: Scheduled service to send due date reminders
 * - Sends reminders 2 days before the due date
 * - Sends reminders on the due date (today)
 * - Sends overdue notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DueDateReminderScheduler {

    private final BorrowRecordRepository borrowRecordRepository;
    private final NotificationService notificationService;

    /**
     * ✅ FIXED: Send reminders for books due TODAY
     * Runs every day at 8:00 AM
     * Cron: 0 0 8 * * * = Every day at 8:00 AM (Server Time)
    *
    * For Testing: configure a short cron in your local/dev environment
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendDueTodayReminders() {
        try {
            log.info("⚠️ ==================== STARTING DUE TODAY REMINDER CHECK ====================");
            
            LocalDate today = LocalDate.now();
            log.info("📅 Today's date: {}", today);
            
            // Find all active borrow records due today
            List<BorrowRecord> recordsDueToday = borrowRecordRepository.findRecordsDueOnDate(today);
            
            if (recordsDueToday.isEmpty()) {
                log.info("✅ No books due today. No reminders to send.");
                log.info("==================== DUE TODAY REMINDER CHECK COMPLETE ====================");
                return;
            }
            
            log.info("📧 Found {} book(s) due TODAY. Sending urgent reminders...", recordsDueToday.size());
            
            int successCount = 0;
            int failureCount = 0;
            
            for (BorrowRecord record : recordsDueToday) {
                try {
                    log.info("📨 Sending due today reminder to: {} for book: {}", 
                        record.getUser().getEmail(), 
                        record.getBook().getTitle());
                    
                    notificationService.sendDueDateReminderNotification(
                        record.getUser(),
                        record.getBook(),
                        record.getDueDate(),
                        0 // Due today
                    );
                    
                    successCount++;
                    log.info("✅ Reminder sent successfully to: {}", record.getUser().getEmail());
                    
                } catch (Exception e) {
                    failureCount++;
                    log.error("❌ Failed to send reminder to: {} for book: {}", 
                        record.getUser().getEmail(), 
                        record.getBook().getTitle(), 
                        e);
                }
            }
            
            log.info("✅ Due today reminder check completed. Success: {}, Failed: {}", successCount, failureCount);
            log.info("==================== DUE TODAY REMINDER CHECK COMPLETE ====================");
            
        } catch (Exception e) {
            log.error("❌ ERROR during due today reminder check: {}", e.getMessage(), e);
        }
    }
    
    /**
     * ✅ FIXED: Send reminders for books due in 2 DAYS
     * Runs every day at 9:00 AM
     * Cron: 0 0 9 * * * = Every day at 9:00 AM (Server Time)
    *
    * For Testing: configure a short cron in your local/dev environment
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendDueSoonReminders() {
        try {
            log.info("📅 ==================== STARTING DUE SOON REMINDER CHECK ====================");
            
            LocalDate today = LocalDate.now();
            LocalDate twoDaysFromNow = today.plusDays(2);
            
            log.info("📅 Today: {}", today);
            log.info("📅 Target date (2 days from now): {}", twoDaysFromNow);
            
            // Find all active borrow records due in 2 days
            List<BorrowRecord> recordsDueSoon = borrowRecordRepository.findRecordsDueOnDate(twoDaysFromNow);
            
            if (recordsDueSoon.isEmpty()) {
                log.info("✅ No books due in 2 days. No reminders to send.");
                log.info("==================== DUE SOON REMINDER CHECK COMPLETE ====================");
                return;
            }
            
            log.info("📧 Found {} book(s) due in 2 days. Sending reminders...", recordsDueSoon.size());
            
            int successCount = 0;
            int failureCount = 0;
            
            for (BorrowRecord record : recordsDueSoon) {
                try {
                    log.info("📨 Sending due soon reminder to: {} for book: {} (Due: {})", 
                        record.getUser().getEmail(), 
                        record.getBook().getTitle(),
                        record.getDueDate());
                    
                    notificationService.sendDueDateReminderNotification(
                        record.getUser(),
                        record.getBook(),
                        record.getDueDate(),
                        2 // 2 days remaining
                    );
                    
                    successCount++;
                    log.info("✅ Reminder sent successfully to: {}", record.getUser().getEmail());
                    
                } catch (Exception e) {
                    failureCount++;
                    log.error("❌ Failed to send reminder to: {} for book: {}", 
                        record.getUser().getEmail(), 
                        record.getBook().getTitle(), 
                        e);
                }
            }
            
            log.info("✅ Due soon reminder check completed. Success: {}, Failed: {}", successCount, failureCount);
            log.info("==================== DUE SOON REMINDER CHECK COMPLETE ====================");
            
        } catch (Exception e) {
            log.error("❌ ERROR during due soon reminder check: {}", e.getMessage(), e);
        }
    }
    
    /**
     * ✅ FIXED: Send overdue notifications for books that are past due date
     * Runs every day at 10:00 AM
     * Cron: 0 0 10 * * * = Every day at 10:00 AM (Server Time)
    *
    * For Testing: configure a short cron in your local/dev environment
     */
    @Scheduled(cron = "0 0 10 * * *")
    @Transactional
    public void sendOverdueNotifications() {
        try {
            log.info("🚨 ==================== STARTING OVERDUE CHECK ====================");
            
            LocalDate today = LocalDate.now();
            log.info("📅 Today's date: {}", today);
            
            // Find all overdue records (due date < today AND not returned)
            List<BorrowRecord> overdueRecords = borrowRecordRepository.findOverdueRecords(today);
            
            if (overdueRecords.isEmpty()) {
                log.info("✅ No overdue books found.");
                log.info("==================== OVERDUE CHECK COMPLETE ====================");
                return;
            }
            
            log.info("🚨 Found {} overdue book(s). Sending notifications...", overdueRecords.size());
            
            int successCount = 0;
            int failureCount = 0;
            
            for (BorrowRecord record : overdueRecords) {
                try {
                    // Calculate days overdue
                    long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(
                        record.getDueDate(), 
                        today
                    );
                    
                    // Skip if already returned
                    if (record.getReturnDate() != null) {
                        log.debug("⏭️ Skipping already returned book: {}", record.getBook().getTitle());
                        continue;
                    }
                    
                    log.info("📨 Sending overdue notification to: {} for book: {} ({} days overdue)", 
                        record.getUser().getEmail(), 
                        record.getBook().getTitle(),
                        daysOverdue);
                    
                    // Update status to OVERDUE if not already
                    if (record.getStatus() != BorrowRecord.BorrowStatus.OVERDUE) {
                        record.setStatus(BorrowRecord.BorrowStatus.OVERDUE);
                        record.setOverdueDays((int) daysOverdue);
                        // Calculate current penalty
                        double penalty = daysOverdue * 15.0; // ₹15 per day
                        record.setPenaltyAmount(penalty);
                        borrowRecordRepository.save(record);
                        log.info("📊 Updated record status to OVERDUE. Penalty: ₹{}", penalty);
                    }
                    
                    notificationService.sendOverdueNotification(
                        record.getUser(),
                        record.getBook(),
                        record.getDueDate(),
                        (int) daysOverdue
                    );
                    
                    successCount++;
                    log.info("✅ Overdue notification sent to: {}", record.getUser().getEmail());
                    
                } catch (Exception e) {
                    failureCount++;
                    log.error("❌ Failed to send overdue notification to: {} for book: {}", 
                        record.getUser().getEmail(), 
                        record.getBook().getTitle(), 
                        e);
                }
            }
            
            log.info("✅ Overdue check completed. Success: {}, Failed: {}", successCount, failureCount);
            log.info("==================== OVERDUE CHECK COMPLETE ====================");
            
        } catch (Exception e) {
            log.error("❌ ERROR during overdue check: {}", e.getMessage(), e);
        }
    }
    
    /**
     * ✅ NEW: Update all overdue statuses and penalties
     * Runs every day at 11:00 PM (end of day)
     * Cron: 0 0 23 * * * = Every day at 11:00 PM
     */
    @Scheduled(cron = "0 0 23 * * *")
    @Transactional
    public void updateOverdueStatusesAndPenalties() {
        try {
            log.info("🔄 ==================== UPDATING OVERDUE STATUSES & PENALTIES ====================");
            
            LocalDate today = LocalDate.now();
            List<BorrowRecord> overdueRecords = borrowRecordRepository.findOverdueRecords(today);
            
            int updateCount = 0;
            
            for (BorrowRecord record : overdueRecords) {
                if (record.getReturnDate() == null) {
                    long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(
                        record.getDueDate(), 
                        today
                    );
                    
                    record.setStatus(BorrowRecord.BorrowStatus.OVERDUE);
                    record.setOverdueDays((int) daysOverdue);
                    record.setPenaltyAmount(daysOverdue * 15.0);
                    
                    borrowRecordRepository.save(record);
                    updateCount++;
                }
            }
            
            log.info("✅ Updated {} overdue record(s) with current penalties", updateCount);
            log.info("==================== OVERDUE STATUS UPDATE COMPLETE ====================");
            
        } catch (Exception e) {
            log.error("❌ ERROR during overdue status update: {}", e.getMessage(), e);
        }
    }
    
    /**
     * ✅ MANUAL TRIGGER: For testing reminders
     * Can be called via a test endpoint or for debugging
     */
    public void sendTestReminders() {
        log.info("🧪 ==================== MANUAL TEST: TRIGGERING ALL REMINDER CHECKS ====================");
        
        try {
            log.info("🧪 Testing Due Today Reminders...");
            sendDueTodayReminders();
            
            Thread.sleep(1000); // 1 second delay between tests
            
            log.info("🧪 Testing Due Soon Reminders...");
            sendDueSoonReminders();
            
            Thread.sleep(1000);
            
            log.info("🧪 Testing Overdue Notifications...");
            sendOverdueNotifications();
            
            log.info("🧪 ==================== MANUAL TEST COMPLETE ====================");
            
        } catch (Exception e) {
            log.error("❌ Error during manual test: {}", e.getMessage(), e);
        }
    }
    
    /**
     * ✅ DIAGNOSTIC: Check scheduler status
     * Runs every hour to confirm scheduler is working
     * Cron: 0 0 * * * * = Every hour
     */
    @Scheduled(cron = "0 0 * * * *")
    public void schedulerHealthCheck() {
        log.info("💚 SCHEDULER HEALTH CHECK: DueDateReminderScheduler is running at {}", 
                LocalDate.now() + " " + java.time.LocalTime.now());
    }
}