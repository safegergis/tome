package com.safegergis.tome_auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Data Transfer Object for User Profile
 * Includes extended information like friends count
 * Email is only included when user views their own profile
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {

    private Long id;
    private String username;
    private String email; // Only visible when viewing own profile
    private String avatarUrl;
    private String bio;
    private OffsetDateTime createdAt;
    private Long friendsCount;
}
