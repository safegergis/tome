package com.safegergis.tome_user_data.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.safegergis.tome_user_data.model.BookList;

@Repository
public interface BookListRepository extends JpaRepository<BookList, Long> {

    /**
     * Find all non-deleted lists for a user
     */
    List<BookList> findByUserIdAndDeletedAtIsNull(Long userId);

    /**
     * Find a default list for a user by type
     * Using native query with explicit CAST for PostgreSQL ENUM compatibility
     */
    @Query(value = "SELECT * FROM lists WHERE user_id = :userId AND list_type = CAST(:listType AS list_type) AND is_default = true", nativeQuery = true)
    Optional<BookList> findByUserIdAndListTypeAndIsDefaultTrue(@Param("userId") Long userId, @Param("listType") String listType);

    /**
     * Find all public lists (excluding deleted)
     */
    List<BookList> findByIsPublicTrueAndDeletedAtIsNull();

    /**
     * Find active lists for a user ordered by creation date
     */
    @Query("SELECT bl FROM BookList bl WHERE bl.userId = :userId AND bl.deletedAt IS NULL ORDER BY bl.createdAt DESC")
    List<BookList> findActiveByUserId(@Param("userId") Long userId);

    /**
     * Check if a list exists and belongs to a user (and is not deleted)
     */
    boolean existsByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    /**
     * Find a list by ID if it's not deleted
     */
    Optional<BookList> findByIdAndDeletedAtIsNull(Long id);

    /**
     * Find recent public lists created by multiple users (for activity feed)
     */
    @Query("SELECT l FROM BookList l WHERE l.userId IN :userIds " +
           "AND l.isPublic = true AND l.deletedAt IS NULL " +
           "ORDER BY l.createdAt DESC")
    List<BookList> findRecentPublicListsByUserIds(
        @Param("userIds") List<Long> userIds,
        Pageable pageable);
}
