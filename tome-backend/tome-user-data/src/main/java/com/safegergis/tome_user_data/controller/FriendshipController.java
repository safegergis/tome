package com.safegergis.tome_user_data.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

import com.safegergis.tome_user_data.dto.FriendRequestDTO;
import com.safegergis.tome_user_data.dto.FriendshipDTO;
import com.safegergis.tome_user_data.dto.SendFriendRequestRequest;
import com.safegergis.tome_user_data.enums.FriendRequestStatus;
import com.safegergis.tome_user_data.service.FriendshipService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for friendship operations
 * Handles friend requests, friendships, and related operations
 */
@RestController
@RequestMapping("/api/friendships")
@RequiredArgsConstructor
@Slf4j
public class FriendshipController {

    private final FriendshipService friendshipService;

    /**
     * Extract authenticated user ID from SecurityContext
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }

    /**
     * Send a friend request
     * POST /api/friendships/requests
     */
    @PostMapping("/requests")
    public ResponseEntity<FriendRequestDTO> sendFriendRequest(
            @Valid @RequestBody SendFriendRequestRequest request) {
        Long userId = getAuthenticatedUserId();
        log.info("POST /api/friendships/requests - User {} sending request to {}",
                userId, request.getFriendUserId());

        FriendRequestDTO result = friendshipService.sendFriendRequest(userId, request.getFriendUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Accept a friend request
     * POST /api/friendships/requests/{requestId}/accept
     */
    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<FriendshipDTO> acceptFriendRequest(@PathVariable Long requestId) {
        Long userId = getAuthenticatedUserId();
        log.info("POST /api/friendships/requests/{}/accept - User {}", requestId, userId);

        FriendshipDTO result = friendshipService.acceptFriendRequest(userId, requestId);
        return ResponseEntity.ok(result);
    }

    /**
     * Reject a friend request
     * POST /api/friendships/requests/{requestId}/reject
     */
    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<Void> rejectFriendRequest(@PathVariable Long requestId) {
        Long userId = getAuthenticatedUserId();
        log.info("POST /api/friendships/requests/{}/reject - User {}", requestId, userId);

        friendshipService.rejectFriendRequest(userId, requestId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Cancel an outgoing friend request
     * DELETE /api/friendships/requests/{requestId}
     */
    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<Void> cancelFriendRequest(@PathVariable Long requestId) {
        Long userId = getAuthenticatedUserId();
        log.info("DELETE /api/friendships/requests/{} - User {}", requestId, userId);

        friendshipService.cancelFriendRequest(userId, requestId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get friends list (paginated)
     * If userId is provided, returns that user's friends
     * If userId is not provided, returns authenticated user's friends
     *
     * GET /api/friendships?page=0&size=20
     * GET /api/friendships?userId=123&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Page<FriendshipDTO>> getFriends(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long authenticatedUserId = getAuthenticatedUserId();
        Long targetUserId = userId != null ? userId : authenticatedUserId;

        log.info("GET /api/friendships?userId={}&page={}&size={} - Requested by User {}",
                targetUserId, page, size, authenticatedUserId);

        Pageable pageable = PageRequest.of(page, size);
        Page<FriendshipDTO> friends = friendshipService.getFriends(targetUserId, pageable);
        return ResponseEntity.ok(friends);
    }

    /**
     * Get incoming friend requests (paginated)
     * GET /api/friendships/requests/incoming?status=pending&page=0&size=20
     */
    @GetMapping("/requests/incoming")
    public ResponseEntity<Page<FriendRequestDTO>> getIncomingRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = getAuthenticatedUserId();
        log.info("GET /api/friendships/requests/incoming?status={}&page={}&size={} - User {}",
                status, page, size, userId);

        FriendRequestStatus requestStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                requestStatus = FriendRequestStatus.fromString(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status parameter: {}", status);
                return ResponseEntity.badRequest().build();
            }
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<FriendRequestDTO> requests = friendshipService.getIncomingRequests(
                userId, requestStatus, pageable);
        return ResponseEntity.ok(requests);
    }

    /**
     * Get outgoing friend requests (paginated)
     * GET /api/friendships/requests/outgoing?status=pending&page=0&size=20
     */
    @GetMapping("/requests/outgoing")
    public ResponseEntity<Page<FriendRequestDTO>> getOutgoingRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = getAuthenticatedUserId();
        log.info("GET /api/friendships/requests/outgoing?status={}&page={}&size={} - User {}",
                status, page, size, userId);

        FriendRequestStatus requestStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                requestStatus = FriendRequestStatus.fromString(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status parameter: {}", status);
                return ResponseEntity.badRequest().build();
            }
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<FriendRequestDTO> requests = friendshipService.getOutgoingRequests(
                userId, requestStatus, pageable);
        return ResponseEntity.ok(requests);
    }

    /**
     * Unfriend / Remove friendship
     * DELETE /api/friendships/{friendId}
     */
    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> unfriend(@PathVariable Long friendId) {
        Long userId = getAuthenticatedUserId();
        log.info("DELETE /api/friendships/{} - User {}", friendId, userId);

        friendshipService.unfriend(userId, friendId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get friends count
     * GET /api/friendships/count?userId={id}
     * If userId is provided, returns that user's count
     * If userId is not provided, returns authenticated user's count
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getFriendsCount(
            @RequestParam(required = false) Long userId) {
        Long authenticatedUserId = getAuthenticatedUserId();
        Long targetUserId = userId != null ? userId : authenticatedUserId;

        log.info("GET /api/friendships/count?userId={} - Requested by User {}",
                targetUserId, authenticatedUserId);

        Long count = friendshipService.getFriendsCount(targetUserId);
        return ResponseEntity.ok(count);
    }

    /**
     * Get friendship status with another user
     * GET /api/friendships/status/{targetUserId}
     */
    @GetMapping("/status/{targetUserId}")
    public ResponseEntity<java.util.Map<String, Object>> getFriendshipStatus(
            @PathVariable Long targetUserId) {
        Long userId = getAuthenticatedUserId();
        log.info("GET /api/friendships/status/{} - User {}", targetUserId, userId);

        java.util.Map<String, Object> status = friendshipService.getFriendshipStatus(userId, targetUserId);
        return ResponseEntity.ok(status);
    }
}
