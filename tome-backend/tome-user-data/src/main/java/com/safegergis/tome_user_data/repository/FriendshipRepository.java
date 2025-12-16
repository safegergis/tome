package com.safegergis.tome_user_data.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.safegergis.tome_user_data.model.Friendship;

/**
 * Repository for Friendship entities
 */
@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /**
     * Check if friendship exists between two users (either direction)
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Friendship f " +
            "WHERE ((f.userId = :userId1 AND f.friendId = :userId2) OR " +
            "(f.userId = :userId2 AND f.friendId = :userId1)) AND f.deletedAt IS NULL")
    boolean existsBetweenUsers(
            @Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Find friendship between two users (either direction)
     */
    @Query("SELECT f FROM Friendship f WHERE " +
            "((f.userId = :userId1 AND f.friendId = :userId2) OR " +
            "(f.userId = :userId2 AND f.friendId = :userId1)) AND f.deletedAt IS NULL")
    Optional<Friendship> findBetweenUsers(
            @Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Get all friendships for a user (paginated)
     * Returns friendships where user appears in either userId or friendId column
     */
    @Query("SELECT f FROM Friendship f WHERE " +
            "(f.userId = :userId OR f.friendId = :userId) AND f.deletedAt IS NULL " +
            "ORDER BY f.createdAt DESC")
    Page<Friendship> findAllFriendships(@Param("userId") Long userId, Pageable pageable);

    /**
     * Count friends for a user
     */
    @Query("SELECT COUNT(f) FROM Friendship f WHERE " +
            "(f.userId = :userId OR f.friendId = :userId) AND f.deletedAt IS NULL")
    long countFriends(@Param("userId") Long userId);
}
