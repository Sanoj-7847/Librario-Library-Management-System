package com.lms.repository;

import com.lms.entity.Book;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {

    Optional<Book> findByIsbn(String isbn);

    List<Book> findByTitleContainingIgnoreCase(String title);

    List<Book> findByAuthorContainingIgnoreCase(String author);

    List<Book> findByAvailableCopiesGreaterThan(Integer copies);

    Long countByAvailableCopiesGreaterThan(Integer copies);

    @Query("SELECT b FROM Book b JOIN b.categories c WHERE c.id = :categoryId")
    Page<Book> findByCategoryId(Long categoryId, Pageable pageable);

    @Query("""
                SELECT b FROM Book b
                WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(b.publisher) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(b.isbn) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<Book> searchBooks(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT b FROM Book b WHERE b.availableCopies > 0")
    List<Book> findAllAvailableBooks();

    boolean existsByIsbn(String isbn);
}