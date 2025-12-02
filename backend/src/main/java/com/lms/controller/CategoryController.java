package com.lms.controller;

import com.lms.entity.Category;
import com.lms.service.CategoryService;
import com.lms.dto.CategoryRequest;
import com.lms.dto.CategoryResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // Get all categories or search
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(@RequestParam(required = false) String q) {
        List<Category> categories = (q != null && !q.isBlank())
                ? categoryService.search(q)
                : categoryService.listAll();

        List<CategoryResponse> responses = categories.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // Get category by ID
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id) {
        Category category = categoryService.get(id);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        }
        return ResponseEntity.ok(mapToResponse(category));
    }

    // Add new category
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CategoryRequest request) {
        Category newCategory = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Category savedCategory = categoryService.create(newCategory);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapToResponse(savedCategory));
    }

    // Update category
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(@PathVariable Long id,
                                                           @RequestBody CategoryRequest request) {
        Category updateData = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Category updated = categoryService.update(id, updateData);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        }
        return ResponseEntity.ok(mapToResponse(updated));
    }

    // Delete category
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        Category existing = categoryService.get(id);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Category not found");
        }

        categoryService.delete(id);
        return ResponseEntity.ok("Category deleted successfully");
    }

    // Helper: convert entity to response DTO
    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }
}
