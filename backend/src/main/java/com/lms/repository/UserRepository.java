package com.lms.repository;

import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    // Find user by username
    Optional<User> findByUsername(String username);

    // Find user by email
    Optional<User> findByEmail(String email);

    // Check if username exists
    boolean existsByUsername(String username);

    // Check if email exists
    boolean existsByEmail(String email);

    // Find users by membership plan
    List<User> findByMembershipPlan(User.MembershipPlan plan);

    // Find users by account status
    List<User> findByAccountStatus(User.AccountStatus status);

    // Find users whose membership has expired but are still active
    @Query("SELECT u FROM User u WHERE u.membershipExpiryDate < :date AND u.accountStatus = 'ACTIVE'")
    List<User> findExpiredMemberships(LocalDate date);

    // Find users with memberships expiring in a given date range
    @Query("SELECT u FROM User u WHERE u.membershipExpiryDate BETWEEN :startDate AND :endDate")
    List<User> findMembershipsExpiringBetween(LocalDate startDate, LocalDate endDate);

    // Find all users with role MEMBER
    @Query("SELECT u FROM User u WHERE u.role.name = 'MEMBER'")
    List<User> findAllMembers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.accountStatus = 'ACTIVE'")
    Long countActiveMembers();

    @Query("SELECT u FROM User u WHERE u.role.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);
}