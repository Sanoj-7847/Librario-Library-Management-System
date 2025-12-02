package com.lms.service;

import com.lms.entity.Book;
import com.lms.entity.DamagedBookReport;
import com.lms.entity.Notification;
import com.lms.entity.RenewalRequest;
import com.lms.entity.User;
import com.lms.repository.NotificationRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private void createNotification(User user, String title, String message, Notification.NotificationType type) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setIsRead(false);
        notificationRepository.save(notification);
    }

    // ================= ADMIN / ALERT NOTIFICATIONS =================
    public void sendLowStockAlertToAdmins(Book book, Integer availableCopies) {
        String title = "⚠️ Low Stock Alert: " + book.getTitle();
        String message = String.format("Book '%s' is low on stock. Available: %d copies",
                book.getTitle(), availableCopies != null ? availableCopies : 0);

        notifyAdmins(title, message, Notification.NotificationType.ALERT);

        String emailBody = String.format(
                "Dear Admin,\n\n" +
                        "⚠️ LOW STOCK ALERT\n\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "Available Copies: %d\n" +
                        "Total Copies: %d\n\n" +
                        "Please consider ordering more copies or take appropriate action.\n\n" +
                        "Best regards,\n" +
                        "Librario Library System",
                book.getTitle(),
                book.getAuthor(),
                availableCopies != null ? availableCopies : 0,
                book.getTotalCopies() != null ? book.getTotalCopies() : 0);

        for (User admin : userRepository.findByRoleName("ADMIN")) {
            emailService.sendNotificationEmail(admin.getEmail(), title, emailBody);
        }
        for (User lib : userRepository.findByRoleName("LIBRARIAN")) {
            emailService.sendNotificationEmail(lib.getEmail(), title, emailBody);
        }
    }

    public void sendDamagedBookAlertToAdmins(DamagedBookReport report) {
        Book book = report.getBook();
        String title = "🔧 Damaged Book Report: " + book.getTitle();
        String message = String.format("Damaged report for '%s' by %s. Level: %s, Cost: ₹%.2f",
                book.getTitle(),
                report.getReportedBy().getFullName(),
                report.getDamageLevel().name(),
                report.getRepairCost() != null ? report.getRepairCost() : 0.0);

        notifyAdmins(title, message, Notification.NotificationType.ALERT);

        String emailBody = String.format(
                "Dear Admin,\n\n" +
                        "🔧 DAMAGED BOOK REPORT RECEIVED\n\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "ISBN: %s\n\n" +
                        "Reported By: %s (%s)\n" +
                        "Damage Level: %s\n" +
                        "Estimated Repair Cost: ₹%.2f\n\n" +
                        "Description:\n%s\n\n" +
                        "Please review the report and take appropriate action.\n\n" +
                        "Best regards,\n" +
                        "Librario Library System",
                book.getTitle(),
                book.getAuthor(),
                book.getIsbn() != null ? book.getIsbn() : "N/A",
                report.getReportedBy().getFullName(),
                report.getReportedBy().getEmail(),
                report.getDamageLevel().name(),
                report.getRepairCost() != null ? report.getRepairCost() : 0.0,
                report.getDamageDescription());

        for (User admin : userRepository.findByRoleName("ADMIN")) {
            emailService.sendNotificationEmail(admin.getEmail(), title, emailBody);
        }
    }

    public void sendDamagedBookReportConfirmation(User user, Book book, String damageLevel) {
        String title = "✅ Damaged Book Report Received";
        String message = String.format("We have received your damaged book report for '%s' (Level: %s).",
                book.getTitle(), damageLevel);
        createNotification(user, title, message, Notification.NotificationType.GENERAL);

        String emailBody = String.format(
                "Dear %s,\n\n" +
                        "✅ DAMAGE REPORT CONFIRMATION\n\n" +
                        "Thank you for reporting the damage for the book '%s'.\n\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "Damage Level: %s\n\n" +
                        "Our team will review your report shortly and take appropriate action.\n" +
                        "You will be notified once the report is processed.\n\n" +
                        "Best regards,\n" +
                        "Librario Library Team",
                user.getFullName(),
                book.getTitle(),
                book.getTitle(),
                book.getAuthor(),
                damageLevel);

        emailService.sendNotificationEmail(user.getEmail(), title, emailBody);
    }

    public void sendDamagedBookReportUpdate(User user, Book book, String status, String resolutionNotes) {
        String title = "📋 Damaged Book Report Update";
        String message = String.format("Your damaged book report for '%s' has been updated: %s",
                book.getTitle(), status);
        createNotification(user, title, message, Notification.NotificationType.GENERAL);

        String emailBody = String.format(
                "Dear %s,\n\n" +
                        "📋 DAMAGE REPORT UPDATE\n\n" +
                        "Your damaged book report for '%s' has been updated.\n\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "New Status: %s\n\n" +
                        "Resolution Notes:\n%s\n\n" +
                        "Best regards,\n" +
                        "Librario Library Team",
                user.getFullName(),
                book.getTitle(),
                book.getTitle(),
                book.getAuthor(),
                status,
                resolutionNotes != null && !resolutionNotes.isEmpty() ? resolutionNotes : "No additional notes");

        emailService.sendNotificationEmail(user.getEmail(), title, emailBody);
    }

    // ================= DUE / OVERDUE / REMINDERS =================
    public void sendDueDateReminderNotification(User user, Book book, LocalDate dueDate, int daysRemaining) {
        String title = daysRemaining == 0 ? "⏰ Due Today: Return Reminder" : "🔔 Due Soon: Return Reminder";
        String dayText = daysRemaining == 0 ? "today" : "in " + daysRemaining + " day" + (daysRemaining > 1 ? "s" : "");
        String message = String.format("Reminder: Book '%s' is due %s (%s).",
                book.getTitle(), dayText, dueDate.format(DATE_FORMATTER));

        createNotification(user, title, message, Notification.NotificationType.REMINDER);

        String emailBody = String.format(
                "Dear %s,\n\n" +
                        "🔔 BOOK RETURN REMINDER\n\n" +
                        "This is a friendly reminder that your borrowed book is due %s.\n\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "Due Date: %s\n" +
                        "Days Remaining: %s\n\n" +
                        "Please return the book on time to avoid late penalties (₹15/day).\n\n" +
                        "Thank you for your cooperation!\n\n" +
                        "Best regards,\n" +
                        "Librario Library Team",
                user.getFullName(),
                dayText,
                book.getTitle(),
                book.getAuthor(),
                dueDate.format(DATE_FORMATTER),
                daysRemaining == 0 ? "Due Today!" : daysRemaining + " day(s)");

        emailService.sendNotificationEmail(user.getEmail(), title, emailBody);
        log.info("📧 Due date reminder sent to: {} for book: {}", user.getEmail(), book.getTitle());
    }

    public void sendOverdueNotification(User user, Book book, LocalDate dueDate, int daysOverdue) {
        String title = "🚨 Overdue Notice";
        String message = String.format("Your book '%s' is overdue by %d day(s). Due date was %s.",
                book.getTitle(), daysOverdue, dueDate.format(DATE_FORMATTER));

        createNotification(user, title, message, Notification.NotificationType.OVERDUE);

        double penaltyAmount = daysOverdue * 15.0;

        String emailBody = String.format(
                "Dear %s,\n\n" +
                        "🚨 OVERDUE BOOK NOTICE\n\n" +
                        "Our records show that the following book is overdue:\n\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "Due Date: %s\n" +
                        "Days Overdue: %d\n" +
                        "Current Penalty: ₹%.2f (₹15/day)\n\n" +
                        "Please return the book as soon as possible to avoid additional penalties.\n" +
                        "You can return the book at the library counter during working hours.\n\n" +
                        "If you have already returned the book, please disregard this notice.\n\n" +
                        "Best regards,\n" +
                        "Librario Library Team",
                user.getFullName(),
                book.getTitle(),
                book.getAuthor(),
                dueDate.format(DATE_FORMATTER),
                daysOverdue,
                penaltyAmount);

        emailService.sendNotificationEmail(user.getEmail(), title, emailBody);
        log.info("📧 Overdue notification sent to: {} for book: {}", user.getEmail(), book.getTitle());
    }

    // ================= RENEWAL REQUESTS =================
    public void notifyAdminsAboutRenewalRequest(RenewalRequest renewalRequest) {
        String title = "🔄 Renewal Request: " + renewalRequest.getBook().getTitle();
        String message = String.format("User %s requested renewal for '%s' (current due: %s → requested: %s).",
                renewalRequest.getUser().getFullName(),
                renewalRequest.getBook().getTitle(),
                renewalRequest.getCurrentDueDate(),
                renewalRequest.getRequestedDueDate());

        notifyAdmins(title, message, Notification.NotificationType.ALERT);

        String emailBody = String.format(
                "Dear Admin,\n\n" +
                        "🔄 NEW RENEWAL REQUEST\n\n" +
                        "A member has requested to renew their borrowed book:\n\n" +
                        "Member: %s (%s)\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "Current Due Date: %s\n" +
                        "Requested New Due Date: %s\n" +
                        "Extension Days: %d\n\n" +
                        "Reason:\n%s\n\n" +
                        "Please review and process this request.\n\n" +
                        "Best regards,\n" +
                        "Librario Library System",
                renewalRequest.getUser().getFullName(),
                renewalRequest.getUser().getEmail(),
                renewalRequest.getBook().getTitle(),
                renewalRequest.getBook().getAuthor(),
                renewalRequest.getCurrentDueDate(),
                renewalRequest.getRequestedDueDate(),
                renewalRequest.getRenewalDays(),
                renewalRequest.getReason() != null && !renewalRequest.getReason().isEmpty()
                        ? renewalRequest.getReason()
                        : "No reason provided");

        for (User admin : userRepository.findByRoleName("ADMIN")) {
            emailService.sendNotificationEmail(admin.getEmail(), title, emailBody);
        }
    }

    public void sendRenewalApprovedNotification(User user, Book book, LocalDate oldDueDate, LocalDate newDueDate,
            int renewalDays) {
        String title = "✅ Renewal Approved: " + book.getTitle();
        String message = String.format("Your renewal for '%s' has been approved. New due date: %s.",
                book.getTitle(), newDueDate.format(DATE_FORMATTER));

        createNotification(user, title, message, Notification.NotificationType.GENERAL);

        String emailBody = String.format(
                "Dear %s,\n\n" +
                        "✅ RENEWAL REQUEST APPROVED\n\n" +
                        "Great news! Your renewal request has been approved.\n\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "Previous Due Date: %s\n" +
                        "New Due Date: %s\n" +
                        "Extension: %d days\n\n" +
                        "Please return the book by the new due date to avoid penalties.\n\n" +
                        "Thank you!\n\n" +
                        "Best regards,\n" +
                        "Librario Library Team",
                user.getFullName(),
                book.getTitle(),
                book.getAuthor(),
                oldDueDate.format(DATE_FORMATTER),
                newDueDate.format(DATE_FORMATTER),
                renewalDays);

        emailService.sendNotificationEmail(user.getEmail(), title, emailBody);
    }

    public void sendRenewalRejectedNotification(User user, Book book, String adminNotes) {
        String title = "❌ Renewal Rejected: " + book.getTitle();
        String message = String.format("Your renewal for '%s' has been rejected.", book.getTitle());

        createNotification(user, title, message, Notification.NotificationType.GENERAL);

        String emailBody = String.format(
                "Dear %s,\n\n" +
                        "❌ RENEWAL REQUEST REJECTED\n\n" +
                        "We regret to inform you that your renewal request for the following book has been rejected:\n\n"
                        +
                        "Book: %s\n" +
                        "Author: %s\n\n" +
                        "Reason:\n%s\n\n" +
                        "Please return the book by the original due date to avoid penalties.\n\n" +
                        "Best regards,\n" +
                        "Librario Library Team",
                user.getFullName(),
                book.getTitle(),
                book.getAuthor(),
                adminNotes != null && !adminNotes.isEmpty() ? adminNotes : "No specific reason provided");

        emailService.sendNotificationEmail(user.getEmail(), title, emailBody);
    }

    // Helper to notify all admins/librarians
    private void notifyAdmins(String title, String message, Notification.NotificationType type) {
        for (User admin : userRepository.findByRoleName("ADMIN")) {
            createNotification(admin, title, message, type != null ? type : Notification.NotificationType.ALERT);
        }
        for (User lib : userRepository.findByRoleName("LIBRARIAN")) {
            createNotification(lib, title, message, type != null ? type : Notification.NotificationType.ALERT);
        }
    }

    // ================= BOOK ISSUE =================
    @Transactional
    public void sendBookIssuedNotification(User user, Book book, LocalDate dueDate) {
        String title = "📚 Book Issued Successfully";
        String message = String.format("Book '%s' has been issued. Return by %s.",
                book.getTitle(),
                dueDate.format(DATE_FORMATTER));

        createNotification(user, title, message, Notification.NotificationType.BOOK_ISSUED);

        String emailBody = String.format(
                "Dear %s,\n\n" +
                        "📚 BOOK ISSUED SUCCESSFULLY\n\n" +
                        "Your book has been successfully issued!\n\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "ISBN: %s\n" +
                        "Issue Date: %s\n" +
                        "Due Date: %s\n\n" +
                        "⚠️ Important:\n" +
                        "• Please return the book by the due date\n" +
                        "• Late penalty: ₹15 per day\n" +
                        "• Handle the book with care\n" +
                        "• Report any damage immediately\n\n" +
                        "Enjoy your reading!\n\n" +
                        "Best regards,\n" +
                        "Librario Library Team",
                user.getFullName(),
                book.getTitle(),
                book.getAuthor(),
                book.getIsbn() != null ? book.getIsbn() : "N/A",
                LocalDate.now().format(DATE_FORMATTER),
                dueDate.format(DATE_FORMATTER));

        emailService.sendNotificationEmail(user.getEmail(), "Book Issued - Librario", emailBody);
        log.info("📧 Book issued email sent to: {}", user.getEmail());
    }

    // ================= BOOK RETURN (ENHANCED VERSION) =================
    @Transactional
    public void sendBookReturnedNotification(
            User user,
            Book book,
            LocalDate returnDate,
            Double totalAmount,
            String paymentMethod,
            boolean hasDamage,
            String damageLevel,
            String damageDescription,
            Double damageAmount) {
        if (totalAmount == null) {
            totalAmount = 0.0;
        }

        String title;
        String message;
        Notification.NotificationType type;

        if (totalAmount > 0) {
            type = Notification.NotificationType.PENALTY;
            if (hasDamage) {
                title = "📖 Book Returned - Payment & Damage Report";
                message = String.format("Book '%s' returned with damage. Total charges: ₹%.2f",
                        book.getTitle(), totalAmount);
            } else {
                title = "📖 Book Returned - Late Penalty";
                message = String.format("Book '%s' returned. Late penalty: ₹%.2f",
                        book.getTitle(), totalAmount);
            }
        } else {
            type = Notification.NotificationType.BOOK_RETURNED;
            title = "📖 Book Returned Successfully";
            message = String.format("Book '%s' returned successfully. No charges.", book.getTitle());
        }

        createNotification(user, title, message, type);

        // ✅ FIX 3: EMAIL with complete damage details
        StringBuilder emailBody = new StringBuilder();

        emailBody.append(String.format(
                "Dear %s,\n\n" +
                        "📖 BOOK RETURN CONFIRMATION\n\n" +
                        "Your book has been returned successfully.\n\n" +
                        "Book: %s\n" +
                        "Author: %s\n" +
                        "ISBN: %s\n" +
                        "Return Date: %s\n\n",
                user.getFullName(),
                book.getTitle(),
                book.getAuthor(),
                book.getIsbn() != null ? book.getIsbn() : "N/A",
                returnDate.format(DATE_FORMATTER)));

        if (totalAmount > 0) {
            emailBody.append("💰 PAYMENT DETAILS\n");
            emailBody.append(String.format("Total Amount Paid: ₹%.2f\n", totalAmount));
            emailBody.append(String.format("Payment Method: %s\n",
                    paymentMethod != null ? paymentMethod : "Pending"));

            if (hasDamage && damageAmount != null && damageAmount > 0) {
                emailBody.append("\n🔧 DAMAGE REPORT DETAILS\n");
                emailBody.append(String.format("Damage Level: %s\n", damageLevel != null ? damageLevel : "N/A"));
                emailBody.append(String.format("Damage Description: %s\n",
                        damageDescription != null && !damageDescription.trim().isEmpty() ? damageDescription
                                : "No description provided"));
                emailBody.append(String.format("Damage Repair Cost: ₹%.2f\n", damageAmount));
                emailBody.append("\nA damage report has been created and sent to the library administration.\n");
                emailBody.append("Our team will review and take appropriate action.\n");
            }

            if (!hasDamage && totalAmount > 0) {
                emailBody.append("\n⚠️ This amount is a late return penalty (₹15/day).\n");
            }

            emailBody.append("\nThank you for settling the payment.\n");
        } else {
            emailBody.append("✅ STATUS\n");
            emailBody.append("No penalties or charges applied.\n");
            emailBody.append("Thank you for returning the book on time!\n");
        }

        emailBody.append("\nThank you for using Librario Library!\n\n");
        emailBody.append("Best regards,\n");
        emailBody.append("Librario Library Team");

        emailService.sendNotificationEmail(user.getEmail(), title, emailBody.toString());

        log.info("📧 Book return email sent to: {} with total amount: ₹{}",
                user.getEmail(), totalAmount);
    }

    // ================= OLD COMPATIBILITY VERSION =================
    @Transactional
    public void sendBookReturnedNotification(User user, Book book, LocalDate returnDate,
            Double totalAmount, String paymentMethod, boolean hasDamage) {
        sendBookReturnedNotification(user, book, returnDate, totalAmount, paymentMethod,
                hasDamage, null, null, 0.0);
    }
}