package com.lms.dto;

import lombok.Data;

@Data
public class MemberSearchRequest {
    private String email;
    private String fullName;
    private String phone;
    private String membershipPlan;
    private String accountStatus;
    private String sortBy = "fullName";
    private String sortDirection = "ASC";
    private Integer page = 0;
    private Integer size = 10;
}