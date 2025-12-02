package com.lms.service;

import com.lms.dto.BookRequest;
import com.lms.dto.BookResponse;
import com.lms.dto.BookSearchRequest;
import com.lms.dto.CategoryResponse;
import com.lms.entity.Book;
import com.lms.entity.Category;
import com.lms.exception.BadRequestException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.BookRepository;
import com.lms.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public BookResponse createBook(BookRequest request) {
        if (request.getIsbn() != null && !request.getIsbn().trim().isEmpty()
                && bookRepository.findByIsbn(request.getIsbn()).isPresent()) {
            throw new BadRequestException("Book with ISBN " + request.getIsbn() + " already exists");
        }

        Book book = Book.builder()
                .title(request.getTitle())
                .author(request.getAuthor())
                .isbn(request.getIsbn())
                .publisher(request.getPublisher())
                .publishedYear(request.getPublishedYear())
                .description(request.getDescription())
                .totalCopies(request.getTotalCopies())
                .availableCopies(request.getAvailableCopies())
                .pages(request.getPages())
                .coverImage(request.getCoverImage())
                .status(Book.BookStatus.AVAILABLE)
                .build();

        if (request.getCategoryId() != null && !request.getCategoryId().isEmpty()) {
            List<Category> categories = categoryRepository.findAllById(request.getCategoryId());
            if (categories.isEmpty()) {
                throw new BadRequestException("Invalid category IDs provided");
            }
            book.setCategories(categories);
        }

        book = bookRepository.save(book);
        log.info("✓ Book created: {} by {}", book.getTitle(), book.getAuthor());
        return mapToResponse(book);
    }

    @Transactional
    public BookResponse updateBook(Long id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        if (request.getIsbn() != null && !request.getIsbn().trim().isEmpty()
                && !request.getIsbn().equals(book.getIsbn())
                && bookRepository.findByIsbn(request.getIsbn()).isPresent()) {
            throw new BadRequestException("Book with ISBN " + request.getIsbn() + " already exists");
        }

        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setPublisher(request.getPublisher());
        book.setPublishedYear(request.getPublishedYear());
        book.setDescription(request.getDescription());
        book.setTotalCopies(request.getTotalCopies());
        book.setAvailableCopies(request.getAvailableCopies());
        book.setPages(request.getPages());
        book.setCoverImage(request.getCoverImage());

        if (book.getStatus() == null) {
            book.setStatus(Book.BookStatus.AVAILABLE);
        }

        if (request.getCategoryId() != null) {
            List<Category> categories = categoryRepository.findAllById(request.getCategoryId());
            if (categories.isEmpty()) {
                throw new BadRequestException("Invalid category IDs provided");
            }
            book.setCategories(categories);
        }

        book = bookRepository.save(book);
        log.info("✓ Book updated: {}", book.getTitle());
        return mapToResponse(book);
    }

    @Transactional
    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        bookRepository.delete(book);
        log.info("✓ Book deleted: {}", book.getTitle());
    }

    public BookResponse getBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        return mapToResponse(book);
    }

    public Page<BookResponse> getAllBooks(int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("DESC")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Book> books = bookRepository.findAll(pageable);
        return books.map(this::mapToResponse);
    }

    public Page<BookResponse> searchBooks(BookSearchRequest request) {
        String keyword = request.getKeyword() != null ? request.getKeyword().trim() : "";
        Long categoryId = request.getCategoryId();
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "title";
        String direction = request.getSortDirection() != null ? request.getSortDirection().toUpperCase() : "ASC";

        Sort sort = direction.equals("DESC") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);

        Page<Book> result;
        if (categoryId != null && !keyword.isEmpty()) {
            List<Book> filtered = bookRepository.findByCategoryId(categoryId, pageable).stream()
                    .filter(b -> b.getTitle().toLowerCase().contains(keyword.toLowerCase()) ||
                            b.getAuthor().toLowerCase().contains(keyword.toLowerCase()) ||
                            b.getPublisher().toLowerCase().contains(keyword.toLowerCase()) ||
                            b.getIsbn().toLowerCase().contains(keyword.toLowerCase()) ||
                            (b.getDescription() != null && b.getDescription().toLowerCase().contains(keyword.toLowerCase())))
                    .toList();

            int start = Math.min((int) pageable.getOffset(), filtered.size());
            int end = Math.min((start + pageable.getPageSize()), filtered.size());
            result = new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
        } else if (categoryId != null) {
            result = bookRepository.findByCategoryId(categoryId, pageable);
        } else if (!keyword.isEmpty()) {
            result = bookRepository.searchBooks(keyword, pageable);
        } else {
            result = bookRepository.findAll(pageable);
        }

        return result.map(this::mapToResponse);
    }

    private BookResponse mapToResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .publisher(book.getPublisher())
                .publishedYear(book.getPublishedYear())
                .description(book.getDescription())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .pages(book.getPages())
                .coverImage(book.getCoverImage())
                .status(book.getStatus() != null ? book.getStatus().name() : "AVAILABLE")
                .categories(book.getCategories() != null ? book.getCategories().stream()
                        .map(cat -> CategoryResponse.builder()
                                .id(cat.getId())
                                .name(cat.getName())
                                .description(cat.getDescription())
                                .build())
                        .collect(Collectors.toList()) : List.of())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }
}
