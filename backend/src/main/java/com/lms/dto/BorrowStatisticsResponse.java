package com.lms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowStatisticsResponse {
    private Long totalBorrowed;
    private Long overdueBooks;
    private Long availableBooks;
    private Double totalPenalties;
    private Long totalReturned;
    private Long activeMembers;
}