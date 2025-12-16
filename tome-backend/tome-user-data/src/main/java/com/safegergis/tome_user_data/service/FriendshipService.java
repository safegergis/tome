package com.safegergis.tome_user_data.service;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safegergis.tome_user_data.dto.FriendRequestDTO;
import com.safegergis.tome_user_data.dto.FriendshipDTO;
import com.safegergis.tome_user_data.dto.UserSummaryDTO;
import com.safegergis.tome_user_data.enums.FriendRequestStatus;
import com.safegergis.tome_user_data.exception.DuplicateResourceException;
import com.safegergis.tome_user_data.exception.ForbiddenException;
import com.safegergis.tome_user_data.exception.ResourceNotFoundException;
import com.safegergis.tome_user_data.mapper.FriendRequestMapper;
import com.safegergis.tome_user_data.mapper.FriendshipMapper;
import com.safegergis.tome_user_data.model.FriendRequest;
import com.safegergis.tome_user_data.model.Friendship;
import com.safegergis.tome_user_data.repository.FriendRequestRepository;
import com.safegergis.tome_user_data.repository.FriendshipRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service layer for friendship operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FriendshipService {

    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserServiceClient userServiceClient;

    /**
     * Send a friend request to another user
     */
    @Transactional
    public FriendRequestDTO sendFriendRequest(Long requesterId, Long addresseeId) {
        log.debug("User {} sending friend request to user {}", requesterId, addresseeId);

        // Validate not sending to self
        if (requesterId.equals(addresseeId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        // Verify addressee exists in tome-auth
        UserSummaryDTO addressee = userServiceClient.getUser(addresseeId);

        // Check for existing friendship
        if (friendshipRepository.existsBetweenUsers(requesterId, addresseeId)) {
            throw new DuplicateResourceException("Friendship",
                    "users " + requesterId + " and " + addresseeId);
        }

        // Check for existing request in either direction
        var existingRequest = friendRequestRepository
                .findExistingRequestBetweenUsers(requesterId, addresseeId);

        if (existingRequest.isPresent()) {
            FriendRequest existing = existingRequest.get();

            // If there's a pending request from the addressee to the requester
            // inform user to check their incoming requests instead
            if (existing.getRequesterId().equals(addresseeId) &&
                    existing.getAddresseeId().equals(requesterId) &&
                    existing.getStatus() == FriendRequestStatus.PENDING) {
                throw new DuplicateResourceException("FriendRequest",
                        "This user has already sent you a friend request. Check your incoming requests.");
            }

            // If there's already a pending request from requester to addressee
            if (existing.getRequesterId().equals(requesterId) &&
                    existing.getAddresseeId().equals(addresseeId) &&
                    existing.getStatus() == FriendRequestStatus.PENDING) {
                throw new DuplicateResourceException("FriendRequest",
                        "users " + requesterId + " and " + addresseeId);
            }

            // If rejected request exists, soft delete it to allow new request
            if (existing.getStatus() == FriendRequestStatus.REJECTED) {
                existing.setDeletedAt(OffsetDateTime.now());
                friendRequestRepository.save(existing);
            }
        }

        // Create new friend request
        FriendRequest request = FriendRequest.builder()
                .requesterId(requesterId)
                .addresseeId(addresseeId)
                .status(FriendRequestStatus.PENDING)
                .build();

        FriendRequest saved = friendRequestRepository.save(request);

        // Enrich with user data
        UserSummaryDTO requester = userServiceClient.getUser(requesterId);
        return FriendRequestMapper.toDTO(saved, requester, addressee);
    }

    /**
     * Accept a friend request
     */
    @Transactional
    public FriendshipDTO acceptFriendRequest(Long addresseeId, Long requestId) {
        log.debug("User {} accepting friend request {}", addresseeId, requestId);

        // Find request
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", requestId));

        // Validate addressee is the recipient
        if (!request.getAddresseeId().equals(addresseeId)) {
            throw new ForbiddenException("You are not authorized to accept this friend request");
        }

        // Validate status is PENDING
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new IllegalArgumentException("Friend request is not in PENDING status");
        }

        // Create friendship with ordered IDs
        Friendship friendship = createFriendship(request.getRequesterId(), request.getAddresseeId());
        Friendship saved = friendshipRepository.save(friendship);

        // Soft delete the request
        request.setDeletedAt(OffsetDateTime.now());
        friendRequestRepository.save(request);

        // Enrich with user data and return from addressee's perspective
        Long friendId = request.getRequesterId();
        UserSummaryDTO friend = userServiceClient.getUser(friendId);

        return FriendshipMapper.toDTO(saved, addresseeId, friend);
    }

    /**
     * Reject a friend request
     */
    @Transactional
    public void rejectFriendRequest(Long addresseeId, Long requestId) {
        log.debug("User {} rejecting friend request {}", addresseeId, requestId);

        // Find request
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", requestId));

        // Validate addressee is the recipient
        if (!request.getAddresseeId().equals(addresseeId)) {
            throw new ForbiddenException("You are not authorized to reject this friend request");
        }

        // Validate status is PENDING
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new IllegalArgumentException("Friend request is not in PENDING status");
        }

        // Update status to REJECTED
        request.setStatus(FriendRequestStatus.REJECTED);
        friendRequestRepository.save(request);
    }

    /**
     * Cancel an outgoing friend request
     */
    @Transactional
    public void cancelFriendRequest(Long requesterId, Long requestId) {
        log.debug("User {} canceling friend request {}", requesterId, requestId);

        // Find request
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", requestId));

        // Validate requester is the sender
        if (!request.getRequesterId().equals(requesterId)) {
            throw new ForbiddenException("You are not authorized to cancel this friend request");
        }

        // Validate status is PENDING
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new IllegalArgumentException("Friend request is not in PENDING status");
        }

        // Soft delete the request
        request.setDeletedAt(OffsetDateTime.now());
        friendRequestRepository.save(request);
    }

    /**
     * Get friends list (paginated)
     */
    @Transactional(readOnly = true)
    public Page<FriendshipDTO> getFriends(Long userId, Pageable pageable) {
        log.debug("Fetching friends for user {} (page {})", userId, pageable.getPageNumber());

        // Query friendships
        Page<Friendship> friendships = friendshipRepository.findAllFriendships(userId, pageable);

        // Extract friend IDs for batch fetching
        Set<Long> friendIds = friendships.getContent().stream()
                .map(friendship -> {
                    // Get the other user's ID from perspective of userId
                    return friendship.getUserId().equals(userId)
                            ? friendship.getFriendId()
                            : friendship.getUserId();
                })
                .collect(Collectors.toSet());

        // Batch fetch user data
        Map<Long, UserSummaryDTO> users = userServiceClient.getUsers(friendIds);

        // Map to DTOs
        List<FriendshipDTO> dtos = friendships.getContent().stream()
                .map(friendship -> {
                    Long friendId = friendship.getUserId().equals(userId)
                            ? friendship.getFriendId()
                            : friendship.getUserId();
                    UserSummaryDTO friend = users.get(friendId);
                    return FriendshipMapper.toDTO(friendship, userId, friend);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, friendships.getTotalElements());
    }

    /**
     * Get incoming friend requests (paginated)
     */
    @Transactional(readOnly = true)
    public Page<FriendRequestDTO> getIncomingRequests(
            Long userId,
            FriendRequestStatus status,
            Pageable pageable) {
        log.debug("Fetching incoming requests for user {} with status {} (page {})",
                userId, status, pageable.getPageNumber());

        // Query requests
        Page<FriendRequest> requests;
        if (status != null) {
            requests = friendRequestRepository.findIncomingRequests(userId, status, pageable);
        } else {
            requests = friendRequestRepository.findAllIncomingRequests(userId, pageable);
        }

        // Extract requester IDs for batch fetching
        Set<Long> requesterIds = requests.getContent().stream()
                .map(FriendRequest::getRequesterId)
                .collect(Collectors.toSet());

        // Add addressee ID (the current user)
        Set<Long> allUserIds = new HashSet<>(requesterIds);
        allUserIds.add(userId);

        // Batch fetch user data
        Map<Long, UserSummaryDTO> users = userServiceClient.getUsers(allUserIds);

        // Map to DTOs
        List<FriendRequestDTO> dtos = requests.getContent().stream()
                .map(request -> FriendRequestMapper.toDTO(
                        request,
                        users.get(request.getRequesterId()),
                        users.get(request.getAddresseeId())))
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, requests.getTotalElements());
    }

    /**
     * Get outgoing friend requests (paginated)
     */
    @Transactional(readOnly = true)
    public Page<FriendRequestDTO> getOutgoingRequests(
            Long userId,
            FriendRequestStatus status,
            Pageable pageable) {
        log.debug("Fetching outgoing requests for user {} with status {} (page {})",
                userId, status, pageable.getPageNumber());

        // Query requests
        Page<FriendRequest> requests;
        if (status != null) {
            requests = friendRequestRepository.findOutgoingRequests(userId, status, pageable);
        } else {
            requests = friendRequestRepository.findAllOutgoingRequests(userId, pageable);
        }

        // Extract addressee IDs for batch fetching
        Set<Long> addresseeIds = requests.getContent().stream()
                .map(FriendRequest::getAddresseeId)
                .collect(Collectors.toSet());

        // Add requester ID (the current user)
        Set<Long> allUserIds = new HashSet<>(addresseeIds);
        allUserIds.add(userId);

        // Batch fetch user data
        Map<Long, UserSummaryDTO> users = userServiceClient.getUsers(allUserIds);

        // Map to DTOs
        List<FriendRequestDTO> dtos = requests.getContent().stream()
                .map(request -> FriendRequestMapper.toDTO(
                        request,
                        users.get(request.getRequesterId()),
                        users.get(request.getAddresseeId())))
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, requests.getTotalElements());
    }

    /**
     * Unfriend / Remove friendship
     */
    @Transactional
    public void unfriend(Long userId, Long friendId) {
        log.debug("User {} unfriending user {}", userId, friendId);

        // Find friendship
        Friendship friendship = friendshipRepository.findBetweenUsers(userId, friendId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship",
                        "between users " + userId + " and " + friendId));

        // Soft delete
        friendship.setDeletedAt(OffsetDateTime.now());
        friendshipRepository.save(friendship);
    }

    /**
     * Get friends count for a user
     */
    @Transactional(readOnly = true)
    public Long getFriendsCount(Long userId) {
        log.debug("Fetching friends count for user {}", userId);
        return friendshipRepository.countFriends(userId);
    }

    /**
     * Get friendship status between two users
     * Returns status information including IDs needed for actions
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getFriendshipStatus(Long userId, Long targetUserId) {
        log.debug("Checking friendship status between user {} and user {}", userId, targetUserId);

        // Check if they are friends
        var friendship = friendshipRepository.findBetweenUsers(userId, targetUserId);
        if (friendship.isPresent()) {
            return Map.of(
                "status", "friends",
                "friendshipId", friendship.get().getId()
            );
        }

        // Check for outgoing request (user -> targetUser)
        var outgoingRequest = friendRequestRepository.findPendingRequest(userId, targetUserId);
        if (outgoingRequest.isPresent()) {
            return Map.of(
                "status", "pending_sent",
                "friendRequestId", outgoingRequest.get().getId()
            );
        }

        // Check for incoming request (targetUser -> user)
        var incomingRequest = friendRequestRepository.findPendingRequest(targetUserId, userId);
        if (incomingRequest.isPresent()) {
            return Map.of(
                "status", "pending_received",
                "friendRequestId", incomingRequest.get().getId()
            );
        }

        // No relationship
        return Map.of("status", "none");
    }

    /**
     * Helper method to create friendship with ordered IDs
     */
    private Friendship createFriendship(Long userId1, Long userId2) {
        Long smallerId = Math.min(userId1, userId2);
        Long largerId = Math.max(userId1, userId2);

        return Friendship.builder()
                .userId(smallerId)
                .friendId(largerId)
                .build();
    }
}
