package com.safegergis.tome_user_data.mapper;

import com.safegergis.tome_user_data.dto.FriendshipDTO;
import com.safegergis.tome_user_data.dto.UserSummaryDTO;
import com.safegergis.tome_user_data.model.Friendship;

/**
 * Mapper for Friendship entities to DTOs
 */
public class FriendshipMapper {

    /**
     * Convert Friendship entity to DTO from the perspective of a specific user
     *
     * @param friendship    The friendship entity
     * @param currentUserId The authenticated user viewing this friendship
     * @param friend        The enriched user data for the friend
     * @return FriendshipDTO with friend data from current user's perspective
     */
    public static FriendshipDTO toDTO(
            Friendship friendship,
            Long currentUserId,
            UserSummaryDTO friend) {
        if (friendship == null) {
            return null;
        }

        // Determine which ID is the friend's from current user's perspective
        Long friendId = friendship.getUserId().equals(currentUserId)
                ? friendship.getFriendId()
                : friendship.getUserId();

        return FriendshipDTO.builder()
                .id(friendship.getId())
                .userId(currentUserId)
                .friendId(friendId)
                .friend(friend)
                .createdAt(friendship.getCreatedAt())
                .updatedAt(friendship.getUpdatedAt())
                .build();
    }
}
