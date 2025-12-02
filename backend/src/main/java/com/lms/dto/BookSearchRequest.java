package com.lms.dto;

import lombok.Data;

@Data
public class BookSearchRequest {
    private String keyword;
    private String title;
    private String author;
    private String publisher;
    private String isbn;
    private Long categoryId;
    private String status;
    private Integer publishedYear;
    private Boolean availableOnly;
    private String sortBy = "title";
    private String sortDirection = "ASC";
    private Integer page = 0;
    private Integer size = 10;
}