package com.lms.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class BorrowHistoryRequest {
    private Long userId;
    private Long bookId;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean overdueOnly;
    private String sortBy = "borrowDate";
    private String sortDirection = "DESC";
    private Integer page = 0;
    private Integer size = 10;
}