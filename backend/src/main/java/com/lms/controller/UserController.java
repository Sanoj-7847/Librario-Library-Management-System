package com.lms.controller;

import com.lms.entity.User;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserRepository userRepository;
    
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole().getName());
        response.put("isActive", user.getIsActive());

        response.put("membershipPlan", user.getMembershipPlan().name());
        response.put("accountStatus", user.getAccountStatus().name());
        
        
        return ResponseEntity.ok(response);
    }
}
