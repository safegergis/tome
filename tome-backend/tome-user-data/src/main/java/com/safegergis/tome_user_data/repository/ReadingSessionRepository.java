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
}
