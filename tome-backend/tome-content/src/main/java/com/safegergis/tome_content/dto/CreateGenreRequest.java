package com.safegergis.tome_content.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new genre
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGenreRequest {
    private String name;
    private String description;
}
