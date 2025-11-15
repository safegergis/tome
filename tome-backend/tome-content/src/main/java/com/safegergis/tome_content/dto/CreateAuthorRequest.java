package com.safegergis.tome_content.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new author
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAuthorRequest {
    private String name;
    private String bio;
    private Integer birthYear;
    private Integer deathYear;
    private String photoUrl;
    private String externalId;
    private String externalSource;
}
