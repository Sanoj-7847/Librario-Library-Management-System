package com.lms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class BookRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @NotBlank(message = "Author is required")
    @Size(max = 255, message = "Author name cannot exceed 255 characters")
    private String author;

    @NotBlank(message = "ISBN is required")
    private String isbn;

    private String publisher;

    @Min(value = 1000, message = "Published year must be valid")
    @Max(value = 2100, message = "Published year must be valid")
    private Integer publishedYear;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @NotNull(message = "Total copies is required")
    @Min(value = 1, message = "Total copies must be at least 1")
    private Integer totalCopies;

    @NotNull(message = "Available copies is required")
    @Min(value = 0, message = "Available copies must be at least 0")
    private Integer availableCopies;

    @NotNull(message = "Pages count is required")
    @Min(value = 1, message = "Book must have at least 1 page")
    private Integer pages;

    private String coverImage;

    @NotNull(message = "Category ID is required")
    @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
    private List<Long> categoryId;
}
