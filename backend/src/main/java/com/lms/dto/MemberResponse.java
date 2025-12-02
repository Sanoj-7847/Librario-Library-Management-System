package com.lms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private Set<String> role;
    private String membershipPlan;
    private LocalDate membershipStartDate;
    private LocalDate membershipExpiryDate;
    private Double membershipFee;
    private Integer maxBooksAllowed;
    private Integer currentlyBorrowed;
    private String accountStatus;
    private Boolean isVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isMembershipActive;
}