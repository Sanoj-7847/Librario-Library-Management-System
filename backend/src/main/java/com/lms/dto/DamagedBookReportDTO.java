package com.lms.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DamagedBookReportDTO {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private Long borrowRecordId;
    private Long reportedByUserId;
    private String reportedByName;
    private String damageLevel;
    private String damageDescription;
    private Double repairCost;
    private String status;
    private LocalDateTime reportDate;
    private String resolutionNotes;
    private Long resolvedBy;
    private String resolvedByName;
    private LocalDateTime resolvedDate;
}
