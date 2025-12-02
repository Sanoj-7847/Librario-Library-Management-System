package com.lms.dto;

import lombok.Data;

@Data
public class ResolveAlertRequest {
    private String status; // RESOLVED or DISMISSED
    private String resolutionNotes;
}
