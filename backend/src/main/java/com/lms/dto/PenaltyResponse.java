package com.lms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PenaltyResponse {
    private Long borrowRecordId;
    private String bookTitle;
    private String fullName;
    private Integer overdueDays;
    private Double penaltyAmount;
    private Boolean penaltyPaid;
    private String message;
}
