package com.safegergis.tome_user_data.dto;

import java.time.OffsetDateTime;

import com.safegergis.tome_user_data.enums.ActivityType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single activity in the feed
 * Polymorphic - only one of readingSession, list, or userBook will be populated
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityFeedDTO {
    /**
     * Composite ID in format "{type}-{entityId}"
     */
    private String id;

    /**
     * Type of activity
     */
    private ActivityType type;

    /**
     * ID of the user who performed this activity
     */
    private Long userId;

    /**
     * User summary information
     */
    private UserSummaryDTO user;

    /**
     * Timestamp when the activity occurred
     */
    private OffsetDateTime timestamp;

    /**
     * Reading session details (only populated if type is READING_SESSION)
     */
    private ReadingSessionDTO readingSession;

    /**
     * List details (only populated if type is LIST_CREATED)
     */
    private ListSummaryDTO list;

    /**
     * User book details (only populated if type is BOOK_FINISHED)
     */
    private UserBookSummaryDTO userBook;
}
