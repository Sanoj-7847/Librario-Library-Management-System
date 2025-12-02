package com.lms.service;

import com.lms.dto.*;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.exception.BadRequestException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.RoleRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public MemberResponse createMember(MemberRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress() != null && !request.getAddress().trim().isEmpty()
                ? request.getAddress()
                : "Not Provided");
        // Set membership plan
        User.MembershipPlan plan = User.MembershipPlan.valueOf(request.getMembershipPlan());
        user.setMembershipPlan(plan);
        user.setMaxBooksAllowed(plan.getMaxBooks());
        user.setCurrentlyBorrowed(0);
        user.setMembershipFee(plan.getFee());

        // Set membership dates
        LocalDate startDate = request.getMembershipStartDate() != null
                ? request.getMembershipStartDate()
                : LocalDate.now();
        user.setMembershipStartDate(startDate);

        LocalDate expiryDate;
        if (request.getMembershipExpiryDate() != null) {
            expiryDate = request.getMembershipExpiryDate();
        } else {
            // Default duration based on plan
            if (plan == User.MembershipPlan.STANDARD) {
                expiryDate = startDate.plusMonths(2); // 2 months for STANDARD
            } else if (plan == User.MembershipPlan.PREMIUM) {
                expiryDate = startDate.plusMonths(6);
            } else {
                expiryDate = startDate.plusMonths(12);
            }
        }
        user.setMembershipExpiryDate(expiryDate);

        // Assign member role
        Role memberRole = roleRepository.findByName("MEMBER")
                .orElseThrow(() -> new ResourceNotFoundException("Member role not found"));
        user.setRole(memberRole); // Changed from Set to single Role

        user.setAccountStatus(User.AccountStatus.ACTIVE);
        user.setIsVerified(true);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Transactional
    public MemberResponse updateMember(Long id, MemberRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        user.setEmail(request.getEmail());

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());

        // Update membership plan
        User.MembershipPlan plan = User.MembershipPlan.valueOf(request.getMembershipPlan());
        user.setMembershipPlan(plan);
        user.setMaxBooksAllowed(plan.getMaxBooks());
        user.setMembershipFee(plan.getFee());

        if (request.getMembershipStartDate() != null) {
            user.setMembershipStartDate(request.getMembershipStartDate());
        }

        if (request.getMembershipExpiryDate() != null) {
            user.setMembershipExpiryDate(request.getMembershipExpiryDate());
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    @Transactional
    public void deleteMember(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        // Check if member has active borrows
        if (user.getCurrentlyBorrowed() != null && user.getCurrentlyBorrowed() > 0) {
            throw new BadRequestException(
                    "Cannot delete member with active borrows. Currently borrowed: " + user.getCurrentlyBorrowed());
        }

        // Delete the user from database
        userRepository.delete(user);
        userRepository.flush(); // Force immediate deletion
    }

    public MemberResponse getMemberById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        return mapToResponse(user);
    }

    public Page<MemberResponse> searchMembers(MemberSearchRequest request) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (request.getEmail() != null && !request.getEmail().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("email")),
                        "%" + request.getEmail().toLowerCase() + "%"));
            }

            if (request.getFullName() != null && !request.getFullName().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("fullName")),
                        "%" + request.getFullName().toLowerCase() + "%"));
            }

            if (request.getPhone() != null && !request.getPhone().isEmpty()) {
                predicates.add(cb.like(root.get("phone"),
                        "%" + request.getPhone() + "%"));
            }

            if (request.getMembershipPlan() != null && !request.getMembershipPlan().isEmpty()) {
                predicates.add(cb.equal(root.get("membershipPlan"),
                        User.MembershipPlan.valueOf(request.getMembershipPlan())));
            }

            if (request.getAccountStatus() != null && !request.getAccountStatus().isEmpty()) {
                predicates.add(cb.equal(root.get("accountStatus"),
                        User.AccountStatus.valueOf(request.getAccountStatus())));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(request.getSortDirection()) ? Sort.Direction.DESC : Sort.Direction.ASC,
                request.getSortBy());

        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);
        Page<User> userPage = userRepository.findAll(spec, pageable);

        return userPage.map(this::mapToResponse);
    }

    public List<MemberResponse> getAllMembers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MemberResponse updateMembershipStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        user.setAccountStatus(User.AccountStatus.valueOf(status));
        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    @Transactional
    public MemberResponse extendMembership(Long id, int months) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        LocalDate currentExpiry = user.getMembershipExpiryDate();
        LocalDate newExpiry = currentExpiry.plusMonths(months);
        user.setMembershipExpiryDate(newExpiry);

        if (user.getAccountStatus() == User.AccountStatus.EXPIRED) {
            user.setAccountStatus(User.AccountStatus.ACTIVE);
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    private MemberResponse mapToResponse(User user) {
        // Changed to handle single Role instead of Set
        Set<String> roleNames = new HashSet<>();
        if (user.getRole() != null) {
            roleNames.add(user.getRole().getName());
        }

        boolean isMembershipActive = user.getMembershipExpiryDate() != null &&
                user.getMembershipExpiryDate().isAfter(LocalDate.now());

        return MemberResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(roleNames)
                .membershipPlan(user.getMembershipPlan().name())
                .membershipStartDate(user.getMembershipStartDate())
                .membershipExpiryDate(user.getMembershipExpiryDate())
                .membershipFee(user.getMembershipFee())
                .maxBooksAllowed(user.getMaxBooksAllowed())
                .currentlyBorrowed(user.getCurrentlyBorrowed())
                .accountStatus(user.getAccountStatus().name())
                .isVerified(user.getIsVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .isMembershipActive(isMembershipActive)
                .build();
    }
}