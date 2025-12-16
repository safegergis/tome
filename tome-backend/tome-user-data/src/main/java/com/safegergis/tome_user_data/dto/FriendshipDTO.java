package com.safegergis.tome_user_data.dto;

import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for friendship with enriched friend data
 * userId represents the authenticated user
 * friendId and friend represent the friend from the authenticated user's perspective
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipDTO {
    private Long id;
    private Long userId;
    private Long friendId;
    private UserSummaryDTO friend;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
