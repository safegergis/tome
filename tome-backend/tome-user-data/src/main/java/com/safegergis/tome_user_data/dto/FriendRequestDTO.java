package com.safegergis.tome_user_data.dto;

import java.time.OffsetDateTime;

import com.safegergis.tome_user_data.enums.FriendRequestStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for friend request with enriched user data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestDTO {
    private Long id;
    private Long requesterId;
    private UserSummaryDTO requester;
    private Long addresseeId;
    private UserSummaryDTO addressee;
    private FriendRequestStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
