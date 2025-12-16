package com.safegergis.tome_user_data.mapper;

import com.safegergis.tome_user_data.dto.FriendRequestDTO;
import com.safegergis.tome_user_data.dto.UserSummaryDTO;
import com.safegergis.tome_user_data.model.FriendRequest;

/**
 * Mapper for FriendRequest entities to DTOs
 */
public class FriendRequestMapper {

    /**
     * Convert FriendRequest entity to DTO with enriched user data
     */
    public static FriendRequestDTO toDTO(
            FriendRequest request,
            UserSummaryDTO requester,
            UserSummaryDTO addressee) {
        if (request == null) {
            return null;
        }

        return FriendRequestDTO.builder()
                .id(request.getId())
                .requesterId(request.getRequesterId())
                .requester(requester)
                .addresseeId(request.getAddresseeId())
                .addressee(addressee)
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
