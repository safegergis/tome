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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.safegergis.tome_user_data.dto.CreateReadingSessionRequest;
import com.safegergis.tome_user_data.dto.ReadingSessionDTO;
import com.safegergis.tome_user_data.dto.ReadingStatisticsDTO;
import com.safegergis.tome_user_data.service.ReadingSessionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for ReadingSession operations
 * Extracts userId from JWT authentication
 */
@RestController
@RequestMapping("/api/reading-sessions")
@RequiredArgsConstructor
@Slf4j
public class ReadingSessionController {

    private final ReadingSessionService readingSessionService;

    /**
     * Extract authenticated user ID from SecurityContext
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }

    /**
     * Log a new reading session
     */
    @PostMapping
    public ResponseEntity<ReadingSessionDTO> logSession(@Valid @RequestBody CreateReadingSessionRequest request) {
        log.info("POST /api/reading-sessions - Logging session for book {}", request.getBookId());
        ReadingSessionDTO created = readingSessionService.logSession(getAuthenticatedUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get a specific reading session
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReadingSessionDTO> getSession(@PathVariable Long id) {
        log.info("GET /api/reading-sessions/{}", id);
        ReadingSessionDTO session = readingSessionService.getSession(getAuthenticatedUserId(), id);
        return ResponseEntity.ok(session);
    }

    /**
     * Get recent reading sessions
     */
    @GetMapping
    public ResponseEntity<List<ReadingSessionDTO>> getRecentSessions(
            @RequestParam(defaultValue = "20") int limit) {
        log.info("GET /api/reading-sessions?limit={}", limit);
        List<ReadingSessionDTO> sessions = readingSessionService.getRecentSessions(getAuthenticatedUserId(), limit);
        return ResponseEntity.ok(sessions);
    }

    /**
     * Get reading sessions for a specific book
     */
    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<ReadingSessionDTO>> getSessionsForBook(@PathVariable Long bookId) {
        log.info("GET /api/reading-sessions/book/{}", bookId);
        List<ReadingSessionDTO> sessions = readingSessionService.getSessionsForBook(getAuthenticatedUserId(), bookId);
        return ResponseEntity.ok(sessions);
    }

    /**
     * Get reading statistics for the user
     */
    @GetMapping("/stats")
    public ResponseEntity<ReadingStatisticsDTO> getUserStatistics() {
        log.info("GET /api/reading-sessions/stats");
        ReadingStatisticsDTO stats = readingSessionService.getUserStatistics(getAuthenticatedUserId());
        return ResponseEntity.ok(stats);
    }

    /**
     * Delete a reading session
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        log.info("DELETE /api/reading-sessions/{}", id);
        readingSessionService.deleteSession(getAuthenticatedUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
