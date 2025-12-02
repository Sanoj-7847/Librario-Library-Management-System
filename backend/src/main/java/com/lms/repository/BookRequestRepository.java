package com.lms.repository;

import com.lms.entity.BookRequest;
import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookRequestRepository extends JpaRepository<BookRequest, Long> {

    List<BookRequest> findByStatus(BookRequest.RequestStatus status);

    List<BookRequest> findByUserAndStatus(User user, BookRequest.RequestStatus status);

    List<BookRequest> findByUserIdOrderByRequestDateDesc(Long userId);

    @Query("SELECT br FROM BookRequest br WHERE br.status = com.lms.entity.BookRequest$RequestStatus.PENDING ORDER BY br.requestDate DESC, br.createdAt DESC")
    List<BookRequest> findAllPendingRequests();
    
    @Query("SELECT br FROM BookRequest br ORDER BY br.requestDate DESC, br.createdAt DESC")
    List<BookRequest> findAllOrderByRequestDateDesc();

    @Query("SELECT COUNT(br) FROM BookRequest br WHERE br.status = com.lms.entity.BookRequest$RequestStatus.PENDING")
    Long countPendingRequests();

    boolean existsByUserAndBookAndStatus(User user, com.lms.entity.Book book, BookRequest.RequestStatus status);
}