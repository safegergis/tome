package com.safegergis.tome_auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Data Transfer Object for User information (public profile)
 * Excludes sensitive data like password and email
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long id;
    private String username;
    private String avatarUrl;
    private String bio;
    private OffsetDateTime createdAt;
}
