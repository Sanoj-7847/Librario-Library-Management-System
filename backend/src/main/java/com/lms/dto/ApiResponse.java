package com.lms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

/**
 * Generic API Response wrapper for consistent response structure
 * @param <T> Type of data being returned
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    private boolean success;
    private String message;
    private T data;
    private String error;
    private LocalDateTime timestamp;
    private Integer statusCode;
    
    
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .statusCode(200)
                .build();
    }
    
    
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .timestamp(LocalDateTime.now())
                .statusCode(200)
                .build();
    }
    
    
    public static <T> ApiResponse<T> error(String message, String error, Integer statusCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .error(error)
                .timestamp(LocalDateTime.now())
                .statusCode(statusCode)
                .build();
    }
    
    
    public static <T> ApiResponse<T> error(String message, String error) {
        return error(message, error, 400);
    }
    
    
    public static <T> ApiResponse<T> error(String message) {
        return error(message, null, 400);
    }
    
    
    public static <T> ApiResponse<T> created(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .statusCode(201)
                .build();
    }
    
    
    public static <T> ApiResponse<T> noContent(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .timestamp(LocalDateTime.now())
                .statusCode(204)
                .build();
    }
    
    
    public static <T> ApiResponse<T> unauthorized(String message) {
        return error(message, "Unauthorized access", 401);
    }
    
    
    public static <T> ApiResponse<T> forbidden(String message) {
        return error(message, "Access forbidden", 403);
    }
    
    
    public static <T> ApiResponse<T> notFound(String message) {
        return error(message, "Resource not found", 404);
    }
    
    
    public static <T> ApiResponse<T> badRequest(String message) {
        return error(message, "Bad request", 400);
    }
    
    
    public static <T> ApiResponse<T> internalServerError(String message) {
        return error(message, "Internal server error", 500);
    }
}