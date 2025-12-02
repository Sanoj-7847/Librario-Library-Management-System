package com.lms.dto;

import lombok.Data;

@Data
public class ReportDamagedBookRequest {
    private Long bookId;
    private Long borrowRecordId;
    private String damageLevel; // MINOR, MODERATE, SEVERE, LOST
    private String damageDescription;
    private Double repairCost;
}
