package com.safegergis.tome_user_data.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.safegergis.tome_user_data.dto.AuthorStatisticsDTO;
import com.safegergis.tome_user_data.dto.CompletionStatisticsDTO;
import com.safegergis.tome_user_data.dto.ComprehensiveStatisticsDTO;
import com.safegergis.tome_user_data.dto.GenreStatisticsDTO;
import com.safegergis.tome_user_data.dto.ReadingMethodStatisticsDTO;
import com.safegergis.tome_user_data.dto.ReadingStreakDTO;
import com.safegergis.tome_user_data.dto.TimeSeriesStatisticsDTO;
import com.safegergis.tome_user_data.dto.TimeSeriesStatisticsDTO.TimePeriod;
import com.safegergis.tome_user_data.service.StatisticsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for Statistics operations
 * Provides endpoints for comprehensive reading analytics and statistics
 */
@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@Slf4j
public class StatisticsController {

    private final StatisticsService statisticsService;

    /**
     * Extract authenticated user ID from SecurityContext
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }

    /**
     * Get comprehensive statistics overview
     * Includes summary stats, method breakdown, top genres/authors, streak, and completion metrics
     */
    @GetMapping("/overview")
    public ResponseEntity<ComprehensiveStatisticsDTO> getOverview() {
        log.info("GET /api/statistics/overview");
        ComprehensiveStatisticsDTO stats = statisticsService.getComprehensiveStatistics(getAuthenticatedUserId());
        return ResponseEntity.ok(stats);
    }

    /**
     * Get time series statistics
     * Returns pages/minutes/sessions aggregated by specified time period
     *
     * @param period The time period (WEEK, MONTH, YEAR)
     * @param year Optional year for MONTH period (defaults to current year)
     */
    @GetMapping("/time-series")
    public ResponseEntity<TimeSeriesStatisticsDTO> getTimeSeries(
            @RequestParam TimePeriod period,
            @RequestParam(required = false) Integer year) {
        log.info("GET /api/statistics/time-series?period={}&year={}", period, year);
        TimeSeriesStatisticsDTO stats = statisticsService.getTimeSeriesStatistics(
                getAuthenticatedUserId(), period, year);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get reading method statistics
     * Returns breakdown of reading by physical, ebook, and audiobook
     */
    @GetMapping("/reading-methods")
    public ResponseEntity<ReadingMethodStatisticsDTO> getReadingMethods() {
        log.info("GET /api/statistics/reading-methods");
        ReadingMethodStatisticsDTO stats = statisticsService.getReadingMethodStatistics(getAuthenticatedUserId());
        return ResponseEntity.ok(stats);
    }

    /**
     * Get genre statistics
     * Returns favorite genres with book counts and ratings
     *
     * @param limit Maximum number of genres to return (default: 10)
     */
    @GetMapping("/genres")
    public ResponseEntity<List<GenreStatisticsDTO>> getGenres(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("GET /api/statistics/genres?limit={}", limit);
        List<GenreStatisticsDTO> stats = statisticsService.getGenreStatistics(getAuthenticatedUserId(), limit);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get author statistics
     * Returns favorite authors with book counts and ratings
     *
     * @param limit Maximum number of authors to return (default: 10)
     */
    @GetMapping("/authors")
    public ResponseEntity<List<AuthorStatisticsDTO>> getAuthors(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("GET /api/statistics/authors?limit={}", limit);
        List<AuthorStatisticsDTO> stats = statisticsService.getAuthorStatistics(getAuthenticatedUserId(), limit);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get reading streak statistics
     * Returns current and longest reading streaks
     */
    @GetMapping("/streaks")
    public ResponseEntity<ReadingStreakDTO> getStreaks() {
        log.info("GET /api/statistics/streaks");
        ReadingStreakDTO stats = statisticsService.getReadingStreak(getAuthenticatedUserId());
        return ResponseEntity.ok(stats);
    }

    /**
     * Get completion statistics
     * Returns completion rates, DNF analysis, and reading velocity
     */
    @GetMapping("/completion")
    public ResponseEntity<CompletionStatisticsDTO> getCompletion() {
        log.info("GET /api/statistics/completion");
        CompletionStatisticsDTO stats = statisticsService.getCompletionStatistics(getAuthenticatedUserId());
        return ResponseEntity.ok(stats);
    }
}
