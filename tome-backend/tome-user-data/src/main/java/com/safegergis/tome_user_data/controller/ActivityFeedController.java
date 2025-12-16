package com.safegergis.tome_user_data.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.safegergis.tome_user_data.dto.ActivityFeedDTO;
import com.safegergis.tome_user_data.service.ActivityFeedService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for Activity Feed operations
 */
@RestController
@RequestMapping("/api/activity-feed")
@RequiredArgsConstructor
@Slf4j
public class ActivityFeedController {

    private final ActivityFeedService activityFeedService;

    /**
     * Extract authenticated user ID from SecurityContext
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }

    /**
     * Get activity feed for current user's friends
     *
     * @param page Page number (default: 0)
     * @param size Page size (default: 20, max: 50)
     * @return Paginated activity feed
     */
    @GetMapping
    public ResponseEntity<Page<ActivityFeedDTO>> getActivityFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long userId = getAuthenticatedUserId();
        log.info("GET /api/activity-feed?page={}&size={} - User {}", page, size, userId);

        // Validate and cap size at 50
        if (size > 50) {
            log.debug("Requested size {} exceeds maximum, capping at 50", size);
            size = 50;
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityFeedDTO> feed = activityFeedService.getFriendActivityFeed(userId, pageable);

        log.debug("Returning {} activities for user {}", feed.getContent().size(), userId);
        return ResponseEntity.ok(feed);
    }
}
