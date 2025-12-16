package com.safegergis.tome_user_data.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.safegergis.tome_user_data.dto.CreateUserBookRequest;
import com.safegergis.tome_user_data.dto.UpdateUserBookRequest;
import com.safegergis.tome_user_data.dto.UserBookDTO;
import com.safegergis.tome_user_data.enums.ReadingStatus;
import com.safegergis.tome_user_data.service.UserBookService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for UserBook operations
 * Extracts userId from JWT authentication
 */
@RestController
@RequestMapping("/api/user-books")
@RequiredArgsConstructor
@Slf4j
public class UserBookController {

    private final UserBookService userBookService;

    /**
     * Extract authenticated user ID from SecurityContext
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }

    /**
     * Get user's books, optionally filtered by status
     * If userId is provided, returns that user's public books (currently-reading only for privacy)
     * If userId is not provided, returns authenticated user's books
     *
     * Examples:
     * - GET /api/user-books (all authenticated user's books)
     * - GET /api/user-books?status=currently-reading
     * - GET /api/user-books?userId=123&status=currently-reading (other user's currently reading)
     */
    @GetMapping
    public ResponseEntity<List<UserBookDTO>> getUserBooks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId) {

        Long authenticatedUserId = getAuthenticatedUserId();

        // If no userId provided, return authenticated user's books
        if (userId == null) {
            log.info("GET /api/user-books?status={} - User {}", status, authenticatedUserId);

            ReadingStatus readingStatus = null;
            if (status != null && !status.isEmpty()) {
                try {
                    readingStatus = ReadingStatus.fromString(status);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status parameter: {}", status);
                    return ResponseEntity.badRequest().build();
                }
            }

            List<UserBookDTO> books = userBookService.getUserBooksByStatus(authenticatedUserId, readingStatus);
            return ResponseEntity.ok(books);
        } else {
            // Requesting another user's books
            log.info("GET /api/user-books?userId={}&status={} - Requested by User {}",
                    userId, status, authenticatedUserId);

            // Parse status (required for other users to limit to currently-reading for privacy)
            ReadingStatus readingStatus;
            if (status != null && !status.isEmpty()) {
                try {
                    readingStatus = ReadingStatus.fromString(status);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status parameter: {}", status);
                    return ResponseEntity.badRequest().build();
                }

                // Only allow currently-reading status for other users (privacy)
                if (readingStatus != ReadingStatus.CURRENTLY_READING) {
                    log.warn("Attempted to access restricted status {} for user {}", status, userId);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            } else {
                // Default to currently-reading for other users
                readingStatus = ReadingStatus.CURRENTLY_READING;
            }

            List<UserBookDTO> books = userBookService.getUserBooksByStatus(userId, readingStatus);
            return ResponseEntity.ok(books);
        }
    }

    /**
     * Get a specific user book
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserBookDTO> getUserBook(@PathVariable Long id) {
        log.info("GET /api/user-books/{}", id);
        UserBookDTO userBook = userBookService.getUserBook(getAuthenticatedUserId(), id);
        return ResponseEntity.ok(userBook);
    }

    /**
     * Add a book to user's shelf
     */
    @PostMapping
    public ResponseEntity<UserBookDTO> addBookToShelf(@Valid @RequestBody CreateUserBookRequest request) {
        log.info("POST /api/user-books - Adding book {} to shelf", request.getBookId());
        UserBookDTO created = userBookService.addBookToShelf(getAuthenticatedUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update a user book
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserBookDTO> updateUserBook(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserBookRequest request) {
        log.info("PUT /api/user-books/{}", id);
        UserBookDTO updated = userBookService.updateUserBook(getAuthenticatedUserId(), id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update reading status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserBookDTO> updateReadingStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        log.info("PATCH /api/user-books/{}/status - status={}", id, status);

        ReadingStatus readingStatus;
        try {
            readingStatus = ReadingStatus.fromString(status);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status parameter: {}", status);
            return ResponseEntity.badRequest().build();
        }

        UserBookDTO updated = userBookService.updateReadingStatus(getAuthenticatedUserId(), id, readingStatus);
        return ResponseEntity.ok(updated);
    }

    /**
     * Mark book as Did Not Finish
     */
    @PostMapping("/{id}/dnf")
    public ResponseEntity<UserBookDTO> markAsDidNotFinish(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        log.info("POST /api/user-books/{}/dnf - reason={}", id, reason);
        UserBookDTO updated = userBookService.markAsDidNotFinish(getAuthenticatedUserId(), id, reason);
        return ResponseEntity.ok(updated);
    }

    /**
     * Remove book from shelf
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeBookFromShelf(@PathVariable Long id) {
        log.info("DELETE /api/user-books/{}", id);
        userBookService.removeBookFromShelf(getAuthenticatedUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
