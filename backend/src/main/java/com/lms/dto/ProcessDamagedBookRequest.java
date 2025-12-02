package com.lms.dto;

import lombok.Data;

@Data
public class ProcessDamagedBookRequest {
    private String status; // UNDER_REVIEW, REPAIRING, REPAIRED, REPLACED, WRITTEN_OFF
    private String resolutionNotes;
}
