package com.lms.dto;
import lombok.Data;

@Data
public class BookRequestRequest {
    private Long bookId;
    private String notes;
}