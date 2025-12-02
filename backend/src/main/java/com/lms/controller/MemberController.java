package com.lms.controller;

import com.lms.dto.*;
import com.lms.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {
    
    private final MemberService memberService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<MemberResponse>> createMember(@Valid @RequestBody MemberRequest request) {
        MemberResponse response = memberService.createMember(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Member created successfully", response));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<MemberResponse>> updateMember(
            @PathVariable Long id, 
            @Valid @RequestBody MemberRequest request) {
        MemberResponse response = memberService.updateMember(id, request);
        return ResponseEntity.ok(ApiResponse.success("Member updated successfully", response));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMember(@PathVariable Long id) {
        memberService.deleteMember(id);
        return ResponseEntity.ok(ApiResponse.success("Member deleted successfully", null));
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<MemberResponse>> getMemberById(@PathVariable Long id) {
        MemberResponse response = memberService.getMemberById(id);
        return ResponseEntity.ok(ApiResponse.success("Member retrieved successfully", response));
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<MemberResponse>>> getAllMembers() {
        List<MemberResponse> members = memberService.getAllMembers();
        return ResponseEntity.ok(ApiResponse.success("Members retrieved successfully", members));
    }
    
    @PostMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<Page<MemberResponse>>> searchMembers(
            @RequestBody MemberSearchRequest request) {
        Page<MemberResponse> members = memberService.searchMembers(request);
        return ResponseEntity.ok(ApiResponse.success("Members retrieved successfully", members));
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<MemberResponse>> updateMembershipStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        MemberResponse response = memberService.updateMembershipStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Membership status updated", response));
    }
    
    @PatchMapping("/{id}/extend")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<MemberResponse>> extendMembership(
            @PathVariable Long id,
            @RequestParam int months) {
        MemberResponse response = memberService.extendMembership(id, months);
        return ResponseEntity.ok(ApiResponse.success("Membership extended", response));
    }
}