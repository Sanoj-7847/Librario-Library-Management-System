package com.lms.dto;

import lombok.Data;

@Data
public class ProcessRequestDTO {
    private Long requestId;
    private String action; 
    private String adminNotes;
}
