package com.safegergis.tome_content.dto;

import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for Author entity
 * Used for API responses to avoid exposing entity structure
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorDTO {
    private Long id;
    private String name;
    private String bio;
    private Integer birthYear;
    private Integer deathYear;
    private String photoUrl;
    private String externalId;
    private String externalSource;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
