package com.safegergis.tome_user_data.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safegergis.tome_user_data.dto.AuthorStatisticsDTO;
import com.safegergis.tome_user_data.dto.BookSummaryDTO;
import com.safegergis.tome_user_data.dto.CompletionStatisticsDTO;
import com.safegergis.tome_user_data.dto.ComprehensiveStatisticsDTO;
import com.safegergis.tome_user_data.dto.GenreStatisticsDTO;
import com.safegergis.tome_user_data.dto.ReadingMethodStatisticsDTO;
import com.safegergis.tome_user_data.dto.ReadingStreakDTO;
import com.safegergis.tome_user_data.dto.TimeSeriesStatisticsDTO;
import com.safegergis.tome_user_data.dto.TimeSeriesStatisticsDTO.TimePeriod;
import com.safegergis.tome_user_data.repository.ReadingSessionRepository;
import com.safegergis.tome_user_data.repository.UserBookRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service layer for Statistics operations
 * Handles aggregation and calculation of reading statistics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsService {

    private final ReadingSessionRepository sessionRepository;
    private final UserBookRepository userBookRepository;
    private final BookServiceClient bookServiceClient;

    /**
     * Get comprehensive statistics overview
     * Aggregates multiple statistics into a single response
     */
    @Cacheable(value = "statistics", key = "#userId")
    @Transactional(readOnly = true)
    public ComprehensiveStatisticsDTO getComprehensiveStatistics(Long userId) {
        log.debug("Getting comprehensive statistics for user {}", userId);

        // Get total books by status
        long totalRead = userBookRepository.countByUserIdAndStatus(userId, "READ");
        long currentlyReading = userBookRepository.countByUserIdAndStatus(userId, "CURRENTLY_READING");

        // Get total pages and minutes
        List<Object[]> totalsList = sessionRepository.getTotalPagesAndMinutes(userId);
        Long totalPages = 0L;
        Long totalMinutes = 0L;
        if (!totalsList.isEmpty()) {
            Object[] totals = totalsList.get(0);
            totalPages = ((Number) totals[0]).longValue();
            totalMinutes = ((Number) totals[1]).longValue();
        }

        // Build summary stats
        ComprehensiveStatisticsDTO.SummaryStats summary = ComprehensiveStatisticsDTO.SummaryStats.builder()
                .totalBooksRead(totalRead)
                .totalPagesRead(totalPages)
                .totalMinutesRead(totalMinutes)
                .currentlyReadingCount(currentlyReading)
                .build();

        // Get reading method breakdown
        ReadingMethodStatisticsDTO methodStats = getReadingMethodStatistics(userId);
        ComprehensiveStatisticsDTO.ReadingMethodBreakdown methodBreakdown =
                ComprehensiveStatisticsDTO.ReadingMethodBreakdown.builder()
                        .physical(convertMethodBreakdown(methodStats.getPhysical()))
                        .ebook(convertMethodBreakdown(methodStats.getEbook()))
                        .audiobook(convertMethodBreakdown(methodStats.getAudiobook()))
                        .preferredMethod(methodStats.getPreferredMethod())
                        .build();

        // Get top 5 genres and authors
        List<GenreStatisticsDTO> genreStats = getGenreStatistics(userId, 5);
        List<ComprehensiveStatisticsDTO.GenreStatDTO> topGenres = genreStats.stream()
                .map(g -> ComprehensiveStatisticsDTO.GenreStatDTO.builder()
                        .genreId(g.getGenreId())
                        .genreName(g.getGenreName())
                        .booksRead(g.getBooksRead())
                        .totalBooks(g.getTotalBooks())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        List<AuthorStatisticsDTO> authorStats = getAuthorStatistics(userId, 5);
        List<ComprehensiveStatisticsDTO.AuthorStatDTO> topAuthors = authorStats.stream()
                .map(a -> ComprehensiveStatisticsDTO.AuthorStatDTO.builder()
                        .authorId(a.getAuthorId())
                        .authorName(a.getAuthorName())
                        .booksRead(a.getBooksRead())
                        .totalBooks(a.getTotalBooks())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        // Get reading streak
        ReadingStreakDTO streakDTO = getReadingStreak(userId);
        ComprehensiveStatisticsDTO.ReadingStreakInfo streak =
                ComprehensiveStatisticsDTO.ReadingStreakInfo.builder()
                        .currentStreak(streakDTO.getCurrentStreak())
                        .longestStreak(streakDTO.getLongestStreak())
                        .build();

        // Get completion metrics
        CompletionStatisticsDTO completionDTO = getCompletionStatistics(userId);
        ComprehensiveStatisticsDTO.CompletionMetrics completion =
                ComprehensiveStatisticsDTO.CompletionMetrics.builder()
                        .totalStarted(completionDTO.getTotalStarted())
                        .totalCompleted(completionDTO.getTotalCompleted())
                        .totalDnf(completionDTO.getTotalDnf())
                        .completionRate(completionDTO.getCompletionRate())
                        .build();

        return ComprehensiveStatisticsDTO.builder()
                .userId(userId)
                .summary(summary)
                .methodBreakdown(methodBreakdown)
                .topGenres(topGenres)
                .topAuthors(topAuthors)
                .streak(streak)
                .completion(completion)
                .build();
    }

    /**
     * Convert ReadingMethodStatisticsDTO.MethodBreakdown to ComprehensiveStatisticsDTO.ReadingMethodBreakdown.MethodStats
     */
    private ComprehensiveStatisticsDTO.ReadingMethodBreakdown.MethodStats convertMethodBreakdown(
            ReadingMethodStatisticsDTO.MethodBreakdown breakdown) {
        if (breakdown == null) {
            return null;
        }
        return ComprehensiveStatisticsDTO.ReadingMethodBreakdown.MethodStats.builder()
                .booksCount(breakdown.getBooksCount())
                .pagesRead(breakdown.getPagesRead())
                .minutesRead(breakdown.getMinutesRead())
                .sessionsCount(breakdown.getSessionsCount())
                .percentage(breakdown.getPercentage())
                .build();
    }

    /**
     * Get time series statistics for specified period
     */
    @Transactional(readOnly = true)
    public TimeSeriesStatisticsDTO getTimeSeriesStatistics(Long userId, TimePeriod period, Integer year) {
        log.debug("Getting time series statistics for user {}, period: {}, year: {}", userId, period, year);

        List<TimeSeriesStatisticsDTO.TimeSeriesDataPoint> dataPoints = new ArrayList<>();

        if (period == TimePeriod.WEEK) {
            // Last 52 weeks
            LocalDate startDate = LocalDate.now().minusWeeks(52);
            List<Object[]> weeklyData = sessionRepository.getWeeklyTimeSeriesData(userId, startDate);

            for (Object[] row : weeklyData) {
                java.sql.Date sqlDate = (java.sql.Date) row[0];
                LocalDate weekStart = sqlDate.toLocalDate();
                Long totalPages = ((Number) row[1]).longValue();
                Long totalMinutes = ((Number) row[2]).longValue();
                Integer sessionCount = ((Number) row[3]).intValue();

                dataPoints.add(TimeSeriesStatisticsDTO.TimeSeriesDataPoint.builder()
                        .label("Week of " + weekStart.toString())
                        .startDate(weekStart)
                        .endDate(weekStart.plusDays(6))
                        .pagesRead(totalPages)
                        .minutesRead(totalMinutes)
                        .sessionsCount(sessionCount)
                        .build());
            }
        } else if (period == TimePeriod.MONTH) {
            // 12 months of specified year (default current year)
            int targetYear = year != null ? year : LocalDate.now().getYear();
            List<Object[]> monthlyData = sessionRepository.getMonthlyTimeSeriesData(userId, targetYear);

            for (Object[] row : monthlyData) {
                java.sql.Date sqlDate = (java.sql.Date) row[0];
                LocalDate monthStart = sqlDate.toLocalDate();
                Long totalPages = ((Number) row[1]).longValue();
                Long totalMinutes = ((Number) row[2]).longValue();
                Integer sessionCount = ((Number) row[3]).intValue();

                dataPoints.add(TimeSeriesStatisticsDTO.TimeSeriesDataPoint.builder()
                        .label(monthStart.getMonth().toString())
                        .startDate(monthStart)
                        .endDate(monthStart.plusMonths(1).minusDays(1))
                        .pagesRead(totalPages)
                        .minutesRead(totalMinutes)
                        .sessionsCount(sessionCount)
                        .build());
            }
        } else if (period == TimePeriod.YEAR) {
            // Aggregate by month for current year
            int targetYear = year != null ? year : LocalDate.now().getYear();
            List<Object[]> monthlyData = sessionRepository.getMonthlyTimeSeriesData(userId, targetYear);

            for (Object[] row : monthlyData) {
                java.sql.Date sqlDate = (java.sql.Date) row[0];
                LocalDate monthStart = sqlDate.toLocalDate();
                Long totalPages = ((Number) row[1]).longValue();
                Long totalMinutes = ((Number) row[2]).longValue();
                Integer sessionCount = ((Number) row[3]).intValue();

                dataPoints.add(TimeSeriesStatisticsDTO.TimeSeriesDataPoint.builder()
                        .label(monthStart.getMonth().toString())
                        .startDate(monthStart)
                        .endDate(monthStart.plusMonths(1).minusDays(1))
                        .pagesRead(totalPages)
                        .minutesRead(totalMinutes)
                        .sessionsCount(sessionCount)
                        .build());
            }
        }

        return TimeSeriesStatisticsDTO.builder()
                .period(period)
                .dataPoints(dataPoints)
                .build();
    }

    /**
     * Get reading method statistics
     */
    @Transactional(readOnly = true)
    public ReadingMethodStatisticsDTO getReadingMethodStatistics(Long userId) {
        log.debug("Getting reading method statistics for user {}", userId);

        List<Object[]> methodData = sessionRepository.getReadingMethodBreakdown(userId);

        ReadingMethodStatisticsDTO.MethodBreakdown physical = null;
        ReadingMethodStatisticsDTO.MethodBreakdown ebook = null;
        ReadingMethodStatisticsDTO.MethodBreakdown audiobook = null;

        long totalSessions = 0;
        com.safegergis.tome_user_data.enums.ReadingMethod preferredMethod = null;
        int maxSessions = 0;

        for (Object[] row : methodData) {
            String method = (String) row[0];
            Integer booksCount = ((Number) row[1]).intValue();
            Long pagesRead = ((Number) row[2]).longValue();
            Long minutesRead = ((Number) row[3]).longValue();
            Integer sessionsCount = ((Number) row[4]).intValue();

            totalSessions += sessionsCount;

            if (sessionsCount > maxSessions) {
                maxSessions = sessionsCount;
                preferredMethod = com.safegergis.tome_user_data.enums.ReadingMethod.valueOf(method);
            }

            ReadingMethodStatisticsDTO.MethodBreakdown breakdown = ReadingMethodStatisticsDTO.MethodBreakdown.builder()
                    .booksCount(booksCount)
                    .pagesRead(pagesRead)
                    .minutesRead(minutesRead)
                    .sessionsCount(sessionsCount)
                    .percentage(0.0) // Will calculate after we have total
                    .build();

            if ("PHYSICAL".equals(method)) {
                physical = breakdown;
            } else if ("EBOOK".equals(method)) {
                ebook = breakdown;
            } else if ("AUDIOBOOK".equals(method)) {
                audiobook = breakdown;
            }
        }

        // Calculate percentages
        final long finalTotalSessions = totalSessions;
        if (physical != null) {
            physical.setPercentage((physical.getSessionsCount() * 100.0) / finalTotalSessions);
        }
        if (ebook != null) {
            ebook.setPercentage((ebook.getSessionsCount() * 100.0) / finalTotalSessions);
        }
        if (audiobook != null) {
            audiobook.setPercentage((audiobook.getSessionsCount() * 100.0) / finalTotalSessions);
        }

        // Create empty breakdowns for methods with no data
        if (physical == null) {
            physical = ReadingMethodStatisticsDTO.MethodBreakdown.builder()
                    .booksCount(0).pagesRead(0L).minutesRead(0L).sessionsCount(0).percentage(0.0).build();
        }
        if (ebook == null) {
            ebook = ReadingMethodStatisticsDTO.MethodBreakdown.builder()
                    .booksCount(0).pagesRead(0L).minutesRead(0L).sessionsCount(0).percentage(0.0).build();
        }
        if (audiobook == null) {
            audiobook = ReadingMethodStatisticsDTO.MethodBreakdown.builder()
                    .booksCount(0).pagesRead(0L).minutesRead(0L).sessionsCount(0).percentage(0.0).build();
        }

        return ReadingMethodStatisticsDTO.builder()
                .userId(userId)
                .physical(physical)
                .ebook(ebook)
                .audiobook(audiobook)
                .preferredMethod(preferredMethod)
                .build();
    }

    /**
     * Get genre statistics
     */
    @Transactional(readOnly = true)
    public List<GenreStatisticsDTO> getGenreStatistics(Long userId, int limit) {
        log.debug("Getting genre statistics for user {} (limit: {})", userId, limit);

        // Fetch all user books
        List<com.safegergis.tome_user_data.model.UserBook> userBooks = userBookRepository.findByUserId(userId);

        if (userBooks.isEmpty()) {
            return new ArrayList<>();
        }

        // Extract unique book IDs
        Set<Long> bookIds = userBooks.stream()
                .map(com.safegergis.tome_user_data.model.UserBook::getBookId)
                .collect(java.util.stream.Collectors.toSet());

        // Batch fetch books with genres from tome-content
        Map<Long, BookServiceClient.BookDetailDTO> booksWithDetails = bookServiceClient.getBooksWithDetails(bookIds);

        // Map to aggregate genre statistics
        Map<Long, GenreStats> genreStatsMap = new java.util.HashMap<>();

        for (com.safegergis.tome_user_data.model.UserBook userBook : userBooks) {
            BookServiceClient.BookDetailDTO book = booksWithDetails.get(userBook.getBookId());
            if (book == null || book.getGenres() == null) {
                continue;
            }

            for (BookServiceClient.GenreDTO genre : book.getGenres()) {
                GenreStats stats = genreStatsMap.computeIfAbsent(genre.getId(),
                        k -> new GenreStats(genre.getId(), genre.getName()));

                // Count by status
                if ("READ".equals(userBook.getStatus().name())) {
                    stats.booksRead++;
                } else if ("CURRENTLY_READING".equals(userBook.getStatus().name())) {
                    stats.booksCurrentlyReading++;
                } else if ("WANT_TO_READ".equals(userBook.getStatus().name())) {
                    stats.booksWantToRead++;
                }

                stats.totalBooks++;

                // Add rating if present
                if (userBook.getPersonalRating() != null) {
                    stats.totalRating += userBook.getPersonalRating();
                    stats.ratingCount++;
                }
            }
        }

        // Convert to DTOs and sort by books read descending
        return genreStatsMap.values().stream()
                .map(stats -> GenreStatisticsDTO.builder()
                        .genreId(stats.genreId)
                        .genreName(stats.genreName)
                        .booksRead((long) stats.booksRead)
                        .booksCurrentlyReading((long) stats.booksCurrentlyReading)
                        .booksWantToRead((long) stats.booksWantToRead)
                        .totalBooks((long) stats.totalBooks)
                        .build())
                .sorted((a, b) -> Long.compare(b.getBooksRead(), a.getBooksRead()))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Get author statistics
     */
    @Transactional(readOnly = true)
    public List<AuthorStatisticsDTO> getAuthorStatistics(Long userId, int limit) {
        log.debug("Getting author statistics for user {} (limit: {})", userId, limit);

        // Fetch all user books
        List<com.safegergis.tome_user_data.model.UserBook> userBooks = userBookRepository.findByUserId(userId);

        if (userBooks.isEmpty()) {
            return new ArrayList<>();
        }

        // Extract unique book IDs
        Set<Long> bookIds = userBooks.stream()
                .map(com.safegergis.tome_user_data.model.UserBook::getBookId)
                .collect(java.util.stream.Collectors.toSet());

        // Batch fetch books with authors from tome-content
        Map<Long, BookServiceClient.BookDetailDTO> booksWithDetails = bookServiceClient.getBooksWithDetails(bookIds);

        // Map to aggregate author statistics
        Map<Long, AuthorStats> authorStatsMap = new java.util.HashMap<>();

        for (com.safegergis.tome_user_data.model.UserBook userBook : userBooks) {
            BookServiceClient.BookDetailDTO book = booksWithDetails.get(userBook.getBookId());
            if (book == null || book.getAuthors() == null) {
                continue;
            }

            for (BookServiceClient.AuthorDTO author : book.getAuthors()) {
                AuthorStats stats = authorStatsMap.computeIfAbsent(author.getId(),
                        k -> new AuthorStats(author.getId(), author.getName()));

                // Count by status
                if ("READ".equals(userBook.getStatus().name())) {
                    stats.booksRead++;
                } else if ("CURRENTLY_READING".equals(userBook.getStatus().name())) {
                    stats.booksCurrentlyReading++;
                } else if ("WANT_TO_READ".equals(userBook.getStatus().name())) {
                    stats.booksWantToRead++;
                }

                stats.totalBooks++;

                // Add rating if present
                if (userBook.getPersonalRating() != null) {
                    stats.totalRating += userBook.getPersonalRating();
                    stats.ratingCount++;
                }
            }
        }

        // Convert to DTOs and sort by books read descending
        return authorStatsMap.values().stream()
                .map(stats -> AuthorStatisticsDTO.builder()
                        .authorId(stats.authorId)
                        .authorName(stats.authorName)
                        .booksRead((long) stats.booksRead)
                        .booksCurrentlyReading((long) stats.booksCurrentlyReading)
                        .booksWantToRead((long) stats.booksWantToRead)
                        .totalBooks((long) stats.totalBooks)
                        .build())
                .sorted((a, b) -> Long.compare(b.getBooksRead(), a.getBooksRead()))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Get reading streak information
     */
    @Transactional(readOnly = true)
    public ReadingStreakDTO getReadingStreak(Long userId) {
        log.debug("Getting reading streak for user {}", userId);

        List<LocalDate> sessionDates = sessionRepository.getAllSessionDates(userId);
        return calculateStreaks(sessionDates);
    }

    /**
     * Get completion statistics
     */
    @Transactional(readOnly = true)
    public CompletionStatisticsDTO getCompletionStatistics(Long userId) {
        log.debug("Getting completion statistics for user {}", userId);

        // Get book counts by status
        long totalRead = userBookRepository.countByUserIdAndStatus(userId, "READ");
        long totalDnf = userBookRepository.countByUserIdAndStatus(userId, "DID_NOT_FINISH");
        long totalCurrentlyReading = userBookRepository.countByUserIdAndStatus(userId, "CURRENTLY_READING");

        // Total started = read + dnf + currently reading
        long totalStarted = totalRead + totalDnf + totalCurrentlyReading;

        // Calculate rates
        double completionRate = totalStarted > 0 ? (totalRead * 100.0) / totalStarted : 0.0;
        double dnfRate = totalStarted > 0 ? (totalDnf * 100.0) / totalStarted : 0.0;

        // Get DNF reasons
        List<Object[]> dnfReasonData = userBookRepository.getDnfReasonCounts(userId);
        List<CompletionStatisticsDTO.DnfReasonCount> dnfReasons = new ArrayList<>();
        for (Object[] row : dnfReasonData) {
            String reason = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            dnfReasons.add(CompletionStatisticsDTO.DnfReasonCount.builder()
                    .reason(reason)
                    .count(count)
                    .build());
        }

        // Calculate reading velocity
        Double avgDaysToComplete = userBookRepository.getAverageDaysToComplete(userId);
        List<Object[]> totalsList = sessionRepository.getTotalPagesAndMinutes(userId);
        Long totalPages = 0L;
        Long totalMinutes = 0L;
        if (!totalsList.isEmpty()) {
            Object[] totals = totalsList.get(0);
            totalPages = ((Number) totals[0]).longValue();
            totalMinutes = ((Number) totals[1]).longValue();
        }

        // Calculate average pages/minutes per day (based on total days with sessions)
        List<LocalDate> sessionDates = sessionRepository.getAllSessionDates(userId);
        long totalDaysWithSessions = sessionDates.size();

        double avgPagesPerDay = totalDaysWithSessions > 0 ? (totalPages * 1.0) / totalDaysWithSessions : 0.0;
        double avgMinutesPerDay = totalDaysWithSessions > 0 ? (totalMinutes * 1.0) / totalDaysWithSessions : 0.0;

        CompletionStatisticsDTO.ReadingVelocity velocity = CompletionStatisticsDTO.ReadingVelocity.builder()
                .avgDaysToComplete(avgDaysToComplete != null ? avgDaysToComplete : 0.0)
                .avgPagesPerDay(avgPagesPerDay)
                .avgMinutesPerDay(avgMinutesPerDay)
                .build();

        return CompletionStatisticsDTO.builder()
                .totalStarted(totalStarted)
                .totalCompleted(totalRead)
                .totalDnf(totalDnf)
                .completionRate(completionRate)
                .dnfRate(dnfRate)
                .dnfReasons(dnfReasons)
                .velocity(velocity)
                .build();
    }

    // ==================== Helper Methods ====================

    /**
     * Calculate current and longest reading streaks from session dates
     */
    private ReadingStreakDTO calculateStreaks(List<LocalDate> sessionDates) {
        if (sessionDates == null || sessionDates.isEmpty()) {
            return ReadingStreakDTO.builder()
                    .currentStreak(0)
                    .longestStreak(0)
                    .activeDates(new ArrayList<>())
                    .build();
        }

        // Dates are already sorted descending from the query
        LocalDate today = LocalDate.now();
        int currentStreak = 0;
        LocalDate currentStreakStartDate = null;

        // Calculate current streak (from today backwards)
        LocalDate checkDate = today;
        for (LocalDate sessionDate : sessionDates) {
            if (sessionDate.equals(checkDate) || sessionDate.equals(checkDate.minusDays(1))) {
                if (currentStreak == 0) {
                    currentStreakStartDate = sessionDate;
                }
                currentStreak++;
                checkDate = sessionDate.minusDays(1);
            } else if (sessionDate.isBefore(checkDate.minusDays(1))) {
                // Gap found, stop counting current streak
                break;
            }
        }

        // Calculate longest streak in history
        int longestStreak = 0;
        LocalDate longestStreakStartDate = null;
        LocalDate longestStreakEndDate = null;
        int tempStreak = 1;
        LocalDate tempStreakStart = sessionDates.get(0);
        LocalDate previousDate = sessionDates.get(0);

        for (int i = 1; i < sessionDates.size(); i++) {
            LocalDate currentDate = sessionDates.get(i);

            // Check if consecutive (dates are in descending order, so prev should be 1 day after current)
            if (previousDate.minusDays(1).equals(currentDate)) {
                tempStreak++;
            } else {
                // Streak broken, check if it was the longest
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                    longestStreakStartDate = currentDate;
                    longestStreakEndDate = previousDate;
                }
                // Start new streak
                tempStreak = 1;
                tempStreakStart = currentDate;
            }

            previousDate = currentDate;
        }

        // Check final streak
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
            longestStreakStartDate = sessionDates.get(sessionDates.size() - 1);
            longestStreakEndDate = sessionDates.get(0);
        }

        // Make sure current streak is at least as long as itself
        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
            longestStreakStartDate = currentStreakStartDate;
            longestStreakEndDate = today;
        }

        // Filter active dates for last 365 days (for heatmap)
        LocalDate oneYearAgo = today.minusDays(365);
        List<LocalDate> activeDates = sessionDates.stream()
                .filter(date -> date.isAfter(oneYearAgo) || date.equals(oneYearAgo))
                .collect(java.util.stream.Collectors.toList());

        return ReadingStreakDTO.builder()
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .currentStreakStartDate(currentStreakStartDate)
                .longestStreakStartDate(longestStreakStartDate)
                .longestStreakEndDate(longestStreakEndDate)
                .activeDates(activeDates)
                .build();
    }

    // ==================== Helper Classes ====================

    /**
     * Helper class for aggregating genre statistics
     */
    private static class GenreStats {
        Long genreId;
        String genreName;
        int booksRead = 0;
        int booksCurrentlyReading = 0;
        int booksWantToRead = 0;
        int totalBooks = 0;
        double totalRating = 0.0;
        int ratingCount = 0;

        GenreStats(Long genreId, String genreName) {
            this.genreId = genreId;
            this.genreName = genreName;
        }
    }

    /**
     * Helper class for aggregating author statistics
     */
    private static class AuthorStats {
        Long authorId;
        String authorName;
        int booksRead = 0;
        int booksCurrentlyReading = 0;
        int booksWantToRead = 0;
        int totalBooks = 0;
        double totalRating = 0.0;
        int ratingCount = 0;

        AuthorStats(Long authorId, String authorName) {
            this.authorId = authorId;
            this.authorName = authorName;
        }
    }
}
