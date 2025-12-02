package com.lms.dto;

import lombok.Data;

@Data
public class RenewalRequestRequest {
    private Long borrowRecordId;
    private Integer renewalDays; // How many days to extend
    private String reason;
}