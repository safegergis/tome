package com.safegergis.tome_user_data.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.safegergis.tome_user_data.enums.FriendRequestStatus;
import com.safegergis.tome_user_data.model.FriendRequest;

/**
 * Repository for FriendRequest entities
 */
@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    /**
     * Find a friend request by requester, addressee, and status
     */
    Optional<FriendRequest> findByRequesterIdAndAddresseeIdAndStatusAndDeletedAtIsNull(
            Long requesterId, Long addresseeId, FriendRequestStatus status);

    /**
     * Find any existing request between two users (either direction)
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE " +
            "((fr.requesterId = :userId1 AND fr.addresseeId = :userId2) OR " +
            "(fr.requesterId = :userId2 AND fr.addresseeId = :userId1)) " +
            "AND fr.deletedAt IS NULL")
    Optional<FriendRequest> findExistingRequestBetweenUsers(
            @Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Find a pending request from one user to another (specific direction)
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.requesterId = :requesterId " +
            "AND fr.addresseeId = :addresseeId AND fr.status = 'PENDING' AND fr.deletedAt IS NULL")
    Optional<FriendRequest> findPendingRequest(
            @Param("requesterId") Long requesterId, @Param("addresseeId") Long addresseeId);

    /**
     * Get incoming friend requests for a user (paginated)
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.addresseeId = :userId " +
            "AND fr.status = :status AND fr.deletedAt IS NULL ORDER BY fr.createdAt DESC")
    Page<FriendRequest> findIncomingRequests(
            @Param("userId") Long userId,
            @Param("status") FriendRequestStatus status,
            Pageable pageable);

    /**
     * Get all incoming friend requests for a user (paginated)
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.addresseeId = :userId " +
            "AND fr.deletedAt IS NULL ORDER BY fr.createdAt DESC")
    Page<FriendRequest> findAllIncomingRequests(
            @Param("userId") Long userId,
            Pageable pageable);

    /**
     * Get outgoing friend requests for a user (paginated)
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.requesterId = :userId " +
            "AND fr.status = :status AND fr.deletedAt IS NULL ORDER BY fr.createdAt DESC")
    Page<FriendRequest> findOutgoingRequests(
            @Param("userId") Long userId,
            @Param("status") FriendRequestStatus status,
            Pageable pageable);

    /**
     * Get all outgoing friend requests for a user (paginated)
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.requesterId = :userId " +
            "AND fr.deletedAt IS NULL ORDER BY fr.createdAt DESC")
    Page<FriendRequest> findAllOutgoingRequests(
            @Param("userId") Long userId,
            Pageable pageable);

    /**
     * Count pending incoming requests for a user
     */
    long countByAddresseeIdAndStatusAndDeletedAtIsNull(Long addresseeId, FriendRequestStatus status);
}
