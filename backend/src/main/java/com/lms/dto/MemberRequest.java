package com.lms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class MemberRequest {
        
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String phone;
    
    private String address;
    
    @NotBlank(message = "Membership plan is required")
    private String membershipPlan;
    
    private LocalDate membershipStartDate;
    private LocalDate membershipExpiryDate;
    private Double membershipFee;
}