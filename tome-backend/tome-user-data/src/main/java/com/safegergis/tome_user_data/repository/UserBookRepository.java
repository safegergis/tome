package com.safegergis.tome_user_data.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.safegergis.tome_user_data.enums.ReadingStatus;
import com.safegergis.tome_user_data.model.UserBook;

@Repository
public interface UserBookRepository extends JpaRepository<UserBook, Long> {

    /**
     * Find a user's book by user ID and book ID
     */
    Optional<UserBook> findByUserIdAndBookId(Long userId, Long bookId);

    /**
     * Find all books for a user
     */
    List<UserBook> findByUserId(Long userId);

    /**
     * Find books for a user filtered by reading status
     * Using native query with explicit CAST for PostgreSQL ENUM compatibility
     */
    @Query(value = "SELECT * FROM user_books WHERE user_id = :userId AND status = CAST(:status AS reading_status)", nativeQuery = true)
    List<UserBook> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);

    /**
     * Check if a user has added a specific book
     */
    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    /**
     * Find all users who have a specific book
     */
    List<UserBook> findByBookId(Long bookId);

    /**
     * Find recent books for a user filtered by status
     * Using native query with explicit CAST for PostgreSQL ENUM compatibility
     */
    @Query(value = "SELECT * FROM user_books WHERE user_id = :userId AND status = CAST(:status AS reading_status) ORDER BY updated_at DESC LIMIT :limit", nativeQuery = true)
    List<UserBook> findRecentByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status, @Param("limit") int limit);

    /**
     * Find all books for a user ordered by updated date
     */
    @Query("SELECT ub FROM UserBook ub WHERE ub.userId = :userId ORDER BY ub.updatedAt DESC")
    List<UserBook> findByUserIdOrderByUpdatedAtDesc(@Param("userId") Long userId);

    /**
     * Count books by status for a user
     * Using native query with explicit CAST for PostgreSQL ENUM compatibility
     */
    @Query(value = "SELECT COUNT(*) FROM user_books WHERE user_id = :userId AND status = CAST(:status AS reading_status)", nativeQuery = true)
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
}
