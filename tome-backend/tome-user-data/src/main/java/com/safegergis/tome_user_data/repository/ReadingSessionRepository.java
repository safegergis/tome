package com.safegergis.tome_user_data.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.safegergis.tome_user_data.model.ReadingSession;

@Repository
public interface ReadingSessionRepository extends JpaRepository<ReadingSession, Long> {

    /**
     * Find all sessions for a user
     */
    List<ReadingSession> findByUserId(Long userId);

    /**
     * Find sessions for a specific book by a user
     */
    List<ReadingSession> findByUserIdAndBookId(Long userId, Long bookId);

    /**
     * Find sessions within a date range for a user
     */
    List<ReadingSession> findByUserIdAndSessionDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    /**
     * Find recent sessions for a user, ordered by session date
     */
    @Query("SELECT rs FROM ReadingSession rs WHERE rs.userId = :userId ORDER BY rs.sessionDate DESC, rs.createdAt DESC")
    List<ReadingSession> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * Sum total pages read by a user since a given date
     */
    @Query("SELECT COALESCE(SUM(rs.pagesRead), 0) FROM ReadingSession rs WHERE rs.userId = :userId AND rs.sessionDate >= :startDate")
    Long sumPagesReadSince(@Param("userId") Long userId, @Param("startDate") LocalDate startDate);

    /**
     * Sum total minutes read by a user since a given date
     */
    @Query("SELECT COALESCE(SUM(rs.minutesRead), 0) FROM ReadingSession rs WHERE rs.userId = :userId AND rs.sessionDate >= :startDate")
    Long sumMinutesReadSince(@Param("userId") Long userId, @Param("startDate") LocalDate startDate);

    /**
     * Count sessions for a user since a given date
     */
    @Query("SELECT COUNT(rs) FROM ReadingSession rs WHERE rs.userId = :userId AND rs.sessionDate >= :startDate")
    long countSessionsSince(@Param("userId") Long userId, @Param("startDate") LocalDate startDate);

    /**
     * Find all sessions for a user ordered by date descending
     */
    @Query("SELECT rs FROM ReadingSession rs WHERE rs.userId = :userId ORDER BY rs.sessionDate DESC, rs.createdAt DESC")
    List<ReadingSession> findByUserIdOrderBySessionDateDesc(@Param("userId") Long userId);

    /**
     * Find recent sessions for multiple users (for activity feed)
     */
    @Query("SELECT rs FROM ReadingSession rs WHERE rs.userId IN :userIds " +
           "ORDER BY rs.createdAt DESC")
    List<ReadingSession> findRecentByUserIds(
        @Param("userIds") List<Long> userIds,
        Pageable pageable);

    // ==================== Statistics Queries ====================

    /**
     * Get time-series data aggregated by week
     * Returns: weekStart (Date), totalPages (Long), totalMinutes (Long), sessionCount (Long)
     */
    @Query(value = """
        SELECT
            DATE_TRUNC('week', session_date) as week_start,
            COALESCE(SUM(pages_read), 0) as total_pages,
            COALESCE(SUM(minutes_read), 0) as total_minutes,
            COUNT(id) as session_count
        FROM reading_sessions
        WHERE user_id = :userId AND session_date >= :startDate
        GROUP BY DATE_TRUNC('week', session_date)
        ORDER BY week_start
        """, nativeQuery = true)
    List<Object[]> getWeeklyTimeSeriesData(@Param("userId") Long userId, @Param("startDate") LocalDate startDate);

    /**
     * Get time-series data aggregated by month for a specific year
     * Returns: monthStart (Date), totalPages (Long), totalMinutes (Long), sessionCount (Long)
     */
    @Query(value = """
        SELECT
            DATE_TRUNC('month', session_date) as month_start,
            COALESCE(SUM(pages_read), 0) as total_pages,
            COALESCE(SUM(minutes_read), 0) as total_minutes,
            COUNT(id) as session_count
        FROM reading_sessions
        WHERE user_id = :userId AND EXTRACT(YEAR FROM session_date) = :year
        GROUP BY DATE_TRUNC('month', session_date)
        ORDER BY month_start
        """, nativeQuery = true)
    List<Object[]> getMonthlyTimeSeriesData(@Param("userId") Long userId, @Param("year") int year);

    /**
     * Get reading method breakdown
     * Returns: readingMethod (String), bookCount (Long), totalPages (Long), totalMinutes (Long), sessionCount (Long)
     */
    @Query(value = """
        SELECT
            reading_method,
            COUNT(DISTINCT book_id) as book_count,
            COALESCE(SUM(pages_read), 0) as total_pages,
            COALESCE(SUM(minutes_read), 0) as total_minutes,
            COUNT(id) as session_count
        FROM reading_sessions
        WHERE user_id = :userId
        GROUP BY reading_method
        """, nativeQuery = true)
    List<Object[]> getReadingMethodBreakdown(@Param("userId") Long userId);

    /**
     * Get all distinct session dates for a user (for streak calculation)
     */
    @Query("SELECT DISTINCT rs.sessionDate FROM ReadingSession rs WHERE rs.userId = :userId ORDER BY rs.sessionDate DESC")
    List<LocalDate> getAllSessionDates(@Param("userId") Long userId);

    /**
     * Get total pages and minutes ever read by a user
     * Returns: totalPages (Long), totalMinutes (Long)
     */
    @Query(value = """
        SELECT
            COALESCE(SUM(pages_read), 0) as total_pages,
            COALESCE(SUM(minutes_read), 0) as total_minutes
        FROM reading_sessions
        WHERE user_id = :userId
        """, nativeQuery = true)
    List<Object[]> getTotalPagesAndMinutes(@Param("userId") Long userId);
}
