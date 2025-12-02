package com.lms.dto;

import lombok.Data;

@Data
public class ProcessRenewalRequest {
    private String action; // APPROVE or REJECT
    private Integer renewalDays; // For approval
    private String adminNotes;
}
