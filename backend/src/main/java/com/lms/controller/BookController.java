package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.dto.BookRequest;
import com.lms.dto.BookResponse;
import com.lms.dto.BookSearchRequest;
import com.lms.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@Slf4j
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<Page<BookResponse>> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(bookService.getAllBooks(page, size, sortBy, direction));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookResponse>> getBook(@PathVariable Long id) {
        BookResponse response = bookService.getBook(id);
        return ResponseEntity.ok(ApiResponse.success("Book retrieved successfully", response));
    }

    @PostMapping("/search")
    public ResponseEntity<Page<BookResponse>> searchBooks(@RequestBody BookSearchRequest request) {
        return ResponseEntity.ok(bookService.searchBooks(request));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getBooksByCategory(
            @PathVariable Long categoryId) {
        BookSearchRequest request = new BookSearchRequest();
        request.setCategoryId(categoryId);
        request.setSize(1000);
        Page<BookResponse> books = bookService.searchBooks(request);
        return ResponseEntity.ok(ApiResponse.success("Books by category retrieved", books.getContent()));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getAvailableBooks() {
        BookSearchRequest request = new BookSearchRequest();
        request.setAvailableOnly(true);
        request.setSize(1000);
        Page<BookResponse> books = bookService.searchBooks(request);
        return ResponseEntity.ok(ApiResponse.success("Available books retrieved", books.getContent()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<BookResponse>> createBook(@Valid @RequestBody BookRequest request) {
        BookResponse response = bookService.createBook(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Book created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<BookResponse>> updateBook(
            @PathVariable Long id,
            @Valid @RequestBody BookRequest request) {
        BookResponse response = bookService.updateBook(id, request);
        return ResponseEntity.ok(ApiResponse.success("Book updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<ApiResponse<Void>> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok(ApiResponse.success("Book deleted successfully", null));
    }
}