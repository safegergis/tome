package com.safegergis.tome_content.dto;

import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for Genre entity
 * Used for API responses to avoid exposing entity structure
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenreDTO {
    private Long id;
    private String name;
    private String description;
    private OffsetDateTime createdAt;
}
