package com.safegergis.tome_auth.mapper;

import com.safegergis.tome_auth.dto.UserDTO;
import com.safegergis.tome_auth.models.User;

/**
 * Mapper utility class to convert User entities to DTOs
 */
public class UserMapper {

    /**
     * Convert User entity to UserDTO (public profile data only)
     *
     * @param user the User entity
     * @return UserDTO with public user information
     */
    public static UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
