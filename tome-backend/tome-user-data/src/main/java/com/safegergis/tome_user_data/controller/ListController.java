package com.safegergis.tome_user_data.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.safegergis.tome_user_data.dto.CreateListRequest;
import com.safegergis.tome_user_data.dto.ListDTO;
import com.safegergis.tome_user_data.enums.ListType;
import com.safegergis.tome_user_data.service.ListService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for List operations
 * Extracts userId from JWT authentication
 */
@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
@Slf4j
public class ListController {

    private final ListService listService;

    /**
     * Extract authenticated user ID from SecurityContext
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }

    /**
     * Create a new custom list
     */
    @PostMapping
    public ResponseEntity<ListDTO> createList(@Valid @RequestBody CreateListRequest request) {
        log.info("POST /api/lists - Creating list '{}'", request.getName());
        ListDTO created = listService.createList(getAuthenticatedUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get all lists for the user
     */
    @GetMapping
    public ResponseEntity<List<ListDTO>> getUserLists() {
        log.info("GET /api/lists");
        List<ListDTO> lists = listService.getUserLists(getAuthenticatedUserId());
        return ResponseEntity.ok(lists);
    }

    /**
     * Get a specific list
     */
    @GetMapping("/{id}")
    public ResponseEntity<ListDTO> getList(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean includeBooks) {
        log.info("GET /api/lists/{}?includeBooks={}", id, includeBooks);
        ListDTO list = listService.getList(getAuthenticatedUserId(), id, includeBooks);
        return ResponseEntity.ok(list);
    }

    /**
     * Update a list
     */
    @PutMapping("/{id}")
    public ResponseEntity<ListDTO> updateList(
            @PathVariable Long id,
            @Valid @RequestBody CreateListRequest request) {
        log.info("PUT /api/lists/{}", id);
        ListDTO updated = listService.updateList(getAuthenticatedUserId(), id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a list (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteList(@PathVariable Long id) {
        log.info("DELETE /api/lists/{}", id);
        listService.deleteList(getAuthenticatedUserId(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Add a book to a list
     */
    @PostMapping("/{id}/books/{bookId}")
    public ResponseEntity<Void> addBookToList(
            @PathVariable Long id,
            @PathVariable Long bookId) {
        log.info("POST /api/lists/{}/books/{}", id, bookId);
        listService.addBookToList(getAuthenticatedUserId(), id, bookId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * Remove a book from a list
     */
    @DeleteMapping("/{id}/books/{bookId}")
    public ResponseEntity<Void> removeBookFromList(
            @PathVariable Long id,
            @PathVariable Long bookId) {
        log.info("DELETE /api/lists/{}/books/{}", id, bookId);
        listService.removeBookFromList(getAuthenticatedUserId(), id, bookId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reorder books in a list
     */
    @PutMapping("/{id}/books/order")
    public ResponseEntity<Void> reorderBooks(
            @PathVariable Long id,
            @RequestBody List<Long> bookIds) {
        log.info("PUT /api/lists/{}/books/order - {} books", id, bookIds.size());
        listService.reorderBooksInList(getAuthenticatedUserId(), id, bookIds);
        return ResponseEntity.ok().build();
    }

    /**
     * Get default list by type
     */
    @GetMapping("/default/{type}")
    public ResponseEntity<ListDTO> getDefaultList(@PathVariable String type) {
        log.info("GET /api/lists/default/{}", type);

        ListType listType;
        try {
            listType = ListType.fromString(type);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid list type: {}", type);
            return ResponseEntity.badRequest().build();
        }

        if (listType == ListType.CUSTOM) {
            return ResponseEntity.badRequest().build();
        }

        ListDTO list = listService.getDefaultList(getAuthenticatedUserId(), listType);
        return ResponseEntity.ok(list);
    }
}
